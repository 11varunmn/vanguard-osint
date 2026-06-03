"""
Evidence Vault Service
----------------------
Handles immutable storage of raw artifacts.
Every file gets SHA-256 hashed at write time. Nothing is ever overwritten.
"""

import hashlib
import os
import shutil
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from core.config import settings


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def compute_sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def seal_artifact(
    case_id: str,
    filename: str,
    data: bytes,
    provenance: Optional[str] = None,
) -> dict:
    """
    Write raw bytes to the evidence vault.
    Returns metadata including SHA-256 and vault path.
    Never overwrites an existing file.
    """
    vault_root = Path(settings.evidence_vault_path)
    case_dir = vault_root / case_id
    case_dir.mkdir(parents=True, exist_ok=True)

    sha256 = compute_sha256(data)
    # Use hash prefix in filename to make collisions obvious
    safe_name = f"{sha256[:8]}_{filename}"
    dest = case_dir / safe_name

    if dest.exists():
        # Already sealed — idempotent, return existing metadata
        meta_path = dest.with_suffix(dest.suffix + ".meta.json")
        if meta_path.exists():
            with open(meta_path) as f:
                return json.load(f)

    with open(dest, "wb") as f:
        f.write(data)

    meta = {
        "filename": filename,
        "vault_path": str(dest),
        "sha256": sha256,
        "byte_size": len(data),
        "sealed_at_utc": _utcnow(),
        "case_id": case_id,
        "provenance": provenance or "",
        "is_sealed": True,
    }

    meta_path = dest.with_suffix(dest.suffix + ".meta.json")
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    return meta


def read_artifact(vault_path: str) -> bytes:
    """Read a sealed artifact and verify its integrity."""
    path = Path(vault_path)
    if not path.exists():
        raise FileNotFoundError(f"Artifact not found: {vault_path}")

    data = path.read_bytes()

    # Verify against stored metadata
    meta_path = path.with_suffix(path.suffix + ".meta.json")
    if meta_path.exists():
        with open(meta_path) as f:
            meta = json.load(f)
        stored_hash = meta.get("sha256", "")
        actual_hash = compute_sha256(data)
        if stored_hash and stored_hash != actual_hash:
            raise ValueError(
                f"INTEGRITY VIOLATION: hash mismatch for {vault_path}\n"
                f"Stored:   {stored_hash}\n"
                f"Computed: {actual_hash}"
            )
    return data


def list_case_artifacts(case_id: str) -> list[dict]:
    """List all sealed artifacts for a case."""
    vault_root = Path(settings.evidence_vault_path)
    case_dir = vault_root / case_id
    if not case_dir.exists():
        return []

    artifacts = []
    for meta_file in case_dir.glob("*.meta.json"):
        with open(meta_file) as f:
            artifacts.append(json.load(f))
    return sorted(artifacts, key=lambda x: x.get("sealed_at_utc", ""))
