"""
Vanguard Stylometry Engine
--------------------------
Computes pairwise authorship similarity across multiple feature categories.
All scores are investigative leads — not proof of identity.
"""

import re
import hashlib
import json
from collections import Counter
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import List, Optional
import math


# ─── Data Structures ──────────────────────────────────────────────────────────

@dataclass
class FeatureVector:
    """Extracted stylometric features from a single text sample."""
    token_count: int = 0
    unique_token_ratio: float = 0.0       # vocabulary richness
    avg_sentence_length: float = 0.0
    sentence_length_variance: float = 0.0
    avg_word_length: float = 0.0
    punctuation_density: float = 0.0      # punct chars / total chars
    exclamation_rate: float = 0.0
    question_rate: float = 0.0
    ellipsis_rate: float = 0.0
    caps_word_ratio: float = 0.0          # ALL_CAPS words / total words
    digit_ratio: float = 0.0
    informal_markers: float = 0.0         # lol, lmao, smh, imo, etc.
    hedge_words: float = 0.0              # maybe, probably, kind of, etc.
    top_bigrams: List[str] = field(default_factory=list)
    function_word_dist: dict = field(default_factory=dict)


@dataclass
class FeatureComparison:
    """Pairwise comparison result for a single feature."""
    feature: str
    score: float           # 0–1 similarity
    weight: float          # importance weight
    signal: Optional[str]  # human-readable observation


@dataclass
class StylometryResult:
    """Full comparison result between two text samples."""
    run_ref: str
    sample_a_label: str
    sample_b_label: str
    similarity_score: float
    confidence_low: float
    confidence_high: float
    verdict: str           # "strong" | "moderate" | "low" | "insufficient"
    feature_scores: dict
    top_signals: List[str]
    token_count_a: int
    token_count_b: int
    created_at: str
    artifact_sha256: str   # hash of this result for chain-of-custody


# ─── Text Cleaning ────────────────────────────────────────────────────────────

def clean_text(text: str) -> str:
    """Strip HTML, URLs, platform artefacts. Preserve linguistic signals."""
    # Remove URLs
    text = re.sub(r'https?://\S+', ' [URL] ', text)
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Normalise whitespace but keep structure
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def tokenize(text: str) -> List[str]:
    """Simple word tokenizer that preserves capitalisation signals."""
    words = re.findall(r"\b[a-zA-Z']+\b|\d+", text)
    return [w for w in words if len(w) >= 1]


