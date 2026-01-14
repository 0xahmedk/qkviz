# Training Lab API - Frontend Quick Reference

## Endpoint

```
POST http://localhost:8000/api/simulate
```

## Request Format

### Minimal Request (uses defaults)

```json
{
  "text": "The cat sat on the mat."
}
```

### Full Request (all options)

```json
{
  "text": "The cat sat on the mat.",
  "epochs": 20,
  "lr": 0.01,
  "embed_dim": 32,
  "n_head": 2,
  "n_layer": 2,
  "block_size": 64
}
```

## Response Format

```typescript
interface SimulateResponse {
  history: Array<{
    epoch: number; // Epoch number (0, 1, 2, ...)
    loss: number; // Training loss (decreases over time)
    predicted_text: string; // Model's prediction at this epoch
    attention_weights: number[][]; // Attention matrix (seq_len x seq_len)
    input_tokens: string; // The input sequence
    target_tokens: string; // The target sequence
  }>;
  vocab: Record<string, number>; // Token to index mapping
  idx_to_token: Record<string, string>; // Index to token mapping
  vocab_size: number; // Size of vocabulary
  error?: string; // Error message if any
}
```

## TypeScript Types

```typescript
// Request
interface SimulateRequest {
  text: string;
  epochs?: number; // default: 20, range: 1-1000
  lr?: number; // default: 0.01, range: 0.0-1.0
  embed_dim?: number; // default: 32
  n_head?: number; // default: 2
  n_layer?: number; // default: 2
  block_size?: number; // default: 64
}

// Response
interface EpochSnapshot {
  epoch: number;
  loss: number;
  predicted_text: string;
  attention_weights: number[][];
  input_tokens: string;
  target_tokens: string;
}

interface SimulateResponse {
  history: EpochSnapshot[];
  vocab: Record<string, number>;
  idx_to_token: Record<string, string>;
  vocab_size: number;
  error?: string;
}
```

## React Example

```typescript
import { useState } from "react";

function TrainingLab() {
  const [text, setText] = useState("");
  const [epochs, setEpochs] = useState(20);
  const [isTraining, setIsTraining] = useState(false);
  const [result, setResult] = useState<SimulateResponse | null>(null);

  const runSimulation = async () => {
    setIsTraining(true);
    try {
      const response = await fetch("http://localhost:8000/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, epochs }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Simulation failed:", error);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter your text here..."
      />
      <input
        type="number"
        value={epochs}
        onChange={(e) => setEpochs(Number(e.target.value))}
        min={1}
        max={1000}
      />
      <button onClick={runSimulation} disabled={isTraining}>
        {isTraining ? "Training..." : "Start Training"}
      </button>

      {result && (
        <div>
          <h3>Results</h3>
          <p>Vocabulary Size: {result.vocab_size}</p>
          <p>Initial Loss: {result.history[0].loss.toFixed(4)}</p>
          <p>
            Final Loss:{" "}
            {result.history[result.history.length - 1].loss.toFixed(4)}
          </p>

          {/* Plot loss curve */}
          <LossChart data={result.history.map((h) => h.loss)} />

          {/* Show attention heatmap */}
          <AttentionHeatmap
            data={result.history[result.history.length - 1].attention_weights}
          />
        </div>
      )}
    </div>
  );
}
```

## Visualization Examples

### 1. Loss Curve (Chart.js)

```typescript
import { Line } from "react-chartjs-2";

function LossChart({ data }: { data: number[] }) {
  const chartData = {
    labels: data.map((_, i) => `Epoch ${i}`),
    datasets: [
      {
        label: "Training Loss",
        data: data,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  return <Line data={chartData} />;
}
```

### 2. Attention Heatmap (Plotly)

```typescript
import Plot from "react-plotly.js";

function AttentionHeatmap({ data }: { data: number[][] }) {
  return (
    <Plot
      data={[
        {
          z: data,
          type: "heatmap",
          colorscale: "Viridis",
        },
      ]}
      layout={{
        title: "Attention Weights",
        xaxis: { title: "Key Position" },
        yaxis: { title: "Query Position" },
      }}
    />
  );
}
```

### 3. Prediction Timeline

