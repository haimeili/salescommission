import { useState } from "react";
import LoginScreen from "./LoginScreen";
import EchoGardenDeal from "./EchoGardenDeal";

export default function App() {
  const [user, setUser] = useState(null);

  if (!user) return <LoginScreen onLogin={setUser} />;
  return <EchoGardenDeal user={user} onLogout={() => setUser(null)} />;
}
