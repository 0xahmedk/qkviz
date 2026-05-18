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
  Box,
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
import { ViewCounter } from "./components/ViewCounter";
import ViewAnalytics from "./components/ViewAnalytics";
import { TermTooltip } from "./components/TermTooltip";

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

  // Inject MapMyVisitors tracking script on mount so all visitors are tracked,
  // not just those who open the analytics modal.
  useEffect(() => {
    if (document.getElementById("mapmyvisitors")) return;
    const container = document.createElement("div");
    container.style.cssText =
      "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden";
    document.body.appendChild(container);
    const script = document.createElement("script");
    script.id = "mapmyvisitors";
    script.type = "text/javascript";
    script.src =
      "https://mapmyvisitors.com/map.js?cl=ffffff&w=a&t=n&d=asWChGCPZ9mTGNvJn10ctJ665yYB0i3hc-Vf_-TwD0E";
    container.appendChild(script);
    return () => {
      document.body.removeChild(container);
    };
  }, []);

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
              Inside the "thinking" of "Stochastic Parrots"
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

        {/* Intro paragraph */}
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            textAlign: "center",
            padding: "8px 0 4px",
          }}
        >
          <Text
            style={{
              fontSize: "18px",
              color: "#C0C0C0",
              lineHeight: 1.8,
              marginBottom: "28px",
            }}
          >
            The word{" "}
            <TermTooltip
              definition="Mahowald et al (2024) separates what LLMs are genuinely good at from what they are not, without overclaiming either way."
              href="https://arxiv.org/abs/2404.03502"
            >
              thinking
            </TermTooltip>{" "}
            in the title is deliberate and uncomfortable.{" "}
            <TermTooltip
              definition="Bender et al (2021) argues that large language models are statistical pattern matchers, not thinkers."
              href="https://dl.acm.org/doi/10.1145/3442188.3445922"
            >
              Stochastic parrots
            </TermTooltip>{" "}
            is a term coined to argue that language models do not think at all,
            that they are sophisticated next-token predictors and nothing more.
            Whether that is a category error or an open question depends on who
            you ask, and this simulation does not take a side. It shows you the
            mechanism directly: train a small model on a short text, watch it
            predict one token at a time, and read every probability score behind
            each decision.
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: "#555",
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            scroll down to begin
          </Text>
        </div>

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
                <div
                  style={{
                    maxWidth: "800px",
                    margin: "0 auto",
                    textAlign: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "18px",
                      color: "#F5F5F5",
                      lineHeight: 1.7,
                      marginBottom: "20px",
                    }}
                  >
                    <TermTooltip definition="Predicting one token at a time using only the tokens that came before it. No lookahead, no plan">
                      Autoregressive prediction
                    </TermTooltip>{" "}
                    is a simple idea with a strange outcome. The model has no
                    plan, no intention, no target sentence it is working toward.
                    It looks at the tokens before it and produces a probability
                    score for every possible next token. Then it picks one and
                    does it again.
                  </Text>
                  <Text
                    style={{
                      fontSize: "18px",
                      color: "#F5F5F5",
                      lineHeight: 1.7,
                      marginBottom: "20px",
                    }}
                  >
                    The{" "}
                    <TermTooltip definition="Raw unnormalized scores the model assigns to every token in its vocabulary before they get converted to probabilities">
                      logits
                    </TermTooltip>{" "}
                    you see here are those raw scores before they get converted
                    to percentages. They reveal what the model considered and
                    what it almost said. The model behind this is a small
                    GPT-styled transformer, minimal layers, minimal parameters,
                    trained specifically on <em>Al-Muqaddimah</em>, Ibn
                    Khaldun's 14th-century treatise on history and civilization.
                    We captured its weights and logits after training so you can
                    watch exactly how it distributes probability across its
                    vocabulary. The output it produces will often be incoherent.
                    That is not a bug to work around. A model this small,
                    trained on a corpus this narrow, was never going to write
                    sense. But that is beside the point. What you are looking at
                    is the mechanism, not the result.
                  </Text>
                  <Text
                    style={{
                      fontSize: "18px",
                      color: "#F5F5F5",
                      lineHeight: 1.7,
                      marginBottom: "20px",
                    }}
                  >
                    Two controls shape what you see.{" "}
                    <TermTooltip definition="A hard cap on how many tokens the model generates before it stops, regardless of whether the output feels complete">
                      Max tokens
                    </TermTooltip>{" "}
                    sets a hard limit on how many predictions the model makes
                    before it stops.{" "}
                    <TermTooltip definition="A value that controls how peaked or flat the probability distribution is. Low means predictable, high means varied">
                      Temperature
                    </TermTooltip>{" "}
                    controls how the model chooses between its options. At low
                    temperature, it almost always picks the highest scoring
                    token, staying close to what the training text would
                    predict. Turn it up and the lower ranked options get a real
                    chance, which produces more varied and sometimes surprising
                    output. High temperature is not the model being creative. It
                    is the model being less certain on purpose.
                  </Text>
                  <Text
                    style={{
                      fontSize: "18px",
                      color: "#F5F5F5",
                      lineHeight: 1.7,
                      marginBottom: "20px",
                    }}
                  >
                    You can run the full sequence at once or step through it
                    token by token. Stepping through is worth doing at least
                    once. It makes visible something that is easy to miss when
                    generation happens in a blur: there is no sentence being
                    assembled. There is only the next token, then the next, each
                    one decided without any knowledge of where it is going.
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
                <div
                  style={{
                    maxWidth: "800px",
                    margin: "0 auto",
                    textAlign: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "18px",
                      color: "#F5F5F5",
                      lineHeight: 1.7,
                      marginBottom: "20px",
                    }}
                  >
                    Training is fundamentally about{" "}
                    <TermTooltip definition="Each wrong prediction generates an error signal that gets used to adjust the model before the next attempt">
                      correcting mistakes
                    </TermTooltip>
                    . Each time the model predicts the wrong next word, it
                    measures how wrong it was.{" "}
                    <TermTooltip definition="The process of tracing an error backward through the network to find which weights caused it and by how much">
                      Backpropagation
                    </TermTooltip>{" "}
                    then works backward through every layer, nudging the{" "}
                    <TermTooltip definition="Numbers that control how strongly one neuron influences another. Training adjusts these continuously">
                      weights
                    </TermTooltip>
                    , the numerical connections between neurons, so the same
                    error is less likely to happen again.
                  </Text>
                  <Text
                    style={{
                      fontSize: "18px",
                      color: "#F5F5F5",
                      lineHeight: 1.7,
                      marginBottom: "20px",
                    }}
                  >
                    Do this enough times across enough text, and something
                    shifts. The weights stop being noise and start carrying
                    structure, the rhythms, vocabulary, and patterns specific to
                    your{" "}
                    <TermTooltip definition="The body of text the model learns from. It never sees anything outside of this during training">
                      training corpus
                    </TermTooltip>
                    . The following model isn't learning language in any general
                    sense. It's learning yours.
                  </Text>
                  <Text
                    style={{
                      fontSize: "18px",
                      color: "#F5F5F5",
                      lineHeight: 1.7,
                      marginBottom: "20px",
                    }}
                  >
                    Below, you provide a short sentence, set the number of
                    epochs, and choose a learning rate. The backend runs the
                    full training loop and records a snapshot at every step. You
                    can scrub through those snapshots on a timeline or let them
                    play back at variable speed. Each frame shows the{" "}
                    <TermTooltip definition="A single number measuring how wrong the model's predictions were. Lower is better. Watching it fall across epochs is watching the model learn.">
                      loss
                    </TermTooltip>{" "}
                    at that epoch alongside three things: the input the model
                    received, the correct next token, and what the model
                    actually predicted. Below that is the{" "}
                    <TermTooltip definition="A grid showing how much each token attends to every other token. Brighter cells mean stronger attention between that pair.">
                      attention heatmap
                    </TermTooltip>
                    , a grid where each cell represents how much attention one
                    token pays to another, with opacity reflecting the weight.
                    Hover any cell to see the exact percentage. Click one to
                    open the <strong>Vector Inspector</strong>, which shows the
                    raw query and key vectors that produced that attention
                    score.
                  </Text>
                </div>
              </Stack>
            </Paper>
            <TrainingLab />
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <Stack
        w="100%"
        gap={4}
        mt={28}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box style={{ textAlign: "center" }}>
          <a
            href="https://0xahmedk.github.io/me"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              background: "rgba(232, 160, 32, 0.08)",
              border: "1px solid rgba(232, 160, 32, 0.3)",
              borderRadius: 20,
              color: "#e8a020",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              letterSpacing: "0.04em",
              transition: "background 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "rgba(232, 160, 32, 0.15)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor =
                "rgba(232, 160, 32, 0.55)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "rgba(232, 160, 32, 0.08)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor =
                "rgba(232, 160, 32, 0.3)";
            }}
          >
            More by this author ↗
          </a>
        </Box>

        <Box style={{ width: 1, height: 24, background: "#2a2a2e" }} />

        <ViewCounter />
        <ViewAnalytics />
      </Stack>
    </Container>
  );
}

export default App;
