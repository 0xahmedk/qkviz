import { Modal, Stack, Text, Group, Badge, Paper, Grid } from "@mantine/core";
import "./VectorInspector.css";

interface VectorInspectorProps {
  opened: boolean;
  onClose: () => void;
  tokenI: string;
  tokenJ: string;
  qVector: number[];
  kVector: number[];
  attentionScore: number;
}

export function VectorInspector({
  opened,
  onClose,
  tokenI,
  tokenJ,
  qVector,
  kVector,
  attentionScore,
}: VectorInspectorProps) {
  // Compute dot product
  const dotProduct =
    qVector && kVector
      ? qVector.reduce((sum, q, idx) => sum + q * kVector[idx], 0)
      : 0;

  const headSize = qVector?.length || 0;
  const scaledScore = dotProduct / Math.sqrt(headSize);

  // Find dimensions where both are significantly positive (aligned)
  const alignmentThreshold = 0.1;
  const dimensionAlignments = qVector?.map((q, idx) => {
    const k = kVector[idx];

    if (q > alignmentThreshold && k > alignmentThreshold) {
      return "aligned"; // Both positive - GREEN
    } else if (
      (q > alignmentThreshold && k < -alignmentThreshold) ||
      (q < -alignmentThreshold && k > alignmentThreshold)
    ) {
      return "opposite"; // Opposite signs - RED
    } else {
      return "neutral"; // GRAY
    }
  });

  // Compute max absolute values for scaling
  const maxQ = Math.max(...(qVector?.map((v) => Math.abs(v)) || [1]));
  const maxK = Math.max(...(kVector?.map((v) => Math.abs(v)) || [1]));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Text fw={700} size="lg">
            🔬 Vector Inspector
          </Text>
        </Group>
      }
      size="xl"
      centered
    >
      <Stack gap="lg">
        {/* Header Info */}
        <Paper p="md" withBorder bg="dark.6">
          <Stack gap="sm">
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" mb={4}>
                  Query Token (Looking)
                </Text>
                <Badge size="lg" variant="filled" color="pink">
                  "{tokenI}"
                </Badge>
              </div>
              <Text size="xl" c="dimmed">
                →
              </Text>
              <div>
                <Text size="sm" c="dimmed" mb={4}>
                  Key Token (Being Looked At)
                </Text>
                <Badge size="lg" variant="filled" color="cyan">
                  "{tokenJ}"
                </Badge>
              </div>
            </Group>

            <Paper p="sm" withBorder bg="grape.9">
              <Stack gap="xs">
                <Text size="sm" fw={600} c="grape.1">
                  📊 Attention Math
                </Text>
                <Group gap="md">
                  <div>
                    <Text size="xs" c="dimmed">
                      Raw Dot Product:
                    </Text>
                    <Text size="lg" fw={700} c="grape.3">
                      {dotProduct.toFixed(4)}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      Scaled Score:
                    </Text>
                    <Text size="lg" fw={700} c="pink.3">
                      {scaledScore.toFixed(4)}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      Final Attention:
                    </Text>
                    <Text size="lg" fw={700} c="cyan.3">
                      {(attentionScore * 100).toFixed(1)}%
                    </Text>
                  </div>
                </Group>
                <Text size="xs" c="dimmed" fs="italic">
                  Formula: sum(Q[i] × K[j]) / √{headSize} ={" "}
                  {scaledScore.toFixed(4)}
                </Text>
              </Stack>
            </Paper>
          </Stack>
        </Paper>

        {/* Explanation */}
        <Paper p="md" withBorder bg="blue.9">
          <Text size="sm" c="blue.1">
            <Text span fw={700}>
              Why this attention score?
            </Text>{" "}
            {scaledScore > 0.1
              ? `High alignment! The query and key vectors point in similar directions. Green bars show dimensions where both vectors are strongly positive.`
              : scaledScore < -0.1
              ? `Negative alignment. The vectors point in opposite directions, reducing attention.`
              : `Low alignment. The vectors are mostly orthogonal (perpendicular), resulting in weak attention.`}
          </Text>
        </Paper>

        {/* Vector Visualization */}
        <Grid gutter="md">
          {/* Query Vector */}
          <Grid.Col span={6}>
            <Paper p="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="md" fw={600} c="pink">
                    Q Vector
                  </Text>
                  <Text size="xs" c="dimmed">
                    {qVector?.length || 0} dims
                  </Text>
                </Group>

                <div className="vector-bars">
                  {qVector?.map((value, idx) => {
                    const alignment = dimensionAlignments?.[idx] || "neutral";
                    const heightPercent = (Math.abs(value) / maxQ) * 100;
                    const isPositive = value >= 0;

                    return (
                      <div key={idx} className="vector-bar-container">
                        <div
                          className={`vector-bar vector-bar-${alignment}`}
                          style={{
                            height: `${Math.max(heightPercent, 2)}%`,
                            backgroundColor:
                              alignment === "aligned"
                                ? "rgba(64, 192, 87, 0.8)"
                                : alignment === "opposite"
                                ? "rgba(250, 82, 82, 0.8)"
                                : isPositive
                                ? "rgba(240, 62, 162, 0.6)"
                                : "rgba(240, 62, 162, 0.3)",
                          }}
                          title={`Dim ${idx}: ${value.toFixed(3)}`}
                        />
                        {idx % 4 === 0 && (
                          <Text
                            size="8px"
                            c="dimmed"
                            style={{ position: "absolute", bottom: "-16px" }}
                          >
                            {idx}
                          </Text>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Text size="xs" c="dimmed" ta="center">
                  What token "{tokenI}" is looking for
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Key Vector */}
          <Grid.Col span={6}>
            <Paper p="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="md" fw={600} c="cyan">
                    K Vector
                  </Text>
                  <Text size="xs" c="dimmed">
                    {kVector?.length || 0} dims
                  </Text>
                </Group>

                <div className="vector-bars">
                  {kVector?.map((value, idx) => {
                    const alignment = dimensionAlignments?.[idx] || "neutral";
                    const heightPercent = (Math.abs(value) / maxK) * 100;
                    const isPositive = value >= 0;

                    return (
                      <div key={idx} className="vector-bar-container">
                        <div
                          className={`vector-bar vector-bar-${alignment}`}
                          style={{
                            height: `${Math.max(heightPercent, 2)}%`,
                            backgroundColor:
                              alignment === "aligned"
                                ? "rgba(64, 192, 87, 0.8)"
                                : alignment === "opposite"
                                ? "rgba(250, 82, 82, 0.8)"
                                : isPositive
                                ? "rgba(34, 184, 207, 0.6)"
                                : "rgba(34, 184, 207, 0.3)",
                          }}
                          title={`Dim ${idx}: ${value.toFixed(3)}`}
                        />
                        {idx % 4 === 0 && (
                          <Text
                            size="8px"
                            c="dimmed"
                            style={{ position: "absolute", bottom: "-16px" }}
                          >
                            {idx}
                          </Text>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Text size="xs" c="dimmed" ta="center">
                  What token "{tokenJ}" offers
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Legend */}
        <Paper p="sm" withBorder bg="dark.7">
          <Group justify="center" gap="md">
            <Group gap="xs">
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor: "rgba(64, 192, 87, 0.8)",
                  borderRadius: "3px",
                }}
              />
              <Text size="xs" c="dimmed">
                Aligned (both positive)
              </Text>
            </Group>
            <Group gap="xs">
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor: "rgba(250, 82, 82, 0.8)",
                  borderRadius: "3px",
                }}
              />
              <Text size="xs" c="dimmed">
                Opposite (conflicting)
              </Text>
            </Group>
            <Group gap="xs">
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor: "rgba(160, 160, 160, 0.5)",
                  borderRadius: "3px",
                }}
              />
              <Text size="xs" c="dimmed">
                Neutral (weak signal)
              </Text>
            </Group>
          </Group>
        </Paper>
      </Stack>
    </Modal>
  );
}