```typescript
function PredictionTimeline({ history }: { history: EpochSnapshot[] }) {
  return (
    <div>
      {history.map((snapshot, i) => (
        <div key={i} style={{ marginBottom: "10px" }}>
          <strong>Epoch {snapshot.epoch}:</strong>
          <div>Loss: {snapshot.loss.toFixed(4)}</div>
          <div
            style={{
              backgroundColor: `rgba(75, 192, 192, ${
                1 - snapshot.loss / history[0].loss
              })`,
            }}
          >
            {snapshot.predicted_text}
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Error Handling

```typescript
try {
  const response = await fetch("http://localhost:8000/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, epochs }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Simulation failed");
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  // Success - use data
} catch (error) {
  console.error("Error:", error.message);
  // Show error to user
}
```

## Common Error Messages

| Status | Message                                 | Cause                          |
| ------ | --------------------------------------- | ------------------------------ |
| 400    | "Text corpus cannot be empty"           | Empty or whitespace-only text  |
| 400    | "Epochs must be between 1 and 1000"     | Invalid epoch count            |
| 400    | "Learning rate must be between 0 and 1" | Invalid learning rate          |
| 400    | "Text corpus is too short..."           | Text has fewer than 2 words    |
| 500    | "Training simulation failed: ..."       | Internal error during training |

## Performance Tips

### For Real-Time Visualization

```json
{
  "text": "Short text here.",
  "epochs": 10,
  "embed_dim": 16,
  "n_head": 2,
  "n_layer": 2
}
```

⚡ Fast (~1-2 seconds)

### For Better Quality

```json
{
  "text": "Your longer text here...",
  "epochs": 50,
  "embed_dim": 64,
  "n_head": 4,
  "n_layer": 3
}
```

🐌 Slower (~5-10 seconds)

## Example Texts to Try

### Short (Fast)

- "The cat sat on the mat."
- "Hello world!"
- "I love programming."

### Medium (Recommended)

- "The quick brown fox jumps over the lazy dog. The dog was sleeping."
- "Machine learning is fun. Deep learning is powerful. AI is the future."

### Long (Detailed)

- "In the beginning there was nothing. Then light appeared. The light brought warmth. Warmth brought life. Life brought joy."

## WebSocket Alternative (Future Enhancement)

For real-time updates during training:

```typescript
// Not implemented yet, but here's how it could work:
const ws = new WebSocket("ws://localhost:8000/api/simulate-stream");

ws.onmessage = (event) => {
  const snapshot = JSON.parse(event.data);
  // Update UI with each epoch in real-time
  updateLossChart(snapshot.loss);
  updatePrediction(snapshot.predicted_text);
};

ws.send(JSON.stringify({ text, epochs }));
```

## Complete Component Example

```typescript
import { useState } from "react";
import { Line } from "react-chartjs-2";

export function TrainingLab() {
  const [text, setText] = useState("The cat sat on the mat.");
  const [epochs, setEpochs] = useState(20);
  const [lr, setLr] = useState(0.01);
  const [isTraining, setIsTraining] = useState(false);
  const [result, setResult] = useState<SimulateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    setIsTraining(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, epochs, lr }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsTraining(false);
    }
  };

  const lossData = result
    ? {
        labels: result.history.map((_, i) => i),
        datasets: [
          {
            label: "Loss",
            data: result.history.map((h) => h.loss),
            borderColor: "rgb(75, 192, 192)",
          },
        ],
      }
    : null;

  return (
    <div className="training-lab">
      <h2>Training Lab</h2>

      {/* Input Section */}
      <div className="input-section">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to train on..."
          rows={4}
          disabled={isTraining}
        />

        <div className="controls">
          <label>
            Epochs:
            <input
              type="number"
              value={epochs}
              onChange={(e) => setEpochs(Number(e.target.value))}
              min={1}
              max={1000}
              disabled={isTraining}
            />
          </label>

          <label>
            Learning Rate:
            <input
              type="number"
              value={lr}
              onChange={(e) => setLr(Number(e.target.value))}
              step={0.001}
              min={0}
              max={1}
              disabled={isTraining}
            />
          </label>

          <button onClick={runSimulation} disabled={isTraining || !text}>
            {isTraining ? "Training..." : "Start Training"}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && <div className="error">Error: {error}</div>}

      {/* Results Section */}
      {result && (
        <div className="results">
          <h3>Training Results</h3>

          <div className="stats">
            <p>Vocabulary Size: {result.vocab_size}</p>
            <p>Initial Loss: {result.history[0].loss.toFixed(4)}</p>
            <p>
              Final Loss:{" "}
              {result.history[result.history.length - 1].loss.toFixed(4)}
            </p>
            <p>
              Improvement:{" "}
              {(
                ((result.history[0].loss -
                  result.history[result.history.length - 1].loss) /
                  result.history[0].loss) *
                100
              ).toFixed(1)}
              %
            </p>
          </div>

          {lossData && (
            <div className="chart">
              <Line data={lossData} />
            </div>
          )}

          <div className="predictions">
            <h4>Predictions Over Time</h4>
            {result.history.slice(0, 5).map((snapshot, i) => (
              <div key={i}>
                <strong>Epoch {snapshot.epoch}:</strong>{" "}
                {snapshot.predicted_text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## API Compatibility Note

This endpoint is **completely independent** from the `/generate` endpoint:

- Uses its own tokenizer
- Creates its own model
- No shared state
- Can run simultaneously with generation

The original `/generate` endpoint remains unchanged and fully functional.
