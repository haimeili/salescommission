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
`;

const PLANT_BASE = {
  1:{ emoji:"🍅", name:"Tomatoes", color:"#e85858", bed:"My garden", photoStatus:"Growing",   photoEvidence:"Identified from your photo", photoConfidence:90, firstSeenDate:new Date(Date.now()-65*24*60*60*1000), userStatus:null },
  2:{ emoji:"🌿", name:"Basil",    color:"#52c478", bed:"My garden", photoStatus:"Thriving",  photoEvidence:"Identified from your photo", photoConfidence:92, firstSeenDate:new Date(Date.now()-32*24*60*60*1000), userStatus:null },
  3:{ emoji:"🥒", name:"Zucchini", color:"#5bbf5b", bed:"My garden", photoStatus:"Seedling",  photoEvidence:"Identified from your photo", photoConfidence:88, firstSeenDate:new Date(Date.now()-12*24*60*60*1000), userStatus:null },
  4:{ emoji:"🌶️", name:"Peppers",  color:"#e0924e", bed:"My garden", photoStatus:"Flowering", photoEvidence:"Identified from your photo", photoConfidence:89, firstSeenDate:new Date(Date.now()-48*24*60*60*1000), userStatus:null },
  5:{ emoji:"🥬", name:"Kale",     color:"#2d8a5f", bed:"My garden", photoStatus:"Ready",     photoEvidence:"Identified from your photo", photoConfidence:94, firstSeenDate:new Date(Date.now()-62*24*60*60*1000), userStatus:null },
};

// ── Photo grid: user taps their garden photos ────────────────────────────────
function PhotoGrid({ photos, onDone, onSkip }) {
  const [selected, setSelected] = useState(new Set());

  const toggle = (id) => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  return (
    <div style={{ fontFamily:"Georgia,serif",background:G.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",paddingBottom:110 }}>
      <style>{CSS}</style>

      <div style={{ padding:"52px 20px 14px" }}>
        <div style={{ fontSize:17,fontWeight:800,color:G.text,marginBottom:4 }}>Tap your garden photos</div>
        <div style={{ fontSize:12,color:G.textMuted }}>
          Select photos that show your plants · {photos.length} photos loaded
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3,padding:"0 3px" }}>
        {photos.slice(0,30).map(photo => {
          const sel = selected.has(photo.id);
          return (
            <div key={photo.id} onClick={() => toggle(photo.id)}
              style={{ position:"relative",aspectRatio:"1",overflow:"hidden",cursor:"pointer" }}>
              <img src={`${photo.baseUrl}=w200-h200`} alt=""
                style={{ width:"100%",height:"100%",objectFit:"cover",display:"block",
                  filter:sel?"none":"brightness(0.55)",transition:"filter 0.15s" }}
                onError={e => { e.target.style.display="none"; }} />
              {sel && (
                <div style={{ position:"absolute",top:6,right:6,width:22,height:22,
                  borderRadius:"50%",background:G.green,display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:13,color:"#fff",fontWeight:900,
                  boxShadow:`0 2px 8px ${G.greenGlow}` }}>✓</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
        width:"100%",maxWidth:430,padding:"14px 20px 32px",
        background:`linear-gradient(180deg,transparent 0%,${G.bg} 25%)` }}>
        <button onClick={() => onDone(photos.filter(p => selected.has(p.id)))}
          style={{ width:"100%",background:selected.size>0?`linear-gradient(135deg,${G.green},${G.greenDark})`:G.bg2,
            border:selected.size>0?"none":`1px solid ${G.border}`,borderRadius:14,padding:"15px",
            color:selected.size>0?"#fff":G.textMuted,fontSize:15,fontFamily:"Georgia,serif",
            fontWeight:700,cursor:"pointer",marginBottom:10,
            boxShadow:selected.size>0?`0 8px 24px ${G.greenGlow}`:"none",transition:"all 0.2s" }}>
          {selected.size > 0 ? `Use ${selected.size} photo${selected.size!==1?"s":""} →` : "Select photos above"}
        </button>
        <button onClick={onSkip}
          style={{ width:"100%",background:"transparent",border:"none",color:G.textMuted,
            fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer",padding:"6px" }}>
          Skip — use default images
        </button>
      </div>
    </div>
  );
}

// ── Per-photo plant picker ───────────────────────────────────────────────────
function PlantPicker({ photo, idx, total, onPick, onSkip }) {
  return (
    <div style={{ animation:"fadeUp 0.3s ease both" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
        <div style={{ fontSize:13,color:G.textMuted }}>Photo {idx+1} of {total}</div>
        <div style={{ display:"flex",gap:5 }}>
          {Array.from({length:total}).map((_,i) => (
            <div key={i} style={{ width:20,height:3,borderRadius:2,
              background:i<idx?G.green:i===idx?G.greenDark:G.bg3 }} />
          ))}
        </div>
      </div>
      <div style={{ width:"100%",aspectRatio:"4/3",borderRadius:18,overflow:"hidden",marginBottom:16,position:"relative" }}>
        <img src={`${photo.baseUrl}=w600-h450`} alt="garden"
          style={{ width:"100%",height:"100%",objectFit:"cover" }} />
        <div style={{ position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 55%,#080f08ee)" }} />
        <div style={{ position:"absolute",bottom:12,left:14,fontSize:11,color:"#fff",opacity:0.6 }}>
          {photo.mediaMetadata?.creationTime?.slice(0,10) || ""}
        </div>
      </div>
      <div style={{ fontSize:13,color:G.textMuted,marginBottom:12,textAlign:"center" }}>
        What plant is this?
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:10 }}>
        {Object.entries(PLANT_BASE).map(([id, p]) => (
          <button key={id} onClick={() => onPick(Number(id))}
            style={{ background:G.bg3,border:`1.5px solid ${p.color}44`,borderRadius:14,
              padding:"12px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ fontSize:22 }}>{p.emoji}</span>
            <span style={{ fontSize:13,fontWeight:700,color:G.text,fontFamily:"Georgia,serif" }}>{p.name}</span>
          </button>
        ))}
      </div>
      <button onClick={onSkip}
        style={{ width:"100%",padding:"11px",borderRadius:12,border:`1px solid ${G.border}`,
          background:"transparent",color:G.textMuted,fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer" }}>
        Not a plant photo — skip
      </button>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AutoScanScreen({ user, onDone, onSkip }) {
  const [phase, setPhase]         = useState("fetching");
  const [progress, setProgress]   = useState(0);
  const [statusMsg, setStatusMsg] = useState("Connecting to Google Photos…");
  const [photos, setPhotos]       = useState([]);
  const [gridPhotos, setGridPhotos] = useState([]);
  const [detected, setDetected]   = useState(new Map());
  const [assignQueue, setAssignQueue] = useState([]); // photos chosen in grid, awaiting plant type
  const [assignIdx, setAssignIdx]    = useState(0);
  const [confirmed, setConfirmed] = useState([]);
  const aborted      = useRef(false);
  const latestFound  = useRef(new Map());

  const VISION_KEY = import.meta.env.VITE_GOOGLE_VISION_KEY || "";

  useEffect(() => {
    aborted.current = false;
    runScan();
    return () => { aborted.current = true; };
  }, []);

  async function runScan() {
    try {
      setStatusMsg("Connecting to Google Photos…");
      setProgress(5);

      const fetched = await fetchGardenPhotos(user.accessToken, 2);
      if (aborted.current) return;

      setPhotos(fetched);
      setGridPhotos(fetched.slice(0, 9));
      setProgress(20);

      if (fetched.length === 0) {
        setStatusMsg("No photos found in the last 2 years.");
        setPhase("confirming");
        return;
      }

      if (VISION_KEY) {
        // Vision API: auto-identify plants
        setPhase("scanning");
        const found = new Map();
        const msgs  = ["Scanning your photos…","Identifying plants…","Reading garden…","Almost done…"];

        for (let i = 0; i < fetched.length; i++) {
          if (aborted.current) return;
          setProgress(Math.round(20 + (i / fetched.length) * 70));
          setStatusMsg(msgs[Math.min(Math.floor((i / fetched.length) * msgs.length), msgs.length-1)]);
          setGridPhotos(fetched.slice(Math.max(0, i-8), i+1).reverse());

          try {
            const vision  = await detectPlantsInPhoto(fetched[i].baseUrl, VISION_KEY);
            const plantId = matchPlantFromLabels(vision);
            if (plantId && !found.has(plantId)) {
              const conf = Math.round((vision.labelAnnotations?.[0]?.score || 0.88) * 100);
              const plant = { ...PLANT_BASE[plantId], id:plantId,
                thumb:`${fetched[i].baseUrl}=w400-h400`, photoConfidence:conf };
              found.set(plantId, plant);
              latestFound.current = new Map(found);
              setDetected(new Map(found));
            }
          } catch { /* skip single errors */ }
        }

        setProgress(100);
        setStatusMsg(`Found ${found.size} plant${found.size!==1?"s":""}!`);
        setConfirmed([...found.keys()]);
        setDetected(new Map(found));
        setPhase("confirming");

      } else {
        // No Vision key: show photo grid for user to pick garden photos
        setProgress(100);
        setStatusMsg(`Loaded ${fetched.length} photos`);
        setPhase("grid");
      }

    } catch (err) {
      if (!aborted.current) {
        setStatusMsg(err.message || String(err));
        setPhase("error");
      }
    }
  }

  // ── Photo grid done: user selected photos to classify ──────────────────────
  const handleGridDone = (selected) => {
    if (selected.length === 0) { onSkip(); return; }
    setAssignQueue(selected);
    setAssignIdx(0);
    setDetected(new Map());
    setPhase("assign");
  };

  // ── Plant picker: user tagged a photo ─────────────────────────────────────
  const handleAssignPick = (plantId) => {
    const photo = assignQueue[assignIdx];
    setDetected(prev => {
      const next = new Map(prev);
      if (!next.has(plantId)) {
        next.set(plantId, { ...PLANT_BASE[plantId], id:plantId,
          thumb:`${photo.baseUrl}=w400-h400` });
      }
      return next;
    });
    advanceAssign();
  };

  const advanceAssign = () => {
    const next = assignIdx + 1;
    if (next >= assignQueue.length) {
      setDetected(prev => {
        const results = [...prev.values()];
        setConfirmed(results.map(p => p.id));
        return prev;
      });
      setPhase("confirming");
    } else {
      setAssignIdx(next);
    }
  };

  // ── Skip during scanning → go to confirming with what we have ─────────────
  const skipToConfirm = () => {
    aborted.current = true;
    const cur = latestFound.current;
    setDetected(cur);
    setConfirmed([...cur.keys()]);
    setProgress(100);
    setPhase("confirming");
  };

  // ── Fetching / scanning screen ─────────────────────────────────────────────
  if (phase === "fetching" || phase === "scanning") return (
    <div style={{ fontFamily:"Georgia,serif",background:G.bg,minHeight:"100vh",maxWidth:430,
      margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",padding:"40px 24px",position:"relative" }}>
      <style>{CSS}</style>

      {/* Version stamp — top left for debugging */}
      <div style={{ position:"absolute",top:52,left:20,fontSize:10,color:G.textMuted,opacity:0.5 }}>
        v4 · Jun 4
      </div>

      <button onClick={skipToConfirm}
        style={{ position:"absolute",top:52,right:20,background:"transparent",
          border:`1px solid ${G.border}`,borderRadius:20,padding:"6px 14px",
          color:G.textMuted,fontSize:12,fontFamily:"Georgia,serif",cursor:"pointer" }}>Skip</button>

      <div style={{ width:200,height:200,borderRadius:24,overflow:"hidden",background:G.bg2,
        border:`1.5px solid ${G.borderBright}`,boxShadow:`0 0 48px ${G.greenGlow}`,
        marginBottom:26,position:"relative",display:"grid",
        gridTemplateColumns:"repeat(3,1fr)",gap:3,padding:3 }}>
        {Array.from({length:9}).map((_,i) => {
          const ph = gridPhotos[i];
          return ph
            ? <div key={i} style={{ borderRadius:5,overflow:"hidden",background:G.bg3 }}>
                <img src={`${ph.baseUrl}=w80-h80`} alt=""
                  style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }} />
              </div>
            : <div key={i} style={{ borderRadius:5,background:G.bg3,display:"flex",
                alignItems:"center",justifyContent:"center",fontSize:18,opacity:0.15 }}>🌿</div>;
        })}
        <div style={{ position:"absolute",left:0,right:0,height:2,
          background:`linear-gradient(90deg,transparent,${G.green},transparent)`,
          animation:"scanLine 1.8s ease-in-out infinite",boxShadow:`0 0 10px ${G.green}` }} />
      </div>

      <div style={{ fontSize:19,fontWeight:800,color:G.text,marginBottom:6 }}>
        Loading your photos…
      </div>
      <div style={{ fontSize:13,color:G.green,marginBottom:6,textAlign:"center",minHeight:20 }}>
        {statusMsg}
      </div>
      <div style={{ fontSize:12,color:G.textMuted,marginBottom:4 }}>
        {photos.length > 0 ? `✓ ${photos.length} photos loaded` : "Requesting access…"}
      </div>
      <div style={{ fontSize:11,color:G.textMuted,marginBottom:20,opacity:0.6 }}>
        Signed in as {user?.email}
      </div>

      <div style={{ width:"100%",height:6,background:G.bg3,borderRadius:3,overflow:"hidden",marginBottom:6 }}>
        <div style={{ height:"100%",width:`${progress}%`,
          background:`linear-gradient(90deg,${G.greenDark},${G.green})`,
          borderRadius:3,transition:"width 0.4s" }} />
      </div>
      <div style={{ fontSize:12,color:G.textMuted,marginBottom:20 }}>{progress}%</div>

      {detected.size > 0 && (
        <div style={{ width:"100%",animation:"fadeUp 0.3s ease both" }}>
          <div style={{ fontSize:10,color:G.textMuted,letterSpacing:2,textTransform:"uppercase",marginBottom:10 }}>
            Detected so far
          </div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
            {[...detected.values()].map(p => (
              <div key={p.id} style={{ background:G.bg2,border:`1px solid ${p.color}44`,
                borderRadius:24,padding:"5px 12px",display:"flex",alignItems:"center",gap:6 }}>
                {p.thumb
                  ? <img src={p.thumb} alt="" style={{ width:22,height:22,borderRadius:6,objectFit:"cover" }} />
                  : <span style={{ fontSize:14 }}>{p.emoji}</span>}
                <span style={{ fontSize:12,color:G.text,fontWeight:700 }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── Photo grid screen ──────────────────────────────────────────────────────
  if (phase === "grid") return (
    <PhotoGrid photos={photos} onDone={handleGridDone} onSkip={onSkip} />
  );

  // ── Plant-type assign screen ───────────────────────────────────────────────
  if (phase === "assign") return (
    <div style={{ fontFamily:"Georgia,serif",background:G.bg,minHeight:"100vh",
      maxWidth:430,margin:"0 auto",padding:"52px 22px 40px" }}>
      <style>{CSS}</style>
      <PlantPicker
        photo={assignQueue[assignIdx]}
        idx={assignIdx}
        total={assignQueue.length}
        onPick={handleAssignPick}
        onSkip={advanceAssign}
      />
    </div>
  );

  // ── Error screen ───────────────────────────────────────────────────────────
  if (phase === "error") return (
    <div style={{ fontFamily:"Georgia,serif",background:G.bg,minHeight:"100vh",
      maxWidth:430,margin:"0 auto",padding:"60px 24px" }}>
      <style>{CSS}</style>
      <div style={{ textAlign:"center",marginBottom:20 }}>
        <div style={{ fontSize:44,marginBottom:14 }}>⚠️</div>
        <div style={{ fontSize:17,fontWeight:800,color:G.text,marginBottom:8 }}>
          Can't access Google Photos
        </div>
        <div style={{ fontSize:13,color:G.orange,marginBottom:16,lineHeight:1.5,
          background:`${G.orange}11`,borderRadius:12,padding:"12px 14px" }}>
          {statusMsg}
        </div>
        <div style={{ fontSize:12,color:G.textMuted,lineHeight:1.8,background:G.bg2,
          borderRadius:12,padding:"14px 16px",textAlign:"left" }}>
          <strong style={{ color:G.text,display:"block",marginBottom:6 }}>
            To enable photo scanning:
          </strong>
          1. Go to <strong style={{ color:G.green }}>console.cloud.google.com</strong><br/>
          2. APIs &amp; Services → Library<br/>
          3. Search <strong>"Photos Library API"</strong> → Enable<br/>
          4. Then sign in again
        </div>
      </div>
      <button onClick={onSkip}
        style={{ width:"100%",background:`linear-gradient(135deg,${G.green},${G.greenDark})`,
          border:"none",borderRadius:14,padding:"14px",color:"#fff",fontSize:14,
          fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",marginTop:8 }}>
        Enter garden with default images →
      </button>
    </div>
  );

  // ── Confirm screen ─────────────────────────────────────────────────────────
  const detectedList = [...detected.values()];
  return (
    <div style={{ fontFamily:"Georgia,serif",background:G.bg,minHeight:"100vh",
      maxWidth:430,margin:"0 auto",padding:"52px 22px 40px" }}>
      <style>{CSS}</style>

      <div style={{ textAlign:"center",marginBottom:22 }}>
        <div style={{ width:60,height:60,borderRadius:"50%",
          background:`linear-gradient(135deg,${G.green},${G.greenDark})`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,
          margin:"0 auto 14px",boxShadow:`0 0 24px ${G.greenGlow}` }}>✓</div>
        <div style={{ fontSize:20,fontWeight:800,color:G.text }}>
          {detectedList.length > 0 ? `${detectedList.length} plant${detectedList.length!==1?"s":""} from your photos!` : "No plants identified"}
        </div>
        <div style={{ fontSize:12,color:G.textMuted,marginTop:4 }}>
          {detectedList.length > 0 ? "Tap to deselect anything that's wrong" : "You can add plants manually in the garden"}
        </div>
      </div>

      {detectedList.map((p, i) => (
        <div key={p.id}
          onClick={() => setConfirmed(s => s.includes(p.id) ? s.filter(x=>x!==p.id) : [...s,p.id])}
          style={{ display:"flex",alignItems:"center",gap:12,
            background:confirmed.includes(p.id)?G.bg3:G.bg2,borderRadius:16,
            padding:"12px 14px",marginBottom:10,
            border:`1.5px solid ${confirmed.includes(p.id)?p.color+"55":G.border}`,
            cursor:"pointer",transition:"all 0.2s",
            animation:`fadeUp 0.4s ease ${i*0.07}s both` }}>
          <div style={{ width:56,height:56,borderRadius:14,overflow:"hidden",flexShrink:0,
            border:`2.5px solid ${confirmed.includes(p.id)?p.color:G.border}`,background:G.bg3 }}>
            {p.thumb
              ? <img src={p.thumb} alt={p.name}
                  style={{ width:"100%",height:"100%",objectFit:"cover" }}
                  onError={e => { e.target.style.display="none"; }} />
              : <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:26 }}>{p.emoji}</div>}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14,fontWeight:800,color:G.text }}>{p.emoji} {p.name}</div>
            <div style={{ fontSize:11,color:G.textMuted,marginTop:2 }}>Your photo · tap to deselect</div>
          </div>
          <div style={{ width:24,height:24,borderRadius:"50%",
            background:confirmed.includes(p.id)?G.green:G.bg3,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:12,color:"#fff" }}>
            {confirmed.includes(p.id)?"✓":""}
          </div>
        </div>
      ))}

      <button
        onClick={() => onDone(detectedList.filter(p => confirmed.includes(p.id)))}
        style={{ width:"100%",background:`linear-gradient(135deg,${G.green},${G.greenDark})`,
          border:"none",borderRadius:16,padding:"16px",color:"#fff",fontSize:15,
          fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",
          boxShadow:`0 8px 24px ${G.greenGlow}`,marginTop:8 }}>
        {confirmed.length > 0 ? `Add ${confirmed.length} plant${confirmed.length!==1?"s":""} to my garden →` : "Enter garden →"}
      </button>
      <button onClick={onSkip}
        style={{ width:"100%",background:"transparent",border:"none",color:G.textMuted,
          fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer",padding:"12px 8px",marginTop:4 }}>
        Skip for now
      </button>
    </div>
  );
}
