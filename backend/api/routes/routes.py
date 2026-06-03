from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid, time, hashlib, json
from datetime import datetime, timezone

from core.database import get_db
from core.auth import get_current_user
from core.config import settings
from models.models import Case, Source, Artifact, TextSample, StylometryRun, AuditEvent, AuditEventType
from schemas.schemas import (
    CaseCreate, CaseUpdate, CaseResponse,
    SourceCreate, SourceResponse,
    IngestTextRequest,
    StyleCompareRequest, StyleCompareResponse,
    GraphResponse,
    AuditEventResponse,
    ReportCreateRequest, ReportResponse,
)
from services.stylometry import run_comparison
from services.vault import seal_artifact, list_case_artifacts
from services import graph as graph_svc

router = APIRouter()


def _utcnow():
    return datetime.now(timezone.utc)

def _case_number():
    now = datetime.now(timezone.utc)
    return f"CASE-{now.year}-{str(now.microsecond)[:4].zfill(4)}"

async def _log(db: AsyncSession, case_id: str, event_type: AuditEventType,
               actor: str = "system", obj_type: str = None, obj_id: str = None,
               sha256: str = None, meta: dict = {}):
    ev = AuditEvent(
        id=str(uuid.uuid4()), case_id=case_id, event_type=event_type,
        actor=actor, object_type=obj_type, object_id=obj_id,
        sha256=sha256, metadata_json=meta,
    )
    db.add(ev)
    await db.flush()


# ─── Cases ────────────────────────────────────────────────────────────────────

