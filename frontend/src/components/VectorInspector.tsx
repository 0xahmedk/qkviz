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
        <Text style={{ fontSize: "20px", fontWeight: 700, color: "#F5F5F5" }}>
          Vector Inspector
        </Text>
      }
      size="xl"
      centered
      overlayProps={{ backgroundOpacity: 0.8, blur: 4 }}
      styles={{
        content: {
          backgroundColor: "#0A0A0A",
          border: "1px solid #333",
          borderRadius: 0,
        },
        header: {
          backgroundColor: "#1A1A1A",
          borderBottom: "1px solid #333",
          padding: "16px 24px",
          margin: 0,
        },
        title: { color: "#F5F5F5", fontSize: "20px", fontWeight: 800 },
        close: { color: "#F5F5F5", "&:hover": { backgroundColor: "#333" } },
      }}
    >
      <Stack gap="24px">
        {/* Header Info */}
        <Paper
          p="16px"
          withBorder
          style={{
            borderColor: "#333",
            backgroundColor: "#1A1A1A",
            borderRadius: 0,
          }}
        >
          <Stack gap="16px">
            <Group justify="space-between">
              <div>
                <Text
                  style={{
                    fontSize: "14px",
                    color: "#F5F5F5",
                    marginBottom: "8px",
                    lineHeight: 1.6,
                  }}
                >
                  Query Token (Looking)
                </Text>
                <Badge
                  size="lg"
                  style={{
                    borderRadius: 0,
                    backgroundColor: "#22C55E",
                    color: "#0A0A0A",
                    border: "1px solid #22C55E",
                  }}
                >
                  "{tokenI}"
                </Badge>
              </div>
              <Text style={{ fontSize: "24px", color: "#F5F5F5" }}>→</Text>
              <div>
                <Text
                  style={{
                    fontSize: "14px",
                    color: "#F5F5F5",
                    marginBottom: "8px",
                    lineHeight: 1.6,
                  }}
                >
                  Key Token (Being Looked At)
                </Text>
                <Badge
                  size="lg"
                  style={{
                    borderRadius: 0,
                    backgroundColor: "#22C55E",
                    color: "#0A0A0A",
                    border: "1px solid #22C55E",
                  }}
                >
                  "{tokenJ}"
                </Badge>
              </div>
            </Group>

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
                <Text
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#F5F5F5",
                    lineHeight: 1.6,
                  }}
                >
                  Attention Computation
                </Text>
                <Group gap="16px">
                  <div>
                    <Text
                      style={{
                        fontSize: "12px",
                        color: "#F5F5F5",
                        lineHeight: 1.6,
                      }}
                    >
                      Raw Dot Product:
                    </Text>
                    <Text
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#22C55E",
                        lineHeight: 1.6,
                      }}
                    >
                      {dotProduct.toFixed(4)}
                    </Text>
                  </div>
                  <div>
                    <Text
                      style={{
                        fontSize: "12px",
                        color: "#F5F5F5",
                        lineHeight: 1.6,
                      }}
                    >
                      Scaled Score:
                    </Text>
                    <Text
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#22C55E",
                        lineHeight: 1.6,
                      }}
                    >
                      {scaledScore.toFixed(4)}
                    </Text>
                  </div>
                  <div>
                    <Text
                      style={{
                        fontSize: "12px",
                        color: "#F5F5F5",
                        lineHeight: 1.6,
                      }}
                    >
                      Final Attention:
                    </Text>
                    <Text
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#22C55E",
                        lineHeight: 1.6,
                      }}
                    >
                      {(attentionScore * 100).toFixed(1)}%
                    </Text>
                  </div>
                </Group>
                <Text
                  style={{
                    fontSize: "12px",
                    color: "#F5F5F5",
                    fontStyle: "italic",
                    lineHeight: 1.6,
                  }}
                >
                  Formula: sum(Q[i] × K[j]) / √{headSize} ={" "}
                  {scaledScore.toFixed(4)}
                </Text>
              </Stack>
            </Paper>
          </Stack>
        </Paper>

        {/* Explanation */}
        <Paper
          p="16px"
          withBorder
          style={{
            borderColor: "#333",
            backgroundColor: "#1A1A1A",
            borderRadius: 0,
          }}
        >
          <Text style={{ fontSize: "14px", color: "#F5F5F5", lineHeight: 1.6 }}>
            <Text span style={{ fontWeight: 700, color: "#22C55E" }}>
              Why this attention score?
            </Text>{" "}
            {scaledScore > 0.1
              ? `High alignment: The query and key vectors demonstrate strong directional coherence. Green bars indicate dimensions where both vectors exhibit significant positive values.`
              : scaledScore < -0.1
                ? `Negative alignment: The vectors exhibit opposing directional tendencies, resulting in a reduction in attention magnitude.`
                : `Low alignment: The vectors are predominantly orthogonal, leading to a weak overall attention signal.`}
          </Text>
        </Paper>

        {/* Vector Visualization */}
        <Grid gutter="16px">
          {/* Query Vector */}
          <Grid.Col span={6}>
            <Paper
              p="16px"
              withBorder
              style={{
                borderColor: "#333",
                backgroundColor: "#1A1A1A",
                borderRadius: 0,
              }}
            >
              <Stack gap="8px">
                <Group justify="space-between">
                  <Text
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#22C55E",
                      lineHeight: 1.6,
                    }}
                  >
                    Query Vector
                  </Text>
                  <Text style={{ fontSize: "12px", color: "#F5F5F5" }}>
                    {qVector?.length || 0} dims
                  </Text>
                </Group>

                <div className="vector-bars">
                  {qVector?.map((value, idx) => {
                    const alignment = dimensionAlignments?.[idx] || "neutral";
                    const heightPercent = (Math.abs(value) / maxQ) * 100;
                    const isPositive = value >= 0;

                    let barColor = "#333"; // Default neutral
                    if (alignment === "aligned") {
                      barColor = "#22C55E"; // Green for aligned
                    } else if (alignment === "opposite") {
                      barColor = "#EF4444"; // Red for opposite
                    } else if (isPositive) {
                      barColor = "#888"; // Gray for neutral positive
                    } else {
                      barColor = "#555"; // Darker gray for neutral negative
                    }

                    return (
                      <div key={idx} className="vector-bar-container">
                        <div
                          className={`vector-bar vector-bar-${alignment}`}
                          style={{
                            height: `${Math.max(heightPercent, 2)}%`,
                            backgroundColor: barColor,
                          }}
                          title={`Dim ${idx}: ${value.toFixed(3)}`}
                        />
                        {idx % 8 ===
                          0 /* Changed to 8 for better spacing */ && (
                          <Text
                            style={{
                              fontSize: "10px",
                              color: "#F5F5F5",
                              position: "absolute",
                              bottom: "-24px",
                              lineHeight: 1.6,
                            }}
                          >
                            {idx}
                          </Text>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Text
                  style={{
                    fontSize: "12px",
                    color: "#F5F5F5",
                    textAlign: "center",
                    marginTop: "24px",
                    lineHeight: 1.6,
                  }}
                >
                  This vector represents what token "{tokenI}" is seeking.
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Key Vector */}
          <Grid.Col span={6}>
            <Paper
              p="16px"
              withBorder
              style={{
                borderColor: "#333",
                backgroundColor: "#1A1A1A",
                borderRadius: 0,
              }}
            >
              <Stack gap="8px">
                <Group justify="space-between">
                  <Text
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#22C55E",
                      lineHeight: 1.6,
                    }}
                  >
                    Key Vector
                  </Text>
                  <Text style={{ fontSize: "12px", color: "#F5F5F5" }}>
                    {kVector?.length || 0} dims
                  </Text>
                </Group>

                <div className="vector-bars">
                  {kVector?.map((value, idx) => {
                    const alignment = dimensionAlignments?.[idx] || "neutral";
                    const heightPercent = (Math.abs(value) / maxK) * 100;
                    const isPositive = value >= 0;

                    let barColor = "#333"; // Default neutral
                    if (alignment === "aligned") {
                      barColor = "#22C55E"; // Green for aligned
                    } else if (alignment === "opposite") {
                      barColor = "#EF4444"; // Red for opposite
                    } else if (isPositive) {
                      barColor = "#888"; // Gray for neutral positive
                    } else {
                      barColor = "#555"; // Darker gray for neutral negative
                    }

                    return (
                      <div key={idx} className="vector-bar-container">
                        <div
                          className={`vector-bar vector-bar-${alignment}`}
                          style={{
                            height: `${Math.max(heightPercent, 2)}%`,
                            backgroundColor: barColor,
                          }}
                          title={`Dim ${idx}: ${value.toFixed(3)}`}
                        />
                        {idx % 8 ===
                          0 /* Changed to 8 for better spacing */ && (
                          <Text
                            style={{
                              fontSize: "10px",
                              color: "#F5F5F5",
                              position: "absolute",
                              bottom: "-24px",
                              lineHeight: 1.6,
                            }}
                          >
                            {idx}
                          </Text>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Text
                  style={{
                    fontSize: "12px",
                    color: "#F5F5F5",
                    textAlign: "center",
                    marginTop: "24px",
                    lineHeight: 1.6,
                  }}
                >
                  This vector represents what token "{tokenJ}" offers.
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Legend */}
        <Paper
          p="16px"
          withBorder
          style={{
            borderColor: "#333",
            backgroundColor: "#1A1A1A",
            borderRadius: 0,
          }}
        >
          <Group justify="center" gap="16px">
            <Group gap="8px">
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor: "#22C55E",
                  borderRadius: 0,
                  border: "1px solid #333",
                }}
              />
              <Text
                style={{ fontSize: "12px", color: "#F5F5F5", lineHeight: 1.6 }}
              >
                Aligned (both positive)
              </Text>
            </Group>
            <Group gap="8px">
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor: "#EF4444",
                  borderRadius: 0,
                  border: "1px solid #333",
                }}
              />
              <Text
                style={{ fontSize: "12px", color: "#F5F5F5", lineHeight: 1.6 }}
              >
                Opposite (conflicting)
              </Text>
            </Group>
            <Group gap="8px">
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor: "#888",
                  borderRadius: 0,
                  border: "1px solid #333",
                }}
              />
              <Text
                style={{ fontSize: "12px", color: "#F5F5F5", lineHeight: 1.6 }}
              >
                Neutral (weak signal)
              </Text>
            </Group>
          </Group>
        </Paper>
      </Stack>
    </Modal>
  );
}
