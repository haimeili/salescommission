import { useState, useEffect, useRef } from "react";
import { fetchGardenPhotos, detectPlantsInPhoto, matchPlantFromLabels } from "./googlePhotos.js";

const G = {
  bg:"#080f08", bg2:"#101e10", bg3:"#182818",
  green:"#52c478", greenDark:"#266b3a", greenGlow:"#52c47844",
  text:"#edf5ed", textDim:"#90c890", textMuted:"#4a724a",
  border:"#1e341e", borderBright:"#2e4e2e",
  orange:"#e0924e", red:"#e85858",
};

const CSS = `
  *{box-sizing:border-box;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes scanLine{0%,100%{top:4%;opacity:1}50%{top:92%;opacity:0.5}}
  @keyframes pulse{0%,100%{opacity:0.6}50%{opacity:1}}
`;

const PLANT_BASE = {
  1:{ emoji:"🍅", name:"Tomatoes", color:"#e85858", bed:"Detected from photos", photoStatus:"Growing",  photoEvidence:"Identified in your garden photos", photoConfidence:90, firstSeenDate:new Date(Date.now()-65*24*60*60*1000), userStatus:null },
  2:{ emoji:"🌿", name:"Basil",    color:"#52c478", bed:"Detected from photos", photoStatus:"Thriving", photoEvidence:"Identified in your garden photos", photoConfidence:92, firstSeenDate:new Date(Date.now()-32*24*60*60*1000), userStatus:null },
  3:{ emoji:"🥒", name:"Zucchini", color:"#5bbf5b", bed:"Detected from photos", photoStatus:"Seedling", photoEvidence:"Identified in your garden photos", photoConfidence:88, firstSeenDate:new Date(Date.now()-12*24*60*60*1000), userStatus:null },
  4:{ emoji:"🌶️", name:"Peppers",  color:"#e0924e", bed:"Detected from photos", photoStatus:"Flowering",photoEvidence:"Identified in your garden photos", photoConfidence:89, firstSeenDate:new Date(Date.now()-48*24*60*60*1000), userStatus:null },
  5:{ emoji:"🥬", name:"Kale",     color:"#2d8a5f", bed:"Detected from photos", photoStatus:"Ready",    photoEvidence:"Identified in your garden photos", photoConfidence:94, firstSeenDate:new Date(Date.now()-62*24*60*60*1000), userStatus:null },
};

