import { useState } from "react";

const G = {
  bg:"#080f08", bg2:"#101e10", bg3:"#182818",
  green:"#52c478", greenDark:"#266b3a", greenGlow:"#52c47844",
  text:"#edf5ed", textDim:"#90c890", textMuted:"#4a724a",
  border:"#1e341e", borderBright:"#2e4e2e",
  red:"#e85858",
};

const CSS = `
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:0.7;transform:scale(1.08)}}
  input:-webkit-autofill{-webkit-box-shadow:0 0 0 100px #182818 inset!important;-webkit-text-fill-color:#edf5ed!important;}
  input:focus{outline:none;}
`;

export default function LoginScreen({ onLogin }) {
  const [mode, setMode]         = useState("login"); // "login" | "signup"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const valid = email.includes("@") && password.length >= 6 && (mode === "login" || name.trim().length > 0);

  const handleSubmit = () => {
    if (!valid) {
      if (!email.includes("@")) return setError("Enter a valid email address.");
      if (password.length < 6)  return setError("Password must be at least 6 characters.");
      if (mode === "signup" && !name.trim()) return setError("Enter your name.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({ name: name || email.split("@")[0], email });
    }, 1200);
  };

  const Field = ({ label, value, onChange, type = "text", placeholder, right }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: G.textDim, marginBottom: 6, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ position: "relative" }}>
        <input
          value={value}
          onChange={e => { onChange(e.target.value); setError(""); }}
          type={type}
          placeholder={placeholder}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{
            width: "100%", background: G.bg3, border: `1.5px solid ${G.border}`,
            borderRadius: 14, padding: "14px 44px 14px 16px", fontSize: 15,
            color: G.text, fontFamily: "Georgia,serif",
            transition: "border-color 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = G.green}
          onBlur={e  => e.target.style.borderColor = G.border}
        />
        {right && (
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", cursor: "pointer" }} onClick={right.onClick}>
            <span style={{ fontSize: 16, opacity: 0.5 }}>{right.icon}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "Georgia,serif", background: G.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <style>{CSS}</style>

      {/* Background glow blobs */}
      <div style={{ position: "absolute", top: -80, left: -80, width: 280, height: 280, borderRadius: "50%", background: G.greenGlow, filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 100, right: -60, width: 200, height: 200, borderRadius: "50%", background: "#52c47822", filter: "blur(50px)", pointerEvents: "none" }} />

      {/* Top logo area */}
      <div style={{ padding: "72px 28px 32px", textAlign: "center", animation: "fadeUp 0.5s ease both" }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${G.green}, ${G.greenDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 18px", boxShadow: `0 0 0 8px ${G.greenGlow}, 0 12px 32px #00000044` }}>
          🌿
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: G.text, letterSpacing: -0.5, marginBottom: 4 }}>
          Garden<span style={{ fontStyle: "italic", fontWeight: 400 }}>&Deal</span>
        </div>
        <div style={{ fontSize: 13, color: G.textMuted }}>
          {mode === "login" ? "Welcome back" : "Create your garden"}
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ margin: "0 28px 24px", display: "flex", background: G.bg2, borderRadius: 14, padding: 3, border: `1px solid ${G.border}`, animation: "fadeUp 0.5s ease 0.05s both" }}>
        {[["login", "Sign In"], ["signup", "Sign Up"]].map(([key, label]) => (
          <div key={key} onClick={() => { setMode(key); setError(""); }} style={{ flex: 1, padding: "10px", borderRadius: 11, background: mode === key ? G.bg3 : "transparent", textAlign: "center", fontSize: 13, fontWeight: mode === key ? 800 : 400, color: mode === key ? G.text : G.textMuted, cursor: "pointer", transition: "all 0.2s" }}>
            {label}
          </div>
        ))}
      </div>

      {/* Form */}
      <div style={{ padding: "0 28px", flex: 1, animation: "fadeUp 0.5s ease 0.1s both" }}>
        {mode === "signup" && (
          <Field label="YOUR NAME" value={name} onChange={setName} placeholder="e.g. Lilly" />
        )}
        <Field label="EMAIL" value={email} onChange={setEmail} type="email" placeholder="you@example.com" />
        <Field
          label="PASSWORD"
          value={password}
          onChange={setPassword}
          type={showPass ? "text" : "password"}
          placeholder={mode === "signup" ? "At least 6 characters" : "Enter your password"}
          right={{ icon: showPass ? "🙈" : "👁️", onClick: () => setShowPass(v => !v) }}
        />

        {/* Error */}
        {error && (
          <div style={{ background: `${G.red}18`, border: `1px solid ${G.red}44`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: G.red }}>
            ⚠️ {error}
          </div>
        )}

        {/* Forgot password (login only) */}
        {mode === "login" && (
          <div style={{ textAlign: "right", marginBottom: 22, marginTop: -6 }}>
            <span style={{ fontSize: 12, color: G.textMuted, cursor: "pointer" }}>Forgot password?</span>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", padding: "16px", borderRadius: 16, border: "none", cursor: loading ? "default" : "pointer",
            background: valid ? `linear-gradient(135deg, ${G.green}, ${G.greenDark})` : G.bg3,
            color: valid ? "#fff" : G.textMuted,
            fontSize: 15, fontFamily: "Georgia,serif", fontWeight: 700,
            boxShadow: valid ? `0 8px 24px ${G.greenGlow}` : "none",
            transition: "all 0.3s",
            marginBottom: 16,
          }}
        >
          {loading
            ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ animation: "pulse 1s ease infinite", display: "inline-block" }}>🌱</span> {mode === "login" ? "Signing in…" : "Creating account…"}
              </span>
            : mode === "login" ? "Sign In →" : "Create Account →"
          }
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: G.border }} />
          <span style={{ fontSize: 11, color: G.textMuted }}>or</span>
          <div style={{ flex: 1, height: 1, background: G.border }} />
        </div>

        {/* Continue without account */}
        <button
          onClick={() => onLogin({ name: "Lilly", email: "" })}
          style={{ width: "100%", padding: "14px", borderRadius: 16, border: `1.5px solid ${G.border}`, background: "transparent", color: G.textDim, fontSize: 13, fontFamily: "Georgia,serif", cursor: "pointer" }}
        >
          Continue as guest
        </button>
      </div>

      {/* Bottom note */}
      <div style={{ padding: "24px 28px 40px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: G.textMuted, lineHeight: 1.8 }}>
          By continuing you agree to our{" "}
          <span style={{ color: G.textDim, textDecoration: "underline" }}>Terms</span> &{" "}
          <span style={{ color: G.textDim, textDecoration: "underline" }}>Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}
