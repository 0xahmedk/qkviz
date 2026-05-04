// API service for communicating with the QKViz backend

const DEV_API_BASE_URL = "http://localhost:8000";
const PROD_API_BASE_URL = "https://0xahmedk.me/qkviz-api";
const APP_ENV =
  import.meta.env.VITE_APP_ENV ?? import.meta.env.MODE ?? "development";
const IS_PROD = APP_ENV === "production";
const API_BASE_URL = IS_PROD ? PROD_API_BASE_URL : DEV_API_BASE_URL;
console.log("API_BASE_URL", API_BASE_URL);
const API_USERNAME = import.meta.env.VITE_API_USERNAME;
const API_PASSWORD = import.meta.env.VITE_API_PASSWORD;

export interface ApiResponse<T> {
  data: T;
  status: number;
}

interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

function buildAuthHeader(): Record<string, string> {
  if (!IS_PROD) {
    return {};
  }

  if (!API_USERNAME || !API_PASSWORD) {
    throw new Error(
      "Missing production API credentials. Set VITE_API_USERNAME and VITE_API_PASSWORD.",
    );
  }

  const encoded = btoa(`${API_USERNAME}:${API_PASSWORD}`);
  return { Authorization: `Basic ${encoded}` };
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers);
  const authHeader = buildAuthHeader();

  Object.entries(authHeader).forEach(([key, value]) => {
    headers.set(key, value);
  });

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorPayload = payload as ApiErrorResponse;
    const message =
      errorPayload.detail ||
      errorPayload.message ||
      response.statusText ||
      "Request failed";
    throw new Error(message);
  }

  return {
    data: payload as T,
    status: response.status,
  };
}

export interface TokenPrediction {
  token: string;
  probability: number;
  log_probability: number;
}

export interface GenerateResponse {
  next_token_predictions: TokenPrediction[];
  context: string;
  generated_token: string;
}

export interface GenerateSequenceResponse {
  generated_text: string;
  context: string;
  num_tokens: number;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  device: string | null;
}

export interface EpochSnapshot {
  epoch: number;
  loss: number;
  predicted_text: string;
  attention_weights: number[][];
  q_vectors: number[][]; // NEW: Query vectors [seq_len, head_size]
  k_vectors: number[][]; // NEW: Key vectors [seq_len, head_size]
  input_tokens: string[]; // Array of token strings
  target_tokens: string[]; // Array of token strings
}

export interface SimulateResponse {
  history: EpochSnapshot[];
  vocab: Record<string, number>;
  idx_to_token: Record<string, string>;
  vocab_size: number;
  error?: string;
}

/**
 * Check if the backend API is healthy and model is loaded
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await apiFetch<HealthResponse>("/health");
    return response.data;
  } catch (error) {
    console.error("Health check failed:", error);
    throw error;
  }
}

/**
 * Generate next token step-by-step
 */
export async function generateNextToken(
  context: string,
  temperature: number = 1.0,
  topK: number = 5,
): Promise<GenerateResponse> {
  try {
    const response = await apiFetch<GenerateResponse>("/generate", {
      method: "POST",
      body: JSON.stringify({
        context,
        temperature,
        top_k: topK,
      }),
    });
    return response.data;
  } catch (error) {
    console.error("Token generation failed:", error);
    throw error;
  }
}

/**
 * Generate a complete sequence of tokens
 */
export async function generateSequence(
  context: string,
  temperature: number = 1.0,
  maxTokens: number = 100,
): Promise<GenerateSequenceResponse> {
  try {
    const response = await apiFetch<GenerateSequenceResponse>(
      `/generate-sequence?max_tokens=${maxTokens}`,
      {
        method: "POST",
        body: JSON.stringify({
          context,
          temperature,
        }),
      },
    );

    return response.data;
  } catch (error) {
    console.error("Sequence generation failed:", error);
    throw error;
  }
}

/**
 * Get vocabulary information
 */
export async function getVocab(): Promise<{
  vocab_size: number;
  sample_chars: string[];
}> {
  try {
    const response = await apiFetch<{
      vocab_size: number;
      sample_chars: string[];
    }>("/vocab");

    return response.data;
  } catch (error) {
    console.error("Vocab fetch failed:", error);
    throw error;
  }
}

/**
 * Simulate training on a text corpus
 */
export async function simulateTraining(
  text: string,
  epochs: number = 20,
  lr: number = 0.01,
  embedDim: number = 32,
  nHead: number = 2,
  nLayer: number = 2,
  blockSize: number = 64,
): Promise<SimulateResponse> {
  try {
    const response = await apiFetch<SimulateResponse>("/api/simulate", {
      method: "POST",
      body: JSON.stringify({
        text,
        epochs,
        lr,
        embed_dim: embedDim,
        n_head: nHead,
        n_layer: nLayer,
        block_size: blockSize,
      }),
    });
    return response.data;
  } catch (error) {
    console.error("Training simulation failed:", error);
    throw error;
  }
}