// Manual plant selector — shown per-photo when no Vision key
function PlantPicker({ photo, onPick, onSkip }) {
  return (
    <div style={{ animation:"fadeUp 0.3s ease both" }}>
      <div style={{ width:"100%",aspectRatio:"4/3",borderRadius:18,overflow:"hidden",marginBottom:16,position:"relative" }}>
        <img src={`${photo.baseUrl}=w600-h450`} alt="garden" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
        <div style={{ position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 50%,#080f08ee)" }} />
        <div style={{ position:"absolute",bottom:12,left:14,fontSize:12,color:"#fff",opacity:0.7 }}>
          {photo.mediaMetadata?.creationTime?.slice(0,10) || ""}
        </div>
      </div>
      <div style={{ fontSize:13,color:G.textMuted,marginBottom:12,textAlign:"center" }}>
        What plant is in this photo?
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:10 }}>
        {Object.entries(PLANT_BASE).map(([id, p]) => (
          <button key={id} onClick={() => onPick(Number(id))}
            style={{ background:G.bg3,border:`1.5px solid ${p.color}44`,borderRadius:14,padding:"12px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ fontSize:22 }}>{p.emoji}</span>
            <span style={{ fontSize:13,fontWeight:700,color:G.text,fontFamily:"Georgia,serif" }}>{p.name}</span>
          </button>
        ))}
      </div>
      <button onClick={onSkip}
        style={{ width:"100%",padding:"11px",borderRadius:12,border:`1px solid ${G.border}`,background:"transparent",color:G.textMuted,fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer" }}>
        Not a garden photo — skip
      </button>
    </div>
  );
}

export default function AutoScanScreen({ user, onDone, onSkip }) {
  const [phase, setPhase]       = useState("fetching"); // fetching|scanning|manual|confirming|done|error
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("Connecting to Google Photos…");
  const [photos, setPhotos]     = useState([]);
  const [gridPhotos, setGridPhotos] = useState([]); // real thumbnails for grid
  const [detected, setDetected] = useState(new Map()); // plantId → plant object
  const [manualQueue, setManualQueue] = useState([]); // photos awaiting manual ID
  const [manualIdx, setManualIdx]     = useState(0);
  const [confirmed, setConfirmed]     = useState([]);
  const aborted = useRef(false);

  const VISION_KEY = import.meta.env.VITE_GOOGLE_VISION_KEY || "";

  useEffect(() => {
    aborted.current = false;
    runScan();
    return () => { aborted.current = true; };
  }, []);

  async function runScan() {
    try {
      // ── Phase 1: fetch photos ─────────────────────────────────────────────
      setStatusMsg("Connecting to Google Photos…");
      setProgress(5);

      const fetched = await fetchGardenPhotos(user.accessToken, 2);
      if (aborted.current) return;

      setPhotos(fetched);
      setGridPhotos(fetched.slice(0, 9));
      setProgress(20);

      if (fetched.length === 0) {
        setStatusMsg("No garden photos found in the last 2 years.");
        setPhase("confirming");
        return;
      }

      // ── Phase 2a: Vision API auto-detection ───────────────────────────────
      if (VISION_KEY) {
        setPhase("scanning");
        const found = new Map();
        const msgs  = [
          "Scanning garden photos…",
          "Identifying plants & vegetables…",
          "Reading growth stages…",
          "Checking the last 2 years…",
          "Almost done…",
        ];

        for (let i = 0; i < fetched.length; i++) {
          if (aborted.current) return;
          const pct = Math.round(20 + (i / fetched.length) * 70);
          setProgress(pct);
          setStatusMsg(msgs[Math.min(Math.floor((i / fetched.length) * msgs.length), msgs.length - 1)]);
          // Keep grid showing real photos
          setGridPhotos(fetched.slice(Math.max(0, i - 8), i + 1).reverse());

          try {
            const vision  = await detectPlantsInPhoto(fetched[i].baseUrl, VISION_KEY);
            const plantId = matchPlantFromLabels(vision);
            if (plantId && !found.has(plantId)) {
              const conf = Math.round((vision.labelAnnotations?.[0]?.score || 0.88) * 100);
              found.set(plantId, {
                ...PLANT_BASE[plantId],
                id:               plantId,
                // Use real Google Photo as the card thumbnail
                thumb:            `${fetched[i].baseUrl}=w400-h400`,
                photoConfidence:  conf,
              });
              setDetected(new Map(found));
            }
          } catch { /* skip single-photo errors */ }
        }

        setProgress(100);
        setStatusMsg(`Found ${found.size} plant${found.size !== 1 ? "s" : ""}!`);
        const results = [...found.values()];
        setConfirmed(results.map(p => p.id));
        setDetected(new Map(found));
        setPhase("confirming");

      // ── Phase 2b: No Vision key — manual identification ───────────────────
      } else {
        setPhase("manual");
        setManualQueue(fetched.slice(0, 20)); // limit to 20 for manual flow
        setManualIdx(0);
      }

    } catch (err) {
      if (!aborted.current) {
        setStatusMsg(err.message);
        setPhase("error");
      }
    }
  }

  // Manual pick handler
  const handleManualPick = (plantId) => {
    const photo = manualQueue[manualIdx];
    setDetected(prev => {
      const next = new Map(prev);
      if (!next.has(plantId)) {
        next.set(plantId, {
          ...PLANT_BASE[plantId],
          id:    plantId,
          thumb: `${photo.baseUrl}=w400-h400`,
        });
      }
      return next;
    });
    advanceManual();
  };

  const advanceManual = () => {
    const nextIdx = manualIdx + 1;
    if (nextIdx >= manualQueue.length) {
      const results = [...detected.values()];
      setConfirmed(results.map(p => p.id));
      setPhase("confirming");
    } else {
      setManualIdx(nextIdx);
    }
  };

  // ── Scanning / Fetching screen ──────────────────────────────────────────
  if (phase === "fetching" || phase === "scanning") return (
    <div style={{ fontFamily:"Georgia,serif",background:G.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",position:"relative" }}>
      <style>{CSS}</style>
      <button onClick={onSkip} style={{ position:"absolute",top:52,right:20,background:"transparent",border:`1px solid ${G.border}`,borderRadius:20,padding:"6px 14px",color:G.textMuted,fontSize:12,fontFamily:"Georgia,serif",cursor:"pointer" }}>Skip</button>

      {/* Real photo grid */}
      <div style={{ width:200,height:200,borderRadius:24,overflow:"hidden",background:G.bg2,border:`1.5px solid ${G.borderBright}`,boxShadow:`0 0 48px ${G.greenGlow}`,marginBottom:26,position:"relative",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3,padding:3 }}>
        {Array.from({length:9}).map((_,i) => {
          const ph = gridPhotos[i];
          return ph
            ? <div key={i} style={{ borderRadius:5,overflow:"hidden",background:G.bg3 }}>
                <img src={`${ph.baseUrl}=w80-h80`} alt="" style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }} />
              </div>
            : <div key={i} style={{ borderRadius:5,background:G.bg3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,opacity:0.15 }}>🌿</div>;
        })}
        <div style={{ position:"absolute",left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${G.green},transparent)`,animation:"scanLine 1.8s ease-in-out infinite",boxShadow:`0 0 10px ${G.green}` }} />
      </div>

      <div style={{ fontSize:19,fontWeight:800,color:G.text,marginBottom:6 }}>
        Scanning your photos…
      </div>
      <div style={{ fontSize:13,color:G.green,marginBottom:6,textAlign:"center",minHeight:20 }}>{statusMsg}</div>
      <div style={{ fontSize:11,color:G.textMuted,marginBottom:20 }}>Last 2 years · {photos.length} photos</div>

      {/* Progress bar */}
      <div style={{ width:"100%",height:6,background:G.bg3,borderRadius:3,overflow:"hidden",marginBottom:6 }}>
        <div style={{ height:"100%",width:`${progress}%`,background:`linear-gradient(90deg,${G.greenDark},${G.green})`,borderRadius:3,transition:"width 0.4s" }} />
      </div>
      <div style={{ fontSize:12,color:G.textMuted,marginBottom:20 }}>{progress}%</div>

      {/* Detected so far */}
      {detected.size > 0 && (
        <div style={{ width:"100%",animation:"fadeUp 0.3s ease both" }}>
          <div style={{ fontSize:10,color:G.textMuted,letterSpacing:2,textTransform:"uppercase",marginBottom:10 }}>Detected so far</div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
            {[...detected.values()].map(p => (
              <div key={p.id} style={{ background:G.bg2,border:`1px solid ${p.color}44`,borderRadius:24,padding:"5px 12px",display:"flex",alignItems:"center",gap:6 }}>
                {p.thumb
                  ? <img src={p.thumb} alt={p.emoji} style={{ width:22,height:22,borderRadius:6,objectFit:"cover" }} />
                  : <span style={{ fontSize:14 }}>{p.emoji}</span>
                }
                <span style={{ fontSize:12,color:G.text,fontWeight:700 }}>{p.name}</span>
                <span style={{ fontSize:10,color:G.green }}>{p.photoConfidence}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── Manual identification screen ─────────────────────────────────────────
  if (phase === "manual") return (
    <div style={{ fontFamily:"Georgia,serif",background:G.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",padding:"52px 22px 40px" }}>
      <style>{CSS}</style>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
        <div style={{ fontSize:15,fontWeight:800,color:G.text }}>
          📸 Photo {manualIdx + 1} of {manualQueue.length}
        </div>
        <button onClick={onSkip} style={{ background:"transparent",border:`1px solid ${G.border}`,borderRadius:20,padding:"5px 12px",color:G.textMuted,fontSize:12,fontFamily:"Georgia,serif",cursor:"pointer" }}>Skip all</button>
      </div>
      {/* Progress dots */}
      <div style={{ display:"flex",gap:4,marginBottom:16 }}>
        {manualQueue.map((_,i) => (
          <div key={i} style={{ flex:1,height:3,borderRadius:2,background:i < manualIdx ? G.green : i === manualIdx ? G.greenDark : G.bg3 }} />
        ))}
      </div>
      <PlantPicker photo={manualQueue[manualIdx]} onPick={handleManualPick} onSkip={advanceManual} />
    </div>
  );

  // ── Error screen ─────────────────────────────────────────────────────────
  if (phase === "error") return (
    <div style={{ fontFamily:"Georgia,serif",background:G.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",padding:"60px 24px" }}>
      <style>{CSS}</style>
      <div style={{ textAlign:"center",marginBottom:24 }}>
        <div style={{ fontSize:44,marginBottom:14 }}>⚠️</div>
        <div style={{ fontSize:17,fontWeight:800,color:G.text,marginBottom:8 }}>Scan couldn't complete</div>
        <div style={{ fontSize:13,color:G.textMuted,lineHeight:1.8 }}>{statusMsg}</div>
      </div>
      <button onClick={onSkip} style={{ width:"100%",background:`linear-gradient(135deg,${G.green},${G.greenDark})`,border:"none",borderRadius:14,padding:"14px",color:"#fff",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer" }}>
        Enter garden anyway →
      </button>
    </div>
  );

  // ── Confirm screen ───────────────────────────────────────────────────────
  const detectedList = [...detected.values()];
  return (
    <div style={{ fontFamily:"Georgia,serif",background:G.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",padding:"52px 22px 40px" }}>
      <style>{CSS}</style>

      <div style={{ textAlign:"center",marginBottom:22 }}>
        <div style={{ width:60,height:60,borderRadius:"50%",background:`linear-gradient(135deg,${G.green},${G.greenDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 14px",boxShadow:`0 0 24px ${G.greenGlow}` }}>✓</div>
        <div style={{ fontSize:20,fontWeight:800,color:G.text }}>
          {detectedList.length > 0 ? `${detectedList.length} plants found in your photos!` : "No plants detected"}
        </div>
        <div style={{ fontSize:12,color:G.textMuted,marginTop:4 }}>
          {detectedList.length > 0 ? "Tap to deselect anything that's not right" : "You can add plants manually from the garden tab"}
        </div>
      </div>

      {detectedList.map((p, i) => (
        <div key={p.id} onClick={() => setConfirmed(s => s.includes(p.id) ? s.filter(x => x !== p.id) : [...s, p.id])}
          style={{ display:"flex",alignItems:"center",gap:12,background:confirmed.includes(p.id)?G.bg3:G.bg2,borderRadius:16,padding:"12px 14px",marginBottom:10,border:`1.5px solid ${confirmed.includes(p.id)?p.color+"55":G.border}`,cursor:"pointer",transition:"all 0.2s",animation:`fadeUp 0.4s ease ${i*0.07}s both` }}>
          {/* Real photo thumbnail */}
          <div style={{ width:56,height:56,borderRadius:14,overflow:"hidden",flexShrink:0,border:`2.5px solid ${confirmed.includes(p.id)?p.color:G.border}`,background:G.bg3 }}>
            {p.thumb
              ? <img src={p.thumb} alt={p.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} onError={e => e.target.style.display="none"} />
              : <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26 }}>{p.emoji}</div>
            }
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14,fontWeight:800,color:G.text }}>{p.emoji} {p.name}</div>
            <div style={{ fontSize:11,color:G.textMuted,marginTop:2 }}>Detected from your photos</div>
          </div>
          <div style={{ textAlign:"right",flexShrink:0 }}>
            <div style={{ background:`${G.green}22`,color:G.green,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,marginBottom:6 }}>{p.photoConfidence}%</div>
            <div style={{ width:22,height:22,borderRadius:"50%",background:confirmed.includes(p.id)?G.green:G.bg3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",margin:"0 0 0 auto" }}>{confirmed.includes(p.id)?"✓":""}</div>
          </div>
        </div>
      ))}

      <button
        onClick={() => onDone(detectedList.filter(p => confirmed.includes(p.id)))}
        style={{ width:"100%",background:`linear-gradient(135deg,${G.green},${G.greenDark})`,border:"none",borderRadius:16,padding:"16px",color:"#fff",fontSize:15,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",boxShadow:`0 8px 24px ${G.greenGlow}`,marginTop:8 }}>
        {confirmed.length > 0 ? `Add ${confirmed.length} plants to my garden →` : "Enter garden →"}
      </button>
      <button onClick={onSkip}
        style={{ width:"100%",background:"transparent",border:"none",color:G.textMuted,fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer",padding:"12px 8px",marginTop:4 }}>
        Skip for now
      </button>
    </div>
  );
}
