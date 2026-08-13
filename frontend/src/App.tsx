import { Routes, Route, Navigate } from "react-router-dom";
import SosButtonContainer from "./components/SosButtonContainer.tsx";
import SosSuccess from "./components/sosSuccess.tsx";
import { useSosData } from "./context/SocketContext.tsx"
import type { GeoState, Coords } from "./types"; // <-- Yahan seedha import kiya

export default function App() {
  const { online, geoState, coords } = useSosData();

  const geoLabel: string = {
    requesting: "ACQUIRING GPS…",
    granted: "LOCATION LOCKED",
    denied: "LOCATION DENIED",
    unsupported: "LOCATION UNAVAILABLE",
  }[geoState as GeoState];

  return (
    <Routes>
      <Route path="/" element={<SosButtonContainer />} />
      <Route
        path="/sos-broadcasted"
        element={<SuccessScreenWrapper online={online} geoState={geoState as GeoState} geoLabel={geoLabel} coords={coords} />}
      />
    </Routes>
  );
}


interface SuccessScreenWrapperProps {
  online: boolean;
  geoState: GeoState;
  geoLabel: string;
  coords: Coords | null;
}


function SuccessScreenWrapper({ online, geoState, geoLabel, coords }: SuccessScreenWrapperProps) {
  const savedData = localStorage.getItem("sos_broadcast_data");
  if (!savedData) return <Navigate to="/" replace />;
  const parsedData = JSON.parse(savedData);
  console.log(parsedData)
  return (
    <SosSuccess
      online={online}
      geoState={geoState}
      geoLabel={geoLabel}
      incidentTime={new Date(parsedData.incidentTime)}
      eta={parsedData.eta}
      logLines={parsedData.logLines}
      coords={coords}
    />
  );
}