@router.post("/cases", response_model=CaseResponse, status_code=201)
async def create_case(
    body: CaseCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    case = Case(
        id=str(uuid.uuid4()),
        case_number=_case_number(),
        title=body.title,
        description=body.description,
        classification=body.classification,
        owner_id=user["user_id"],
    )
    db.add(case)
    await _log(db, case.id, AuditEventType.CASE_CREATED, actor=user["email"],
               obj_type="case", meta={"title": body.title})
    await db.commit()
    await db.refresh(case)
    return case


@router.get("/cases", response_model=list[CaseResponse])
async def list_cases(db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    result = await db.execute(select(Case).order_by(Case.created_at.desc()))
    return result.scalars().all()


@router.get("/cases/{case_id}", response_model=CaseResponse)
async def get_case(case_id: str, db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")
    return case


@router.patch("/cases/{case_id}", response_model=CaseResponse)
async def update_case(case_id: str, body: CaseUpdate, db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(case, field, val)
    await _log(db, case_id, AuditEventType.CASE_UPDATED, actor=user["email"])
    await db.commit()
    await db.refresh(case)
    return case


# ─── Sources ──────────────────────────────────────────────────────────────────

@router.post("/cases/{case_id}/sources", response_model=SourceResponse, status_code=201)
async def add_source(case_id: str, body: SourceCreate, db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")
    src = Source(id=str(uuid.uuid4()), case_id=case_id, **body.model_dump())
    db.add(src)
    await _log(db, case_id, AuditEventType.SOURCE_ADDED, actor=user["email"],
               obj_type="source", meta={"handle": body.handle, "platform": body.platform})
    await db.commit()
    await db.refresh(src)
    # Add to graph
    await graph_svc.upsert_account_node(case_id, body.handle, body.platform)
    await graph_svc.add_account_platform_edge(case_id, body.handle, body.platform)
    return src


@router.get("/cases/{case_id}/sources", response_model=list[SourceResponse])
async def list_sources(case_id: str, db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    result = await db.execute(select(Source).where(Source.case_id == case_id))
    return result.scalars().all()


# ─── Ingestion ────────────────────────────────────────────────────────────────

@router.post("/cases/{case_id}/ingest/text", status_code=201)
async def ingest_text(case_id: str, body: IngestTextRequest, db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    raw_bytes = body.text_content.encode("utf-8")
    meta = seal_artifact(case_id, f"text_{body.source_id[:8]}.txt", raw_bytes, body.provenance_notes)

    artifact = Artifact(
        id=str(uuid.uuid4()), case_id=case_id, source_id=body.source_id,
        filename=meta["filename"], raw_uri=meta["vault_path"],
        sha256=meta["sha256"], mime_type="text/plain",
        byte_size=meta["byte_size"], provenance_notes=body.provenance_notes,
    )
    db.add(artifact)
    await db.flush()

    tokens = body.text_content.split()
    sample = TextSample(
        id=str(uuid.uuid4()), artifact_id=artifact.id,
        original_text=body.text_content,
        cleaned_text=body.text_content,
        token_count=len(tokens),
    )
    db.add(sample)

    await _log(db, case_id, AuditEventType.ARTIFACT_SEALED, actor=user["email"],
               obj_type="artifact", obj_id=artifact.id, sha256=meta["sha256"],
               meta={"filename": meta["filename"], "tokens": len(tokens)})
    await db.commit()

    return {"artifact_id": artifact.id, "sha256": meta["sha256"], "tokens": len(tokens)}


@router.post("/cases/{case_id}/ingest/file", status_code=201)
async def ingest_file(
    case_id: str,
    file: UploadFile = File(...),
    source_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if file.size and file.size > settings.max_upload_bytes:
        raise HTTPException(413, "File too large")

    data = await file.read()
    meta = seal_artifact(case_id, file.filename or "upload.bin", data)

    artifact = Artifact(
        id=str(uuid.uuid4()), case_id=case_id, source_id=source_id,
        filename=file.filename, raw_uri=meta["vault_path"],
        sha256=meta["sha256"], mime_type=file.content_type,
        byte_size=meta["byte_size"],
    )
    db.add(artifact)
    await _log(db, case_id, AuditEventType.ARTIFACT_SEALED, actor=user["email"],
               obj_type="artifact", obj_id=artifact.id, sha256=meta["sha256"])
    await db.commit()

    return {"artifact_id": artifact.id, "sha256": meta["sha256"]}


# ─── Stylometry ───────────────────────────────────────────────────────────────

@router.post("/cases/{case_id}/stylometry/compare", response_model=StyleCompareResponse)
async def compare_texts(
    case_id: str,
    body: StyleCompareRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    run_ref = f"STY-{int(time.time())}"
    await _log(db, case_id, AuditEventType.STYLO_RUN_STARTED, actor=user["email"],
               meta={"label_a": body.label_a, "label_b": body.label_b, "run_ref": run_ref})

    result = run_comparison(
        body.text_a, body.text_b,
        label_a=body.label_a, label_b=body.label_b,
        run_ref=run_ref,
        min_tokens=settings.stylo_min_tokens,
    )

    run = StylometryRun(
        id=str(uuid.uuid4()), case_id=case_id,
        run_ref=result.run_ref,
        sample_a_label=result.sample_a_label, sample_b_label=result.sample_b_label,
        similarity_score=result.similarity_score,
        confidence_low=result.confidence_low, confidence_high=result.confidence_high,
        feature_scores=result.feature_scores, top_signals=result.top_signals,
        verdict=result.verdict, artifact_sha256=result.artifact_sha256,
    )
    db.add(run)

    event = AuditEventType.MATCH_FLAGGED if result.verdict == "strong" else AuditEventType.STYLO_RUN_COMPLETE
    await _log(db, case_id, event, actor=user["email"],
               sha256=result.artifact_sha256,
               meta={"score": result.similarity_score, "verdict": result.verdict})
    await db.commit()

    return StyleCompareResponse(**result.__dict__)


@router.get("/cases/{case_id}/stylometry/results")
async def get_stylo_results(case_id: str, db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    result = await db.execute(
        select(StylometryRun).where(StylometryRun.case_id == case_id).order_by(StylometryRun.created_at.desc())
    )
    runs = result.scalars().all()
    return [{"run_ref": r.run_ref, "similarity_score": r.similarity_score, "verdict": r.verdict,
             "label_a": r.sample_a_label, "label_b": r.sample_b_label,
             "created_at": r.created_at.isoformat()} for r in runs]


# ─── Graph ────────────────────────────────────────────────────────────────────

@router.get("/cases/{case_id}/graph", response_model=GraphResponse)
async def get_graph(case_id: str, user: dict = Depends(get_current_user)):
    data = await graph_svc.get_case_graph(case_id)
    return data


@router.get("/cases/{case_id}/graph/clusters")
async def get_clusters(case_id: str, user: dict = Depends(get_current_user)):
    return await graph_svc.find_clusters(case_id)


@router.get("/cases/{case_id}/graph/bridges")
async def get_bridges(case_id: str, user: dict = Depends(get_current_user)):
    return await graph_svc.find_bridge_nodes(case_id)


# ─── Audit ────────────────────────────────────────────────────────────────────

@router.get("/cases/{case_id}/audit", response_model=list[AuditEventResponse])
async def get_audit(case_id: str, db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    result = await db.execute(
        select(AuditEvent).where(AuditEvent.case_id == case_id).order_by(AuditEvent.timestamp_utc.desc())
    )
    return result.scalars().all()


# ─── Evidence ─────────────────────────────────────────────────────────────────

@router.get("/cases/{case_id}/evidence")
async def list_evidence(case_id: str, user: dict = Depends(get_current_user)):
    return list_case_artifacts(case_id)


# ─── Reports ──────────────────────────────────────────────────────────────────

@router.post("/cases/{case_id}/reports", response_model=ReportResponse)
async def generate_report(
    case_id: str,
    body: ReportCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    case = await db.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    sections = {}

    if body.include_stylometry:
        result = await db.execute(
            select(StylometryRun).where(StylometryRun.case_id == case_id).order_by(StylometryRun.created_at.desc())
        )
        runs = result.scalars().all()
        sections["stylometry"] = [
            {"run_ref": r.run_ref, "score": r.similarity_score, "verdict": r.verdict,
             "labels": [r.sample_a_label, r.sample_b_label], "sha256": r.artifact_sha256}
            for r in runs
        ]

    if body.include_audit_trail:
        result = await db.execute(
            select(AuditEvent).where(AuditEvent.case_id == case_id).order_by(AuditEvent.timestamp_utc)
        )
        events = result.scalars().all()
        sections["audit_trail"] = [
            {"event": e.event_type.value, "actor": e.actor,
             "timestamp": e.timestamp_utc.isoformat(), "sha256": e.sha256}
            for e in events
        ]

    sections["evidence"] = list_case_artifacts(case_id)

    report_payload = json.dumps(sections, sort_keys=True, default=str)
    report_sha256 = hashlib.sha256(report_payload.encode()).hexdigest()
    report_id = f"RPT-{int(time.time())}"

    await _log(db, case_id, AuditEventType.REPORT_GENERATED, actor=user["email"],
               sha256=report_sha256, meta={"report_id": report_id})
    await db.commit()

    return ReportResponse(
        report_id=report_id,
        case_id=case_id,
        case_number=case.case_number,
        generated_at=_utcnow().isoformat(),
        artifact_sha256=report_sha256,
        sections=sections,
    )
