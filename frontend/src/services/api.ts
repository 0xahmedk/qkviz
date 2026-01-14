// API service for communicating with the QKViz backend

const API_BASE_URL = "http://localhost:8000";

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
  input_tokens: string;
  target_tokens: string;
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
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return await response.json();
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
  topK: number = 5
): Promise<GenerateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        context,
        temperature,
        top_k: topK,
      }),
    });

    if (!response.ok) {
      throw new Error(`Generation failed: ${response.statusText}`);
    }

    return await response.json();
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
  maxTokens: number = 100
): Promise<GenerateSequenceResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/generate-sequence?max_tokens=${maxTokens}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context,
          temperature,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Sequence generation failed: ${response.statusText}`);
    }

    return await response.json();
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
    const response = await fetch(`${API_BASE_URL}/vocab`);
    if (!response.ok) {
      throw new Error(`Vocab fetch failed: ${response.statusText}`);
    }
    return await response.json();
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
  blockSize: number = 64
): Promise<SimulateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Training simulation failed: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Training simulation failed:", error);
    throw error;
  }
}
