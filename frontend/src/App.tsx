import { useState, useEffect, useCallback } from "react";
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Badge,
  Grid,
  Alert,
  Loader,
  Tabs,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCircleCheck,
  IconBrain,
  IconRocket,
} from "@tabler/icons-react";
import "./App.css";

// Components
import { GenerationControls } from "./components/GenerationControls";
import { TokenDisplay } from "./components/TokenDisplay";
import { ProbabilityChart } from "./components/ProbabilityChart";
import type { TokenPrediction } from "./components/ProbabilityChart";
import { ActionButtons } from "./components/ActionButtons";

// Pages
import { TrainingLab } from "./pages/TrainingLab";

// API Service
import { checkHealth, generateNextToken } from "./services/api";

interface Token {
  text: string;
  index: number;
  isGenerated: boolean;
}

function App() {
  // Controls state
  const [prompt, setPrompt] = useState("The sciences");
  const [maxTokens, setMaxTokens] = useState(50);
  const [temperature, setTemperature] = useState(0.8);
  const [mode, setMode] = useState<"auto" | "manual">("manual");

  // Generation state
  const [tokens, setTokens] = useState<Token[]>([]);
  const [predictions, setPredictions] = useState<TokenPrediction[]>([]);
  const [selectedPredictionIndex, setSelectedPredictionIndex] = useState<
    number | null
  >(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  // Backend health state
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "connected" | "error"
  >("checking");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Check backend health
  const checkBackendHealth = useCallback(async () => {
    try {
      const health = await checkHealth();
      if (health.model_loaded) {
        setBackendStatus("connected");
      } else {
        setBackendStatus("error");
        setErrorMessage(
          "Backend is running but model is not loaded. Please train the model first.",
        );
      }
    } catch {
      setBackendStatus("error");
      setErrorMessage(
        "Cannot connect to backend. Make sure the API server is running on http://localhost:8000",
      );
    }
  }, []);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
  }, [checkBackendHealth]);

  // Initialize tokens from prompt
  useEffect(() => {
    if (prompt && tokens.length === 0) {
      // Split by words and special characters (similar to backend tokenizer)
      const tokenArray = prompt.match(/\w+|[^\w\s]|\s+/g) || [];
      const promptTokens = tokenArray.map((token, idx) => ({
        text: token,
        index: idx,
        isGenerated: false,
      }));
      setTokens(promptTokens);
    }
  }, [prompt, tokens.length]);

  // Generate token handler
  const handleGenerateToken = useCallback(async () => {
    if (backendStatus !== "connected") {
      setErrorMessage("Backend not connected. Please check the server.");
      return;
    }

    try {
      const context = tokens.map((t) => t.text).join("");
      const response = await generateNextToken(context, temperature, 5);

      // Update predictions
      setPredictions(response.next_token_predictions);

      // The model selected the first prediction (or we sample from them)
      const selectedToken = response.generated_token;
      const selectedIdx = response.next_token_predictions.findIndex(
        (p) => p.token === selectedToken,
      );
      setSelectedPredictionIndex(selectedIdx >= 0 ? selectedIdx : 0);

      // Add the new token
      const newToken: Token = {
        text: selectedToken,
        index: tokens.length,
        isGenerated: true,
      };
      setTokens([...tokens, newToken]);
      setCurrentStep(tokens.length);
    } catch (error) {
      console.error("Generation error:", error);
      setErrorMessage("Failed to generate token. Check console for details.");
      setIsGenerating(false);
    }
  }, [backendStatus, tokens, temperature]);

  // Auto generation logic
  useEffect(() => {
    if (mode === "auto" && isGenerating && tokens.length < maxTokens) {
      const timer = setTimeout(() => {
        handleGenerateToken();
      }, 500); // 500ms delay between tokens for visualization
      return () => clearTimeout(timer);
    } else if (tokens.length >= maxTokens && isGenerating) {
      setIsGenerating(false);
    }
  }, [isGenerating, tokens.length, mode, maxTokens, handleGenerateToken]);

  const handleGenerate = () => {
    if (mode === "auto") {
      setIsGenerating(true);
    } else {
      // Manual mode - generate one token
      if (tokens.length < maxTokens) {
        handleGenerateToken();
      }
    }
  };

  const handleStop = () => {
    setIsGenerating(false);
  };

  const handleReset = () => {
    setIsGenerating(false);
    setPredictions([]);
    setSelectedPredictionIndex(null);
    setCurrentStep(-1);

    // Reset to prompt tokens (word-level)
    const tokenArray = prompt.match(/\w+|[^\w\s]|\s+/g) || [];
    const promptTokens = tokenArray.map((token, idx) => ({
      text: token,
      index: idx,
      isGenerated: false,
    }));
    setTokens(promptTokens);
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={1} size="h2">
                QKViz - Interactive LLM Visualization
              </Title>
              <Text size="sm" c="dimmed" mt={4}>
                Explore how QKViz visualizes the workings of language models,
                one token at a time
              </Text>
            </div>
            <Badge
              size="lg"
              variant="gradient"
              gradient={{ from: "blue", to: "cyan" }}
              leftSection={
                backendStatus === "checking" ? (
                  <Loader size="xs" color="white" />
                ) : backendStatus === "connected" ? (
                  <IconCircleCheck size={16} />
                ) : (
                  <IconAlertCircle size={16} />
                )
              }
            >
              {backendStatus === "checking"
                ? "Connecting..."
                : backendStatus === "connected"
                  ? "Connected"
                  : "Offline"}
            </Badge>
          </Group>
        </Paper>

        {/* Error Alert */}
        {errorMessage && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error"
            color="red"
            withCloseButton
            onClose={() => setErrorMessage("")}
          >
            {errorMessage}
          </Alert>
        )}

        {/* Tabs for Navigation */}
        <Tabs defaultValue="generation" variant="pills">
          <Tabs.List mb="md">
            <Tabs.Tab value="generation" leftSection={<IconRocket size={16} />}>
              Generation
            </Tabs.Tab>
            <Tabs.Tab
              value="training-lab"
              leftSection={<IconBrain size={16} />}
            >
              Training Lab
            </Tabs.Tab>
          </Tabs.List>

          {/* Generation Tab */}
          <Tabs.Panel value="generation">
            <Grid gutter="lg">
              {/* Left Column - Controls */}
              <Grid.Col span={{ base: 12, md: 4 }}>
                <GenerationControls
                  prompt={prompt}
                  setPrompt={setPrompt}
                  maxTokens={maxTokens}
                  setMaxTokens={setMaxTokens}
                  temperature={temperature}
                  setTemperature={setTemperature}
                  mode={mode}
                  setMode={setMode}
                />
              </Grid.Col>

              {/* Right Column - Visualization */}
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Stack gap="md">
                  {/* Generated Text Display */}
                  <TokenDisplay tokens={tokens} currentStep={currentStep} />

                  {/* Action Buttons */}
                  <ActionButtons
                    mode={mode}
                    isGenerating={isGenerating}
                    onGenerate={handleGenerate}
                    onStop={handleStop}
                    onReset={handleReset}
                    disabled={
                      backendStatus !== "connected" ||
                      tokens.length >= maxTokens
                    }
                  />

                  {/* Probability Chart */}
                  <ProbabilityChart
                    predictions={predictions}
                    selectedIndex={selectedPredictionIndex}
                  />
                </Stack>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          {/* Training Lab Tab */}
          <Tabs.Panel value="training-lab">
            <TrainingLab />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}

export default App;
