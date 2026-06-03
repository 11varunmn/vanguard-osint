"""
Unit tests for the Vanguard Stylometry Engine.
Run with: pytest tests/
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.stylometry import (
    clean_text,
    tokenize,
    sentence_split,
    extract_features,
    run_comparison,
)


# ─── Text Cleaning ────────────────────────────────────────────────────────────

def test_clean_removes_urls():
    text = "Check this out https://example.com and also http://other.org/page"
    cleaned = clean_text(text)
    assert "https://example.com" not in cleaned
    assert "http://other.org" not in cleaned
    assert "[URL]" in cleaned


def test_clean_removes_html():
    text = "<b>Bold text</b> and <a href='x'>link</a>"
    cleaned = clean_text(text)
    assert "<b>" not in cleaned
    assert "Bold text" in cleaned


def test_tokenize_basic():
    tokens = tokenize("Hello world, this is a test.")
    assert "Hello" in tokens
    assert "world" in tokens
    assert "test" in tokens
    assert "," not in tokens


def test_tokenize_preserves_case():
    tokens = tokenize("CAPS lower MiXeD")
    assert "CAPS" in tokens
    assert "lower" in tokens
    assert "MiXeD" in tokens


def test_sentence_split():
    text = "First sentence. Second sentence! Third sentence?"
    sents = sentence_split(text)
    assert len(sents) >= 2


# ─── Feature Extraction ───────────────────────────────────────────────────────

SAMPLE_INFORMAL = (
    "yeah no its literally insane how ppl just dont get it lol. "
    "like ive been saying this for YEARS and nobody listens. "
    "the whole system is rigged anyway so why bother right? "
    "classic cope from the usual suspects smh. "
    "gonna document everything bc they always try to memory hole this stuff. "
    "not gonna let them tbh, fr fr this is important."
)

SAMPLE_FORMAL = (
    "The evidence presented in this analysis demonstrates a clear pattern of behaviour. "
    "Investigators have noted that the subject utilised multiple platforms to disseminate information. "
    "The methodology employed was consistent with established protocols for digital investigations. "
    "Further analysis is required before any conclusions can be drawn."
)


def test_feature_extraction_informal():
    fv = extract_features(SAMPLE_INFORMAL)
    assert fv.token_count > 0
    assert fv.caps_word_ratio > 0  # "YEARS" should be detected
    assert fv.informal_markers > 0  # lol, smh, tbh, fr


def test_feature_extraction_formal():
    fv = extract_features(SAMPLE_FORMAL)
    assert fv.token_count > 0
    assert fv.informal_markers == 0.0
    assert fv.avg_sentence_length > 10  # formal sentences are longer


def test_feature_extraction_empty():
    fv = extract_features("")
    assert fv.token_count == 0


def test_feature_token_count():
    text = "one two three four five"
    fv = extract_features(text)
    assert fv.token_count == 5


# ─── Comparison Engine ────────────────────────────────────────────────────────

SIMILAR_A = (
    "yeah no its literally insane how ppl just dont get it lol. "
    "been saying this for YEARS. classic cope from the usual suspects smh. "
    "gonna document everything bc they always memory hole this stuff. "
    "the system is totally rigged anyway so why bother playing along right?"
)

SIMILAR_B = (
    "its actually insane nobody talking about this lol. "
    "been pointing this out YEARS ago and the memory holing is real as always. "
    "classic move from their side smh. dont play by rigged rules. "
    "document everything bc they will deny it. ppl just cope and dont get it."
)

DIFFERENT = (
    "The quarterly earnings report indicates strong performance in the technology sector. "
    "Revenue increased by 14% year over year, driven primarily by cloud services. "
    "The board of directors recommends a dividend distribution to shareholders. "
    "Further details are available in the attached financial statements."
)


def test_similar_samples_score_high():
    result = run_comparison(SIMILAR_A, SIMILAR_B, label_a="A", label_b="B")
    assert result.similarity_score > 0.55, f"Expected >0.55, got {result.similarity_score}"


def test_different_samples_score_lower():
    result_sim = run_comparison(SIMILAR_A, SIMILAR_B)
    result_diff = run_comparison(SIMILAR_A, DIFFERENT)
    assert result_sim.similarity_score > result_diff.similarity_score


def test_result_has_required_fields():
    result = run_comparison(SIMILAR_A, SIMILAR_B)
    assert result.run_ref
    assert result.artifact_sha256
    assert len(result.artifact_sha256) == 64  # SHA-256 hex
    assert result.confidence_low <= result.similarity_score <= result.confidence_high
    assert result.verdict in ("strong", "moderate", "low", "insufficient")
    assert len(result.feature_scores) > 0
    assert result.token_count_a > 0
    assert result.token_count_b > 0


def test_short_sample_insufficient():
    result = run_comparison("hi", "hey", min_tokens=100)
    assert result.verdict == "insufficient"


def test_run_ref_is_unique():
    r1 = run_comparison(SIMILAR_A, SIMILAR_B)
    r2 = run_comparison(SIMILAR_A, SIMILAR_B)
    assert r1.run_ref != r2.run_ref


def test_sha256_determinism():
    """Same inputs with same run_ref should produce same hash."""
    import time
    ref = f"STY-TEST-{int(time.time())}"
    r1 = run_comparison(SIMILAR_A, SIMILAR_B, run_ref=ref)
    r2 = run_comparison(SIMILAR_A, SIMILAR_B, run_ref=ref)
    assert r1.artifact_sha256 == r2.artifact_sha256
