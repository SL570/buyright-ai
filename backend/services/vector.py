import os
from typing import List

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
INDEX_NAME       = os.getenv("PINECONE_INDEX", "buyright-knowledge")
EMBED_MODEL      = "multilingual-e5-large"
DIMENSION        = 1024


def _get_pc():
    from pinecone import Pinecone
    return Pinecone(api_key=PINECONE_API_KEY)


def _get_index():
    return _get_pc().Index(INDEX_NAME)


def embed_texts(texts: List[str], input_type: str = "passage") -> List[List[float]]:
    pc = _get_pc()
    result = pc.inference.embed(
        model=EMBED_MODEL,
        inputs=texts,
        parameters={"input_type": input_type, "truncate": "END"},
    )
    return [item["values"] for item in result]


def search_knowledge(query: str, top_k: int = 4) -> List[str]:
    """Return top-k relevant knowledge chunks for a query. Returns [] if not configured."""
    if not PINECONE_API_KEY:
        return []
    try:
        query_vec = embed_texts([query], input_type="query")[0]
        results = _get_index().query(
            vector=query_vec,
            top_k=top_k,
            include_metadata=True,
        )
        return [
            m["metadata"]["text"]
            for m in results["matches"]
            if m.get("score", 0) > 0.4 and m.get("metadata", {}).get("text")
        ]
    except Exception as e:
        print(f"[PINECONE] search error: {e}")
        return []


def upsert_chunks(chunks: List[dict]) -> None:
    """chunks: list of {"id": str, "text": str, "category": str}"""
    if not PINECONE_API_KEY or not chunks:
        return
    try:
        pc      = _get_pc()
        index   = pc.Index(INDEX_NAME)
        texts   = [c["text"] for c in chunks]
        vectors = embed_texts(texts, input_type="passage")
        records = [
            {
                "id":       c["id"],
                "values":   v,
                "metadata": {"text": c["text"], "category": c.get("category", "general")},
            }
            for c, v in zip(chunks, vectors)
        ]
        index.upsert(vectors=records)
        print(f"[PINECONE] upserted {len(records)} chunks")
    except Exception as e:
        print(f"[PINECONE] upsert error: {e}")


def index_is_empty() -> bool:
    """Returns True if the index has no vectors (needs seeding)."""
    if not PINECONE_API_KEY:
        return False
    try:
        stats = _get_index().describe_index_stats()
        return stats.get("total_vector_count", 0) == 0
    except Exception:
        return False
