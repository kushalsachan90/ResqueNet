import StatusBar from "./statusbar";
import { useNavigate } from "react-router-dom";
type GeoState = "requesting" | "granted" | "denied" | "unsupported";
type LogTone = "ok" | "pending";
import { Timer } from "./Timer";
interface LogLine {
  text: string;
  tone: LogTone;
}

interface Coords {
  lat: number;
  lng: number;
  accuracy: number | null;
}

function formatCoord(value: number | undefined | null): string {
  return typeof value === "number" ? value.toFixed(5) : "—";
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString([], { hour12: false });
}

interface SosSuccessProps {
  online: boolean;
  geoState: GeoState;
  geoLabel: string;
  incidentTime: Date | null;
  eta: number | null;
  logLines: LogLine[];
  coords: Coords | null;
}

export default function SosSuccess({
  online,
  geoState,
  geoLabel,
  incidentTime,
  eta,
  logLines,
  coords,
}: SosSuccessProps) {
  const navigate = useNavigate();
  const CalculateTime = async () => {
    try {

    } catch (error) {
      console.log(error);
    }

  }

  return (

    <div className="min-h-screen bg-void flex flex-col items-center px-6 pt-10 pb-8 safe-area relative">
      <button className="absolute top-0 left-2 border rounded-2xl p-2" onClick={() => navigate("/")}>Back</button>
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
            {eta !== null ? (
              <span className="text-signal-amber"><Timer /></span>
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