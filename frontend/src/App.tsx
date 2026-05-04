import { useState, useEffect, useCallback, useRef } from "react";
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Grid,
  Alert,
  Tabs,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import "./App.css";
import profile from "./assets/profile.png";
import stochastic_parrot from "./assets/stochastic_parrot.png";

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
  // 1. State declarations
  const [prompt, setPrompt] = useState("The sciences");
  const [maxTokens, setMaxTokens] = useState(50);
  const [temperature, setTemperature] = useState(0.8);
  const [mode, setMode] = useState<"auto" | "manual">("manual");
  const [predictions, setPredictions] = useState<TokenPrediction[]>([]);
  const [selectedPredictionIndex, setSelectedPredictionIndex] = useState<
    number | null
  >(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "connected" | "error"
  >("checking");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // 2. Ref declarations
  const isMounted = useRef(false);

  // 3. Memoized callback functions (order matters for dependencies)

  // Helper to tokenize text (no dependencies on other state/callbacks)
  const tokenizePrompt = useCallback((text: string): Token[] => {
    const tokenArray = text.match(/\w+|[^\w\s]|\s+/g) || [];
    return tokenArray.map((token, idx) => ({
      text: token,
      index: idx,
      isGenerated: false,
    }));
  }, []);

  // Initialize tokens state (depends on tokenizePrompt) - placed here to allow other callbacks to use `setTokens`
  const [tokens, setTokens] = useState<Token[]>(() => tokenizePrompt(prompt));

  // Stop auto-generation (depends on setIsGenerating)
  const stopAutoGeneration = useCallback(() => {
    setIsGenerating(false);
  }, []);

  // Reset generation state (depends on prompt, stopAutoGeneration, tokenizePrompt, and other setters)
  const resetGenerationState = useCallback(
    (newPrompt?: string) => {
      stopAutoGeneration();
      setPredictions([]);
      setSelectedPredictionIndex(null);
      setCurrentStep(-1);
      const targetPrompt = newPrompt !== undefined ? newPrompt : prompt;
      setTokens(tokenizePrompt(targetPrompt));
    },
    [
      prompt,
      stopAutoGeneration,
      tokenizePrompt,
      setPredictions,
      setSelectedPredictionIndex,
      setCurrentStep,
      setTokens,
    ], // Explicit dependencies
  );

  // Check backend health (depends on setters)
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
        "Cannot connect to backend. Make sure the API server is running",
      );
    }
  }, []);

  // Handle token generation (depends on state, setters, and stopAutoGeneration)
  const handleGenerateToken = useCallback(async () => {
    if (backendStatus !== "connected") {
      setErrorMessage("Backend not connected. Please check the server.");
      return;
    }

    try {
      const context = tokens.map((t) => t.text).join("");
      const response = await generateNextToken(context, temperature, 5);

      setPredictions(response.next_token_predictions);

      const selectedToken = response.generated_token;
      const selectedIdx = response.next_token_predictions.findIndex(
        (p) => p.token === selectedToken,
      );
      setSelectedPredictionIndex(selectedIdx >= 0 ? selectedIdx : 0);

      const newToken: Token = {
        text: selectedToken,
        index: tokens.length,
        isGenerated: true,
      };
      setTokens((prevTokens) => [...prevTokens, newToken]);
      setCurrentStep(tokens.length);
    } catch (error) {
      console.error("Generation error:", error);
      setErrorMessage("Failed to generate token. Check console for details.");
      stopAutoGeneration();
    }
  }, [
    backendStatus,
    tokens,
    temperature,
    stopAutoGeneration,
    setPredictions,
    setSelectedPredictionIndex,
    setTokens,
    setCurrentStep,
  ]); // Explicit dependencies

  // 4. Effect hooks

  // Effect for checking backend health on mount
  useEffect(() => {
    (async () => {
      await checkBackendHealth();
    })();
  }, [checkBackendHealth]);

  // Effect for resetting generation state when prompt changes
  useEffect(() => {
    if (isMounted.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      resetGenerationState(prompt);
    } else {
      isMounted.current = true;
    }
  }, [prompt, resetGenerationState]);

  // Effect for auto-generation logic
  useEffect(() => {
    if (mode === "auto" && isGenerating && tokens.length < maxTokens) {
      const timer = setTimeout(() => {
        handleGenerateToken();
      }, 500);
      return () => clearTimeout(timer);
    } else if (tokens.length >= maxTokens && isGenerating) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      stopAutoGeneration();
    }
  }, [
    isGenerating,
    tokens.length,
    mode,
    maxTokens,
    handleGenerateToken,
    stopAutoGeneration,
  ]);

  // 5. Event handlers
  const handleGenerate = () => {
    if (mode === "auto") {
      setIsGenerating(true);
    } else {
      if (tokens.length < maxTokens) {
        handleGenerateToken();
      }
    }
  };

  const handleStop = () => {
    stopAutoGeneration();
  };

  const handleReset = () => {
    resetGenerationState();
  };

  return (
    <Container size="xl" py="64px">
      <Stack gap="32px">
        {/* Header */}
        <Paper
          p="24px"
          radius={15}
          style={{
            borderColor: "#333",
            backgroundColor: "#000000",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <img
              src={stochastic_parrot}
              alt="Stochastic Parrot Icon"
              style={{ width: "80px", height: "80px", marginBottom: "10px" }}
            />
            <Title
              order={1}
              style={{
                fontFamily:
                  "'Inter', sans-serif" /* Changed font family to match other text */,
                fontWeight: 800,
                fontSize: "48px" /* Prominent header size */,
                color: "#F5F5F5",
                lineHeight: 1.2 /* Adjusted for prominence */,
                textAlign: "center",
              }}
            >
              Inside the thinking of Stochastic Parrots
            </Title>
            <div style={{ marginTop: "25px" }}>
              <a
                href="https://0xahmedk.me"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "none",
                  color: "#A0A0A0",
                  fontSize: "14px",
                  display: "flex" /* Changed to flex */,
                  flexDirection: "column" /* Stack items vertically */,
                  alignItems: "center" /* Center items horizontally */,
                  gap: "4px" /* Reduced gap for closer placement */,
                  width: "fit-content" /* Fit content to center the block */,
                  margin: "0 auto" /* Center the block itself */,
                }}
                className="author-link"
              >
                <img
                  src={profile}
                  alt="Ahmed Khan Profile"
                  className="profile-pic"
                />
                <span className="author-name">Ahmed Khan</span>
              </a>
            </div>
          </div>
        </Paper>

        {/* Error Alert */}
        {errorMessage && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error"
            color="red"
            withCloseButton
            onClose={() => setErrorMessage("")}
            style={{ borderRadius: 0, border: "1px solid #EF4444" }}
          >
            {errorMessage}
          </Alert>
        )}

        {/* Tabs for Navigation */}
        <Tabs
          defaultValue="generation"
          // variant="unstyled"
          styles={(theme) => ({
            root: {
              border: `1px solid ${theme.colors.gray[8]}`,
              borderRadius: 0,
              backgroundColor:
                "#1A1A1A" /* Darker background for tabs content */,
            },
            list: {
              backgroundColor: "#0A0A0A" /* Deep Black for tab headers */,
              borderBottom: `1px solid ${theme.colors.gray[8]}`,
              padding: "8px 16px",
              marginBottom: 0,
              // center
              display: "flex",
              justifyContent: "center",
            },
            tab: {
              fontSize: "16px" /* Explicit font size */,
              fontWeight: 600,
              color: theme.colors.gray[3],
              borderRadius: 0,
              "&[data-active]": {
                color: theme.colors.green[5],
                borderBottom: `2px solid ${theme.colors.green[5]}`,
                backgroundColor: "#2e2e2e" /* Darker grey for active tab */,
              },
              "&:hover": {
                backgroundColor: "#444" /* Even darker grey for hover */,
                color: theme.colors.gray[0],
              },
            },
            panel: {
              padding: "24px" /* Standardized padding */,
            },
          })}
        >
          <Tabs.List>
            <Tabs.Tab value="generation">Generation</Tabs.Tab>
            <Tabs.Tab value="training-lab">Training Lab</Tabs.Tab>
          </Tabs.List>

          {/* Concept Brief Section */}
          <Tabs.Panel value="generation">
            <Paper
              p="24px" /* Standardized padding */
              radius={0}
              withBorder
              style={{
                borderColor: "#333",
                marginBottom: "24px",
                backgroundColor: "#0A0A0A" /* Deep Black */,
              }}
            >
              <Stack gap="16px">
                <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                  {" "}
                  {/* Added margin: 0 auto for centering */}
                  <Text
                    style={{
                      fontSize: "18px", // Slightly bigger for that blog feel
                      color: "#F5F5F5",
                      lineHeight: 1.7,
                      marginBottom: "20px",
                    }}
                  >
                    This is an exploration of{" "}
                    <strong>Autoregressive Prediction</strong> the process of
                    predicting the future by looking at the past. Imagine a
                    model that doesn't "know" what it wants to say; instead, it
                    looks at the words you just typed and calculates a giant
                    list of probabilities for what the very next piece of text
                    should be.
                  </Text>
                  <Text
                    style={{
                      fontSize: "18px",
                      color: "#F5F5F5",
                      lineHeight: 1.7,
                      marginBottom: "20px",
                    }}
                  >
                    By visualizing the <strong>Logits</strong> (the raw scores)
                    and percentages, you can see the internal struggle of the
                    transformer as it navigates the 14th-century philosophy of{" "}
                    <em>Al-Muqaddimah</em>. It constructs meaning one tiny token
                    at a time, always chasing the most likely path found in the
                    original text.
                  </Text>
                  <a
                    href="https://ia903106.us.archive.org/22/items/etaoin/The%20Muqaddimah%20–%20An%20Introduction%20to%20History%20by%20Ibn%20Khaldun.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#22C55E", // Using your theme's Green
                      textDecoration: "underline",
                      fontSize: "16px",
                      fontWeight: "600",
                      display: "inline-block",
                      marginTop: "10px",
                    }}
                  >
                    Read the original: Al-Muqaddimah (PDF)
                  </a>
                </div>
              </Stack>
            </Paper>
            <Grid gutter="32px">
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
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Stack gap="24px">
                  <TokenDisplay tokens={tokens} currentStep={currentStep} />
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
                  <ProbabilityChart
                    predictions={predictions}
                    selectedIndex={selectedPredictionIndex}
                  />
                </Stack>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="training-lab">
            <Paper
              p="24px" /* Standardized padding */
              radius={0}
              withBorder
              style={{
                borderColor: "#333",
                marginBottom: "24px",
                backgroundColor: "#0A0A0A" /* Deep Black */,
              }}
            >
              <Stack gap="16px">
                <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                  {" "}
                  {/* Added margin: 0 auto for centering */}
                  <Text
                    style={{
                      fontSize: "18px",
                      color: "#F5F5F5",
                      lineHeight: 1.7,
                      marginBottom: "20px",
                    }}
                  >
                    Training is the art of <strong>minimizing regret</strong>.
                    When the model guesses the wrong next word, it calculates
                    how far off it was. <strong>Backpropagation </strong>
                    then sends a signal backward through the layers, adjusting
                    the numerical connections or weights, to ensure it doesn't
                    make the same mistake twice.
                  </Text>
                  <Text
                    style={{
                      fontSize: "18px",
                      color: "#F5F5F5",
                      lineHeight: 1.7,
                      marginBottom: "20px",
                    }}
                  >
                    Think of it as <strong>carving linguistic patterns</strong>{" "}
                    into a block of raw digital stone. Over thousands of
                    iterations, the weights stop being random and begin to
                    reflect the specific statistical structure and vocabulary of
                    the
                    <strong> corpus you provide</strong>. You are essentially
                    watching the machine memorize the "DNA" of your text.
                  </Text>
                </div>
              </Stack>
            </Paper>
            <TrainingLab />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}

export default App;
