import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Float, Integer, JSON, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base
import enum


def utcnow():
    return datetime.now(timezone.utc)


def new_uuid():
    return str(uuid.uuid4())


# ─── Enums ────────────────────────────────────────────────────────────────────

class CaseStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"
    ARCHIVED = "archived"


class RiskLevel(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNKNOWN = "unknown"


class AuditEventType(str, enum.Enum):
    CASE_CREATED = "CASE_CREATED"
    CASE_UPDATED = "CASE_UPDATED"
    SOURCE_ADDED = "SOURCE_ADDED"
    INGEST_STARTED = "INGEST_STARTED"
    INGEST_COMPLETE = "INGEST_COMPLETE"
    ARTIFACT_SEALED = "ARTIFACT_SEALED"
    SHA256_COMPUTED = "SHA256_COMPUTED"
    STYLO_RUN_STARTED = "STYLO_RUN_STARTED"
    STYLO_RUN_COMPLETE = "STYLO_RUN_COMPLETE"
    MATCH_FLAGGED = "MATCH_FLAGGED"
    GRAPH_UPDATED = "GRAPH_UPDATED"
    GRAPH_CLUSTER_FOUND = "GRAPH_CLUSTER_FOUND"
    REPORT_GENERATED = "REPORT_GENERATED"
    VAULT_SEALED = "VAULT_SEALED"


# ─── Models ───────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="analyst")
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    is_active: Mapped[bool] = mapped_column(default=True)

    cases: Mapped[list["Case"]] = relationship("Case", back_populates="owner")


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    case_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    classification: Mapped[str] = mapped_column(String(30), default="RESTRICTED")
    status: Mapped[CaseStatus] = mapped_column(SAEnum(CaseStatus), default=CaseStatus.OPEN)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)

    owner: Mapped["User"] = relationship("User", back_populates="cases")
    sources: Mapped[list["Source"]] = relationship("Source", back_populates="case")
    artifacts: Mapped[list["Artifact"]] = relationship("Artifact", back_populates="case")
    subjects: Mapped[list["Subject"]] = relationship("Subject", back_populates="case")
    stylo_runs: Mapped[list["StylometryRun"]] = relationship("StylometryRun", back_populates="case")
    audit_events: Mapped[list["AuditEvent"]] = relationship("AuditEvent", back_populates="case")


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    handle: Mapped[str] = mapped_column(String(255), nullable=False)
    source_url: Mapped[str] = mapped_column(Text, nullable=True)
    import_method: Mapped[str] = mapped_column(String(30), default="manual")
    added_at: Mapped[datetime] = mapped_column(default=utcnow)
    token_count: Mapped[int] = mapped_column(Integer, default=0)
    risk_level: Mapped[RiskLevel] = mapped_column(SAEnum(RiskLevel), default=RiskLevel.UNKNOWN)

    case: Mapped["Case"] = relationship("Case", back_populates="sources")
    artifacts: Mapped[list["Artifact"]] = relationship("Artifact", back_populates="source")


class Artifact(Base):
    __tablename__ = "artifacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), nullable=False)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"), nullable=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    raw_uri: Mapped[str] = mapped_column(Text, nullable=True)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=True)
    byte_size: Mapped[int] = mapped_column(Integer, default=0)
    captured_at: Mapped[datetime] = mapped_column(default=utcnow)
    provenance_notes: Mapped[str] = mapped_column(Text, nullable=True)
    is_sealed: Mapped[bool] = mapped_column(default=True)

    case: Mapped["Case"] = relationship("Case", back_populates="artifacts")
    source: Mapped["Source"] = relationship("Source", back_populates="artifacts")
    texts: Mapped[list["TextSample"]] = relationship("TextSample", back_populates="artifact")


class TextSample(Base):
    __tablename__ = "text_samples"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    artifact_id: Mapped[str] = mapped_column(ForeignKey("artifacts.id"), nullable=False)
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    cleaned_text: Mapped[str] = mapped_column(Text, nullable=True)
    language: Mapped[str] = mapped_column(String(10), default="en")
    token_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

    artifact: Mapped["Artifact"] = relationship("Artifact", back_populates="texts")


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    platforms: Mapped[list] = mapped_column(JSON, default=list)
    aliases: Mapped[list] = mapped_column(JSON, default=list)
    risk_level: Mapped[RiskLevel] = mapped_column(SAEnum(RiskLevel), default=RiskLevel.UNKNOWN)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

    case: Mapped["Case"] = relationship("Case", back_populates="subjects")


class StylometryRun(Base):
    __tablename__ = "stylometry_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), nullable=False)
    run_ref: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    sample_a_id: Mapped[str] = mapped_column(ForeignKey("text_samples.id"), nullable=True)
    sample_b_id: Mapped[str] = mapped_column(ForeignKey("text_samples.id"), nullable=True)
    sample_a_label: Mapped[str] = mapped_column(String(100), nullable=True)
    sample_b_label: Mapped[str] = mapped_column(String(100), nullable=True)
    similarity_score: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_low: Mapped[float] = mapped_column(Float, nullable=True)
    confidence_high: Mapped[float] = mapped_column(Float, nullable=True)
    feature_scores: Mapped[dict] = mapped_column(JSON, default=dict)
    top_signals: Mapped[list] = mapped_column(JSON, default=list)
    verdict: Mapped[str] = mapped_column(String(30), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    artifact_sha256: Mapped[str] = mapped_column(String(64), nullable=True)

    case: Mapped["Case"] = relationship("Case", back_populates="stylo_runs")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), nullable=True)
    event_type: Mapped[AuditEventType] = mapped_column(SAEnum(AuditEventType), nullable=False)
    actor: Mapped[str] = mapped_column(String(100), nullable=True)
    object_type: Mapped[str] = mapped_column(String(50), nullable=True)
    object_id: Mapped[str] = mapped_column(String(36), nullable=True)
    sha256: Mapped[str] = mapped_column(String(64), nullable=True)
    timestamp_utc: Mapped[datetime] = mapped_column(default=utcnow)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)
    analyst_note: Mapped[str] = mapped_column(Text, nullable=True)

    case: Mapped["Case"] = relationship("Case", back_populates="audit_events")
