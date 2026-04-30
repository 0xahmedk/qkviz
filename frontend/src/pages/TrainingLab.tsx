import { useState, useEffect } from "react";
import {
  Container,
  Title,
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
  IconBrain,
} from "@tabler/icons-react";
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

  const handleStartTraining = async () => {
    if (!text.trim()) {
      setError("Please enter some text to train on");
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

  // Helper function to tokenize text (matches backend word tokenizer)
  const currentSnapshot = trainingHistory?.history[currentFrame];
  const improvementPercent = trainingHistory
    ? (
        ((trainingHistory.history[0].loss -
          trainingHistory.history[trainingHistory.history.length - 1].loss) /
          trainingHistory.history[0].loss) *
        100
      ).toFixed(1)
    : "0";

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={1} size="h2">
                Training Lab
              </Title>
              <Text size="sm" c="dimmed" mt={4}>
                Watch a model learn on your text in real-time
              </Text>
            </div>
            <Badge
              size="lg"
              variant="gradient"
              gradient={{ from: "grape", to: "pink" }}
              leftSection={<IconBrain size={16} />}
            >
              Interactive Training
            </Badge>
          </Group>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error"
            color="red"
            withCloseButton
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        <Grid gutter="lg">
          {/* Left Panel - Controls */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper p="md" radius="md" withBorder>
              <Stack gap="md">
                <Text size="lg" fw={600}>
                  Training Controls
                </Text>

                {/* Text Input */}
                <div>
                  <Text size="sm" fw={500} mb={8}>
                    Training Corpus
                  </Text>
                  <Textarea
                    placeholder="Enter text to train on..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    minRows={4}
                    maxRows={8}
                    disabled={isTraining || !!trainingHistory}
                  />
                  <Text size="xs" c="dimmed" mt={4}>
                    The model will learn to predict this text
                  </Text>
                </div>

                {/* Epochs Slider */}
                <div>
                  <Group justify="space-between" mb={8}>
                    <Text size="sm" fw={500}>
                      Epochs
                    </Text>
                    <Text size="sm" c="dimmed">
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
                    color="grape"
                    disabled={isTraining || !!trainingHistory}
                  />
                  <Text size="xs" c="dimmed" mt={4}>
                    Number of training iterations
                  </Text>
                </div>

                {/* Learning Rate Slider */}
                <div>
                  <Group justify="space-between" mb={8}>
                    <Text size="sm" fw={500}>
                      Learning Rate
                    </Text>
                    <Text size="sm" c="dimmed">
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
                    color="grape"
                    disabled={isTraining || !!trainingHistory}
                  />
                  <Text size="xs" c="dimmed" mt={4}>
                    How fast the model learns
                  </Text>
                </div>

                {/* Action Buttons */}
                <Group justify="center" mt="md">
                  {!trainingHistory ? (
                    <Button
                      size="lg"
                      leftSection={
                        isTraining ? (
                          <Loader size="xs" color="white" />
                        ) : (
                          <IconBrain size={20} />
                        )
                      }
                      onClick={handleStartTraining}
                      disabled={isTraining}
                      variant="gradient"
                      gradient={{ from: "grape", to: "pink" }}
                      fullWidth
                    >
                      {isTraining ? "Training..." : "Start Training"}
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      leftSection={<IconRefresh size={20} />}
                      onClick={handleReset}
                      variant="light"
                      color="gray"
                      fullWidth
                    >
                      Reset & Train New
                    </Button>
                  )}
                </Group>

                {/* Training Stats */}
                {trainingHistory && (
                  <Paper p="sm" withBorder bg="dark.6">
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          Vocabulary Size:
                        </Text>
                        <Text size="sm" fw={500}>
                          {trainingHistory.vocab_size}
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          Total Epochs:
                        </Text>
                        <Text size="sm" fw={500}>
                          {trainingHistory.history.length}
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          Improvement:
                        </Text>
                        <Badge color="green" variant="light">
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
              <Stack gap="md">
                {/* Playback Controls */}
                <Paper p="md" radius="md" withBorder>
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Text size="lg" fw={600}>
                        Training Playback
                      </Text>
                      <Badge variant="light" size="lg">
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
                        color="grape"
                        label={(val) => `Epoch ${val}`}
                      />
                    </div>

                    {/* Play Controls */}
                    <Group justify="center" gap="md">
                      <Button
                        leftSection={
                          isPlaying ? (
                            <IconPlayerPause size={16} />
                          ) : (
                            <IconPlayerPlay size={16} />
                          )
                        }
                        onClick={handlePlayPause}
                        variant="filled"
                        color="grape"
                      >
                        {isPlaying ? "Pause" : "Play"}
                      </Button>

                      <Button
                        onClick={() => setCurrentFrame(0)}
                        variant="light"
                        color="gray"
                      >
                        Reset to Start
                      </Button>

                      {/* Playback Speed */}
                      <Group gap="xs">
                        <Text size="sm" c="dimmed">
                          Speed:
                        </Text>
                        <Button
                          size="xs"
                          variant={playbackSpeed === 0.5 ? "filled" : "light"}
                          color="gray"
                          onClick={() => setPlaybackSpeed(0.5)}
                        >
                          0.5x
                        </Button>
                        <Button
                          size="xs"
                          variant={playbackSpeed === 1.0 ? "filled" : "light"}
                          color="gray"
                          onClick={() => setPlaybackSpeed(1.0)}
                        >
                          1x
                        </Button>
                        <Button
                          size="xs"
                          variant={playbackSpeed === 2.0 ? "filled" : "light"}
                          color="gray"
                          onClick={() => setPlaybackSpeed(2.0)}
                        >
                          2x
                        </Button>
                      </Group>
                    </Group>
                  </Stack>
                </Paper>

                {/* Loss Display */}
                <Paper p="md" radius="md" withBorder>
                  <Group justify="space-between" align="center">
                    <div>
                      <Text size="sm" c="dimmed" mb={4}>
                        Training Loss
                      </Text>
                      <Text size="32px" fw={700} c="grape">
                        {currentSnapshot?.loss.toFixed(4) || "N/A"}
                      </Text>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Text size="sm" c="dimmed" mb={4}>
                        Progress
                      </Text>
                      <Text size="lg" fw={600}>
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
                <Paper p="md" radius="md" withBorder>
                  <Stack gap="md">
                    <Text size="lg" fw={600}>
                      Prediction Comparison
                    </Text>

                    <div>
                      <Text size="sm" fw={500} mb={8}>
                        Input Sequence:
                      </Text>
                      <Code block style={{ fontSize: "14px", padding: "12px" }}>
                        {currentSnapshot?.input_tokens?.join("") || ""}
                      </Code>
                    </div>

                    <div>
                      <Text size="sm" fw={500} mb={8}>
                        Target (Correct):
                      </Text>
                      <Code block style={{ fontSize: "14px", padding: "12px" }}>
                        {currentSnapshot?.target_tokens?.join("") || ""}
                      </Code>
                    </div>

                    <div>
                      <Text size="sm" fw={500} mb={8}>
                        Model Prediction:
                      </Text>
                      <Code
                        block
                        style={{
                          fontSize: "14px",
                          padding: "12px",
                          backgroundColor: "rgba(134, 46, 156, 0.1)",
                        }}
                      >
                        {currentSnapshot?.predicted_text || ""}
                      </Code>
                    </div>
                  </Stack>
                </Paper>

                {/* Attention Map */}
                <Paper p="md" radius="md" withBorder>
                  <Stack gap="md">
                    <Text size="lg" fw={600}>
                      Attention Weights
                    </Text>

                    {/* Hover Info Box - Fixed height to prevent layout shift */}
                    <Paper
                      p="sm"
                      withBorder
                      bg={hoveredCell ? "grape.9" : "dark.6"}
                      style={{
                        minHeight: "100px",
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      {hoveredCell ? (
                        <Stack gap="xs">
                          <Text size="sm" fw={600} c="grape.1">
                            📍 Attention Details
                          </Text>
                          <Text size="sm" c="gray.3">
                            When predicting{" "}
                            <Text span fw={700} c="pink.3">
                              '{hoveredCell.targetToken}'
                            </Text>
                            , the model pays{" "}
                            <Text span fw={700} c="grape.3">
                              {(hoveredCell.value * 100).toFixed(1)}%
                            </Text>{" "}
                            attention to{" "}
                            <Text span fw={700} c="cyan.3">
                              '{hoveredCell.sourceToken}'
                            </Text>
                          </Text>
                          <Group gap="xs">
                            <Badge size="xs" variant="light" color="pink">
                              Target: {hoveredCell.targetToken}
                            </Badge>
                            <Badge size="xs" variant="light" color="cyan">
                              Source: {hoveredCell.sourceToken}
                            </Badge>
                            <Badge size="xs" variant="light" color="grape">
                              Weight: {(hoveredCell.value * 100).toFixed(1)}%
                            </Badge>
                          </Group>
                        </Stack>
                      ) : (
                        <Stack
                          gap="xs"
                          align="center"
                          justify="center"
                          style={{ height: "100%" }}
                        >
                          <Text size="sm" c="dimmed" fs="italic">
                            Hover over a cell to see attention details
                          </Text>
                        </Stack>
                      )}
                    </Paper>

                    {currentSnapshot?.attention_weights &&
                    currentSnapshot.attention_weights.length > 0 ? (
                      <div className="attention-heatmap">
                        {currentSnapshot.attention_weights.map(
                          (row: number[], i: number) => {
                            // Use tokens directly from backend (already tokenized correctly)
                            const tokens = currentSnapshot.input_tokens;

                            return (
                              <div key={i} className="attention-row">
                                {row.map((weight: number, j: number) => {
                                  const targetToken = tokens[i] || `Token${i}`;
                                  const sourceToken = tokens[j] || `Token${j}`;
                                  const isZero = weight < 0.001; // Masked/future tokens

                                  return (
                                    <div
                                      key={j}
                                      className="attention-cell"
                                      style={{
                                        backgroundColor: isZero
                                          ? "rgba(0, 0, 0, 0.3)"
                                          : `rgba(134, 46, 156, ${weight})`,
                                        cursor: isZero
                                          ? "not-allowed"
                                          : "pointer",
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
                      <Text size="sm" c="dimmed" fs="italic">
                        Attention weights will appear here during training
                      </Text>
                    )}
                  </Stack>
                </Paper>
              </Stack>
            ) : (
              <Paper
                p="xl"
                radius="md"
                withBorder
                style={{
                  minHeight: "500px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Stack align="center" gap="md">
                  <IconBrain size={64} color="gray" />
                  <Text size="lg" c="dimmed" ta="center">
                    Configure your training parameters and click "Start
                    Training" to begin
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
