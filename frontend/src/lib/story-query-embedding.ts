const FIXED_STORY_QUERY_EMBEDDING_MODEL_ID = "Xenova/multilingual-e5-small";
const STORY_QUERY_EMBEDDING_MODEL_ID =
  process.env.NEXT_PUBLIC_STORY_EMBEDDING_MODEL_ID ===
    FIXED_STORY_QUERY_EMBEDDING_MODEL_ID
    ? process.env.NEXT_PUBLIC_STORY_EMBEDDING_MODEL_ID
    : FIXED_STORY_QUERY_EMBEDDING_MODEL_ID;
const STORY_EMBEDDING_DIMENSION = 384;
const STORY_QUERY_EMBEDDING_BROWSER_ONLY_ERROR =
  "Story query embedding can only run in the browser runtime. Do not initialize story semantic search on the server.";

type FeatureExtractionResult = { data: Float32Array | number[] };
type FeatureExtractor = (
  input: string,
  options: { pooling: "mean"; normalize: true },
) => Promise<FeatureExtractionResult>;

let extractorPromise: Promise<FeatureExtractor> | null = null;

function assertBrowserRuntime(): void {
  if (typeof window === "undefined") {
    throw new Error(STORY_QUERY_EMBEDDING_BROWSER_ONLY_ERROR);
  }
}

async function loadExtractor(): Promise<FeatureExtractor> {
  const { env, pipeline } = await import("@xenova/transformers");
  env.allowLocalModels = false;
  env.useBrowserCache = true;

  return (await pipeline(
    "feature-extraction",
    STORY_QUERY_EMBEDDING_MODEL_ID,
  )) as FeatureExtractor;
}

export async function embedStoryQuery(query: string): Promise<number[]> {
  assertBrowserRuntime();

  const normalized = query.trim();
  if (normalized.length < 2) {
    throw new Error("Story query must contain at least 2 characters");
  }

  extractorPromise ??= loadExtractor().catch((error) => {
    extractorPromise = null;
    throw error;
  });
  const extractor = await extractorPromise;
  const output = await extractor(`query: ${normalized}`, {
    pooling: "mean",
    normalize: true,
  });
  const embedding = Array.from(output.data);

  if (embedding.length !== STORY_EMBEDDING_DIMENSION) {
    throw new Error(
      `Expected embedding dimension ${STORY_EMBEDDING_DIMENSION}, received ${embedding.length}`,
    );
  }

  return embedding;
}
