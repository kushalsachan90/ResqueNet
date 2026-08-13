import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../main";
import { deviceId } from "../utils/deviseId";
import type { SosContextType, GeoState, SubmitState, Coords, LogLine } from "../types";

const SosContext = createContext<SosContextType | undefined>(undefined);


function buildDispatchLog(hasCoords: boolean): LogLine[] {
  return [
    { text: "Connecting to Aegis Command…", tone: "pending" },
    {
      text: hasCoords ? "Location locked and attached to report." : "Location unavailable.",
      tone: hasCoords ? "ok" : "pending",
    },
    { text: "Distress signal broadcast to responder network.", tone: "ok" },
    { text: "Nearest available unit is being assigned…", tone: "pending" },
  ];
}

export const SosProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const getdeviceId = deviceId();

  // 1. Network State
  const [online, setOnline] = useState<boolean>(navigator.onLine);

  // 2. GeoLocation State (Default already 'requesting' hai)
  const [geoState, setGeoState] = useState<GeoState>("requesting");
  const [coords, setCoords] = useState<Coords | null>(null);

  // 3. Submit State
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [RetryAfter, setRetryAfter] = useState<number>(0);
  const [etaTimeLeft, setEtaTimeLeft] = useState<number | null>(null);
  // --- NETWORK TRACKER ---
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

  // --- GPS TRACKER (Cleaned up to avoid cascading renders) ---
  const startWatch = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoState("unsupported");
      return;
    }

    // Yahan se 'setGeoState("requesting")' hata diya hai kyunki default wahi hai
    const watchId = navigator.geolocation.watchPosition(
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

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Is effect ko delay se chalayenge ya function ko pass karenge taki direct setState na ho
  useEffect(() => {
    let stopWatch: (() => void) | undefined;

    // setTimeout ka use karte hain taaki ye synchronous render cycle ke baad chale
    const timer = setTimeout(() => {
      stopWatch = startWatch();
    }, 0);

    return () => {
      clearTimeout(timer);
      if (stopWatch) stopWatch();
    };
  }, [startWatch]);

  // --- SUBMIT SOS ---
  const submitSOS = async (description: string) => {
    console.log("SUBMIT SOS CALLED", description)
    setSubmitState("submitting");
    try {
      const payload = {
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        accuracy: coords?.accuracy ?? null,
        description: description.trim() || "No description provided.",
        timestamp: new Date().toISOString(),
      };

      const response = await axios.post(API_URL, payload, {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
          "X-Device-Id": getdeviceId
        }
      });

      // Data save karna localStorage mein
      const successData = {
        eta: response.data.etaMinutes ?? null,
        logLines: buildDispatchLog(Boolean(coords)),
        incidentTime: new Date().toISOString(),
      };
      localStorage.setItem("sos_broadcast_data", JSON.stringify(successData));
      console.log(response)
      if (response.data.etaMinutes) {
        setEtaTimeLeft(response.data.etaMinutes);
      }

      setSubmitState("sent");
      navigate("/sos-broadcasted"); // API success hote hi page change

    } catch (error: any) {
      console.log(error, "direrr")
      console.error(error)
      console.dir(error)
      setSubmitState("error");
      setErrorMessage(error.response?.data?.error || "Failed to broadcast");
      setRetryAfter(error.response?.data?.retryAfterSeconds || 60);
    }
  };

  return (
    <SosContext.Provider value={{
      online, geoState, coords, startWatch,
      submitState, errorMessage, RetryAfter, setSubmitState,
      submitSOS, etaTimeLeft
    }}>
      {children}
    </SosContext.Provider>
  );
};

// Custom Hook banaya use karne ke liye
export const useSosData = (): SosContextType => {
  const context = useContext(SosContext);
  if (!context) throw new Error("useSosData must be used within SosProvider");
  return context;
};