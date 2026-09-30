# Cosine Similarity Isn't Measuring What You Think It Is
# Companion code for the video -- paste this into a Colab cell and run it.
# Requires: pip install scikit-learn sentence-transformers

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ---------------------------------------------------------------------------
# Toy support document (Aperture Cloud Storage policy reference) -- same
# text a support bot's RAG pipeline would retrieve from. Chunk 3 is the
# refund-policy decoy, chunk 5 is the real file-recovery answer.
# ---------------------------------------------------------------------------
DOC = """# Aperture Cloud Storage — Product & Policy Reference

## Plans and Pricing

| Plan | Storage | Price | Support |
|------|---------|-------|---------|
| Free | 5GB | $0/mo | Community forum only |
| Pro | 500GB | $12/mo | Email support, 24 hour response time |
| Enterprise | 5TB | $99/mo | Dedicated account manager, 1 hour response SLA |

All plans include automatic file versioning and end-to-end encryption. Enterprise
customers additionally receive a quarterly account review and priority escalation
for any support ticket marked critical.

## Refund Policy

Aperture offers refunds under limited conditions. Standard refund requests must be
submitted within 14 days of the original purchase date. Enterprise plan customers
are given an extended window and may request a refund within 30 days of purchase,
provided the account has not exceeded 10% of its storage allocation. Refunds are
processed to the original payment method within 5 to 7 business days. Partial
refunds are not offered for mid-cycle downgrades.

## Data Retention and Deletion

When a file is deleted by a user, it is not immediately erased. Aperture moves
deleted files into a recovery buffer where they remain restorable by the account
owner. This recovery window lasts 30 days from the moment of deletion, after which
the files are permanently purged from all Aperture systems and cannot be recovered
by support staff under any circumstance. Enterprise accounts can request an
extended recovery window of up to 90 days by contacting their account manager
before deletion occurs.

## Account Security

Two-factor authentication is available on all plans and is mandatory for Enterprise
accounts. Aperture recommends rotating API keys every 90 days."""


# ---------------------------------------------------------------------------
# Naive fixed-size chunker -- splits every 250 characters, no regard for
# sentence/section boundaries. This is the default most people reach for
# first, and it's what produces chunk 3 and chunk 5 below.
# ---------------------------------------------------------------------------
def naive_chunk(text, chunk_size=250):
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]


QUERY = "How many days do I have to recover a deleted file?"
chunks = naive_chunk(DOC, chunk_size=250)
print(f"Total chunks: {len(chunks)}")
print(f"QUERY: {QUERY}\n")


# ---------------------------------------------------------------------------
# retrieve() never changes between backends -- only the vectorizer does.
# That's the whole point being demonstrated.
# ---------------------------------------------------------------------------
def retrieve(query, chunks, vectorize_fn, top_k=2):
    query_vec, chunk_vecs = vectorize_fn(query, chunks)
    scores = cosine_similarity(query_vec, chunk_vecs)[0]
    ranked = sorted(range(len(chunks)), key=lambda i: scores[i], reverse=True)
    return [(i, scores[i]) for i in ranked[:top_k]], dict(zip(range(len(chunks)), scores))


# ---------------------------------------------------------------------------
# WRONG WAY: TF-IDF -- counts overlapping words, blind to meaning. "days"
# appears in both the refund chunk and the real answer, so word-overlap
# alone can't separate them.
# ---------------------------------------------------------------------------
def tfidf_vectorize(query, chunks):
    vectorizer = TfidfVectorizer()
    chunk_vecs = vectorizer.fit_transform(chunks)
    query_vec = vectorizer.transform([query])
    return query_vec, chunk_vecs


print("=== Backend: TF-IDF (word overlap) ===")
top2_tfidf, scores_tfidf = retrieve(QUERY, chunks, tfidf_vectorize)
for rank, (idx, score) in enumerate(top2_tfidf):
    print(f"Rank {rank + 1}: chunk {idx}  score={score:.3f}")
print(f"Refund decoy (chunk 3):    score={scores_tfidf[3]:.3f}")
print(f"Real answer  (chunk 5):    score={scores_tfidf[5]:.3f}")
if scores_tfidf[3] > scores_tfidf[5]:
    print(">> DECOY BEATS THE REAL ANSWER.\n")
else:
    print(">> Real answer correctly wins.\n")


# ---------------------------------------------------------------------------
# RIGHT WAY: a real embedding model -- trained to place semantically similar
# text near each other, regardless of exact word overlap. Same retrieve(),
# same cosine similarity, only the vectorizer swapped.
# ---------------------------------------------------------------------------
def embedding_vectorize(query, chunks):
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("all-MiniLM-L6-v2")
    chunk_vecs = model.encode(chunks)
    query_vec = model.encode([query])
    return query_vec, chunk_vecs


print("=== Backend: sentence-transformers (semantic embeddings) ===")
top2_emb, scores_emb = retrieve(QUERY, chunks, embedding_vectorize)
for rank, (idx, score) in enumerate(top2_emb):
    print(f"Rank {rank + 1}: chunk {idx}  score={score:.3f}")
print(f"Refund decoy (chunk 3):    score={scores_emb[3]:.3f}")
print(f"Real answer  (chunk 5):    score={scores_emb[5]:.3f}")
if scores_emb[5] > scores_emb[3]:
    print(">> Real answer correctly outranks the decoy.\n")
else:
    print(">> Decoy still wins -- embedding backend did not fix it.\n")

print(">> retrieve() never changed. Only the vectorizer did.")
print(">> Same cosine similarity formula, opposite ranking outcome.")


# ---------------------------------------------------------------------------
# CONTRAST CARD for the slide deck -- matches the exact numbers printed
# above, not a separately-drawn approximation. Brand palette: black/white/
# red/green.
# ---------------------------------------------------------------------------
import matplotlib.pyplot as plt
import numpy as np

labels = ["Refund decoy\n(chunk 3)", "Real answer\n(chunk 5)"]
tfidf_vals = [scores_tfidf[3], scores_tfidf[5]]
emb_vals = [scores_emb[3], scores_emb[5]]

x = np.arange(len(labels))
width = 0.32

fig, ax = plt.subplots(figsize=(7, 4.5), facecolor="white")
bars1 = ax.bar(x - width / 2, tfidf_vals, width, label="TF-IDF (wrong)",
               color=["#d32f2f", "#7a7a7a"])
bars2 = ax.bar(x + width / 2, emb_vals, width, label="Embedding (right)",
               color=["#7a7a7a", "#2e7d32"])

for bars in (bars1, bars2):
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2, height + 0.015, f"{height:.3f}",
                ha="center", va="bottom", fontsize=11, fontweight="bold", color="black")

ax.set_xticks(x)
ax.set_xticklabels(labels)
ax.set_ylim(0, max(tfidf_vals + emb_vals) + 0.1)
ax.set_ylabel("Cosine similarity score")
ax.set_title("Same query, same formula, different vectorizer")
ax.legend(frameon=False)
ax.spines[["top", "right"]].set_visible(False)
plt.tight_layout()
plt.savefig("CosineSimilarityEmbeddings_backend_contrast.png", dpi=150)
print("Saved contrast chart: CosineSimilarityEmbeddings_backend_contrast.png")
