// types.ts
export type GeoState = "requesting" | "granted" | "denied" | "unsupported";
export type SubmitState = "idle" | "submitting" | "sent" | "error";
export type LogTone = "ok" | "pending";

export interface Coords {
  lat: number;
  lng: number;
  accuracy: number | null;
}

export interface LogLine {
  text: string;
  tone: LogTone;
}

export interface SosContextType {
  // Network & GPS
  online: boolean;
  geoState: GeoState;
  coords: Coords | null;
  startWatch: () => void;
  
  // Form & Submit State
  submitState: SubmitState;
  errorMessage: string;
  RetryAfter: number;
  setSubmitState: (state: SubmitState) => void;
  
  // Actions
  submitSOS: (description: string) => Promise<void>;
}