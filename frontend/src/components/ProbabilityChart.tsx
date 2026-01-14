import {
  Paper,
  Text,
  Stack,
  Group,
  Badge,
  Progress,
  Code,
} from "@mantine/core";

export interface TokenPrediction {
  token: string;
  probability: number;
  log_probability: number;
}

interface ProbabilityChartProps {
  predictions: TokenPrediction[];
  selectedIndex: number | null;
}

export function ProbabilityChart({
  predictions,
  selectedIndex,
}: ProbabilityChartProps) {
  if (predictions.length === 0) {
    return (
      <Paper p="md" radius="md" withBorder style={{ height: "100%" }}>
        <Stack
          gap="md"
          align="center"
          justify="center"
          style={{ minHeight: 200 }}
        >
          <Text size="lg" fw={600} c="dimmed">
            Top 5 Predictions
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            Click "Generate Next Token" to see the model's predictions
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper p="md" radius="md" withBorder style={{ height: "100%" }}>
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={600}>
            Top 5 Next Token Predictions
          </Text>
          <Badge variant="gradient" gradient={{ from: "blue", to: "cyan" }}>
            Live
          </Badge>
        </Group>

        <Stack gap="sm">
          {predictions.map((pred, idx) => {
            const isSelected = idx === selectedIndex;
            const percentage = (pred.probability * 100).toFixed(1);

            // Display token with special handling for whitespace
            let displayToken = pred.token;
            if (pred.token === " ") displayToken = "␣"; // Space symbol
            else if (pred.token === "\n") displayToken = "↵"; // Newline symbol
            else if (pred.token === "\t") displayToken = "⇥"; // Tab symbol

            return (
              <div key={idx}>
                <Group justify="space-between" mb={4}>
                  <Group gap="xs">
                    <Badge
                      size="lg"
                      variant={isSelected ? "filled" : "light"}
                      color={isSelected ? "green" : "blue"}
                    >
                      #{idx + 1}
                    </Badge>
                    <Code
                      style={{
                        fontSize: "14px",
                        fontWeight: isSelected ? 600 : 400,
                        padding: "4px 8px",
                        backgroundColor: isSelected
                          ? "rgba(64, 192, 87, 0.2)"
                          : undefined,
                        border: isSelected
                          ? "2px solid rgba(64, 192, 87, 0.5)"
                          : undefined,
                      }}
                    >
                      {displayToken}
                    </Code>
                  </Group>
                  <Group gap="xs">
                    <Text
                      size="sm"
                      fw={isSelected ? 600 : 500}
                      c={isSelected ? "green" : undefined}
                    >
                      {percentage}%
                    </Text>
                    {isSelected && (
                      <Badge size="sm" color="green" variant="dot">
                        Selected
                      </Badge>
                    )}
                  </Group>
                </Group>
                <Progress
                  value={pred.probability * 100}
                  size="xl"
                  radius="md"
                  color={isSelected ? "green" : "blue"}
                  animated={isSelected}
                  style={{
                    boxShadow: isSelected
                      ? "0 0 10px rgba(64, 192, 87, 0.4)"
                      : undefined,
                  }}
                />
              </div>
            );
          })}
        </Stack>

        <Text size="xs" c="dimmed" mt="xs">
          📊 These are the model's confidence scores for the next token. The
          selected token (highlighted in green) is what the model chose.
        </Text>
      </Stack>
    </Paper>
  );
}
