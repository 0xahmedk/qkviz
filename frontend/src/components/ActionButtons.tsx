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
  if (mode === "auto") {
    return (
      <Group justify="center" gap="md">
        {!isGenerating ? (
          <>
            <Button
              size="lg"
              leftSection={<IconPlayerPlay size={20} />}
              onClick={onGenerate}
              disabled={disabled}
              variant="gradient"
              gradient={{ from: "blue", to: "cyan" }}
            >
              Generate Text
            </Button>
            <Button
              size="lg"
              leftSection={<IconRefresh size={20} />}
              onClick={onReset}
              variant="light"
              color="gray"
            >
              Reset
            </Button>
          </>
        ) : (
          <Button
            size="lg"
            leftSection={<IconPlayerStop size={20} />}
            onClick={onStop}
            color="red"
            variant="filled"
          >
            Stop Generation
          </Button>
        )}
      </Group>
    );
  }

  // Manual mode
  return (
    <Group justify="center" gap="md">
      <Button
        size="lg"
        leftSection={<IconArrowRight size={20} />}
        onClick={onGenerate}
        disabled={disabled || isGenerating}
        variant="gradient"
        gradient={{ from: "blue", to: "cyan" }}
      >
        Generate Next Token
      </Button>
      <Button
        size="lg"
        leftSection={<IconRefresh size={20} />}
        onClick={onReset}
        variant="light"
        color="gray"
        disabled={isGenerating}
      >
        Reset
      </Button>
    </Group>
  );
}
