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
      <Paper
        p="24px"
        radius={0}
        withBorder
        style={{
          height: "100%",
          borderColor: "#333",
          backgroundColor: "#1A1A1A",
        }}
      >
        <Stack
          gap="16px"
          align="center"
          justify="center"
          style={{ minHeight: 200 }}
        >
          <Text
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#F5F5F5",
              lineHeight: 1.6,
            }}
          >
            Top 5 Predictions
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: "#F5F5F5",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            Click "Generate Next Token" to see the model's predictions
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      p="24px"
      radius={0}
      withBorder
      style={{
        height: "100%",
        borderColor: "#333",
        backgroundColor: "#1A1A1A",
      }}
    >
      <Stack gap="16px">
        <Group justify="space-between">
          <Text
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#F5F5F5",
              lineHeight: 1.6,
            }}
          >
            Top 5 Next Token Predictions
          </Text>
          <Badge
            color="gray"
            style={{
              borderRadius: 0,
              backgroundColor: "#333",
              color: "#F5F5F5",
              border: "1px solid #555",
            }}
          >
            Live
          </Badge>
        </Group>

        <Stack gap="8px">
          {predictions.map((pred, idx) => {
            const isSelected = idx === selectedIndex;
            const percentage = (pred.probability * 100).toFixed(1);

            // Display token with special handling for whitespace
            let displayToken = pred.token;
            if (pred.token === " ")
              displayToken = "␣"; // Space symbol
            else if (pred.token === "\n")
              displayToken = "↵"; // Newline symbol
            else if (pred.token === "\t") displayToken = "⇥"; // Tab symbol

            const progressColor =
              pred.probability > 0.5 ? "#22C55E" : "#EF4444"; // Green for good, Red for bad

            return (
              <div key={idx}>
                <Group justify="space-between" mb="4px">
                  <Group gap="4px">
                    <Badge
                      size="lg"
                      style={{
                        borderRadius: 0,
                        backgroundColor: isSelected ? "#22C55E" : "#333",
                        color: isSelected ? "#0A0A0A" : "#F5F5F5",
                        border: `1px solid ${isSelected ? "#22C55E" : "#555"}`,
                      }}
                    >
                      #{idx + 1}
                    </Badge>
                    <Code
                      style={{
                        fontSize: "14px",
                        fontWeight: isSelected ? 600 : 400,
                        padding: "4px 8px",
                        backgroundColor: isSelected ? "#22C55E" : "#1A1A1A",
                        color: isSelected ? "#0A0A0A" : "#F5F5F5",
                        border: `1px solid ${isSelected ? "#22C55E" : "#555"}`,
                        borderRadius: 0,
                      }}
                    >
                      {displayToken}
                    </Code>
                  </Group>
                  <Group gap="4px">
                    <Text
                      style={{
                        fontSize: "14px",
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? "#22C55E" : "#F5F5F5",
                      }}
                    >
                      {percentage}%
                    </Text>
                    {isSelected && (
                      <Badge
                        size="sm"
                        style={{
                          borderRadius: 0,
                          backgroundColor: "#22C55E",
                          color: "#0A0A0A",
                          border: "1px solid #22C55E",
                        }}
                      >
                        Selected
                      </Badge>
                    )}
                  </Group>
                </Group>
                <Progress
                  value={pred.probability * 100}
                  size="xl"
                  radius={0}
                  color={progressColor}
                  animated={isSelected}
                  style={{
                    border: `1px solid ${progressColor}`,
                  }}
                />
              </div>
            );
          })}
        </Stack>

        <Text
          style={{
            fontSize: "12px",
            color: "#F5F5F5",
            marginTop: "8px",
            lineHeight: 1.6,
          }}
        >
          These are the model's confidence scores for the next token. The
          selected token (highlighted in green) is what the model chose.
        </Text>
      </Stack>
    </Paper>
  );
}
