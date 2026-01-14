# Training Lab - Frontend Implementation

## Overview

The Training Lab feature has been successfully implemented in the frontend. Users can now switch between two tabs:

1. **Generation** - The existing token generation feature
2. **Training Lab** - The new training visualization feature

## Files Added

### 1. `/src/pages/TrainingLab.tsx`

The main Training Lab component that provides:

- Text input for training corpus
- Hyperparameter controls (Epochs, Learning Rate)
- Training simulation trigger
- DVR-style playback controls
- Real-time visualization of:
  - Training loss
  - Model predictions vs targets
  - Attention weight heatmaps

### 2. `/src/pages/TrainingLab.css`

Styles for the attention heatmap visualization:

- Grid-based heatmap display
- Color-coded attention weights
- Hover effects for detailed inspection

## Files Modified

### 1. `/src/services/api.ts`

Added new interfaces and API function:

- `EpochSnapshot` interface
- `SimulateResponse` interface
- `simulateTraining()` function to call the `/api/simulate` endpoint

### 2. `/src/App.tsx`

Updated the main app to use Mantine Tabs:

- Added tab navigation between Generation and Training Lab
- Imported the TrainingLab component
- Added icons for each tab (Rocket for Generation, Brain for Training Lab)

## Features

### Training Lab Controls

- **Training Corpus**: Textarea for user input (default: "The quick brown fox jumps over the lazy dog")
- **Epochs Slider**: 1-50 range, default 10
- **Learning Rate Slider**: 0.001-0.1 range, default 0.01
- **Start Training Button**: Initiates training simulation

### DVR Playback

- **Epoch Timeline Slider**: Navigate through training epochs
- **Play/Pause Button**: Auto-advance through epochs
- **Playback Speed**: 0.5x, 1x, 2x options
- **Reset to Start**: Jump back to epoch 0

### Visualizations

#### 1. Loss Display

Large, prominent display of the current epoch's training loss

#### 2. Prediction Comparison

Three-panel view showing:

- Input sequence
- Target (correct) sequence
- Model prediction
  Color-coded for easy comparison

#### 3. Attention Heatmap

Visual representation of attention weights:

- Purple gradient intensity shows attention strength
- Hover for exact weight values
- Scrollable for large sequences

#### 4. Training Stats

Sidebar showing:

- Vocabulary size
- Total epochs
- Loss improvement percentage

## Usage

### Starting the Frontend

```bash
cd logit-app
pnpm install
pnpm dev
```

### Using Training Lab

1. Click the **"Training Lab"** tab
2. Enter or modify the training text
3. Adjust hyperparameters (optional)
4. Click **"Start Training"**
5. Wait for simulation to complete
6. Use playback controls to explore training progression

### Playback Controls

- **Drag the slider**: Jump to any epoch
- **Click Play**: Auto-advance through epochs
- **Adjust Speed**: Control playback speed (0.5x, 1x, 2x)
- **Reset**: Jump back to the beginning

## API Integration

The frontend communicates with the backend via:

```typescript
// Call the simulate endpoint
const data = await simulateTraining(text, epochs, learningRate);

// Returns:
{
  history: [
    {
      epoch: 0,
      loss: 2.5439,
      predicted_text: "...",
      attention_weights: [[...]],
      input_tokens: "...",
      target_tokens: "..."
    },
    // ... more epochs
  ],
  vocab: { "The": 0, "quick": 1, ... },
  idx_to_token: { "0": "The", "1": "quick", ... },
  vocab_size: 13
}
```

## Design Decisions

### Why Tabs?

- Clean separation between features
- Preserves existing Generation UI completely
- Easy navigation without complexity

### Why DVR-style Playback?

- Familiar metaphor (like video playback)
- Full control over training history
- Can pause, rewind, and replay at different speeds

### Why Purple/Grape Theme?

- Visually distinguishes Training Lab from Generation (blue/cyan)
- Purple gradient indicates "learning" and "experimentation"
- Consistent with Mantine's design system

## Color Scheme

- **Generation Tab**: Blue/Cyan gradient
- **Training Lab Tab**: Grape/Pink gradient
- **Attention Heatmap**: Purple intensity gradient
- **Success/Improvement**: Green badges
- **Errors**: Red alerts

## Responsive Design

The layout adapts to different screen sizes:

- **Desktop (md+)**: Side-by-side panels (4/8 grid split)
- **Mobile/Tablet**: Stacked panels (full width)

## Next Steps / Enhancements

Potential future improvements:

1. **Loss Chart**: Line graph showing loss over all epochs
2. **Token Highlighting**: Highlight differences between prediction and target
3. **Multiple Attention Heads**: Show all heads, not just the first
4. **Layer Selection**: Choose which layer's attention to visualize
5. **Export Results**: Download training history as JSON
6. **Presets**: Quick-load example texts
7. **Comparison Mode**: Compare two training runs side-by-side

## Troubleshooting

### Backend not connected

- Ensure the backend server is running: `python main.py`
- Check the health indicator in the top-right badge

### Training fails

- Text is too short (needs at least a few words)
- Backend error (check browser console and server logs)

### Attention heatmap not showing

- Some epochs may have empty attention weights
- Try different text or more epochs

## Testing

To test the Training Lab:

1. Start the backend: `cd backend && python main.py`
2. Start the frontend: `cd logit-app && pnpm dev`
3. Navigate to http://localhost:5173
4. Click **"Training Lab"** tab
5. Click **"Start Training"** with default settings
6. Verify the simulation completes and shows results
7. Test playback controls (Play, Pause, Speed, Slider)
8. Inspect attention heatmap (hover over cells)

## Architecture

```
App.tsx (Main Container)
├── Tabs Component
    ├── Generation Tab (Existing)
    │   └── [Existing Generation Components]
    └── Training Lab Tab (New)
        └── TrainingLab.tsx
            ├── Controls Panel (Left/Top)
            │   ├── Text Input
            │   ├── Epochs Slider
            │   ├── Learning Rate Slider
            │   └── Start/Reset Button
            └── DVR Player (Right/Bottom)
                ├── Playback Controls
                ├── Loss Display
                ├── Prediction Comparison
                └── Attention Heatmap
```

## Compatibility

- ✅ Does not modify existing Generation feature
- ✅ Fully independent state management
- ✅ Separate API calls
- ✅ Can use both features in same session
- ✅ No shared state between tabs
