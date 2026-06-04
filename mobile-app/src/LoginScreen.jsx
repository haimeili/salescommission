import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";

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
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  input:-webkit-autofill{-webkit-box-shadow:0 0 0 100px #182818 inset!important;-webkit-text-fill-color:#edf5ed!important;}
  input:focus{outline:none;}
`;

const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID || '';
const APPLE_REDIRECT   = import.meta.env.VITE_APPLE_REDIRECT_URI
  || window.location.origin + window.location.pathname;

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink:0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 814 1000" style={{ flexShrink:0 }}>
    <path fill="currentColor" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.4C46 376.1 0 248.7 0 128.3 0 57.2 25.9 29.8 37.4 18.2 48.3 7.2 73.5 0 97.2 0c27.1 0 65.8 19.4 97.8 37.8 30.5 17.6 65.8 43.5 86.4 43.5 18.7 0 57.4-25.9 102.1-43.5C421.7 22.5 459.5 0 492.4 0c22.7 0 63.4 5.1 100.3 27.6 38.6 23.2 79.4 65.1 83.4 66.7z"/>
  </svg>
);

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ animation:"spin 0.8s linear infinite", flexShrink:0 }}>
      <circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
    </svg>
  );
}

function Field({ label, value, onChange, type="text", placeholder, right }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:700, color:G.textDim, marginBottom:6, letterSpacing:0.5 }}>{label}</div>
      <div style={{ position:"relative" }}>
        <input
          value={value} onChange={e=>onChange(e.target.value)} type={type} placeholder={placeholder}
          style={{ width:"100%", background:G.bg3, border:`1.5px solid ${G.border}`, borderRadius:13, padding:`14px ${right?"44px":"16px"} 14px 16px`, fontSize:15, color:G.text, fontFamily:"Georgia,serif", transition:"border-color 0.2s" }}
          onFocus={e=>e.target.style.borderColor=G.green}
          onBlur={e=>e.target.style.borderColor=G.border}
        />
        {right && (
          <div onClick={right.onClick} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", cursor:"pointer", fontSize:16, opacity:0.5 }}>{right.icon}</div>
        )}
      </div>
    </div>
  );
}

// Decode a JWT payload without verification (client-side only, for display)
function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
  } catch { return {}; }
}

export default function LoginScreen({ onLogin }) {
  const [mode, setMode]         = useState("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(null); // "google"|"apple"|"email"|null

  const emailValid = email.includes("@") && password.length >= 6 && (mode === "login" || name.trim().length > 0);

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const googleLogin = useGoogleLogin({
    flow: "implicit",
    scope: "https://www.googleapis.com/auth/photoslibrary.readonly",
    prompt: "consent",
    onSuccess: async (tokenResponse) => {
      try {
        const res  = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const info = await res.json();
        onLogin({
          name:        info.name || info.email.split("@")[0],
          email:       info.email,
          avatar:      info.picture,
          provider:    "google",
          accessToken: tokenResponse.access_token,
        });
      } catch {
        setError("Google sign-in succeeded but profile fetch failed. Try again.");
        setLoading(null);
      }
    },
    onError: (err) => {
      setError(err.error === "popup_closed_by_user" ? "Sign-in cancelled." : "Google sign-in failed. Try again.");
      setLoading(null);
    },
  });

  // ── Apple Sign In ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!APPLE_CLIENT_ID || !window.AppleID) return;
    window.AppleID.auth.init({
      clientId:    APPLE_CLIENT_ID,
      scope:       "name email",
      redirectURI: APPLE_REDIRECT,
      usePopup:    true,
    });

    const handleAppleResponse = (e) => {
      const { authorization, user } = e.detail;
      const payload = decodeJwt(authorization.id_token);
      onLogin({
        name:     user ? `${user.name?.firstName || ""} ${user.name?.lastName || ""}`.trim() : payload.email?.split("@")[0] || "Apple User",
        email:    payload.email || "",
        provider: "apple",
      });
    };
    const handleAppleError = (e) => {
      if (e.detail?.error !== "popup_closed_by_user") {
        setError("Apple sign-in failed. Try again.");
      }
      setLoading(null);
    };

    document.addEventListener("AppleIDSignInOnSuccess", handleAppleResponse);
    document.addEventListener("AppleIDSignInOnFailure", handleAppleError);
    return () => {
      document.removeEventListener("AppleIDSignInOnSuccess", handleAppleResponse);
      document.removeEventListener("AppleIDSignInOnFailure", handleAppleError);
    };
  }, []);

  const handleGoogle = () => {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      setError("Google Client ID not configured. See setup instructions.");
      return;
    }
    setError("");
    setLoading("google");
    googleLogin();
  };

  const handleApple = async () => {
    if (!APPLE_CLIENT_ID) {
      setError("Apple Client ID not configured. See setup instructions.");
      return;
    }
    if (!window.AppleID) {
      setError("Apple SDK not loaded. Please refresh and try again.");
      return;
    }
    setError("");
    setLoading("apple");
    try {
      await window.AppleID.auth.signIn();
      // result handled via event listener above
    } catch (err) {
      if (err.error !== "popup_closed_by_user") {
        setError("Apple sign-in failed. Try again.");
      }
      setLoading(null);
    }
  };

  // ── Email ─────────────────────────────────────────────────────────────────
  const handleEmail = () => {
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 6)  return setError("Password must be at least 6 characters.");
    if (mode === "signup" && !name.trim()) return setError("Enter your name.");
    setError("");
    setLoading("email");
    // In production: call your auth API here
    setTimeout(() => onLogin({ name: name || email.split("@")[0], email, provider:"email" }), 1000);
  };

  return (
    <div style={{ fontFamily:"Georgia,serif", background:G.bg, minHeight:"100vh", maxWidth:430, margin:"0 auto", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden" }}>
      <style>{CSS}</style>

      {/* Background glows */}
      <div style={{ position:"absolute", top:-80, left:-80, width:280, height:280, borderRadius:"50%", background:G.greenGlow, filter:"blur(60px)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:80, right:-60, width:200, height:200, borderRadius:"50%", background:"#52c47820", filter:"blur(50px)", pointerEvents:"none" }} />

      {/* Logo */}
      <div style={{ padding:"68px 28px 28px", textAlign:"center", animation:"fadeUp 0.5s ease both" }}>
        <div style={{ width:72, height:72, borderRadius:22, background:`linear-gradient(135deg,${G.green},${G.greenDark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:34, margin:"0 auto 16px", boxShadow:`0 0 0 8px ${G.greenGlow},0 12px 32px #00000044` }}>🌿</div>
        <div style={{ fontSize:26, fontWeight:800, color:G.text, letterSpacing:-0.5, marginBottom:4 }}>
          Garden<span style={{ fontStyle:"italic", fontWeight:400 }}>&Deal</span>
        </div>
        <div style={{ fontSize:13, color:G.textMuted }}>
          {mode === "login" ? "Welcome back" : "Create your garden"}
        </div>
      </div>

      <div style={{ padding:"0 24px", flex:1 }}>

        {/* Social buttons */}
        <div style={{ display:"flex", flexDirection:"column", gap:11, marginBottom:20, animation:"fadeUp 0.5s ease 0.05s both" }}>
          <button
            onClick={handleGoogle}
            disabled={!!loading}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, width:"100%", padding:"14px 16px", borderRadius:14, border:"1.5px solid #dadce0", background:"#fff", cursor:loading?"default":"pointer", opacity:loading&&loading!=="google"?0.45:1, transition:"all 0.2s", boxShadow:"0 1px 6px #0000001a" }}
          >
            {loading==="google" ? <Spinner /> : <GoogleIcon />}
            <span style={{ fontSize:14, fontWeight:700, color:"#3c4043", fontFamily:"Georgia,serif" }}>
              {loading==="google" ? "Signing in…" : mode==="login" ? "Continue with Google" : "Sign up with Google"}
            </span>
          </button>

          <button
            onClick={handleApple}
            disabled={!!loading}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, width:"100%", padding:"14px 16px", borderRadius:14, border:"1.5px solid #333", background:"#000", cursor:loading?"default":"pointer", opacity:loading&&loading!=="apple"?0.45:1, transition:"all 0.2s" }}
          >
            {loading==="apple" ? <Spinner /> : <AppleIcon />}
            <span style={{ fontSize:14, fontWeight:700, color:"#fff", fontFamily:"Georgia,serif" }}>
              {loading==="apple" ? "Signing in…" : mode==="login" ? "Continue with Apple" : "Sign up with Apple"}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, animation:"fadeUp 0.5s ease 0.1s both" }}>
          <div style={{ flex:1, height:1, background:G.border }} />
          <span style={{ fontSize:11, color:G.textMuted }}>or continue with email</span>
          <div style={{ flex:1, height:1, background:G.border }} />
        </div>

        {/* Mode toggle */}
        <div style={{ display:"flex", background:G.bg2, borderRadius:13, padding:3, marginBottom:18, border:`1px solid ${G.border}`, animation:"fadeUp 0.5s ease 0.12s both" }}>
          {[["login","Sign In"],["signup","Sign Up"]].map(([key,label])=>(
            <div key={key} onClick={()=>{setMode(key);setError("");}} style={{ flex:1, padding:"9px", borderRadius:10, background:mode===key?G.bg3:"transparent", textAlign:"center", fontSize:13, fontWeight:mode===key?800:400, color:mode===key?G.text:G.textMuted, cursor:"pointer", transition:"all 0.2s" }}>{label}</div>
          ))}
        </div>

        {/* Fields */}
        <div style={{ animation:"fadeUp 0.5s ease 0.15s both" }}>
          {mode === "signup" && <Field label="YOUR NAME" value={name} onChange={v=>{setName(v);setError("");}} placeholder="e.g. Lilly" />}
          <Field label="EMAIL" value={email} onChange={v=>{setEmail(v);setError("");}} type="email" placeholder="you@example.com" />
          <Field
            label="PASSWORD" value={password} onChange={v=>{setPassword(v);setError("");}}
            type={showPass?"text":"password"}
            placeholder={mode==="signup"?"At least 6 characters":"Enter your password"}
            right={{ icon:showPass?"🙈":"👁️", onClick:()=>setShowPass(v=>!v) }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:`${G.red}18`, border:`1px solid ${G.red}44`, borderRadius:12, padding:"10px 14px", marginBottom:14, fontSize:12, color:G.red }}>
            ⚠️ {error}
          </div>
        )}

        {mode==="login" && (
          <div style={{ textAlign:"right", marginBottom:18, marginTop:-6 }}>
            <span style={{ fontSize:12, color:G.textMuted, cursor:"pointer" }}>Forgot password?</span>
          </div>
        )}

        <button
          onClick={handleEmail}
          disabled={!!loading}
          style={{ width:"100%", padding:"15px", borderRadius:15, border:"none", cursor:loading?"default":"pointer", background:emailValid?`linear-gradient(135deg,${G.green},${G.greenDark})`:G.bg3, color:emailValid?"#fff":G.textMuted, fontSize:14, fontFamily:"Georgia,serif", fontWeight:700, boxShadow:emailValid?`0 8px 24px ${G.greenGlow}`:"none", transition:"all 0.3s", marginBottom:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:loading&&loading!=="email"?0.45:1 }}
        >
          {loading==="email" ? <><Spinner />{mode==="login"?"Signing in…":"Creating account…"}</> : mode==="login"?"Sign In →":"Create Account →"}
        </button>

        <button
          onClick={()=>!loading&&onLogin({ name:"Guest", email:"", provider:"guest" })}
          style={{ width:"100%", padding:"13px", borderRadius:14, border:`1.5px solid ${G.border}`, background:"transparent", color:G.textMuted, fontSize:13, fontFamily:"Georgia,serif", cursor:"pointer", marginBottom:8 }}
        >
          Continue as guest
        </button>
      </div>

      {/* Terms */}
      <div style={{ padding:"16px 28px 36px", textAlign:"center" }}>
        <div style={{ fontSize:11, color:G.textMuted, lineHeight:1.8 }}>
          By continuing you agree to our{" "}
          <span style={{ color:G.textDim, textDecoration:"underline" }}>Terms</span> &{" "}
          <span style={{ color:G.textDim, textDecoration:"underline" }}>Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}
