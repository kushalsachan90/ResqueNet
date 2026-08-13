import { useState, useRef, useCallback } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import SosButton from "./SosButton"; 
import { useSosData } from "../context/SocketContext"
import type { GeoState } from "../types";

const HOLD_DURATION_MS = 1400;

export default function SosButtonContainer() {
  const {
    online,
    geoState,
    coords,
    startWatch,
    submitState,
    errorMessage,
    RetryAfter,
    submitSOS,
  } = useSosData();

  const [description, setDescription] = useState<string>("");
  const [holdProgress, setHoldProgress] = useState<number>(0);

  const holdRaf = useRef<number | null>(null);
  const holdStart = useRef<number | null>(null);
  const holding = useRef<boolean>(false);

  const cancelHold = useCallback(() => {
    holding.current = false;
    if (holdRaf.current) cancelAnimationFrame(holdRaf.current);
    setHoldProgress(0);
  }, []);

  // YAHAN CHANGE HUA HAI: Arrow function ki jagah 'function loop' likha hai
  const tickHold = useCallback(
    function loop(timestamp: number) {
      if (!holding.current) return;
      if (holdStart.current === null) holdStart.current = timestamp;
      const elapsed = timestamp - holdStart.current;
      const progress = Math.min(elapsed / HOLD_DURATION_MS, 1);
      
      setHoldProgress(progress);

      if (progress >= 1) {
        holding.current = false;
        submitSOS(description);
        return;
      }
      // Ab ye 'loop' ko call karega, 'tickHold' ko nahi
      holdRaf.current = requestAnimationFrame(loop); 
    },
    [submitSOS, description]
  );

  const startHold = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (submitState === "submitting" || submitState === "sent") return;
      holding.current = true;
      holdStart.current = null;
      holdRaf.current = requestAnimationFrame(tickHold);
    },
    [submitState, tickHold]
  );

  const geoLabel: string = {
    requesting: "ACQUIRING GPS…",
    granted: "LOCATION LOCKED",
    denied: "LOCATION DENIED",
    unsupported: "LOCATION UNAVAILABLE",
  }[geoState as GeoState];

  return (
    <SosButton
      online={online}
      geoState={geoState}
      geoLabel={geoLabel}
      submitState={submitState}
      holdProgress={holdProgress}
      startHold={startHold}
      cancelHold={cancelHold}
      description={description}
      setDescription={setDescription}
      errorMessage={errorMessage}
      RetryAfter={RetryAfter}
      submitSOS={() => submitSOS(description)} 
      startWatch={startWatch}
      coords={coords}
    />
  );
}