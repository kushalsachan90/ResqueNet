import { memo, useEffect, useRef } from "react";

type GeoState = "requesting" | "granted" | "denied" | "unsupported";

interface StatusBarProps {
  online: boolean;
  geoState: GeoState;
  geoLabel: string;
}

function StatusBar({ online, geoState, geoLabel }: StatusBarProps) {
  const prev = useRef({ online, geoState, geoLabel });

  useEffect(() => {
    if (prev.current.online !== online) {
      console.log("[StatusBar] online changed:", prev.current.online, "→", online);
    }
    if (prev.current.geoState !== geoState) {
      console.log("[StatusBar] geoState changed:", prev.current.geoState, "→", geoState);
    }
    if (prev.current.geoLabel !== geoLabel) {
      console.log("[StatusBar] geoLabel changed:", prev.current.geoLabel, "→", geoLabel);
    }
    prev.current = { online, geoState, geoLabel };
    console.log("[StatusBar] render committed");
  });

  const dotColor =
    geoState === "granted" ? "bg-signal-green" : geoState === "requesting" ? "bg-signal-amber" : "bg-alert";

  return (
    <div className="w-full max-w-sm flex items-center justify-between mb-8">
      <div className="flex items-center gap-2">
        <span className="font-display font-bold tracking-[0.2em] text-ink text-sm">AEGIS</span>
        <span className="font-mono text-[10px] text-ink-faint">/ VICTIM LINK</span>
      </div>
      <div className="flex items-center gap-3 font-mono text-[10px] tracking-widest">
        <span className="flex items-center gap-1.5 text-ink-faint">
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${geoState === "requesting" ? "animate-blink" : ""}`} />
          {geoLabel}
        </span>
        <span className={`flex items-center gap-1.5 ${online ? "text-signal-green" : "text-alert"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-signal-green" : "bg-alert"}`} />
          {online ? "ONLINE" : "OFFLINE"}
        </span>
      </div>
    </div>
  );
}

export default memo(StatusBar);