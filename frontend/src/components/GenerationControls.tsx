import {
  Stack,
  TextInput,
  Slider,
  Select,
  Group,
  Text,
  Paper,
} from "@mantine/core";

interface GenerationControlsProps {
  prompt: string;
  setPrompt: (value: string) => void;
  maxTokens: number;
  setMaxTokens: (value: number) => void;
  temperature: number;
  setTemperature: (value: number) => void;
  mode: "auto" | "manual";
  setMode: (value: "auto" | "manual") => void;
}

export function GenerationControls({
  prompt,
  setPrompt,
  maxTokens,
  setMaxTokens,
  temperature,
  setTemperature,
  mode,
  setMode,
}: GenerationControlsProps) {
  return (
    <Paper p="24px" radius={0} withBorder style={{ borderColor: "#333" }}>
      <Stack gap="24px">
        <Text
          style={{
            fontSize: "20px",
            fontWeight: 800,
            color: "#F5F5F5",
            lineHeight: 1.6,
          }}
        >
          Generation Controls
        </Text>

        {/* Prompt Input */}
        <TextInput
          label="Starting Text"
          placeholder="Enter a word or phrase..."
          description="The model will continue from this text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          size="md"
          styles={{
            label: { color: "#F5F5F5", fontSize: "14px", lineHeight: 1.6 },
            description: {
              color: "#F5F5F5",
              fontSize: "12px",
              lineHeight: 1.6,
            },
            input: {
              backgroundColor: "#1A1A1A",
              color: "#F5F5F5",
              borderColor: "#333",
              borderRadius: 0,
            },
          }}
        />

        {/* Mode Selection */}
        <Select
          label="Generation Mode"
          description="Auto generates all at once, Manual lets you step through"
          value={mode}
          onChange={(value) => setMode(value as "auto" | "manual")}
          data={[
            { value: "auto", label: "Auto Generate" },
            { value: "manual", label: "Manual Step-by-Step" },
          ]}
          size="md"
          styles={{
            label: { color: "#F5F5F5", fontSize: "14px", lineHeight: 1.6 },
            description: {
              color: "#F5F5F5",
              fontSize: "12px",
              lineHeight: 1.6,
            },
            input: {
              backgroundColor: "#1A1A1A",
              color: "#F5F5F5",
              borderColor: "#333",
              borderRadius: 0,
            },
            dropdown: {
              backgroundColor: "#1A1A1A",
              borderColor: "#333",
              borderRadius: 0,
            },
            option: {
              color: "#F5F5F5",
              "&[data-selected]": {
                backgroundColor: "#22C55E",
                color: "#0A0A0A",
              },
            },
          }}
        />

        {/* Max Tokens Slider */}
        <div>
          <Group justify="space-between" mb="8px">
            <Text
              style={{ color: "#F5F5F5", fontSize: "14px", fontWeight: 500 }}
            >
              Maximum Tokens
            </Text>
            <Text style={{ color: "#F5F5F5", fontSize: "14px" }}>
              {maxTokens} tokens
            </Text>
          </Group>
          <Slider
            value={maxTokens}
            onChange={setMaxTokens}
            min={10}
            max={200}
            step={10}
            marks={[
              { value: 10, label: "10" },
              { value: 50, label: "50" },
              { value: 100, label: "100" },
              { value: 150, label: "150" },
              { value: 200, label: "200" },
            ]}
            color="green" /* Using Green for accent */
            styles={{
              markLabel: { color: "#F5F5F5" },
            }}
          />
        </div>

        {/* Temperature Slider */}
        <div>
          <Group justify="space-between" mb="8px">
            <Text
              style={{ color: "#F5F5F5", fontSize: "14px", fontWeight: 500 }}
            >
              Temperature
            </Text>
            <Text style={{ color: "#F5F5F5", fontSize: "14px" }}>
              {temperature.toFixed(2)}
            </Text>
          </Group>
          <Slider
            value={temperature}
            onChange={setTemperature}
            min={0.1}
            max={2.0}
            step={0.1}
            marks={[
              { value: 0.1, label: "0.1" },
              { value: 0.5, label: "0.5" },
              { value: 1.0, label: "1.0" },
              { value: 1.5, label: "1.5" },
              { value: 2.0, label: "2.0" },
            ]}
            color="red" /* Using Red for accent */
            styles={{
              markLabel: { color: "#F5F5F5" },
            }}
          />
          <Text
            style={{
              fontSize: "12px",
              color: "#F5F5F5",
              marginTop: "24px",
              lineHeight: 1.6,
            }}
          >
            Lower = more focused, Higher = more creative
          </Text>
        </div>
      </Stack>
    </Paper>
  );
}
