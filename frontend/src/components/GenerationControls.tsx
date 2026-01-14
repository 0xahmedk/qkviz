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
    <Paper p="md" radius="md" withBorder>
      <Stack gap="md">
        <Text size="lg" fw={600}>
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
        />

        {/* Mode Selection */}
        <Select
          label="Generation Mode"
          description="Auto generates all at once, Manual lets you step through"
          value={mode}
          onChange={(value) => setMode(value as "auto" | "manual")}
          data={[
            { value: "auto", label: "🚀 Auto Generate" },
            { value: "manual", label: "👆 Manual Step-by-Step" },
          ]}
          size="md"
        />

        {/* Max Tokens Slider */}
        <div>
          <Group justify="space-between" mb={8}>
            <Text size="sm" fw={500}>
              Maximum Tokens
            </Text>
            <Text size="sm" c="dimmed">
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
            color="blue"
          />
        </div>

        {/* Temperature Slider */}
        <div>
          <Group justify="space-between" mb={8}>
            <Text size="sm" fw={500}>
              Temperature
            </Text>
            <Text size="sm" c="dimmed">
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
            color="grape"
          />
          <Text size="xs" c="dimmed" mt={"xl"}>
            Lower = more focused, Higher = more creative
          </Text>
        </div>
      </Stack>
    </Paper>
  );
}
