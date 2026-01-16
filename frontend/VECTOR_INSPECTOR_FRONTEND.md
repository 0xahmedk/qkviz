# Vector Inspector - Frontend Implementation

## 🎉 Implementation Complete

The Vector Inspector feature has been successfully integrated into the QKViz frontend! This document describes the implementation details.

## 📁 Files Modified/Created

### Modified Files:

1. **`frontend/src/services/api.ts`** - Updated TypeScript interfaces
2. **`frontend/src/pages/TrainingLab.tsx`** - Integrated Vector Inspector modal

### Created Files:

1. **`frontend/src/components/VectorInspector.tsx`** - Main component
2. **`frontend/src/components/VectorInspector.css`** - Styling

## 🔧 Implementation Details

### 1. API Interface Update (`api.ts`)

Added Q and K vector fields to the `EpochSnapshot` interface:

```typescript
export interface EpochSnapshot {
  epoch: number;
  loss: number;
  predicted_text: string;
  attention_weights: number[][];
  q_vectors: number[][]; // NEW: Query vectors [seq_len, head_size]
  k_vectors: number[][]; // NEW: Key vectors [seq_len, head_size]
  input_tokens: string;
  target_tokens: string;
}
```

### 2. VectorInspector Component

**Location**: `frontend/src/components/VectorInspector.tsx`

**Features**:

- 📊 **Side-by-side visualization** of Q and K vectors as vertical bar charts
- 🎨 **Color-coded alignment**:
  - 🟢 **Green**: Both vectors are positive (aligned) - contributes to high attention
  - 🔴 **Red**: Vectors have opposite signs (conflicting) - reduces attention
  - ⚪ **Gray**: Neutral/weak signal
- 🧮 **Shows the math**:
  - Raw dot product: `sum(Q[i] × K[j])`
  - Scaled score: `dot_product / sqrt(head_size)`
  - Final attention percentage (after softmax)
- 💬 **Educational explanations**: Contextual text explaining why attention is high/low

**Props**:

```typescript
interface VectorInspectorProps {
  opened: boolean; // Modal open state
  onClose: () => void; // Close handler
  tokenI: string; // Query token (what's looking)
  tokenJ: string; // Key token (being looked at)
  qVector: number[]; // Q vector data [head_size]
  kVector: number[]; // K vector data [head_size]
  attentionScore: number; // Final attention weight (0-1)
}
```

### 3. TrainingLab Integration

**Changes to `TrainingLab.tsx`**:

1. **Added inspector state**:

```typescript
const [inspectorState, setInspectorState] = useState<InspectorState>({
  opened: false,
  tokenI: "",
  tokenJ: "",
  row: -1,
  col: -1,
});
```

2. **Added click handler to attention cells**:

```typescript
onClick={() => {
  if (!isZero) {
    setInspectorState({
      opened: true,
      tokenI: targetToken,
      tokenJ: sourceToken,
      row: i,
      col: j,
    });
  }
}}
```

3. **Rendered VectorInspector modal**:

```tsx
<VectorInspector
  opened={inspectorState.opened}
  onClose={() => setInspectorState({ ... })}
  tokenI={inspectorState.tokenI}
  tokenJ={inspectorState.tokenJ}
  qVector={currentSnapshot.q_vectors[inspectorState.row] || []}
  kVector={currentSnapshot.k_vectors[inspectorState.col] || []}
  attentionScore={currentSnapshot.attention_weights[...] || 0}
/>
```

## 🎨 Visual Design

### Color Scheme

- **Query Vector (Q)**: Pink/Magenta tones
- **Key Vector (K)**: Cyan/Blue tones
- **Aligned dimensions**: Green (`rgba(64, 192, 87, 0.8)`)
- **Opposite dimensions**: Red (`rgba(250, 82, 82, 0.8)`)
- **Neutral**: Semi-transparent pink/cyan

### Layout

- **Modal**: Centered, size XL
- **Header**: Token badges (pink for Q, cyan for K)
- **Math section**: Shows dot product calculation
- **Vectors**: Side-by-side bar charts (50% width each)
- **Legend**: Bottom of modal

## 🎯 User Interaction Flow

