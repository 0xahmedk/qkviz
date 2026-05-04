import { useState, useEffect } from "react";
import {
  Container,
  Text,
  Paper,
  Stack,
  Group,
  Button,
  Textarea,
  Slider,
  Badge,
  Alert,
  Loader,
  Grid,
  Code,
} from "@mantine/core";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconRefresh,
  IconAlertCircle,
} from "@tabler/icons-react"; // Removed IconBrain
import "./TrainingLab.css";
import { simulateTraining, type SimulateResponse } from "../services/api";
import { VectorInspector } from "../components/VectorInspector";

interface HoveredCell {
  row: number;
  col: number;
  value: number;
  sourceToken: string;
  targetToken: string;
}

interface InspectorState {
  opened: boolean;
  tokenI: string;
  tokenJ: string;
  row: number;
  col: number;
}

export function TrainingLab() {
  const MAX_TRAINING_WORDS = 10;

  // Input controls
  const [text, setText] = useState(
    "The quick brown fox jumps over the lazy dog",
  );
  const [epochs, setEpochs] = useState(10);
  const [learningRate, setLearningRate] = useState(0.01);

  // Training state
  const [isTraining, setIsTraining] = useState(false);
  const [trainingHistory, setTrainingHistory] =
    useState<SimulateResponse | null>(null);
  const [error, setError] = useState<string>("");

  // DVR playback state
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Attention matrix hover state
  const [hoveredCell, setHoveredCell] = useState<HoveredCell | null>(null);

  // Vector Inspector state
  const [inspectorState, setInspectorState] = useState<InspectorState>({
    opened: false,
    tokenI: "",
    tokenJ: "",
    row: -1,
    col: -1,
  });

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying || !trainingHistory) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        if (prev >= trainingHistory.history.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, trainingHistory, playbackSpeed]);

  const getWordCount = (value: string) =>
    value.trim().length === 0 ? 0 : value.trim().split(/\s+/).length;

  const handleStartTraining = async () => {
    const wordCount = getWordCount(text);

    if (!text.trim()) {
      setError("Please enter text for training."); // Changed informal language
      return;
    }

    if (wordCount > MAX_TRAINING_WORDS) {
      setError(
        `The training corpus is limited to ${MAX_TRAINING_WORDS} words to ensure optimal visualization performance.`, // Changed informal language
      );
      return;
    }

    setIsTraining(true);
    setError("");
    setTrainingHistory(null);

    try {
      const data = await simulateTraining(text, epochs, learningRate);

      if (data.error) {
        throw new Error(data.error);
      }

      setTrainingHistory(data);
      setCurrentFrame(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsTraining(false);
    }
  };

  const handleReset = () => {
    setTrainingHistory(null);
    setCurrentFrame(0);
    setIsPlaying(false);
    setError("");
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const currentSnapshot = trainingHistory?.history[currentFrame];
  const improvementPercent = trainingHistory
    ? (
        ((trainingHistory.history[0].loss -
          trainingHistory.history[trainingHistory.history.length - 1].loss) /
          trainingHistory.history[0].loss) *
        100
      ).toFixed(1)
    : "0";

  const buttonStyles = {
    root: {
      borderRadius: 0,
      border: "1px solid #333",
      backgroundColor: "transparent",
      color: "#F5F5F5",
      "&:hover": {
        backgroundColor: "#22C55E",
        color: "#0A0A0A",
      },
      "&[data-disabled]": {
        borderColor: "#555",
        color: "#888",
        backgroundColor: "transparent",
        "&:hover": {
          backgroundColor: "transparent",
          color: "#888",
        },
      },
    },
    inner: {
      color: "#F5F5F5",
      "&:hover": {
        color: "#0A0A0A",
      },
    },
    leftSection: {
      color: "#F5F5F5",
      "&:hover": {
        color: "#0A0A0A",
      },
    },
  };

  const playButtonStyles = {
    root: {
      ...buttonStyles.root,
      borderColor: "#22C55E",
      "&:hover": {
        backgroundColor: "#22C55E",
        color: "#0A0A0A",
      },
    },
    inner: {
      color: "#F5F5F5",
      "&:hover": {
        color: "#0A0A0A",
      },
    },
    leftSection: {
      color: "#F5F5F5",
      "&:hover": {
        color: "#0A0A0A",
      },
    },
  };

  const speedButtonStyles = (active: boolean) => ({
    root: {
      borderRadius: 0,
      border: `1px solid ${active ? "#22C55E" : "#333"}`,
      backgroundColor: active ? "#22C55E" : "transparent",
      color: active ? "#0A0A0A" : "#F5F5F5",
      "&:hover": {
        backgroundColor: active ? "#22C55E" : "#1A1A1A",
        color: active ? "#0A0A0A" : "#F5F5F5",
      },
    },
  });

  return (
    <Container size="xl" py="0">
      <Stack gap="32px">
        {/* Error Alert */}
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error"
            color="red"
            withCloseButton
            onClose={() => setError("")}
            style={{ borderRadius: 0 }}
          >
            {error}
          </Alert>
        )}

        <Grid gutter="32px">
          {/* Left Panel - Controls */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper
              p="24px"
              radius={0}
              withBorder
              style={{ borderColor: "#333", backgroundColor: "#1A1A1A" }}
            >
              <Stack gap="24px">
                <Text
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "#F5F5F5",
                    lineHeight: 1.6,
                  }}
                >
                  Training Controls
                </Text>

                {/* Text Input */}
                <div>
                  <Text
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      marginBottom: "8px",
                      color: "#F5F5F5",
                      lineHeight: 1.6,
                    }}
                  >
                    Training Corpus
                  </Text>
                  <Textarea
                    placeholder="Enter text to train on..."
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                    }}
                    minRows={4}
                    maxRows={8}
                    disabled={isTraining || !!trainingHistory}
                    styles={{
                      input: {
                        backgroundColor: "#0A0A0A",
                        color: "#F5F5F5",
                        borderColor: "#333",
                        borderRadius: 0,
                      },
                    }}
                  />
                  <Text
                    style={{
                      fontSize: "12px",
                      color: "#F5F5F5",
                      marginTop: "8px",
                      lineHeight: 1.6,
                    }}
                  >
                    The model will learn to predict this text. Maximum{" "}
                    {MAX_TRAINING_WORDS} words.
                  </Text>
                </div>

                {/* Epochs Slider */}
                <div>
                  <Group justify="space-between" mb="8px">
                    <Text
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#F5F5F5",
                        lineHeight: 1.6,
                      }}
                    >
                      Epochs
                    </Text>
                    <Text style={{ fontSize: "14px", color: "#F5F5F5" }}>
                      {epochs}
                    </Text>
                  </Group>
                  <Slider
                    value={epochs}
                    onChange={setEpochs}
                    min={1}
                    max={50}
                    step={1}
                    marks={[
                      { value: 1, label: "1" },
                      { value: 10, label: "10" },
                      { value: 25, label: "25" },
                      { value: 50, label: "50" },
                    ]}
                    color="green" // Using Green for accent
                    disabled={isTraining || !!trainingHistory}
                    styles={{
                      markLabel: { color: "#F5F5F5" },
                    }}
                  />
                  <Text
                    style={{
                      fontSize: "12px",
                      color: "#F5F5F5",
                      marginTop: "25px",
                      lineHeight: 1.6,
                    }}
                  >
                    Number of training iterations.
                  </Text>
                </div>

                {/* Learning Rate Slider */}
                <div>
                  <Group justify="space-between" mb="8px">
                    <Text
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#F5F5F5",
                        lineHeight: 1.6,
                      }}
                    >
                      Learning Rate
                    </Text>
                    <Text style={{ fontSize: "14px", color: "#F5F5F5" }}>
                      {learningRate.toFixed(3)}
                    </Text>
                  </Group>
                  <Slider
                    value={learningRate}
                    onChange={setLearningRate}
                    min={0.001}
                    max={0.1}
                    step={0.001}
                    marks={[
                      { value: 0.001, label: "0.001" },
                      { value: 0.01, label: "0.01" },
                      { value: 0.05, label: "0.05" },
                      { value: 0.1, label: "0.1" },
                    ]}
                    color="green" // Using Green for accent
                    disabled={isTraining || !!trainingHistory}
                    styles={{
                      markLabel: { color: "#F5F5F5" },
                    }}
                  />
                  <Text
                    style={{
                      fontSize: "12px",
                      color: "#F5F5F5",
                      marginTop: "25px",
                      lineHeight: 1.6,
                    }}
                  >
                    Rate at which the model adjusts its internal parameters.
                  </Text>
                </div>

                {/* Action Buttons */}
                <Group justify="center" mt="24px">
                  {!trainingHistory ? (
                    <Button
                      size="lg"
                      leftSection={
                        isTraining ? <Loader size="xs" color="#F5F5F5" /> : null
                      } // Removed IconBrain
                      onClick={handleStartTraining}
                      disabled={isTraining}
                      styles={playButtonStyles}
                      fullWidth
                    >
                      {isTraining
                        ? "Training in Progress..."
                        : "Start Training"}
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      leftSection={<IconRefresh size={20} />}
                      onClick={handleReset}
                      styles={buttonStyles}
                      fullWidth
                    >
                      Reset & New Training
                    </Button>
                  )}
                </Group>

                {/* Training Stats */}
                {trainingHistory && (
                  <Paper
                    p="16px"
                    withBorder
                    style={{
                      borderColor: "#333",
                      backgroundColor: "#0A0A0A",
                      borderRadius: 0,
                    }}
                  >
                    <Stack gap="8px">
                      <Group justify="space-between">
                        <Text style={{ fontSize: "14px", color: "#F5F5F5" }}>
                          Vocabulary Size:
                        </Text>
                        <Text
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#F5F5F5",
                          }}
                        >
                          {trainingHistory.vocab_size}
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text style={{ fontSize: "14px", color: "#F5F5F5" }}>
                          Total Epochs:
                        </Text>
                        <Text
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#F5F5F5",
                          }}
                        >
                          {trainingHistory.history.length}
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text style={{ fontSize: "14px", color: "#F5F5F5" }}>
                          Improvement:
                        </Text>
                        <Badge
                          style={{
                            borderRadius: 0,
                            backgroundColor: "#22C55E",
                            color: "#0A0A0A",
                            border: "1px solid #22C55E",
                          }}
                        >
                          {improvementPercent}%
                        </Badge>
                      </Group>
                    </Stack>
                  </Paper>
                )}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Right Panel - DVR Player */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            {trainingHistory ? (
              <Stack gap="32px">
                {/* Playback Controls */}
                <Paper
                  p="24px"
                  radius={0}
                  withBorder
                  style={{ borderColor: "#333", backgroundColor: "#1A1A1A" }}
                >
                  <Stack gap="24px">
                    <Group justify="space-between">
                      <Text
                        style={{
                          fontSize: "20px",
                          fontWeight: 800,
                          color: "#F5F5F5",
                          lineHeight: 1.6,
                        }}
                      >
                        Training Playback
                      </Text>
                      <Badge
                        style={{
                          borderRadius: 0,
                          backgroundColor: "#333",
                          color: "#F5F5F5",
                          border: "1px solid #555",
                        }}
                        size="lg"
                      >
                        Epoch {currentSnapshot?.epoch || 0}
                      </Badge>
                    </Group>

                    {/* Timeline Slider */}
                    <div>
                      <Slider
                        value={currentFrame}
                        onChange={(val) => {
                          setCurrentFrame(val);
                          setIsPlaying(false);
                        }}
                        min={0}
                        max={trainingHistory.history.length - 1}
                        step={1}
                        color="green" // Using Green for accent
                        label={(val) => `Epoch ${val}`}
                        styles={{
                          markLabel: { color: "#F5F5F5" },
                        }}
                      />
                    </div>

                    {/* Play Controls */}
                    <Group justify="center" gap="16px">
                      <Button
                        leftSection={
                          isPlaying ? (
                            <IconPlayerPause size={16} />
                          ) : (
                            <IconPlayerPlay size={16} />
                          )
                        }
                        onClick={handlePlayPause}
                        styles={playButtonStyles}
                      >
                        {isPlaying ? "Pause" : "Play"}
                      </Button>

                      <Button
                        onClick={() => setCurrentFrame(0)}
                        styles={buttonStyles}
                      >
                        Reset to Start
                      </Button>

                      {/* Playback Speed */}
                      <Group gap="8px">
                        <Text
                          style={{
                            fontSize: "14px",
                            color: "#F5F5F5",
                            lineHeight: 1.6,
                          }}
                        >
                          Speed:
                        </Text>
                        <Button
                          size="xs"
                          styles={speedButtonStyles(playbackSpeed === 0.5)}
                          onClick={() => setPlaybackSpeed(0.5)}
                        >
                          0.5x
                        </Button>
                        <Button
                          size="xs"
                          styles={speedButtonStyles(playbackSpeed === 1.0)}
                          onClick={() => setPlaybackSpeed(1.0)}
                        >
                          1x
                        </Button>
                        <Button
                          size="xs"
                          styles={speedButtonStyles(playbackSpeed === 2.0)}
                          onClick={() => setPlaybackSpeed(2.0)}
                        >
                          2x
                        </Button>
                      </Group>
                    </Group>
                  </Stack>
                </Paper>

                {/* Loss Display */}
                <Paper
                  p="24px"
                  radius={0}
                  withBorder
                  style={{ borderColor: "#333", backgroundColor: "#1A1A1A" }}
                >
                  <Group justify="space-between" align="center">
                    <div>
                      <Text
                        style={{
                          fontSize: "14px",
                          color: "#F5F5F5",
                          marginBottom: "8px",
                          lineHeight: 1.6,
                        }}
                      >
                        Training Loss
                      </Text>
                      <Text
                        style={{
                          fontSize: "32px",
                          fontWeight: 700,
                          color:
                            (currentSnapshot?.loss || 0) <
                            (trainingHistory?.history[0].loss || 0)
                              ? "#22C55E"
                              : "#EF4444", // Green for decreasing loss, Red for increasing
                        }}
                      >
                        {currentSnapshot?.loss.toFixed(4) || "N/A"}
                      </Text>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Text
                        style={{
                          fontSize: "14px",
                          color: "#F5F5F5",
                          marginBottom: "8px",
                          lineHeight: 1.6,
                        }}
                      >
                        Progress
                      </Text>
                      <Text
                        style={{
                          fontSize: "18px",
                          fontWeight: 600,
                          color: "#F5F5F5",
                          lineHeight: 1.6,
                        }}
                      >
                        {(
                          ((currentFrame + 1) /
                            trainingHistory.history.length) *
                          100
                        ).toFixed(0)}
                        %
                      </Text>
                    </div>
                  </Group>
                </Paper>

                {/* Prediction Comparison */}
                <Paper
                  p="24px"
                  radius={0}
                  withBorder
                  style={{ borderColor: "#333", backgroundColor: "#1A1A1A" }}
                >
                  <Stack gap="16px">
                    <Text
                      style={{
                        fontSize: "20px",
                        fontWeight: 800,
                        color: "#F5F5F5",
                        lineHeight: 1.6,
                      }}
                    >
                      Prediction Comparison
                    </Text>

                    <div>
                      <Text
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          marginBottom: "8px",
                          color: "#F5F5F5",
                          lineHeight: 1.6,
                        }}
                      >
                        Input Sequence:
                      </Text>
                      <Code
                        block
                        style={{
                          fontSize: "14px",
                          padding: "16px",
                          backgroundColor: "#0A0A0A",
                          color: "#F5F5F5",
                          borderColor: "#333",
                          borderRadius: 0,
                        }}
                      >
                        {currentSnapshot?.input_tokens?.join("") || ""}
                      </Code>
                    </div>

                    <div>
                      <Text
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          marginBottom: "8px",
                          color: "#F5F5F5",
                          lineHeight: 1.6,
                        }}
                      >
                        Target (Correct):
                      </Text>
                      <Code
                        block
                        style={{
                          fontSize: "14px",
                          padding: "16px",
                          backgroundColor: "#0A0A0A",
                          color: "#F5F5F5",
                          borderColor: "#333",
                          borderRadius: 0,
                        }}
                      >
                        {currentSnapshot?.target_tokens?.join("") || ""}
                      </Code>
                    </div>

                    <div>
                      <Text
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          marginBottom: "8px",
                          color: "#F5F5F5",
                          lineHeight: 1.6,
                        }}
                      >
                        Model Prediction:
                      </Text>
                      <Code
                        block
                        style={{
                          fontSize: "14px",
                          padding: "16px",
                          backgroundColor: "#0A0A0A",
                          color: "#F5F5F5",
                          borderColor: "#333",
                          borderRadius: 0,
                        }}
                      >
                        {currentSnapshot?.predicted_text || ""}
                      </Code>
                    </div>
                  </Stack>
                </Paper>

                {/* Attention Map */}
                <Paper
                  p="24px"
                  radius={0}
                  withBorder
                  style={{ borderColor: "#333", backgroundColor: "#1A1A1A" }}
                >
                  <Stack gap="16px">
                    <Text
                      style={{
                        fontSize: "20px",
                        fontWeight: 800,
                        color: "#F5F5F5",
                        lineHeight: 1.6,
                      }}
                    >
                      Attention Weights
                    </Text>

                    {/* Hover Info Box - Fixed height to prevent layout shift */}
                    <Paper
                      p="16px"
                      withBorder
                      style={{
                        minHeight: "100px",
                        transition: "background-color 0.2s ease",
                        borderColor: "#333",
                        backgroundColor: "#0A0A0A",
                        borderRadius: 0,
                      }}
                    >
                      {hoveredCell ? (
                        <Stack gap="8px">
                          <Text
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#F5F5F5",
                              lineHeight: 1.6,
                            }}
                          >
                            Attention Details:
                          </Text>
                          <Text
                            style={{
                              fontSize: "14px",
                              color: "#F5F5F5",
                              lineHeight: 1.6,
                            }}
                          >
                            When predicting{" "}
                            <Text
                              span
                              style={{ fontWeight: 700, color: "#22C55E" }}
                            >
                              '{hoveredCell.targetToken}'
                            </Text>
                            , the model pays{" "}
                            <Text
                              span
                              style={{ fontWeight: 700, color: "#22C55E" }}
                            >
                              {(hoveredCell.value * 100).toFixed(1)}%
                            </Text>{" "}
                            attention to{" "}
                            <Text
                              span
                              style={{ fontWeight: 700, color: "#22C55E" }}
                            >
                              '{hoveredCell.sourceToken}'
                            </Text>
                          </Text>
                          <Group gap="8px">
                            <Badge
                              size="xs"
                              style={{
                                borderRadius: 0,
                                backgroundColor: "#333",
                                color: "#F5F5F5",
                                border: "1px solid #555",
                              }}
                            >
                              Target: {hoveredCell.targetToken}
                            </Badge>
                            <Badge
                              size="xs"
                              style={{
                                borderRadius: 0,
                                backgroundColor: "#333",
                                color: "#F5F5F5",
                                border: "1px solid #555",
                              }}
                            >
                              Source: {hoveredCell.sourceToken}
                            </Badge>
                            <Badge
                              size="xs"
                              style={{
                                borderRadius: 0,
                                backgroundColor: "#333",
                                color: "#F5F5F5",
                                border: "1px solid #555",
                              }}
                            >
                              Weight: {(hoveredCell.value * 100).toFixed(1)}%
                            </Badge>
                          </Group>
                        </Stack>
                      ) : (
                        <Stack
                          gap="8px"
                          align="center"
                          justify="center"
                          style={{ height: "100%" }}
                        >
                          <Text
                            style={{
                              fontSize: "14px",
                              color: "#F5F5F5",
                              fontStyle: "italic",
                              lineHeight: 1.6,
                            }}
                          >
                            Hover over a cell to see attention details.
                          </Text>
                        </Stack>
                      )}
                    </Paper>

                    {currentSnapshot?.attention_weights &&
                    currentSnapshot.attention_weights.length > 0 ? (
                      <div className="attention-heatmap">
                        {currentSnapshot.attention_weights.map(
                          (row: number[], i: number) => {
                            const tokens = currentSnapshot.input_tokens;

                            return (
                              <div key={i} className="attention-row">
                                {row.map((weight: number, j: number) => {
                                  const targetToken = tokens[i] || `Token${i}`;
                                  const sourceToken = tokens[j] || `Token${j}`;
                                  const isZero = weight < 0.001;

                                  const cellColor = isZero
                                    ? "rgba(0, 0, 0, 0.3)"
                                    : `rgba(34, 197, 94, ${weight})`; // Green for attention

                                  return (
                                    <div
                                      key={j}
                                      className="attention-cell"
                                      style={{
                                        backgroundColor: cellColor,
                                        cursor: isZero
                                          ? "not-allowed"
                                          : "pointer",
                                        border: "1px solid #333",
                                      }}
                                      onMouseEnter={() => {
                                        if (!isZero) {
                                          setHoveredCell({
                                            row: i,
                                            col: j,
                                            value: weight,
                                            targetToken,
                                            sourceToken,
                                          });
                                        }
                                      }}
                                      onMouseLeave={() => setHoveredCell(null)}
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
                                    />
                                  );
                                })}
                              </div>
                            );
                          },
                        )}
                      </div>
                    ) : (
                      <Text
                        style={{
                          fontSize: "14px",
                          color: "#F5F5F5",
                          fontStyle: "italic",
                          lineHeight: 1.6,
                        }}
                      >
                        Attention weights will appear here during training.
                      </Text>
                    )}
                  </Stack>
                </Paper>
              </Stack>
            ) : (
              <Paper
                p="32px"
                radius={0}
                withBorder
                style={{
                  minHeight: "500px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderColor: "#333",
                  backgroundColor: "#1A1A1A",
                }}
              >
                <Stack align="center" gap="16px">
                  {/* <IconBrain size={64} color="gray" /> */}{" "}
                  {/* Removed IconBrain */}
                  <Text
                    style={{
                      fontSize: "18px",
                      color: "#F5F5F5",
                      textAlign: "center",
                      lineHeight: 1.6,
                    }}
                  >
                    Configure your training parameters and click "Start
                    Training" to begin.
                  </Text>
                </Stack>
              </Paper>
            )}
          </Grid.Col>
        </Grid>

        {/* Vector Inspector Modal */}
        {inspectorState.opened &&
          currentSnapshot?.q_vectors &&
          currentSnapshot?.k_vectors && (
            <VectorInspector
              opened={inspectorState.opened}
              onClose={() =>
                setInspectorState({
                  opened: false,
                  tokenI: "",
                  tokenJ: "",
                  row: -1,
                  col: -1,
                })
              }
              tokenI={inspectorState.tokenI}
              tokenJ={inspectorState.tokenJ}
              qVector={currentSnapshot.q_vectors[inspectorState.row] || []}
              kVector={currentSnapshot.k_vectors[inspectorState.col] || []}
              attentionScore={
                currentSnapshot.attention_weights[inspectorState.row]?.[
                  inspectorState.col
                ] || 0
              }
            />
          )}
      </Stack>
    </Container>
  );
}
