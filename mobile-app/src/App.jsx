import { useState } from "react";
import LoginScreen from "./LoginScreen";
import AutoScanScreen from "./AutoScanScreen";
import EchoGardenDeal from "./EchoGardenDeal";

export default function App() {
  const [user, setUser]       = useState(null);
  const [plants, setPlants]   = useState(null);
  const [scanning, setScanning] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.provider === "google" && userData.accessToken) {
      setScanning(true);
    }
  };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  if (scanning) return (
    <AutoScanScreen
      user={user}
      onDone={(detectedPlants) => { setPlants(detectedPlants); setScanning(false); }}
      onSkip={() => setScanning(false)}
    />
  );

  return (
    <EchoGardenDeal
      user={user}
      initialPlants={plants}
      onLogout={() => { setUser(null); setPlants(null); setScanning(false); }}
    />
  );
}