1. **User starts training** in Training Lab
2. **Training completes**, attention matrix is displayed
3. **User hovers** over attention cell → sees tooltip with attention details
4. **User clicks** attention cell → Vector Inspector modal opens
5. **Modal displays**:
   - Which tokens are being compared (Q token → K token)
   - The mathematical computation (dot product, scaled score)
   - Visual bar charts of both vectors
   - Color-coded alignment highlighting
   - Educational explanation of why attention is high/low
6. **User can**:
   - View different dimensions by scrolling
   - Hover over bars to see exact values
   - Read the explanation text
   - Close modal and click another cell

## 📊 Example Use Case

**Scenario**: User trains on "The quick brown fox"

1. Clicks attention cell where "brown" (row 2) attends to "quick" (col 1)
2. Modal shows:
   - **Q token**: "brown" (what it's looking for)
   - **K token**: "quick" (what it offers)
   - **Dot product**: 0.1234
   - **Scaled score**: 0.0308 (divided by √16)
   - **Attention**: 15.7% (after softmax)
   - **Bar charts**: Shows dimensions 0-15 for both vectors
   - **Green bars**: Dimensions where both vectors are positive
   - **Explanation**: "High alignment! The query and key vectors point in similar directions."

## 🧮 Mathematical Formulas

### Dot Product

```
dot_product = sum(Q[i] × K[j]) for all dimensions
```

### Scaled Score

```
scaled_score = dot_product / sqrt(head_size)
```

### Alignment Detection

```
if Q[dim] > 0.1 AND K[dim] > 0.1:
    color = GREEN (aligned)
elif (Q[dim] > 0.1 AND K[dim] < -0.1) OR (Q[dim] < -0.1 AND K[dim] > 0.1):
    color = RED (opposite)
else:
    color = GRAY (neutral)
```

## 🔍 Educational Value

This feature helps students understand:

1. **What Q and K vectors are**: Raw numerical representations learned by the model
2. **How attention is computed**: Dot product measures similarity
3. **Why certain tokens attend to others**: High Q·K values lead to high attention
4. **Which dimensions matter**: Green bars show contributing dimensions
5. **The full pipeline**: From vectors → dot product → scaled score → attention weight

## 🚀 Testing Checklist

- [x] API interface includes q_vectors and k_vectors
- [x] VectorInspector component renders without errors
- [x] Click handler opens modal
- [x] Modal displays correct token names
- [x] Vectors are visualized as bar charts
- [x] Color coding works (green/red/gray)
- [x] Math calculations are correct
- [x] Hover tooltips show dimension values
- [x] Modal can be closed
- [x] No TypeScript errors
- [x] No linting warnings

## 🎓 Usage Example

```tsx
// In your training simulation:
const result = await simulateTraining("Hello world", 10, 0.01);

// After training completes, click any attention cell
// The modal automatically receives:
// - q_vectors[row]: Q vector for the token at row position
// - k_vectors[col]: K vector for the token at col position
// - attention_weights[row][col]: The final attention score
```

## 🐛 Troubleshooting

**Issue**: Modal doesn't open when clicking attention cell

- **Solution**: Check that `q_vectors` and `k_vectors` exist in snapshot
- **Debug**: Log `currentSnapshot?.q_vectors` to verify data

**Issue**: Vectors appear empty

- **Solution**: Verify backend is returning vector data
- **Check**: API response should include `q_vectors` and `k_vectors` arrays

**Issue**: Colors don't show alignment

- **Solution**: Check threshold value (default 0.1)
- **Adjust**: Modify `alignmentThreshold` in VectorInspector.tsx

## 🔗 Related Documentation

- **Backend**: `/backend/VECTOR_INSPECTOR.md`
- **Backend Guide**: `/backend/FRONTEND_VECTOR_INSPECTOR_GUIDE.md`
- **API**: `/frontend/src/services/api.ts`

## ✅ Status

**Frontend Implementation**: ✅ **COMPLETE**

- VectorInspector component created
- TrainingLab integration done
- API interfaces updated
- No errors or warnings
- Ready for user testing

---

**Next Steps**: Test with real training data and gather user feedback!
