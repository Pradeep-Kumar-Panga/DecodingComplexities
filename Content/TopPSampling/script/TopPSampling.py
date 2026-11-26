# Top-p (nucleus) sampling -- a cutoff whose pool size adapts to the distribution.
import numpy as np

VOCAB = ["30", "14", "90", "60", "45", "7", "10", "365", "0",
         "immediately", "never", "unsure"]

# Raw logits for: "How many days do I have to recover a deleted file?"
LOGITS = np.array([
    4.0, 3.2, 2.8, 1.5, 1.0, 0.6, 0.4, -0.5, -0.8, -1.0, -1.5, -2.0,
])

WRONG_TOKENS = ["immediately", "never", "unsure"]
P = 0.90


def softmax(logits):
    shifted = logits - np.max(logits)
    exp = np.exp(shifted)
    return exp / exp.sum()


def apply_temperature(logits, T):
    return softmax(logits / T)


def top_p_filter(probs, p):
    idx_sorted = np.argsort(probs)[::-1]
    cumulative = np.cumsum(probs[idx_sorted])
    cutoff = np.searchsorted(cumulative, p) + 1  # smallest n with cumulative >= p
    kept_idx = idx_sorted[:cutoff]
    kept_probs = probs[kept_idx]
    return kept_idx, kept_probs / kept_probs.sum(), cumulative[cutoff - 1]


wrong_idx = {VOCAB.index(t) for t in WRONG_TOKENS}

probs_T05 = apply_temperature(LOGITS, 0.5)
probs_T10 = apply_temperature(LOGITS, 1.0)
probs_T20 = apply_temperature(LOGITS, 2.0)

kept_T05, _, mass_T05 = top_p_filter(probs_T05, P)
kept_T10, _, mass_T10 = top_p_filter(probs_T10, P)
kept_T20, _, mass_T20 = top_p_filter(probs_T20, P)

print(f"=== top_p={P} at T=0.5 (sharp distribution) ===")
print(f"pool ({len(kept_T05)} tokens, cumulative mass {mass_T05:.4%}): {[VOCAB[i] for i in kept_T05]}\n")

print(f"=== top_p={P} at T=1.0 ===")
print(f"pool ({len(kept_T10)} tokens, cumulative mass {mass_T10:.4%}): {[VOCAB[i] for i in kept_T10]}")

print(f"\n=== top_p={P} at T=2.0 ===")
print(f"pool ({len(kept_T20)} tokens, cumulative mass {mass_T20:.4%}): {[VOCAB[i] for i in kept_T20]}")

print(f"\nT=1.0 pool is a subset of T=2.0 pool: {set(kept_T10) <= set(kept_T20)}")
print(f"ungrounded tokens in T=1.0 pool: {[VOCAB[i] for i in kept_T10 if i in wrong_idx] or 'none'}")
print(f"ungrounded tokens in T=2.0 pool: {[VOCAB[i] for i in kept_T20 if i in wrong_idx] or 'none'}")

# Fixed-count comparison: top-k keeps the same number of tokens whatever the shape
K = 4
print(f"\n=== top_k={K} on the same three distributions ===")
for label, probs in [("T=0.5", probs_T05), ("T=1.0", probs_T10), ("T=2.0", probs_T20)]:
    top_k_mass = np.sort(probs)[::-1][:K].sum()
    print(f"{label}: pool {K} tokens, probability mass kept {top_k_mass:.2%}")
