import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import axios from "axios";
import StatusBar from "./components/statusbar";
import { API_URL } from "./main.tsx";
import {deviceId} from "./utils/deviseId.tsx"

const HOLD_DURATION_MS = 1400;

type GeoState = "requesting" | "granted" | "denied" | "unsupported";
type SubmitState = "idle" | "submitting" | "sent" | "error";
type LogTone = "ok" | "pending";

interface Coords {
  lat: number;
  lng: number;
  accuracy: number | null;
}

interface LogLine {
  text: string;
  tone: LogTone;
}

interface IncidentResponse {
  etaMinutes?: number | null;
}

function buildDispatchLog(hasCoords: boolean): LogLine[] {
  return [
    { text: "Connecting to Aegis Command…", tone: "pending" },
    {
      text: hasCoords ? "Location locked and attached to report." : "Location unavailable — description sent alone.",
      tone: hasCoords ? "ok" : "pending",
    },
    { text: "Distress signal broadcast to responder network.", tone: "ok" },
    { text: "Nearest available unit is being assigned…", tone: "pending" },
  ];
}

function formatCoord(value: number | undefined | null): string {
  return typeof value === "number" ? value.toFixed(5) : "—";
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString([], { hour12: false });
}

export default function App() {
  // ---- Geolocation -------------------------------------------------
  const [geoState, setGeoState] = useState<GeoState>("requesting");
  const [coords, setCoords] = useState<Coords | null>(null);
  const watchIdRef = useRef<number | null>(null);
   const getdeviceId=deviceId()
  // ---- Voice input (speech-to-text) --------------------------------




  const startWatch = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoState("unsupported");
      return;
    }
    setGeoState("requesting");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGeoState("granted");
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        setGeoState(err.code === err.PERMISSION_DENIED ? "denied" : "unsupported");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }, []);

  useEffect(() => {
    startWatch();
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [startWatch]);

  // ---- Network / connection indicator -------------------------------
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // ---- Form state -----------------------------------------------------
  const [description, setDescription] = useState<string>("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [eta, setEta] = useState<number | null>(null);
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [incidentTime, setIncidentTime] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [RetryAfter,setRetryAfter]=useState(0);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const holdRaf = useRef<number | null>(null);
  const holdStart = useRef<number | null>(null);
  const holding = useRef<boolean>(false);

  const cancelHold = useCallback(() => {
    holding.current = false;
    if (holdRaf.current) cancelAnimationFrame(holdRaf.current);
    setHoldProgress(0);
  }, []);

  // ---- Speech Recognition Setup ----------------------------------------
  

  const submitSOS = useCallback(async () => {
    setSubmitState("submitting");
    setIncidentTime(new Date());
    try {
      const payload = {
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        accuracy: coords?.accuracy ?? null,
        description: description.trim() || "No description provided.",
        timestamp: new Date().toISOString(),
      };
      const response = await axios.post<IncidentResponse>(API_URL, payload, {
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
      "X-Device-Id": getdeviceId
    }
});
console.log(response,"data")

      setSubmitState("sent");
      setLogLines(buildDispatchLog(Boolean(coords)));
      setEta(response.data.etaMinutes ?? null);
    } catch (error:any){
      console.log(error)
      console.log(error.response?.data)
        console.dir(error, { depth: null });

      setSubmitState("error");
      setErrorMessage(error.response?.data.error)
      setRetryAfter(error.response?.data.retryAfterSeconds)
    }
  }, [coords, description]);

  // ---- FIX: Declaring tickHold FIRST so startHold can safely reference it ----
  const tickHold = useCallback(
    (timestamp: number) => {
      if (!holding.current) return;
      if (holdStart.current === null) holdStart.current = timestamp;
      const elapsed = timestamp - holdStart.current;
      const progress = Math.min(elapsed / HOLD_DURATION_MS, 1);
      setHoldProgress(progress);
      if (progress >= 1) {
        holding.current = false;
        submitSOS();
        return;
      }
      holdRaf.current = requestAnimationFrame(tickHold);
    },
    [submitSOS]
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

  useEffect(() => {
    if (submitState !== "sent") return;
    const timers = logLines.map((_, i) => setTimeout(() => {}, i * 500));
    if (eta === null) {
      const t = setTimeout(() => setEta(7 + Math.round(Math.random() * 5)), 2600);
      timers.push(t);
    }
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitState]);

  const geoLabel: string = {
    requesting: "ACQUIRING GPS…",
    granted: "LOCATION LOCKED",
    denied: "LOCATION DENIED",
    unsupported: "LOCATION UNAVAILABLE",
  }[geoState];

  // ---- Status screen (after submit) ------------------------------------
  if (submitState === "sent") {
    return (
      <div className="min-h-screen bg-void flex flex-col items-center px-6 pt-10 pb-8 safe-area">
        <StatusBar online={online} geoState={geoState} geoLabel={geoLabel} />

        <div className="flex-1 w-full max-w-sm flex flex-col items-center justify-center text-center gap-6">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full animate-ring-pulse-1 border border-signal-green" />
            <span className="absolute inset-0 rounded-full animate-ring-pulse-2 border border-signal-green" />
            <div className="relative w-28 h-28 rounded-full bg-void-raised border border-signal-green/60 shadow-beacon-calm flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-12 h-12 text-signal-green" fill="none">
                <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div>
            <h1 className="font-display text-2xl font-semibold tracking-wide text-ink">SOS BROADCASTED</h1>
            <p className="mt-1 text-ink-muted text-sm">
              Nearest rescue unit notified{incidentTime ? ` at ${formatClock(incidentTime)}` : ""}.
            </p>
          </div>

          <div className="w-full rounded-xl bg-void-raised border border-void-line px-5 py-4">
            <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">Estimated arrival</p>
            <p className="font-mono text-3xl mt-1">
              {eta ? (
                <span className="text-signal-amber">{eta} min</span>
              ) : (
                <span className="text-signal-amber">
                  calculating<span className="animate-blink">…</span>
                </span>
              )}
            </p>
          </div>

          <div className="w-full rounded-xl bg-void-raised border border-void-line px-5 py-4 text-left">
            <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mb-2">Dispatch log</p>
            <ul className="space-y-1.5">
              {logLines.map((line, i) => (
                <li key={i} className="font-mono text-xs flex items-start gap-2">
                  <span className={line.tone === "ok" ? "text-signal-green" : "text-signal-amber"}>
                    {line.tone === "ok" ? "✓" : "›"}
                  </span>
                  <span className="text-ink-muted">{line.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {coords && (
            <p className="font-mono text-[11px] text-ink-faint">
              REPORTED AT {formatCoord(coords.lat)}, {formatCoord(coords.lng)}
            </p>
          )}
        </div>

        <p className="text-ink-faint text-xs text-center max-w-xs">
          Stay where rescuers can find you if it's safe to do so. Keep this page open.
        </p>
      </div>
    );
  }

  // ---- Main SOS screen --------------------------------------------------
  return (
    <div className="min-h-screen bg-void flex flex-col items-center px-6 pt-10 pb-8 safe-area">
      <StatusBar online={online} geoState={geoState} geoLabel={geoLabel} />

      <div className="flex-1 w-full max-w-sm flex flex-col items-center justify-center gap-8">
        {/* SOS button */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-56 h-56 flex items-center justify-center select-none">
            <span className="absolute inset-0 rounded-full animate-ring-pulse-1 border border-alert" />
            <span className="absolute inset-0 rounded-full animate-ring-pulse-2 border border-alert" />
            <span className="absolute inset-0 rounded-full animate-ring-pulse-3 border border-alert" />

            <button
              type="button"
              aria-label="Hold to send SOS emergency alert"
              onPointerDown={startHold}
              onPointerUp={cancelHold}
              onPointerLeave={cancelHold}
              onPointerCancel={cancelHold}
              disabled={submitState === "submitting"}
              className="relative w-44 h-44 rounded-full bg-alert shadow-beacon animate-core-throb
                         flex flex-col items-center justify-center text-void
                         active:scale-[0.98] transition-transform touch-none
                         disabled:opacity-80"
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

        {/* Description input */}
        <div className="w-full">
          <label htmlFor="emergency-description" className="font-mono text-xs uppercase tracking-widest text-ink-faint">
            Describe what's happening (optional)
          </label>

          <div className="relative">
            <textarea
              id="emergency-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                // keep manual typing in sync with voice
              }}
              rows={3}
              placeholder="e.g. Water level rising rapidly, 3 people on roof"
              className="mt-2 w-full resize-none rounded-xl bg-void-raised border border-void-line
                         px-4 py-3 text-ink placeholder:text-ink-faint text-sm
                         focus:border-alert focus:outline-none pr-12"
            />
           
          </div>
        </div>

        {submitState === "error" && (
          <div className="w-full rounded-xl border border-alert/50 bg-alert-dim/30 px-4 py-3">
            <p className="text-sm text-ink">{errorMessage}<br></br> Please try after {Math.ceil(RetryAfter/60)}min</p>
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

      {/* Live GPS readout */}
      <div className="w-full max-w-sm rounded-xl bg-void-raised border border-void-line px-4 py-3 font-mono text-[11px] text-ink-faint flex items-center justify-between">
        <span>
          LAT {formatCoord(coords?.lat)} · LON {formatCoord(coords?.lng)}
        </span>
        <span className={geoState === "granted" ? "text-signal-green" : "text-signal-amber"}>
          {coords?.accuracy ? `±${Math.round(coords.accuracy)}m` : "—"}
        </span>
      </div>
    </div>
  );
}