def sentence_split(text: str) -> List[str]:
    """Split into sentences on punctuation boundaries."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if s.strip()]


# ─── Feature Extraction ───────────────────────────────────────────────────────

INFORMAL = {"lol", "lmao", "lmfao", "smh", "imo", "imho", "irl", "tbh",
            "ngl", "omg", "omfg", "wtf", "bruh", "fr", "nah", "yikes",
            "lowkey", "highkey", "legit", "fam", "bro", "dude", "rn"}

HEDGE_WORDS = {"maybe", "probably", "possibly", "perhaps", "might", "could",
               "kind", "sort", "somewhat", "basically", "literally", "honestly",
               "apparently", "seemingly", "suppose", "guess", "think"}

FUNCTION_WORDS = {"the", "a", "an", "and", "but", "or", "nor", "for", "yet",
                  "so", "in", "on", "at", "to", "of", "is", "are", "was",
                  "were", "have", "has", "had", "do", "does", "did", "i",
                  "we", "they", "it", "that", "this", "which", "who"}


def extract_features(text: str) -> FeatureVector:
    """Extract the full feature vector from a text sample."""
    fv = FeatureVector()
    cleaned = clean_text(text)
    tokens = tokenize(cleaned)
    sentences = sentence_split(cleaned)

    if not tokens:
        return fv

    fv.token_count = len(tokens)
    lower_tokens = [t.lower() for t in tokens]

    # Vocabulary richness
    fv.unique_token_ratio = len(set(lower_tokens)) / len(tokens)

    # Sentence length stats
    sent_lens = [len(tokenize(s)) for s in sentences if tokenize(s)]
    if sent_lens:
        fv.avg_sentence_length = sum(sent_lens) / len(sent_lens)
        mean = fv.avg_sentence_length
        fv.sentence_length_variance = sum((x - mean) ** 2 for x in sent_lens) / len(sent_lens)

    # Word length
    fv.avg_word_length = sum(len(t) for t in tokens) / len(tokens)

    # Punctuation analysis
    total_chars = max(len(cleaned), 1)
    punct_chars = sum(1 for c in cleaned if c in '.,;:!?-—…')
    fv.punctuation_density = punct_chars / total_chars
    fv.exclamation_rate = cleaned.count('!') / max(len(sentences), 1)
    fv.question_rate = cleaned.count('?') / max(len(sentences), 1)
    fv.ellipsis_rate = (cleaned.count('...') + cleaned.count('…')) / max(len(sentences), 1)

    # Capitalisation
    caps_words = sum(1 for t in tokens if t.isupper() and len(t) > 1)
    fv.caps_word_ratio = caps_words / len(tokens)

    # Digit use
    fv.digit_ratio = sum(1 for t in tokens if t.isdigit()) / len(tokens)

    # Informal markers
    fv.informal_markers = sum(1 for t in lower_tokens if t in INFORMAL) / len(tokens)

    # Hedging language
    fv.hedge_words = sum(1 for t in lower_tokens if t in HEDGE_WORDS) / len(tokens)

    # Top bigrams
    bigrams = [f"{lower_tokens[i]}_{lower_tokens[i+1]}" for i in range(len(lower_tokens) - 1)]
    bigram_counts = Counter(bigrams)
    fv.top_bigrams = [b for b, _ in bigram_counts.most_common(10)]

    # Function word distribution (normalised)
    fw_counts = Counter(t for t in lower_tokens if t in FUNCTION_WORDS)
    total_fw = max(sum(fw_counts.values()), 1)
    fv.function_word_dist = {w: c / total_fw for w, c in fw_counts.most_common(15)}

    return fv


# ─── Comparison Engine ────────────────────────────────────────────────────────

def _cosine_dict(a: dict, b: dict) -> float:
    """Cosine similarity between two frequency dicts."""
    keys = set(a) | set(b)
    dot = sum(a.get(k, 0) * b.get(k, 0) for k in keys)
    mag_a = math.sqrt(sum(v ** 2 for v in a.values()))
    mag_b = math.sqrt(sum(v ** 2 for v in b.values()))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def _scalar_sim(a: float, b: float, scale: float = 1.0) -> float:
    """Similarity between two scalar values, normalised by expected scale."""
    if scale == 0:
        return 1.0
    return max(0.0, 1.0 - abs(a - b) / scale)


def _bigram_jaccard(a: List[str], b: List[str]) -> float:
    sa, sb = set(a), set(b)
    if not sa and not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def compare_features(fv_a: FeatureVector, fv_b: FeatureVector) -> List[FeatureComparison]:
    """Compare two feature vectors across all dimensions."""
    comparisons = []

    # 1. Vocabulary richness (weight: 1.0)
    s = _scalar_sim(fv_a.unique_token_ratio, fv_b.unique_token_ratio, scale=0.3)
    comparisons.append(FeatureComparison("lexical_density", s, 1.0,
        f"Vocab richness A={fv_a.unique_token_ratio:.2f} B={fv_b.unique_token_ratio:.2f}"))

    # 2. Sentence length distribution (weight: 1.2)
    s = _scalar_sim(fv_a.avg_sentence_length, fv_b.avg_sentence_length, scale=10)
    v_sim = _scalar_sim(fv_a.sentence_length_variance, fv_b.sentence_length_variance, scale=30)
    comparisons.append(FeatureComparison("sentence_rhythm", (s + v_sim) / 2, 1.2,
        f"Avg len A={fv_a.avg_sentence_length:.1f} B={fv_b.avg_sentence_length:.1f}"))

    # 3. Punctuation pattern (weight: 1.5)
    punct_sim = (
        _scalar_sim(fv_a.exclamation_rate, fv_b.exclamation_rate, scale=1) * 0.4 +
        _scalar_sim(fv_a.question_rate, fv_b.question_rate, scale=1) * 0.3 +
        _scalar_sim(fv_a.ellipsis_rate, fv_b.ellipsis_rate, scale=0.5) * 0.3
    )
    comparisons.append(FeatureComparison("punctuation_pattern", punct_sim, 1.5,
        f"Excl A={fv_a.exclamation_rate:.2f} B={fv_b.exclamation_rate:.2f}"))

    # 4. Capitalisation style (weight: 1.8)
    caps_sim = _scalar_sim(fv_a.caps_word_ratio, fv_b.caps_word_ratio, scale=0.1)
    signal = None
    if fv_a.caps_word_ratio > 0.02 and fv_b.caps_word_ratio > 0.02:
        signal = "Both samples use ALL_CAPS emphasis"
    comparisons.append(FeatureComparison("capitalisation_style", caps_sim, 1.8, signal))

    # 5. Informal marker density (weight: 1.6)
    inf_sim = _scalar_sim(fv_a.informal_markers, fv_b.informal_markers, scale=0.05)
    comparisons.append(FeatureComparison("informal_register", inf_sim, 1.6,
        f"Informal density A={fv_a.informal_markers:.3f} B={fv_b.informal_markers:.3f}"))

    # 6. Function word distribution (weight: 1.4)
    fw_sim = _cosine_dict(fv_a.function_word_dist, fv_b.function_word_dist)
    comparisons.append(FeatureComparison("function_word_dist", fw_sim, 1.4,
        "Cosine similarity of function word usage"))

    # 7. Bigram overlap (weight: 1.3)
    bg_sim = _bigram_jaccard(fv_a.top_bigrams, fv_b.top_bigrams)
    shared = set(fv_a.top_bigrams) & set(fv_b.top_bigrams)
    signal = f"Shared bigrams: {', '.join(list(shared)[:3])}" if shared else None
    comparisons.append(FeatureComparison("vocabulary_overlap", bg_sim, 1.3, signal))

    # 8. Hedging language (weight: 0.8)
    h_sim = _scalar_sim(fv_a.hedge_words, fv_b.hedge_words, scale=0.05)
    comparisons.append(FeatureComparison("syntactic_patterns", h_sim, 0.8, None))

    return comparisons


def _weighted_score(comparisons: List[FeatureComparison]) -> float:
    """Compute weighted average similarity."""
    total_weight = sum(c.weight for c in comparisons)
    if total_weight == 0:
        return 0.0
    return sum(c.score * c.weight for c in comparisons) / total_weight


def _verdict(score: float, min_tokens: int) -> str:
    if min_tokens < 50:
        return "insufficient"
    if score >= 0.80:
        return "strong"
    if score >= 0.60:
        return "moderate"
    return "low"


def _top_signals(comparisons: List[FeatureComparison], score: float) -> List[str]:
    """Extract the most discriminating signals to show analysts."""
    signals = []
    sorted_by_score = sorted(comparisons, key=lambda c: c.score, reverse=True)
    for c in sorted_by_score[:4]:
        if c.signal:
            signals.append(f"[{c.feature.upper()}] {c.signal} — score {c.score:.2f}")
        else:
            signals.append(f"[{c.feature.upper()}] Similarity: {c.score:.2f}")
    return signals


# ─── Public Entry Point ───────────────────────────────────────────────────────

def run_comparison(
    text_a: str,
    text_b: str,
    label_a: str = "Sample A",
    label_b: str = "Sample B",
    run_ref: Optional[str] = None,
    min_tokens: int = 100,
) -> StylometryResult:
    """
    Full stylometric comparison between two text samples.
    Returns a StylometryResult with score, confidence, and audit trail.
    """
    import time
    if run_ref is None:
        run_ref = f"STY-{int(time.time())}"

    fv_a = extract_features(text_a)
    fv_b = extract_features(text_b)

    min_t = min(fv_a.token_count, fv_b.token_count)

    comparisons = compare_features(fv_a, fv_b)
    raw_score = _weighted_score(comparisons)

    # Apply token-count penalty for very short samples
    if min_t < min_tokens:
        penalty = min_t / min_tokens
        raw_score *= penalty

    # Confidence band: ±0.06 base, widens with fewer tokens
    band = 0.06 + max(0, (min_tokens - min_t) / min_tokens) * 0.08
    conf_low = max(0.0, round(raw_score - band, 2))
    conf_high = min(1.0, round(raw_score + band, 2))

    feature_scores = {c.feature: round(c.score, 3) for c in comparisons}
    top_signals = _top_signals(comparisons, raw_score)
    verdict = _verdict(raw_score, min_t)

    # Compute SHA-256 of this result for chain-of-custody
    result_payload = json.dumps({
        "run_ref": run_ref,
        "score": round(raw_score, 4),
        "features": feature_scores,
    }, sort_keys=True)
    sha256 = hashlib.sha256(result_payload.encode()).hexdigest()

    return StylometryResult(
        run_ref=run_ref,
        sample_a_label=label_a,
        sample_b_label=label_b,
        similarity_score=round(raw_score, 4),
        confidence_low=conf_low,
        confidence_high=conf_high,
        verdict=verdict,
        feature_scores=feature_scores,
        top_signals=top_signals,
        token_count_a=fv_a.token_count,
        token_count_b=fv_b.token_count,
        created_at=datetime.now(timezone.utc).isoformat(),
        artifact_sha256=sha256,
    )
