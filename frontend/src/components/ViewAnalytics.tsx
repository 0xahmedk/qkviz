import { useState, useMemo } from "react";
import { Button, Modal, Text, TextInput, Group, Anchor } from "@mantine/core";

function ViewAnalytics() {
  const [analyticsOpened, setAnalyticsOpened] = useState(false);
  const [passcodeOpened, setPasscodeOpened] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  const mapImageBase =
    "https://mapmyvisitors.com/map.png?cl=ffffff&t=n&d=asWChGCPZ9mTGNvJn10ctJ665yYB0i3hc-Vf_-TwD0E&co=2d78ad&ct=ffffff";
  const mapImageUrl1x = `${mapImageBase}&w=1200`;
  const mapImageUrl2x = `${mapImageBase}&w=2400`;

  const expectedPasscode = useMemo(() => {
    const codes = [97, 117, 114, 111, 114, 97];
    return String.fromCharCode(...codes);
  }, []);

  const handlePasscodeSubmit = () => {
    const normalized = passcodeInput.trim().toLowerCase();
    if (normalized === expectedPasscode) {
      setPasscodeError("");
      setPasscodeOpened(false);
      setAnalyticsOpened(true);
      setPasscodeInput("");
      return;
    }

    setPasscodeError("Nope. Try the secret word.");
  };
  return (
    <div>
      <Button
        variant="transparent"
        size="xs"
        style={{
          fontSize: 8,
        }}
        onClick={() => setPasscodeOpened(true)}
      >
        View detailed analytics
      </Button>

      <Modal
        opened={passcodeOpened}
        onClose={() => setPasscodeOpened(false)}
        title="Access vault"
        centered
      >
        <Text fz="sm" c="dimmed" mb="sm">
          Speak the secret word to unlock the analytics map. Because it is just
          for Ahmed, 😉
        </Text>
        <TextInput
          label="Passcode"
          placeholder="Enter secret word"
          value={passcodeInput}
          error={passcodeError}
          onChange={(event) => {
            setPasscodeInput(event.currentTarget.value);
            if (passcodeError) {
              setPasscodeError("");
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handlePasscodeSubmit();
            }
          }}
          autoFocus
        />
        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={() => setPasscodeOpened(false)}>
            Cancel
          </Button>
          <Button onClick={handlePasscodeSubmit}>Unlock</Button>
        </Group>
      </Modal>

      <Modal
        opened={analyticsOpened}
        onClose={() => setAnalyticsOpened(false)}
        title="Visitor analytics"
        centered
        fullScreen
      >
        <Anchor
          href="https://mapmyvisitors.com/web/1c48e"
          target="_blank"
          rel="noopener noreferrer"
          title="Visit tracker"
        >
          <img
            src={mapImageUrl1x}
            srcSet={`${mapImageUrl1x} 1x, ${mapImageUrl2x} 2x`}
            alt="Visitor map"
            style={{ width: "100%", borderRadius: 12 }}
          />
        </Anchor>
      </Modal>
    </div>
  );
}

export default ViewAnalytics;
