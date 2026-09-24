"""
Naive fixed-size chunker — splits text every N characters, no regard
for structure (tables, sentences, sections). This is the default
behavior a lot of people reach for first, and it's what we're going
to break on camera.
"""

def naive_chunk(text: str, chunk_size: int = 250, overlap: int = 0):
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start = end - overlap
    return chunks


if __name__ == "__main__":
    with open("toy_doc.md") as f:
        doc = f.read()

    chunks = naive_chunk(doc, chunk_size=250)

    print(f"Total chunks: {len(chunks)}\n")
    for i, c in enumerate(chunks):
        print(f"--- Chunk {i} ({len(c)} chars) ---")
        print(c)
        