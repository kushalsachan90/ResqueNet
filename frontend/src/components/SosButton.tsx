import type { PointerEvent as ReactPointerEvent } from "react";
import StatusBar from "./statusbar";
import { useNavigate } from "react-router-dom";
const HOLD_DURATION_MS = 1400;

type GeoState = "requesting" | "granted" | "denied" | "unsupported";
type SubmitState = "idle" | "submitting" | "sent" | "error";

interface Coords {
  lat: number;
  lng: number;
  accuracy: number | null;
}

function formatCoord(value: number | undefined | null): string {
  return typeof value === "number" ? value.toFixed(5) : "—";
}

interface SosButtonProps {
  online: boolean;
  geoState: GeoState;
  geoLabel: string;
  submitState: SubmitState;
  holdProgress: number;
  startHold: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  cancelHold: () => void;
  description: string;
  setDescription: (value: string) => void;
  errorMessage: string;
  RetryAfter: number;
  submitSOS: () => void;
  startWatch: () => void;
  coords: Coords | null;
}

export default function SosButton({
  online,
  geoState,
  geoLabel,
  submitState,
  holdProgress,
  startHold,
  cancelHold,
  description,
  setDescription,
  errorMessage,
  RetryAfter,
  submitSOS,
  startWatch,
  coords,
}: SosButtonProps) {
  const navigate=useNavigate()
  return (
    <div className="min-h-screen bg-void flex flex-col items-center px-6 pt-10 pb-8 safe-area">
      <StatusBar online={online} geoState={geoState} geoLabel={geoLabel} />

      <div className="flex-1 w-full max-w-sm flex flex-col items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-56 h-56 flex items-center justify-center select-none">
            <span className="absolute inset-0 rounded-full animate-ring-pulse-1 border border-alert" />
            <span className="absolute inset-0 rounded-full animate-ring-pulse-2 border border-alert" />
            <span className="absolute inset-0 rounded-full animate-ring-pulse-3 border border-alert" />

            <button
              type="button"
              onPointerDown={startHold}
              onPointerUp={cancelHold}
              onPointerLeave={cancelHold}
              onPointerCancel={cancelHold}
              disabled={submitState === "submitting"}
              className="relative w-44 h-44 rounded-full bg-alert shadow-beacon animate-core-throb flex flex-col items-center justify-center text-void active:scale-[0.98] transition-transform touch-none disabled:opacity-80"
            >
              <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="rgba(11,14,17,0.35)"
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * (1 - holdProgress)}
                  strokeLinecap="round"
                />
              </svg>
              {submitState === "submitting" ? (
                <span className="font-mono text-sm tracking-widest">SENDING…</span>
              ) : (
                <>
                  <span className="font-display text-5xl font-bold tracking-wider leading-none">SOS</span>
                  <span className="font-mono text-[10px] tracking-widest mt-2 opacity-80">HOLD TO SEND</span>
                </>
              )}
            </button>
          </div>
          <p className="text-ink-faint text-xs text-center max-w-[15rem]">
            Press and hold the button for {(HOLD_DURATION_MS / 1000).toFixed(1).replace(".0", "")} seconds to broadcast your location and alert.
          </p>
        </div>

        <div className="w-full">
          <label htmlFor="emergency-description" className="font-mono text-xs uppercase tracking-widest text-ink-faint">
            Describe what's happening (optional)
          </label>
          <div className="relative">
            <textarea
              id="emergency-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="e.g. Water level rising rapidly, 3 people on roof"
              className="mt-2 w-full resize-none rounded-xl bg-void-raised border border-void-line px-4 py-3 text-ink placeholder:text-ink-faint text-sm focus:border-alert focus:outline-none pr-12"
            />
          </div>
        </div>

        {submitState === "error" && (
          <div className="w-full rounded-xl border border-alert/50 bg-alert-dim/30 px-4 py-3">
            <p className="text-sm text-ink">{errorMessage}<br /> Please try after {Math.ceil(RetryAfter / 60)}min</p>
            <button
              type="button"
              onClick={submitSOS}
              className="mt-2 font-mono text-xs tracking-widest uppercase text-alert-glow underline underline-offset-2"
            >
              Retry now
            </button>
          </div>
        )}

        {geoState === "denied" && (
          <div className="w-full rounded-xl border border-signal-amber/40 bg-void-raised px-4 py-3">
            <p className="text-sm text-ink-muted">
              Location access was denied. You can still send an SOS with your description — responders won't get your exact position.
            </p>
            <button
              type="button"
              onClick={startWatch}
              className="mt-2 font-mono text-xs tracking-widest uppercase text-signal-amber underline underline-offset-2"
            >
              Enable location
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-sm rounded-xl bg-void-raised border border-void-line px-4 py-3 font-mono text-[11px] text-ink-faint flex items-center justify-between">
        <span>
          LAT {formatCoord(coords?.lat)} · LON {formatCoord(coords?.lng)}
        </span>
        <span className={geoState === "granted" ? "text-signal-green" : "text-signal-amber"}>
          {coords?.accuracy ? `±${Math.round(coords.accuracy)}m` : "—"}
        </span>
      </div>
       <div className="w-full flex justify-center mt-4">
  <button 
    type="button" 
    onClick={()=>navigate("/sos-broadcasted")} 
    className="bg-alert text-void font-bold py-2 px-6 rounded-full shadow-lg "
  >
    Check Status
  </button>
</div>
    </div>
   
  );
}