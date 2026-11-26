# KV cache -- same attention output, far less Key/Value work.
import numpy as np

rng = np.random.default_rng(0)

D = 64  # head dimension
N = 50  # tokens in the sequence

W_Q = rng.normal(size=(D, D)) / np.sqrt(D)
W_K = rng.normal(size=(D, D)) / np.sqrt(D)
W_V = rng.normal(size=(D, D)) / np.sqrt(D)

# Toy inputs: one embedding per token. We measure Key/Value work, not generated words.
X = rng.normal(size=(N, D))


def softmax(z):
    shifted = z - np.max(z)
    exp = np.exp(shifted)
    return exp / exp.sum()


def attend(q, K, V):
    weights = softmax(K @ q / np.sqrt(D))
    return weights @ V


# Naive: at every step, recompute Keys and Values for the whole prefix.
naive_kv_rows = 0
naive_out = []
for t in range(1, N + 1):
    K = X[:t] @ W_K
    V = X[:t] @ W_V
    naive_kv_rows += t
    naive_out.append(attend(X[t - 1] @ W_Q, K, V))

# Cached: compute each token's Key and Value once, then store them.
cache_K = np.zeros((N, D))
cache_V = np.zeros((N, D))
cached_kv_rows = 0
cached_out = []
for t in range(1, N + 1):
    cache_K[t - 1] = X[t - 1] @ W_K
    cache_V[t - 1] = X[t - 1] @ W_V
    cached_kv_rows += 1
    cached_out.append(attend(X[t - 1] @ W_Q, cache_K[:t], cache_V[:t]))

naive_out = np.array(naive_out)
cached_out = np.array(cached_out)
max_diff = np.abs(naive_out - cached_out).max()

print("=== Same output? ===")
print(f"max |naive - cached| across all {N} steps: {max_diff:.2e}")
assert np.allclose(naive_out, cached_out)

print(f"\n=== Key/Value rows computed for {N} tokens (K and V each) ===")
print(f"naive:  {naive_kv_rows:,}  (= N(N+1)/2)")
print(f"cached: {cached_kv_rows:,}  (= N)")
print(f"naive does {naive_kv_rows / cached_kv_rows:.1f}x the K/V work")

# Memory: the cache stores K and V for every token, every layer, every head.
BYTES_FP32 = 4
cache_bytes = 2 * N * D * BYTES_FP32
print(f"\n=== Cache memory, one head, one layer, {N} tokens, float32 ===")
print(f"{cache_bytes:,} bytes  (= 2 * N * D * 4)")

# Hypothetical config for scale: 32 layers, 32 heads, head_dim 128, fp16, 4,096 tokens.
layers, heads, head_dim, seq_len, bytes_fp16 = 32, 32, 128, 4096, 2
big = 2 * layers * heads * head_dim * seq_len * bytes_fp16
print(f"\nHypothetical 32-layer, 32-head, head_dim 128, fp16, 4,096 tokens:")
print(f"{big:,} bytes = {big / 2**30:.2f} GiB per sequence")
