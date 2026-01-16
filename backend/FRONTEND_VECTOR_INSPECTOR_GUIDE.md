# Vector Inspector - Frontend Quick Reference

## 🎯 What You Get from the API

When you call `/api/simulate`, each epoch snapshot now includes:

```typescript
interface EpochSnapshot {
  epoch: number;
  loss: number;
  predicted_text: string;
  attention_weights: number[][]; // Existing: [seq_len, seq_len]
  q_vectors: number[][]; // NEW: [seq_len, head_size]
  k_vectors: number[][]; // NEW: [seq_len, head_size]
  input_tokens: string;
  target_tokens: string;
}
```

## 📐 Understanding the Data

### Vector Dimensions

```
q_vectors: [seq_len, head_size]
k_vectors: [seq_len, head_size]

Where:
- seq_len = number of tokens in sequence (e.g., 16)
- head_size = embed_dim / n_head (e.g., 32 / 2 = 16)
```

### Example Data

```javascript
{
  "q_vectors": [
    [0.15, -0.23, 0.08, ...],  // Token 0's Q vector (16 dims)
    [0.12, 0.19, -0.31, ...],  // Token 1's Q vector (16 dims)
    ...
  ],
  "k_vectors": [
    [0.21, -0.15, 0.11, ...],  // Token 0's K vector (16 dims)
    [0.18, 0.22, -0.28, ...],  // Token 1's K vector (16 dims)
    ...
  ]
}
```

## 🔢 Computing Attention Scores

To understand WHY token i attends to token j:

```javascript
// Get Q and K for tokens i and j
const q_i = snapshot.q_vectors[i]; // Array of head_size floats
const k_j = snapshot.k_vectors[j]; // Array of head_size floats

// Compute dot product
const dotProduct = q_i.reduce((sum, q, idx) => sum + q * k_j[idx], 0);

// Scale by sqrt(head_size)
const head_size = q_i.length;
const scaledScore = dotProduct / Math.sqrt(head_size);

// This scaledScore corresponds to attention_weights[i][j] (before softmax)
```

## 🎨 Visualization Ideas

### 1. Vector Heatmap

```jsx
<VectorHeatmap
  vectors={snapshot.q_vectors}
  tokenLabels={inputTokens}
  title="Query Vectors"
  colorScale="diverging" // red-white-blue
/>
```

### 2. Interactive Inspector

```jsx
<AttentionInspector
  attentionWeights={snapshot.attention_weights}
  qVectors={snapshot.q_vectors}
  kVectors={snapshot.k_vectors}
  onCellClick={(i, j) => {
    // Show Q[i], K[j], and their dot product
    showDotProductExplanation(i, j);
  }}
/>
```

### 3. Epoch Animation

```jsx
<EpochSlider
  history={result.history}
  onEpochChange={(epoch) => {
    // Update visualizations with new Q/K vectors
    updateVectorDisplay(epoch);
  }}
/>
```

## 📊 Recommended React Components

### `VectorGrid.tsx`

Display a single vector as a colored grid:

```tsx
interface VectorGridProps {
  vector: number[]; // 1D array of floats
  label: string;
  colorScale?: "diverging" | "sequential";
}
```

### `VectorComparison.tsx`

Show Q and K vectors side by side:

```tsx
interface VectorComparisonProps {
  qVector: number[];
  kVector: number[];
  tokenI: string;
  tokenJ: string;
  showDotProduct?: boolean;
}
```

### `DotProductExplainer.tsx`

Step-by-step dot product visualization:

```tsx
interface DotProductExplainerProps {
  qVector: number[];
  kVector: number[];
  highlightDimension?: number; // For interactive exploration
}
```

## 🎓 Educational Tooltips

Add these explanations to your UI:

**Q Vector (Query)**

> "What this token is LOOKING FOR in other tokens. Each dimension represents a different feature or pattern."

**K Vector (Key)**

> "What this token OFFERS to other tokens. Tokens with similar Q and K vectors will attend to each other."

**Dot Product**

> "Measures similarity between Q and K. Higher value = stronger attention. Formula: sum(Q[i] \* K[j]) / sqrt(head_size)"

## 🔧 TypeScript Types

```typescript
// Update your existing types
interface EpochSnapshot {
  epoch: number;
  loss: number;
  predicted_text: string;
  attention_weights: number[][];
  q_vectors: number[][]; // ADD THIS
  k_vectors: number[][]; // ADD THIS
  input_tokens: string;
  target_tokens: string;
}

// Helper types
type Vector = number[];
type VectorMatrix = number[][]; // [seq_len, head_size]

// Utility functions
function computeDotProduct(q: Vector, k: Vector): number {
  return q.reduce((sum, val, idx) => sum + val * k[idx], 0);
}

function normalizeVector(v: Vector): Vector {
  const magnitude = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
  return v.map((val) => val / magnitude);
}

function vectorMagnitude(v: Vector): number {
  return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
}
```

## 🎯 Implementation Checklist

- [ ] Update `EpochSnapshot` interface to include `q_vectors` and `k_vectors`
- [ ] Verify API returns these fields (test with `/api/simulate`)
- [ ] Create `VectorGrid` component for heatmap display
- [ ] Create `DotProductExplainer` component
- [ ] Add vector magnitude calculations
- [ ] Implement click-to-inspect interaction
- [ ] Add epoch slider/animation
- [ ] Write educational tooltips
- [ ] Test with different sequence lengths
- [ ] Add responsive design for mobile

## 🐛 Common Issues & Solutions

**Issue**: Vectors are all zeros

- Check that the model is properly loaded
- Verify `return_internals=True` in the API call

**Issue**: Wrong dimensions

- head_size should equal embed_dim / n_head
- seq_len should match input token count

**Issue**: Colors look weird

- Use diverging color scale (red-white-blue) for vectors
- Normalize before coloring if values are too extreme

## 📚 Further Reading

- `backend/VECTOR_INSPECTOR.md` - Technical documentation
- `backend/example_vector_inspector.py` - Usage examples
- `backend/test_vector_inspector.py` - Test cases

## 🚀 Quick Start

1. Update TypeScript interfaces:

```bash
cd logit-app/src/services
# Edit api.ts to add q_vectors and k_vectors to EpochSnapshot
```

2. Test API response:

```bash
# Start backend
cd backend && python main.py

# Test endpoint (in another terminal)
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "epochs": 2}'
```

3. Create visualization components:

```bash
cd logit-app/src/components
# Create VectorInspector.tsx
# Create VectorGrid.tsx
# Create DotProductExplainer.tsx
```

4. Integrate into TrainingLab page:

```tsx
// In TrainingLab.tsx
import { VectorInspector } from "../components/VectorInspector";

// Add to your render:
<VectorInspector
  qVectors={currentSnapshot.q_vectors}
  kVectors={currentSnapshot.k_vectors}
  tokens={inputTokens}
/>;
```

---

**Questions?** Check `backend/example_vector_inspector.py` for working examples!
