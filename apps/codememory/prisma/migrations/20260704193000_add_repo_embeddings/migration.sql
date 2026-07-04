CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS repo_embeddings (
    id TEXT PRIMARY KEY,
    repo_id TEXT NOT NULL REFERENCES "Repo"(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS repo_embeddings_repo_id_idx
    ON repo_embeddings (repo_id);

CREATE INDEX IF NOT EXISTS repo_embeddings_embedding_idx
    ON repo_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

