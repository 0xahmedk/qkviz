import { useState, useEffect, useRef } from "react";
import { Badge, Box } from "@mantine/core";
import { Counter } from "counterapi";
import { IconEye } from "@tabler/icons-react";

const QUIRKY_LABELS = ["Curious Minds"] as const;

// Type for the v2 API response
interface CounterV2Response {
  code: string;
  message: string;
  data: {
    up_count: number;
    down_count: number;
    slug: string;
    name: string;
    workspace_slug: string;
  };
}

export function ViewCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const hasIncrementedRef = useRef(false);
  const [label] = useState(() => {
    // Pick a random label on component mount
    return QUIRKY_LABELS[Math.floor(Math.random() * QUIRKY_LABELS.length)];
  });

  useEffect(() => {
    // Prevent multiple increments
    if (hasIncrementedRef.current) {
      return;
    }

    const incrementCounter = async () => {
      try {
        hasIncrementedRef.current = true;
        console.log("Initializing counter...");
        const counter = new Counter({
          workspace: "ahmed-khans-team-2619",
          version: "v2",
        });
        console.log("Calling counter.up...");
        const result = (await counter.up(
          "qkviz",
        )) as unknown as CounterV2Response;
        console.log("Counter result:", result);

        // The v2 API returns the count in result.data.up_count
        if (result && result.data && typeof result.data.up_count === "number") {
          setCount(result.data.up_count);
          console.log("Count set to:", result.data.up_count);
        } else {
          console.error("Invalid result:", result);
          setError(true);
        }
      } catch (error) {
        console.error("Failed to fetch view count:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    incrementCounter();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <Badge variant="light" color="gray" size="lg">
        Loading...
      </Badge>
    );
  }

  // Don't render anything if there was an error
  if (
    error ||
    count === null ||
    count === undefined ||
    typeof count !== "number"
  ) {
    return null;
  }

  // Format number with commas
  const formattedCount = count.toLocaleString();

  return (
    <Badge
      variant="light"
      color="gray"
      size="lg"
      className="terminal-views-badge"
      leftSection={
        <Box style={{ display: "flex", alignItems: "center" }}>
          <IconEye size={14} />
        </Box>
      }
      style={{
        paddingLeft: 8,
        paddingRight: 12,
        textTransform: "none",
      }}
    >
      {formattedCount} {label}
    </Badge>
  );
}
