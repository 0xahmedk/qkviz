import { Group, Button } from "@mantine/core";
import {
  IconPlayerPlay,
  IconPlayerStop,
  IconArrowRight,
  IconRefresh,
} from "@tabler/icons-react";

interface ActionButtonsProps {
  mode: "auto" | "manual";
  isGenerating: boolean;
  onGenerate: () => void;
  onStop: () => void;
  onReset: () => void;
  disabled: boolean;
}

export function ActionButtons({
  mode,
  isGenerating,
  onGenerate,
  onStop,
  onReset,
  disabled,
}: ActionButtonsProps) {
  const buttonStyles = {
    root: {
      borderRadius: 0,
      border: "1px solid #333",
      backgroundColor: "transparent",
      color: "#F5F5F5",
      "&:hover": {
        backgroundColor: "#22C55E",
        color: "#0A0A0A",
      },
      "&[data-disabled]": {
        borderColor: "#555",
        color: "#888",
        backgroundColor: "transparent",
        "&:hover": {
          backgroundColor: "transparent",
          color: "#888",
        },
      },
    },
    inner: {
      color: "#F5F5F5",
      "&:hover": {
        color: "#0A0A0A",
      },
    },
    leftSection: {
      color: "#F5F5F5",
      "&:hover": {
        color: "#0A0A0A",
      },
    },
  };

  const stopButtonStyles = {
    root: {
      ...buttonStyles.root,
      borderColor: "#EF4444",
      "&:hover": {
        backgroundColor: "#EF4444",
        color: "#0A0A0A",
      },
    },
    inner: {
      color: "#F5F5F5",
      "&:hover": {
        color: "#0A0A0A",
      },
    },
    leftSection: {
      color: "#F5F5F5",
      "&:hover": {
        color: "#0A0A0A",
      },
    },
  };

  if (mode === "auto") {
    return (
      <Group justify="center" gap="16px">
        {!isGenerating ? (
          <>
            <Button
              size="lg"
              leftSection={<IconPlayerPlay size={20} />}
              onClick={onGenerate}
              disabled={disabled}
              styles={buttonStyles}
            >
              Generate Text
            </Button>
            <Button
              size="lg"
              leftSection={<IconRefresh size={20} />}
              onClick={onReset}
              styles={buttonStyles}
            >
              Reset
            </Button>
          </>
        ) : (
          <Button
            size="lg"
            leftSection={<IconPlayerStop size={20} />}
            onClick={onStop}
            styles={stopButtonStyles}
          >
            Stop Generation
          </Button>
        )}
      </Group>
    );
  }

  // Manual mode
  return (
    <Group justify="center" gap="16px">
      <Button
        size="lg"
        leftSection={<IconArrowRight size={20} />}
        onClick={onGenerate}
        disabled={disabled || isGenerating}
        styles={buttonStyles}
      >
        Generate Next Token
      </Button>
      <Button
        size="lg"
        leftSection={<IconRefresh size={20} />}
        onClick={onReset}
        styles={buttonStyles}
        disabled={isGenerating}
      >
        Reset
      </Button>
    </Group>
  );
}
