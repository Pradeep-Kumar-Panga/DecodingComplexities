"""
Local inference harness for the two LLM-dependent demos in video 1,
running google/gemma-4-E4B-it fully locally via transformers — no API
key, no network calls after the one-time model download.

HARDWARE NOTE: this model is ~8B params in BF16. On CPU-only, expect
~16GB+ RAM to load it and slow generation (tens of seconds per
response). Pre-generate these outputs before recording rather than
waiting on inference live on camera.

Install once:
    pip install -U transformers torch accelerate

First run downloads the model weights (several GB) — do this well
before you need to record, not the same day.
"""

from transformers import AutoProcessor, AutoModelForCausalLM
import torch

from naive_chunker import naive_chunk
from retriever import retrieve, tfidf_vectorize

MODEL_ID = "google/gemma-4-E4B-it"

print("Loading model — this can take a while on CPU, one-time cost per run...")
processor = AutoProcessor.from_pretrained(MODEL_ID)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    dtype="auto",       # will fall back appropriately on CPU
    device_map="cpu",   # force CPU explicitly since there's no GPU here
)


def ask(query: str, context_chunks: list[str], max_new_tokens: int = 200,
        hedge_instruction: bool = True) -> str:
    """Send a query + retrieved context to the local model, return the answer.

    hedge_instruction=True mirrors a carefully-prompted RAG system (tells the
    model to admit uncertainty). hedge_instruction=False mirrors a naive
    implementation that just stuffs context in without that safeguard — this
    is the version more likely to produce a confidently wrong answer, since
    the earlier test showed the model correctly declining once explicitly
    told to say when it doesn't know.
    """
    context_block = "\n\n---\n\n".join(context_chunks)
    base_prompt = (
        "You are a support assistant. Answer the user's question using "
        "the context provided below.\n\nCONTEXT:\n" + context_block
    )
    if hedge_instruction:
        base_prompt = base_prompt.replace(
            "using the context provided below.",
            "using ONLY the context provided below. If the context doesn't "
            "contain the answer, say so — do not guess."
        )

    messages = [
        {"role": "system", "content": base_prompt},
        {"role": "user", "content": query},
    ]

    text = processor.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
        enable_thinking=False,  # keep it a direct answer, not a visible reasoning trace
    )
    inputs = processor(text=text, return_tensors="pt").to(model.device)
    input_len = inputs["input_ids"].shape[-1]

    outputs = model.generate(
        **inputs,
        max_new_tokens=max_new_tokens,
        temperature=1.0,
        top_p=0.95,
        top_k=64,
    )
    response = processor.decode(
        outputs[0][input_len:], skip_special_tokens=True
    )
    return response.strip()


if __name__ == "__main__":
    with open("toy_doc.md") as f:
        doc = f.read()
    chunks = naive_chunk(doc, chunk_size=250)

    N_TRIALS = 5  # sampling is stochastic (temp=1.0) — one run proves nothing

    # -----------------------------------------------------------------
    # DEMO 1 — Retrieval failure (wrong-topic chunk retrieved)
    # Test WITH and WITHOUT the hedging instruction, since the first
    # run showed the model correctly declining once told to admit
    # uncertainty — that's good behavior, not a failure, and it means
    # the "confidently wrong" hook needs the naive (no-hedge) prompt
    # to have a chance of reproducing.
    # -----------------------------------------------------------------
    print("\n" + "=" * 70)
    print("DEMO 1: RETRIEVAL FAILURE")
    print("=" * 70)

    query_1 = "What happens to my data if I downgrade my plan mid-cycle?"
    # Verified 2026-09-17: with tfidf_vectorize + naive_chunk(chunk_size=250),
    # top_k=1 returns chunk index 4 (score 0.2421) — the sentence "Partial
    # refunds are not offered for mid-cycle downgrades" is split by the chunk
    # boundary; chunk 4 holds only the trailing "mid-cycle downgrades." glued
    # to the following Data Retention section. Deterministic, reproduces
    # every run (TF-IDF has no randomness). The LLM's answer to this chunk
    # is NOT verified/guaranteed the same way — see hedge/no-hedge note above.
    top_chunk = retrieve(query_1, chunks, vectorize_fn=tfidf_vectorize, top_k=1)[0][2]
    print(f"\nQuery: {query_1}")
    print(f"\nTop retrieved chunk (topically wrong):\n{top_chunk}\n")

    for hedge in (True, False):
        label = "WITH hedge instruction" if hedge else "WITHOUT hedge instruction (naive prompt)"
        print(f"--- {label} ---")
        for trial in range(N_TRIALS):
            answer = ask(query_1, [top_chunk], hedge_instruction=hedge)
            print(f"  Trial {trial+1}: {answer}")
        print()

    print("-> Ground truth: 'Partial refunds are not offered for mid-cycle")
    print("   downgrades.' Count how often each prompt version declines vs.")
    print("   confidently answers wrong (drifting toward the deletion/")
    print("   retention topic that dominates the retrieved chunk).")

    # -----------------------------------------------------------------
    # DEMO 2 — Generation failure (correct chunk buried among distractors)
    # Uses a MANUALLY VERIFIED intact sentence, not one produced by the
    # fixed-size chunker — isolating "does the model ignore correct
    # context" from "was the context itself corrupted by chunking,"
    # which is what happened in the first attempt.
    # -----------------------------------------------------------------
    print("\n" + "=" * 70)
    print("DEMO 2: GENERATION FAILURE (lost-in-the-middle)")
    print("=" * 70)

    query_2 = "How many days do I have to recover a deleted file?"

    # Hand-verified, uncorrupted — copied directly from the source doc,
    # not sliced by naive_chunk, so any wrong answer here can only be a
    # generation failure, not a chunking artifact.
    correct_chunk_intact = (
        "This recovery window lasts 30 days from the moment of deletion, "
        "after which the files are permanently purged from all Aperture "
        "systems and cannot be recovered by support staff under any "
        "circumstance. Enterprise accounts can request an extended "
        "recovery window of up to 90 days by contacting their account "
        "manager before deletion occurs."
    )
    distractor_context = [
        chunks[0],              # pricing table fragment
        chunks[1],              # pricing table fragment cont.
        correct_chunk_intact,   # the real, intact answer — buried in the middle
        chunks[2],              # refund policy intro
        chunks[6],              # account security
    ]

    print(f"\nQuery: {query_2}")
    print(f"\nCorrect (intact) chunk buried at position 3 of 5:\n{correct_chunk_intact}\n")

    for trial in range(N_TRIALS):
        answer = ask(query_2, distractor_context, hedge_instruction=True)
        print(f"Trial {trial+1}: {answer}")

    print("\n-> Ground truth: 30 days standard, 90 days extended for Enterprise.")
    print("   Since this chunk is verified intact, any wrong/incomplete answer")
    print("   here is a genuine generation failure, not a chunking artifact.")