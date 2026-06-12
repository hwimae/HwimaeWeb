class Embedder:
    def __init__(self, model_name: str) -> None:
        from sentence_transformers import SentenceTransformer

        self.model = SentenceTransformer(model_name)

    def embed(self, text: str) -> list[float]:
        normalized = text.strip()
        vector = self.model.encode(normalized, normalize_embeddings=True)
        return [float(value) for value in vector.tolist()]
