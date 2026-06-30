-- Knowledge store schema for the optional SupabaseStore (KB_STORE=supabase).
-- Modeled on dragoncandy `donny_knowledge` / harbormill `knowledge`.
--
-- Apply with the Supabase CLI:  supabase db push
-- or paste into the SQL editor of your project. INERT for the default local
-- store — only needed when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set.
--
-- Embedding dimension defaults to 1536 (OpenAI text-embedding-3-small). If you
-- use the local 384-dim model with Supabase, change vector(1536) → vector(384)
-- and the match_knowledge signature to match.

create extension if not exists vector;

create table if not exists public.knowledge (
  id          bigint generated always as identity primary key,
  source_id   text not null unique,                       -- stable id (wiki:<path>)
  content     text not null,                              -- text used for embedding/FTS
  embedding   vector(1536),                               -- null when embeddings are off
  metadata    jsonb not null default '{}'::jsonb,         -- { title, path, tags, hash }
  -- Full-text search vector, maintained automatically from content.
  search      tsvector generated always as (to_tsvector('english', content)) stored,
  updated_at  timestamptz not null default now()
);

-- Approximate-nearest-neighbour index for cosine similarity.
create index if not exists knowledge_embedding_idx
  on public.knowledge using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Full-text search index (the FTS fallback when embeddings are unavailable).
create index if not exists knowledge_search_idx
  on public.knowledge using gin (search);

-- Vector match RPC: returns the k closest rows to a query embedding.
create or replace function public.match_knowledge(
  query_embedding vector(1536),
  match_count int default 10
)
returns table (
  id bigint,
  source_id text,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    k.id,
    k.source_id,
    k.content,
    k.metadata,
    1 - (k.embedding <=> query_embedding) as similarity
  from public.knowledge k
  where k.embedding is not null
  order by k.embedding <=> query_embedding
  limit match_count;
$$;
