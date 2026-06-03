"""Unit tests for the Evidence Vault service."""
import pytest
import tempfile
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def test_seal_and_read(tmp_path, monkeypatch):
    monkeypatch.setattr("core.config.settings.evidence_vault_path", str(tmp_path))
    from services.vault import seal_artifact, read_artifact, compute_sha256

    data = b"test artifact content 12345"
    meta = seal_artifact("case-001", "test.txt", data, provenance="unit test")

    assert meta["sha256"] == compute_sha256(data)
    assert meta["byte_size"] == len(data)
    assert meta["is_sealed"] is True
    assert meta["case_id"] == "case-001"

    recovered = read_artifact(meta["vault_path"])
    assert recovered == data


def test_seal_is_idempotent(tmp_path, monkeypatch):
    monkeypatch.setattr("core.config.settings.evidence_vault_path", str(tmp_path))
    from services.vault import seal_artifact

    data = b"same data twice"
    m1 = seal_artifact("case-002", "dup.txt", data)
    m2 = seal_artifact("case-002", "dup.txt", data)
    assert m1["sha256"] == m2["sha256"]
    assert m1["vault_path"] == m2["vault_path"]


def test_integrity_violation_detected(tmp_path, monkeypatch):
    monkeypatch.setattr("core.config.settings.evidence_vault_path", str(tmp_path))
    from services.vault import seal_artifact, read_artifact

    data = b"original content"
    meta = seal_artifact("case-003", "tamper.txt", data)

    # Tamper with the file
    with open(meta["vault_path"], "wb") as f:
        f.write(b"TAMPERED content")

    with pytest.raises(ValueError, match="INTEGRITY VIOLATION"):
        read_artifact(meta["vault_path"])


def test_sha256_is_hex64():
    from services.vault import compute_sha256
    h = compute_sha256(b"anything")
    assert len(h) == 64
    assert all(c in "0123456789abcdef" for c in h)
