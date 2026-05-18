import { IconExternalLink } from "@tabler/icons-react";
import { useState } from "react";

interface TermTooltipProps {
  definition: string;
  children: React.ReactNode;
  href?: string;
}

const ExternalLinkIcon = () => (
  <IconExternalLink
    size={12}
    style={{ marginLeft: 4, verticalAlign: "middle" }}
  />
);

export function TermTooltip({ definition, children, href }: TermTooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={
        href
          ? () => window.open(href, "_blank", "noopener,noreferrer")
          : undefined
      }
    >
      <strong
        style={{
          cursor: href ? "pointer" : "default",
          borderBottom: visible ? "1px solid #22C55E" : "1px dotted #555",
          borderRadius: "3px",
          padding: "0 2px",
          color: visible ? "#4ade80" : "#a4e1ba",
          backgroundColor: visible ? "rgba(34, 197, 94, 0.08)" : "transparent",
          transition:
            "color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease",
        }}
      >
        {children}
        {href && visible && (
          <span style={{ color: "#777" }}>
            <ExternalLinkIcon />
          </span>
        )}
      </strong>
      <span
        role="tooltip"
        style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#161616",
          color: "#D0D0D0",
          fontSize: "13px",
          lineHeight: 1.55,
          padding: "9px 13px",
          borderRadius: "6px",
          border: "1px solid #3A3A3A",
          width: "240px",
          textAlign: "left",
          pointerEvents: "none",
          zIndex: 1000,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.15s ease",
          whiteSpace: "normal",
          fontWeight: "normal",
        }}
      >
        {definition}
      </span>
    </span>
  );
}
