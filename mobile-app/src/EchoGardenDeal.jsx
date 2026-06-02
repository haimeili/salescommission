import { useState, useEffect } from "react";

const G = {
  bg:"#080f08", bg2:"#101e10", bg3:"#182818",
  green:"#52c478", greenDark:"#266b3a", greenGlow:"#52c47844",
  text:"#edf5ed", textDim:"#90c890", textMuted:"#4a724a",
  border:"#1e341e", borderBright:"#2e4e2e",
  orange:"#e0924e", orangeSoft:"#e0924e22",
  red:"#e85858", redSoft:"#e8585822",
  blue:"#5484d4", purple:"#9b6dd4",
  glass:"rgba(255,255,255,0.04)", glassBorder:"rgba(255,255,255,0.08)",
};

// ─────────────────────────────────────────────
// HARVEST KNOWLEDGE — days to harvest per plant
// ─────────────────────────────────────────────
const HARVEST_KNOWLEDGE = {
  1:{ daysToHarvest:75, name:"Tomatoes" },
  2:{ daysToHarvest:28, name:"Basil"    },
  3:{ daysToHarvest:55, name:"Zucchini" },
  4:{ daysToHarvest:80, name:"Peppers"  },
  5:{ daysToHarvest:60, name:"Kale"     },
};

const STATUS_CONFIG = {
  "Seedling": { color:"#5484d4", icon:"🌱", cookReady:false, bar:15 },
  "Growing":  { color:G.orange,  icon:"🌿", cookReady:false, bar:45 },
  "Flowering":{ color:G.purple,  icon:"🌸", cookReady:false, bar:62 },
  "Thriving": { color:G.green,   icon:"✨", cookReady:true,  bar:82 },
  "Ready":    { color:G.green,   icon:"🌾", cookReady:true,  bar:100},
};
const ALL_STATUSES = ["Seedling","Growing","Flowering","Thriving","Ready"];

function getTimePrediction(plant) {
  const k = HARVEST_KNOWLEDGE[plant.id]; if(!k) return null;
  const days = Math.floor((Date.now() - plant.firstSeenDate)/(24*60*60*1000));
  const rem  = Math.max(k.daysToHarvest - days, 0);
  const pct  = Math.min(days/k.daysToHarvest, 1);
  let s = pct<0.25?"Seedling":pct<0.5?"Growing":pct<0.7?"Flowering":pct<0.9?"Thriving":"Ready";
  return { timeStatus:s, daysSince:days, daysRemaining:rem, pct, daysToHarvest:k.daysToHarvest };
}

function getFinalStatus(plant) {
  if(plant.userStatus) return { status:plant.userStatus, source:"user" };
  const t = getTimePrediction(plant);
  if(plant.photoStatus===t?.timeStatus) return { status:plant.photoStatus, source:"both" };
  return { status:plant.photoStatus, source:"photo" };
}

// ─────────────────────────────────────────────
// PLANT DATA — with both prediction signals
// ─────────────────────────────────────────────
const INITIAL_PLANTS = [
  { id:1, emoji:"🍅", name:"Tomatoes",  confidence:97, bed:"Backyard left",  color:"#e85858", photoDate:"3 days ago",  thumb:"https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=200&h=200&fit=crop", photoStatus:"Growing",   photoEvidence:"Green fruit visible — not yet ripe",              photoConfidence:88, firstSeenDate:new Date(Date.now()-65*24*60*60*1000), userStatus:null },
  { id:2, emoji:"🌿", name:"Basil",     confidence:94, bed:"Backyard left",  color:"#52c478", photoDate:"3 days ago",  thumb:"https://images.unsplash.com/photo-1618436917352-cd3d11ea4f53?w=200&h=200&fit=crop", photoStatus:"Thriving",  photoEvidence:"Large bushy leaves, deep green, no flowering yet",  photoConfidence:94, firstSeenDate:new Date(Date.now()-32*24*60*60*1000), userStatus:null },
  { id:3, emoji:"🥒", name:"Zucchini",  confidence:89, bed:"Side garden",    color:"#5bbf5b", photoDate:"1 week ago",  thumb:"https://images.unsplash.com/photo-1623227866882-c005c26dfe41?w=200&h=200&fit=crop", photoStatus:"Seedling",  photoEvidence:"Small seedling, just sprouted — no fruit yet",      photoConfidence:92, firstSeenDate:new Date(Date.now()-12*24*60*60*1000), userStatus:null },
  { id:4, emoji:"🌶️", name:"Peppers",   confidence:91, bed:"Backyard right", color:"#e0924e", photoDate:"5 days ago",  thumb:"https://images.unsplash.com/photo-1597916829826-02e5bb4a54e0?w=200&h=200&fit=crop", photoStatus:"Flowering", photoEvidence:"White flowers visible — fruit not yet formed",       photoConfidence:91, firstSeenDate:new Date(Date.now()-48*24*60*60*1000), userStatus:null },
  { id:5, emoji:"🥬", name:"Kale",      confidence:96, bed:"Front planter",  color:"#2d8a5f", photoDate:"2 weeks ago", thumb:"https://images.unsplash.com/photo-1576021182211-9ea8dced3690?w=200&h=200&fit=crop", photoStatus:"Ready",     photoEvidence:"Large outer leaves ready to pick — full size",      photoConfidence:96, firstSeenDate:new Date(Date.now()-62*24*60*60*1000), userStatus:null },
];

// ─────────────────────────────────────────────
// DEALS — 3 logical types
// cook    → plant is READY → buy ingredients to cook with it
// nurture → plant is GROWING → buy soil/tools to help it
// grow    → you DON'T have it → buy seeds to add it
// ─────────────────────────────────────────────
const ALL_DEALS = [
  // 🍅 Tomatoes cook (only shown when Ready/Thriving)
  { id:1,  plantId:1, storeId:1, type:"cook",    emoji:"🧀", name:"Fresh Mozzarella",       price:"$3.99",  orig:"$6.99",  off:"43%", why:"Make caprese with your harvest",  expires:"Sun", color:"#c8813a" },
  { id:2,  plantId:1, storeId:1, type:"cook",    emoji:"🍝", name:"Pasta",                  price:"$2.29",  orig:"$3.29",  off:"30%", why:"Pasta night with your tomatoes",   expires:"Thu", color:"#e85858" },
  { id:3,  plantId:1, storeId:2, type:"cook",    emoji:"🫒", name:"Extra Virgin Olive Oil", price:"$7.99",  orig:"$11.99", off:"33%", why:"Dress your tomato salad",           expires:"Sat", color:"#7a9e3a" },
  // 🌿 Basil cook
  { id:4,  plantId:2, storeId:1, type:"cook",    emoji:"🧀", name:"Parmesan Block",         price:"$5.49",  orig:"$7.99",  off:"28%", why:"Make pesto with your basil",        expires:"Sat", color:"#c8813a" },
  { id:5,  plantId:2, storeId:1, type:"cook",    emoji:"🫒", name:"Pine Nuts",              price:"$4.99",  orig:"$6.99",  off:"29%", why:"Classic basil pesto",               expires:"Sun", color:"#7a9e3a" },
  // 🥬 Kale cook
  { id:6,  plantId:5, storeId:2, type:"cook",    emoji:"🥗", name:"Caesar Dressing",        price:"$3.49",  orig:"$4.49",  off:"22%", why:"Kale Caesar with your harvest",     expires:"Wed", color:"#52c478" },
  { id:7,  plantId:5, storeId:1, type:"cook",    emoji:"🫘", name:"Cannellini Beans",       price:"$1.29",  orig:"$1.99",  off:"18%", why:"Kale & bean soup this week",        expires:"Sat", color:"#2d8a5f" },
  // 🍅 Tomatoes nurture
  { id:8,  plantId:1, storeId:3, type:"nurture", emoji:"🌱", name:"Tomato Fertilizer",      price:"$8.99",  orig:"$12.99", off:"31%", why:"Boosts fruit size & flavour",       expires:"Mon", color:"#e85858" },
  { id:9,  plantId:1, storeId:3, type:"nurture", emoji:"🥢", name:"Tomato Support Stakes",  price:"$4.99",  orig:"$7.99",  off:"38%", why:"Keep vines upright as they grow",  expires:"Mon", color:"#e85858" },
  // 🥒 Zucchini nurture
  { id:10, plantId:3, storeId:3, type:"nurture", emoji:"🪣", name:"Raised Bed Soil Mix",    price:"$14.99", orig:"$19.99", off:"25%", why:"Zucchini needs deep rich soil",     expires:"Mon", color:"#5bbf5b" },
  // 🌶️ Peppers nurture
  { id:11, plantId:4, storeId:3, type:"nurture", emoji:"🌡️", name:"Pepper Bloom Booster",   price:"$9.99",  orig:"$14.99", off:"33%", why:"More blooms = more peppers",        expires:"Mon", color:"#e0924e" },
  // 🌿 Basil nurture
  { id:12, plantId:2, storeId:3, type:"nurture", emoji:"🪴", name:"Terracotta Herb Pot",    price:"$6.99",  orig:"$9.99",  off:"30%", why:"Basil thrives in terracotta",       expires:"Mon", color:"#52c478" },
  // 🥬 Kale nurture
  { id:13, plantId:5, storeId:3, type:"nurture", emoji:"🪣", name:"Compost Enricher",       price:"$11.99", orig:"$16.99", off:"29%", why:"Kale loves nitrogen-rich compost",  expires:"Mon", color:"#2d8a5f" },
  // Grow — plants you don't have yet
  { id:14, plantId:null, storeId:3, type:"grow", emoji:"🌽", name:"Sweet Corn Seeds",       price:"$2.49",  orig:"$4.99",  off:"50%", why:"Easy · 10 weeks to harvest",        expires:"Mon", color:"#e8c13a" },
  { id:15, plantId:null, storeId:3, type:"grow", emoji:"🌻", name:"Sunflower Seeds",        price:"$1.99",  orig:"$3.49",  off:"43%", why:"Grows fast · low maintenance",      expires:"Mon", color:"#e8c13a" },
  { id:16, plantId:null, storeId:3, type:"grow", emoji:"🥕", name:"Carrot Seed Pack",       price:"$1.29",  orig:"$1.99",  off:"35%", why:"Perfect for autumn planting",       expires:"Mon", color:"#e0924e" },
];

// ─────────────────────────────────────────────
// SMART GARDEN EXPANSION DATA
// ─────────────────────────────────────────────
const YARD_CONDITION = {
  sunLevel:"full_sun", sunConfidence:91,
  photoEvidence:"Bright direct light visible across garden beds, no significant shadow coverage",
  colorEvidence:"Garden is predominantly green — no flowering colour variety detected",
};
const SUN_CONFIG = {
  full_sun:  { label:"Full Sun",   icon:"☀️", color:"#e8c13a", desc:"6+ hours direct sunlight" },
  part_shade:{ label:"Part Shade", icon:"⛅", color:"#e0924e", desc:"3–6 hours of sun"         },
  full_shade:{ label:"Full Shade", icon:"🌥️", color:"#5484d4", desc:"Under 3 hours direct sun"  },
};
const COMPANION_DB = {
  1:[{ emoji:"🌼", name:"Marigolds",    why:"Repel aphids & whitefly naturally",   sunNeeds:["full_sun","part_shade"], colorAdds:"yellow & orange", colorHex:"#e8c13a", weeks:8,  dealId:201 }],
  2:[{ emoji:"🌸", name:"Chamomile",    why:"Boosts basil's essential oil strength",sunNeeds:["full_sun","part_shade"], colorAdds:"white & yellow",  colorHex:"#f5f0a0", weeks:8,  dealId:null},
     { emoji:"🌺", name:"Bee Balm",     why:"Attracts pollinators to your herbs",  sunNeeds:["full_sun","part_shade"], colorAdds:"red & pink",      colorHex:"#e85858", weeks:10, dealId:null}],
  3:[{ emoji:"🌻", name:"Sunflowers",   why:"Attract pollinators to zucchini",     sunNeeds:["full_sun"],             colorAdds:"bold yellow",     colorHex:"#e8c13a", weeks:10, dealId:202 },
     { emoji:"🌼", name:"Nasturtiums",  why:"Trap aphids away from zucchini",      sunNeeds:["full_sun","part_shade"], colorAdds:"orange & red",    colorHex:"#e0924e", weeks:6,  dealId:203 }],
  4:[{ emoji:"🌸", name:"Petunias",     why:"Repel pepper weevils naturally",      sunNeeds:["full_sun","part_shade"], colorAdds:"pink & purple",   colorHex:"#c87ad4", weeks:8,  dealId:null}],
  5:[{ emoji:"🌼", name:"Nasturtiums",  why:"Lure caterpillars away from kale",    sunNeeds:["full_sun","part_shade"], colorAdds:"orange & yellow", colorHex:"#e0924e", weeks:6,  dealId:203 },
     { emoji:"💐", name:"Dill",         why:"Attracts beneficial wasps for kale",  sunNeeds:["full_sun","part_shade"], colorAdds:"soft yellow",     colorHex:"#e8e07a", weeks:8,  dealId:null}],
};
const COLOR_SUGGESTIONS_DB = {
  full_sun:[
    { emoji:"🌻", name:"Sunflowers",      colorAdds:"Tall bold yellow",   sunNeeds:["full_sun"],              why:"Thrive in full sun · stunning height",       colorHex:"#e8c13a", weeks:10, dealId:202 },
    { emoji:"🌺", name:"Zinnias",         colorAdds:"Multi-colour mix",   sunNeeds:["full_sun"],              why:"Brightest flowers for a full-sun garden",    colorHex:"#e0924e", weeks:8,  dealId:204 },
    { emoji:"💜", name:"Lavender",        colorAdds:"Purple & silver",    sunNeeds:["full_sun"],              why:"Fragrant, repels pests, beautiful colour",   colorHex:"#9b6dd4", weeks:12, dealId:null },
    { emoji:"🌼", name:"Black-eyed Susan",colorAdds:"Gold & dark centre", sunNeeds:["full_sun","part_shade"], why:"Native wildflower, very low maintenance",    colorHex:"#e8c13a", weeks:10, dealId:null },
  ],
  part_shade:[
    { emoji:"💐", name:"Hydrangeas",      colorAdds:"Blue & purple",      sunNeeds:["part_shade"],            why:"Dramatic colour in dappled light",           colorHex:"#5484d4", weeks:16, dealId:null },
    { emoji:"🌼", name:"Begonias",        colorAdds:"Red, pink, white",   sunNeeds:["part_shade"],            why:"Long-lasting colour all season",             colorHex:"#e85858", weeks:10, dealId:205 },
  ],
  full_shade:[
    { emoji:"🌿", name:"Hostas",          colorAdds:"Blue-green & white", sunNeeds:["full_shade"],            why:"Bold textural colour in deep shade",         colorHex:"#52c478", weeks:12, dealId:null },
  ],
};
const EXPAND_DEALS_DB = {
  201:{ emoji:"🌼", name:"Marigold Seeds",      off:"40%", price:"$1.99", storeId:3 },
  202:{ emoji:"🌻", name:"Sunflower Seeds",     off:"43%", price:"$1.99", storeId:3 },
  203:{ emoji:"🌼", name:"Nasturtium Seeds",    off:"38%", price:"$1.79", storeId:3 },
  204:{ emoji:"🌺", name:"Zinnia Seed Mix",     off:"35%", price:"$2.49", storeId:3 },
  205:{ emoji:"🌼", name:"Begonia Starter Pack",off:"30%", price:"$4.99", storeId:3 },
};
// ─────────────────────────────────────────────
const GARDEN_HISTORY = [
  { id:1, emoji:"🍅", name:"Tomatoes",  season:"Spring 2026", yield:"4.2 kg", rating:5, notes:"Best season yet — more sun this year.", bed:"Backyard left",  color:"#e85858", months:["Mar","Apr","May","Jun"] },
  { id:2, emoji:"🥬", name:"Kale",      season:"Winter 2025", yield:"2.8 kg", rating:4, notes:"Survived the frost beautifully.",       bed:"Front planter",  color:"#2d8a5f", months:["Nov","Dec","Jan","Feb"] },
  { id:3, emoji:"🌿", name:"Basil",     season:"Summer 2025", yield:"1.1 kg", rating:5, notes:"Grew incredibly fast in the heat.",     bed:"Backyard left",  color:"#52c478", months:["Jun","Jul","Aug"]       },
  { id:4, emoji:"🥒", name:"Zucchini",  season:"Summer 2025", yield:"6.7 kg", rating:3, notes:"Overproduced — gave bags to neighbours.",bed:"Side garden",  color:"#5bbf5b", months:["Jun","Jul","Aug","Sep"] },
  { id:5, emoji:"🌶️", name:"Peppers",   season:"Fall 2025",   yield:"0.9 kg", rating:4, notes:"Slow start, great finish.",             bed:"Backyard right",color:"#e0924e", months:["Aug","Sep","Oct"]       },
];
const SEASON_TIPS = [
  { id:1, emoji:"🌽", name:"Sweet Corn",   timing:"Plant now",  reason:"Soil temp perfect at 18°C",         difficulty:"Medium", weeks:10, color:"#e8c13a", dealAvailable:true  },
  { id:2, emoji:"🥕", name:"Carrots",      timing:"Plant now",  reason:"Early summer ideal for root veg",   difficulty:"Easy",   weeks:12, color:"#e0924e", dealAvailable:false },
  { id:3, emoji:"🫑", name:"Bell Peppers", timing:"In 2 weeks", reason:"Needs consistent warmth",           difficulty:"Medium", weeks:14, color:"#52c478", dealAvailable:false },
  { id:4, emoji:"🌻", name:"Sunflowers",   timing:"Plant now",  reason:"Long days ahead — perfect timing",  difficulty:"Easy",   weeks:10, color:"#e8c13a", dealAvailable:true  },
];
const RECIPES = [
  { id:1, name:"Classic Caprese",    time:"10 min", difficulty:"Easy",   usesPlantIds:[1,2], emoji:"🥗", color:"#e85858", cookStatuses:["Thriving","Ready"], dealIds:[1,3], thumb:"https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=400&h=220&fit=crop", steps:["Slice tomatoes","Tear basil leaves","Layer with mozzarella","Drizzle olive oil, season"], pantry:["Olive oil","Salt","Black pepper"] },
  { id:2, name:"Basil Pesto Pasta",  time:"20 min", difficulty:"Easy",   usesPlantIds:[2],   emoji:"🌿", color:"#52c478", cookStatuses:["Thriving","Ready"], dealIds:[4,5], thumb:"https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=220&fit=crop", steps:["Blend basil with parmesan & pine nuts","Add olive oil slowly","Cook pasta al dente","Toss pasta with pesto"], pantry:["Pasta","Olive oil","Garlic"] },
  { id:3, name:"Kale Caesar Salad",  time:"15 min", difficulty:"Easy",   usesPlantIds:[5],   emoji:"🥬", color:"#2d8a5f", cookStatuses:["Thriving","Ready"], dealIds:[6],   thumb:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=220&fit=crop", steps:["Massage kale leaves with lemon","Add Caesar dressing","Toss with croutons","Top with parmesan"], pantry:["Lemon","Croutons","Parmesan"] },
];
const PROFILE = { avatar:"🌿", stats:{ plantsGrown:12, harvests:8, dealsUsed:34, saved:"$127.40", recipesCooked:9 }, badges:[{emoji:"🌱",label:"First Harvest",earned:true},{emoji:"💰",label:"Super Saver",earned:true},{emoji:"🍅",label:"Tomato Master",earned:true},{emoji:"📸",label:"Photo Gardener",earned:true},{emoji:"🌿",label:"Herb Whisperer",earned:false},{emoji:"🏆",label:"Season Champion",earned:false}] };
const ALL_STORES = [
  { id:1, name:"Whole Foods",  type:"Supermarket",  distance:0.8, drive:"3 min",  icon:"🌿", color:"#3a8a5a", hours:"7am–10pm" },
  { id:2, name:"Trader Joe's", type:"Supermarket",  distance:1.2, drive:"4 min",  icon:"🛒", color:"#c8813a", hours:"8am–9pm"  },
  { id:3, name:"Home Depot",   type:"Garden Store", distance:2.1, drive:"7 min",  icon:"🪴", color:"#e8613a", hours:"6am–10pm" },
];
const DAYS  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const TIMES = ["7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM","8:00 PM"];
const SCAN_MSGS = ["Connecting to Google Photos…","Filtering outdoor & garden scenes…","Running AI plant recognition…","Identifying species & growth stages…","Mapping to your home location…","Almost done…"];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const parsePrice = s => parseFloat(s.replace(/[^0-9.]/g,""))||0;
const Pill = ({ children, color=G.green, bg, style={} }) => (
  <span style={{ display:"inline-flex",alignItems:"center",background:bg||`${color}22`,color,fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,letterSpacing:0.5,whiteSpace:"nowrap",...style }}>{children}</span>
);
const Card = ({ children, style={}, glow, onClick }) => (
  <div onClick={onClick} style={{ background:G.bg2,borderRadius:20,padding:16,border:`1px solid ${G.border}`,boxShadow:glow?`0 0 0 1px ${glow}44,0 8px 24px #00000033`:"0 2px 16px #00000022",transition:"all 0.25s",cursor:onClick?"pointer":"default",...style }}>{children}</div>
);
const Toggle = ({ on, onToggle, color=G.green }) => (
  <div onClick={e=>{e.stopPropagation();onToggle();}} style={{ width:48,height:28,borderRadius:14,background:on?color:G.bg3,position:"relative",cursor:"pointer",transition:"background 0.3s",border:on?"none":`1px solid ${G.border}`,flexShrink:0 }}>
    <div style={{ width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:on?23:3,transition:"left 0.25s cubic-bezier(0.34,1.5,0.64,1)" }} />
  </div>
);
const Stars = ({ n }) => <span>{[1,2,3,4,5].map(i=><span key={i} style={{ color:i<=n?"#e8c13a":G.bg3,fontSize:12 }}>★</span>)}</span>;

// ─────────────────────────────────────────────
// PLANT PHOTO with fallback
// ─────────────────────────────────────────────
function PlantPhoto({ src, emoji, color, size=54, radius=15, border, style={} }) {
  const [failed, setFailed] = useState(false);
  return (
    <div style={{ width:size,height:size,borderRadius:radius,overflow:"hidden",flexShrink:0,border:border||`2px solid ${color}44`,...style }}>
      {!failed&&src
        ?<img src={src} alt={emoji} onError={()=>setFailed(true)} style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }} />
        :<div style={{ width:"100%",height:"100%",background:`linear-gradient(135deg,${color}44,${color}22)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.45 }}>{emoji}</div>
      }
    </div>
  );
}

// ─────────────────────────────────────────────
// CONNECTION ARROW (animated dashed)
// ─────────────────────────────────────────────
function Arrow({ color, icon="🌱" }) {
  return (
    <svg width="60" height="20" viewBox="0 0 60 20" style={{ flexShrink:0 }}>
      <line x1="2" y1="10" x2="46" y2="10" stroke={color} strokeWidth="2" strokeDasharray="5,4" opacity="0.65" style={{ animation:"dashMove 1.2s linear infinite" }} />
      <polygon points="46,5 58,10 46,15" fill={color} opacity="0.85" />
      <text x="24" y="8" fontSize="9" textAnchor="middle">{icon}</text>
    </svg>
  );
}

// ─────────────────────────────────────────────
// HARVEST STATUS BADGE
// ─────────────────────────────────────────────
function StatusBadge({ plant, compact=false }) {
  const final = getFinalStatus(plant);
  const cfg   = STATUS_CONFIG[final.status];
  return (
    <div style={{ display:"flex",alignItems:"center",gap:4 }}>
      <div style={{ background:`${cfg.color}22`,color:cfg.color,fontSize:compact?9:10,fontWeight:700,padding:compact?"2px 7px":"3px 9px",borderRadius:20,display:"flex",alignItems:"center",gap:3 }}>
        {cfg.icon} {final.status}
      </div>
      {plant.userStatus && <span style={{ fontSize:8,color:G.textMuted }}>✏️</span>}
      {!plant.userStatus && final.source==="both" && <span style={{ fontSize:8,color:G.green }}>✓</span>}
    </div>
  );
}

// ─────────────────────────────────────────────
// HARVEST PREDICTION DETAIL (expanded in garden)
// ─────────────────────────────────────────────
function HarvestDetail({ plant, onOverride, onClose }) {
  const [showPicker, setShowPicker] = useState(false);
  const timePred  = getTimePrediction(plant);
  const final     = getFinalStatus(plant);
  const cfg       = STATUS_CONFIG[final.status];
  const k         = HARVEST_KNOWLEDGE[plant.id];
  const agree     = plant.photoStatus === timePred?.timeStatus;

  return (
    <div style={{ borderTop:`1px solid ${G.border}`,padding:"14px 0 4px",animation:"fadeUp 0.3s ease both" }}>
      {/* Photo signal */}
      <div style={{ background:G.bg3,borderRadius:14,padding:"11px 13px",marginBottom:8 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
          <div style={{ fontSize:11,fontWeight:700,color:G.text }}>📸 Photo says</div>
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <div style={{ background:`${STATUS_CONFIG[plant.photoStatus]?.color}22`,color:STATUS_CONFIG[plant.photoStatus]?.color,fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:20 }}>{plant.photoStatus}</div>
            <div style={{ fontSize:10,color:G.textMuted }}>{plant.photoConfidence}%</div>
          </div>
        </div>
        <div style={{ fontSize:11,color:G.textMuted,fontStyle:"italic" }}>"{plant.photoEvidence}"</div>
      </div>

      {/* Time signal */}
      {timePred&&(
        <div style={{ background:G.bg3,borderRadius:14,padding:"11px 13px",marginBottom:8 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
            <div style={{ fontSize:11,fontWeight:700,color:G.text }}>📅 Time predicts</div>
            <div style={{ background:`${STATUS_CONFIG[timePred.timeStatus]?.color}22`,color:STATUS_CONFIG[timePred.timeStatus]?.color,fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:20 }}>{timePred.timeStatus}</div>
          </div>
          <div style={{ fontSize:11,color:G.textMuted,marginBottom:8 }}>
            Spotted {timePred.daysSince} days ago · {k?.daysToHarvest} days typical ·{" "}
            {timePred.daysRemaining>0
              ? <strong style={{ color:cfg.color }}>{timePred.daysRemaining} days to go</strong>
              : <strong style={{ color:G.green }}>harvest time reached!</strong>
            }
          </div>
          {/* Progress bar */}
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <span style={{ fontSize:9,color:G.textMuted }}>Day 0</span>
            <div style={{ flex:1,height:4,background:G.bg,borderRadius:2,overflow:"hidden" }}>
              <div style={{ height:"100%",width:`${timePred.pct*100}%`,background:`linear-gradient(90deg,${G.greenDark},${cfg.color})`,borderRadius:2 }} />
            </div>
            <span style={{ fontSize:9,color:G.textMuted }}>Day {k?.daysToHarvest}</span>
          </div>
        </div>
      )}

      {/* Agreement */}
      <div style={{ display:"flex",alignItems:"flex-start",gap:8,marginBottom:12,padding:"9px 12px",background:agree?`${G.green}14`:`${G.orange}14`,borderRadius:10 }}>
        <span style={{ fontSize:13,flexShrink:0 }}>{agree?"✓":"⚠️"}</span>
        <div style={{ fontSize:11,color:agree?G.green:G.orange,lineHeight:1.6 }}>
          {agree
            ? `Both signals agree — ${final.status}`
            : `Signals differ. Photo (${plant.photoStatus}) wins over time prediction (${timePred?.timeStatus}).`
          }
        </div>
      </div>

      {/* Override picker */}
      {!showPicker
        ?<button onClick={e=>{e.stopPropagation();setShowPicker(true);}} style={{ background:"transparent",border:`1px solid ${G.border}`,borderRadius:12,padding:"10px",color:G.textDim,fontSize:12,fontFamily:"Georgia,serif",cursor:"pointer",width:"100%",marginBottom:4 }}>
          ✏️ {plant.userStatus?`You set: ${plant.userStatus} — change`:"Override — set status yourself"}
        </button>
        :<div style={{ animation:"fadeUp 0.2s ease both" }}>
          <div style={{ fontSize:11,color:G.textMuted,marginBottom:8,fontWeight:700 }}>You know your garden best:</div>
          <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:8 }}>
            {ALL_STATUSES.map(s=>{
              const sc=STATUS_CONFIG[s]; const sel=(plant.userStatus||final.status)===s;
              return <div key={s} onClick={e=>{e.stopPropagation();onOverride(plant.id,s);setShowPicker(false);}} style={{ flex:1,minWidth:52,background:sel?`${sc.color}22`:G.bg3,border:`1.5px solid ${sel?sc.color:G.border}`,borderRadius:11,padding:"9px 4px",textAlign:"center",cursor:"pointer" }}>
                <div style={{ fontSize:16,marginBottom:3 }}>{sc.icon}</div>
                <div style={{ fontSize:9,fontWeight:800,color:sel?sc.color:G.textMuted }}>{s}</div>
              </div>;
            })}
          </div>
          {plant.userStatus&&<button onClick={e=>{e.stopPropagation();onOverride(plant.id,null);setShowPicker(false);}} style={{ background:"transparent",border:`1px solid ${G.border}`,borderRadius:10,padding:"7px",color:G.textMuted,fontSize:11,fontFamily:"Georgia,serif",cursor:"pointer",width:"100%",marginBottom:6 }}>↺ Reset to AI prediction</button>}
          <button onClick={e=>{e.stopPropagation();setShowPicker(false);}} style={{ background:"transparent",border:"none",color:G.textMuted,fontSize:11,fontFamily:"Georgia,serif",cursor:"pointer",width:"100%",padding:"4px" }}>Cancel</button>
        </div>
      }
    </div>
  );
}

// ─────────────────────────────────────────────
// MATCH ROW — plant + arrow + top deal
// ─────────────────────────────────────────────
function MatchRow({ plant, deals, type, arrowColor, arrowIcon, isExpanded, onToggle, onAddToList, listItems }) {
  const topDeal = deals[0];
  if(!topDeal) return null;
  const store = ALL_STORES.find(s=>s.id===topDeal.storeId);
  return (
    <div style={{ marginBottom:12 }}>
      <div onClick={onToggle} style={{ background:G.bg2,borderRadius:18,padding:"13px 14px",border:`1.5px solid ${isExpanded?arrowColor+"55":G.border}`,cursor:"pointer",transition:"all 0.25s",boxShadow:isExpanded?`0 0 18px ${arrowColor}18`:"none" }}>
        <div style={{ display:"flex",alignItems:"center",gap:0 }}>
          {/* Plant */}
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:5,flexShrink:0,width:64 }}>
            <PlantPhoto src={plant.thumb} emoji={plant.emoji} color={plant.color} size={48} radius={13} />
            <div style={{ fontSize:10,fontWeight:800,color:G.text,textAlign:"center",lineHeight:1.2 }}>{plant.name}</div>
          </div>
          {/* Arrow */}
          <div style={{ margin:"0 2px",flexShrink:0 }}><Arrow color={arrowColor} icon={arrowIcon} /></div>
          {/* Top deal */}
          <div style={{ flex:1,background:G.bg3,borderRadius:13,padding:"9px 11px",border:`1px solid ${topDeal.color}33`,position:"relative",overflow:"hidden" }}>
            <div style={{ position:"absolute",top:-1,right:-1,background:topDeal.color,borderRadius:"0 13px 0 9px",padding:"2px 8px",fontSize:9,fontWeight:800,color:"#fff" }}>{topDeal.off}</div>
            <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:5 }}>
              <span style={{ fontSize:17 }}>{topDeal.emoji}</span>
              <div>
                <div style={{ fontSize:12,fontWeight:800,color:G.text,paddingRight:30,lineHeight:1.2 }}>{topDeal.name}</div>
                <div style={{ fontSize:10,color:G.textMuted }}>{store?.icon} {store?.name}</div>
              </div>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ fontSize:13,fontWeight:800,color:G.text }}>{topDeal.price}</span>
              <span style={{ fontSize:10,color:arrowColor,fontWeight:600 }}>💡 {topDeal.why}</span>
            </div>
          </div>
        </div>
        {deals.length>1&&<div style={{ textAlign:"center",marginTop:8,fontSize:11,color:arrowColor,fontWeight:700 }}>{isExpanded?`▲ Hide`:`▼ ${deals.length-1} more deal${deals.length-1!==1?"s":""}`}</div>}
      </div>
      {/* Expanded extra deals */}
      {isExpanded&&deals.slice(1).map((deal,i)=>{
        const st=ALL_STORES.find(s=>s.id===deal.storeId);
        const inList=listItems.find(l=>l.id===deal.id);
        return (
          <div key={deal.id} style={{ display:"flex",alignItems:"center",gap:0,marginTop:7,paddingLeft:6,animation:`fadeUp 0.3s ease ${i*0.06}s both` }}>
            <div style={{ width:58,flexShrink:0 }} />
            <div style={{ flexShrink:0,marginRight:6 }}>
              <svg width="22" height="14" viewBox="0 0 22 14">
                <line x1="0" y1="7" x2="13" y2="7" stroke={arrowColor} strokeWidth="1.5" strokeDasharray="3,2" opacity="0.5"/>
                <polygon points="13,3 20,7 13,11" fill={arrowColor} opacity="0.5"/>
              </svg>
            </div>
            <div style={{ flex:1,background:G.bg2,borderRadius:11,padding:"8px 11px",border:`1px solid ${G.border}`,display:"flex",alignItems:"center",gap:9 }}>
              <span style={{ fontSize:16 }}>{deal.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12,fontWeight:700,color:G.text }}>{deal.name}</div>
                <div style={{ fontSize:10,color:G.textMuted,marginTop:1 }}>{st?.icon} {st?.name} · {deal.why}</div>
              </div>
              <div style={{ textAlign:"right",flexShrink:0 }}>
                <div style={{ fontSize:11,fontWeight:800,color:deal.color }}>{deal.off}</div>
                <div style={{ fontSize:11,color:G.text,marginTop:1 }}>{deal.price}</div>
              </div>
              <button onClick={e=>{e.stopPropagation();onAddToList(deal);}} style={{ background:inList?`${G.green}22`:"transparent",border:`1px solid ${inList?G.green:G.border}`,borderRadius:8,padding:"4px 8px",color:inList?G.green:G.textMuted,fontSize:10,fontFamily:"Georgia,serif",cursor:"pointer",flexShrink:0 }}>{inList?"✓":"+"}</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// SCAN SUB-SCREEN
// ─────────────────────────────────────────────
function ScanSubScreen({ onBack, onDone, G, CSS, user }) {
  const [screen, setScreen]       = useState("scan");   // "scan"|"confirm"|"error"
  const [progress, setProgress]   = useState(0);
  const [statusMsg, setStatusMsg] = useState("Connecting to Google Photos…");
  const [foundPhotos, setFoundPhotos] = useState([]);
  const [detected, setDetected]   = useState([]); // INITIAL_PLANTS-shaped objects
  const [confirmed, setConfirmed] = useState([]);
  const [errorMsg, setErrorMsg]   = useState("");

  const VISION_KEY = import.meta.env.VITE_GOOGLE_VISION_KEY || "";

  useEffect(() => {
    if (screen !== "scan") return;
    runScan();
  }, [screen]);

  async function runScan() {
    try {
      // ── 1. Fetch garden photos from Google Photos ────────────────────────
      if (!user?.accessToken) throw new Error("no_token");
      setStatusMsg("Connecting to Google Photos…");
      setProgress(5);

      const { fetchGardenPhotos, detectPlantsInPhoto, matchPlantFromLabels } =
        await import("./googlePhotos.js");

      const photos = await fetchGardenPhotos(user.accessToken);
      setFoundPhotos(photos);

      if (photos.length === 0) {
        setStatusMsg("No garden photos found in your library.");
        setProgress(100);
        setTimeout(() => setScreen("confirm"), 600);
        return;
      }

      // ── 2. Run Vision API on each photo ──────────────────────────────────
      if (!VISION_KEY) throw new Error("no_vision_key");

      const found = new Map(); // plantId → plant entry
      const msgs  = [
        "Filtering outdoor & garden scenes…",
        "Running AI plant recognition…",
        "Identifying species & growth stages…",
        "Mapping plants to your garden…",
        "Almost done…",
      ];

      for (let i = 0; i < photos.length; i++) {
        const pct = Math.round(10 + (i / photos.length) * 85);
        setProgress(pct);
        setStatusMsg(msgs[Math.min(Math.floor((i / photos.length) * msgs.length), msgs.length - 1)]);

        try {
          const vision  = await detectPlantsInPhoto(photos[i].baseUrl, VISION_KEY);
          const plantId = matchPlantFromLabels(vision);
          if (plantId && !found.has(plantId)) {
            const base = INITIAL_PLANTS.find(p => p.id === plantId);
            if (base) {
              const conf = Math.round((vision.labelAnnotations?.[0]?.score || 0.88) * 100);
              found.set(plantId, {
                ...base,
                thumb: `${photos[i].baseUrl}=w200-h200`,
                photoConfidence: conf,
                firstSeenDate:   new Date(),
                userStatus:      null,
              });
            }
          }
        } catch { /* skip single-photo failure */ }
      }

      setProgress(100);
      setStatusMsg("Done!");
      const results = [...found.values()];
      setDetected(results.length ? results : INITIAL_PLANTS);
      setConfirmed((results.length ? results : INITIAL_PLANTS).map(p => p.id));
      setTimeout(() => setScreen("confirm"), 500);

    } catch (err) {
      if (err.message === "no_token") {
        setErrorMsg("Sign in with Google first to scan your photos.");
      } else if (err.message === "no_vision_key") {
        setErrorMsg("VITE_GOOGLE_VISION_KEY not set — see setup instructions below.");
      } else {
        setErrorMsg(`Photos scan failed: ${err.message}`);
      }
      setScreen("error");
    }
  }

  // ── Error screen ──────────────────────────────────────────────────────────
  if (screen === "error") return (
    <div style={{ fontFamily:"Georgia,serif",background:G.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",padding:"60px 24px 40px" }}>
      <style>{CSS}</style>
      <button onClick={onBack} style={{ background:"transparent",border:"none",color:G.textMuted,fontSize:12,fontFamily:"Georgia,serif",cursor:"pointer",marginBottom:28 }}>← Back</button>
      <div style={{ textAlign:"center",marginBottom:24 }}>
        <div style={{ fontSize:48,marginBottom:14 }}>⚠️</div>
        <div style={{ fontSize:18,fontWeight:800,color:G.text,marginBottom:8 }}>Scan couldn't complete</div>
        <div style={{ fontSize:13,color:G.textMuted,lineHeight:1.8,marginBottom:20 }}>{errorMsg}</div>
      </div>
      {errorMsg.includes("VISION_KEY") && (
        <div style={{ background:G.bg2,borderRadius:16,padding:"16px 18px",border:`1px solid ${G.border}`,marginBottom:20,fontSize:12,color:G.textMuted,lineHeight:2 }}>
          <div style={{ fontWeight:800,color:G.text,marginBottom:8 }}>To enable plant detection:</div>
          <div>1. Go to <strong style={{color:G.green}}>console.cloud.google.com</strong></div>
          <div>2. Enable <strong style={{color:G.green}}>Cloud Vision API</strong></div>
          <div>3. Create an <strong style={{color:G.green}}>API Key</strong></div>
          <div>4. Add it as <strong style={{color:G.green}}>VITE_GOOGLE_VISION_KEY</strong> and rebuild</div>
        </div>
      )}
      <button onClick={() => { setScreen("scan"); setProgress(0); setErrorMsg(""); }} style={{ width:"100%",background:`linear-gradient(135deg,${G.green},${G.greenDark})`,border:"none",borderRadius:14,padding:"14px",color:"#fff",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",marginBottom:10 }}>Try again</button>
      <button onClick={onBack} style={{ width:"100%",background:"transparent",border:`1px solid ${G.border}`,borderRadius:14,padding:"13px",color:G.textMuted,fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer" }}>Cancel</button>
    </div>
  );

  // ── Scanning screen ───────────────────────────────────────────────────────
  if (screen === "scan") return (
    <div style={{ fontFamily:"Georgia,serif",background:G.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 28px",position:"relative" }}>
      <style>{CSS}</style>
      <button onClick={onBack} style={{ position:"absolute",top:52,left:20,background:G.bg2,border:`1px solid ${G.border}`,borderRadius:20,padding:"7px 15px",color:G.textDim,fontSize:12,fontFamily:"Georgia,serif",cursor:"pointer" }}>← Back</button>

      {/* Photo grid preview */}
      <div style={{ width:188,height:188,borderRadius:24,background:G.bg2,position:"relative",overflow:"hidden",marginBottom:26,border:`1.5px solid ${G.borderBright}`,boxShadow:`0 0 48px ${G.greenGlow}` }}>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3,padding:3,height:"100%" }}>
          {foundPhotos.slice(0,9).map((ph,i) => (
            <div key={i} style={{ borderRadius:6,overflow:"hidden",background:G.bg3 }}>
              <img src={`${ph.baseUrl}=w80-h80`} alt="" style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }} />
            </div>
          ))}
          {Array.from({length:Math.max(0,9-foundPhotos.length)}).map((_,i)=>(
            <div key={`e${i}`} style={{ background:G.bg3,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,opacity:0.2 }}>🌿</div>
          ))}
        </div>
        <div style={{ position:"absolute",left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${G.green},transparent)`,animation:"scanLine 1.8s ease-in-out infinite",boxShadow:`0 0 10px ${G.green}` }} />
      </div>

      <div style={{ fontSize:19,fontWeight:800,color:G.text,marginBottom:6 }}>Scanning Google Photos…</div>
      <div style={{ fontSize:13,color:G.green,marginBottom:22,minHeight:20,textAlign:"center" }}>{statusMsg}</div>
      <div style={{ width:"100%",height:6,background:G.bg3,borderRadius:3,overflow:"hidden",marginBottom:6 }}>
        <div style={{ height:"100%",borderRadius:3,width:`${progress}%`,background:`linear-gradient(90deg,${G.greenDark},${G.green})`,transition:"width 0.4s" }} />
      </div>
      <div style={{ fontSize:12,color:G.textMuted }}>{progress}% · {foundPhotos.length} photos found</div>
    </div>
  );

  // ── Confirm screen ────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"Georgia,serif",background:G.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",padding:"52px 22px 40px" }}>
      <style>{CSS}</style>
      <div style={{ textAlign:"center",marginBottom:22 }}>
        <div style={{ width:58,height:58,borderRadius:"50%",background:`linear-gradient(135deg,${G.green},${G.greenDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 13px",boxShadow:`0 0 28px ${G.greenGlow}` }}>✓</div>
        <div style={{ fontSize:20,fontWeight:800,color:G.text }}>{detected.length} plants detected!</div>
        <div style={{ fontSize:12,color:G.textMuted,marginTop:4 }}>Tap to deselect anything that's not yours</div>
      </div>
      {detected.map((p,i)=>(
        <div key={p.id} onClick={()=>setConfirmed(s=>s.includes(p.id)?s.filter(x=>x!==p.id):[...s,p.id])} style={{ display:"flex",alignItems:"center",gap:12,background:confirmed.includes(p.id)?G.bg3:G.bg2,borderRadius:14,padding:"12px 14px",marginBottom:8,border:`1.5px solid ${confirmed.includes(p.id)?G.borderBright:G.border}`,cursor:"pointer",transition:"all 0.2s",animation:`fadeUp 0.4s ease ${i*0.06}s both` }}>
          <PlantPhoto src={p.thumb} emoji={p.emoji} color={p.color} size={46} radius={12} border={`2px solid ${confirmed.includes(p.id)?p.color:G.border}`} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14,fontWeight:700,color:G.text }}>{p.name}</div>
            <div style={{ fontSize:11,color:G.textMuted,marginTop:1 }}>Detected from your photos</div>
            {confirmed.includes(p.id)&&<StatusBadge plant={p} compact />}
          </div>
          <Pill color={G.green}>{p.photoConfidence}%</Pill>
          <div style={{ width:22,height:22,borderRadius:"50%",background:confirmed.includes(p.id)?G.green:G.bg3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",flexShrink:0 }}>{confirmed.includes(p.id)?"✓":""}</div>
        </div>
      ))}
      <div style={{ fontSize:11,color:G.textMuted,textAlign:"center",marginBottom:16,marginTop:8 }}>{confirmed.length} selected</div>
      <button onClick={()=>onDone(detected.filter(p=>confirmed.includes(p.id)))} style={{ background:`linear-gradient(135deg,${G.green},${G.greenDark})`,border:"none",borderRadius:16,padding:"16px",color:"#fff",fontSize:15,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",width:"100%",boxShadow:`0 8px 24px ${G.greenGlow}` }}>
        Add {confirmed.length} plants to my garden →
      </button>
      <button onClick={()=>setScreen("scan")} style={{ background:"transparent",border:"none",color:G.textMuted,fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer",padding:"12px 8px",width:"100%",marginTop:4 }}>← Scan again</button>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPAND GARDEN COMPONENT
// ─────────────────────────────────────────────
function ExpandGarden({ plants, G, EXPAND_DEALS_DB, ALL_STORES, addToList, listItems }) {
  const [section, setSection] = useState("companion");
  const [expanded, setExpanded] = useState(null);
  const [showYard, setShowYard] = useState(false);
  const sunCfg = SUN_CONFIG[YARD_CONDITION.sunLevel];

  // Build companion suggestions from current plants
  const companionSuggestions = plants.flatMap(plant =>
    (COMPANION_DB[plant.id]||[]).map(s=>({...s, sourceType:"companion", sourcePlant:plant}))
  ).filter((s,i,arr)=>arr.findIndex(x=>x.name===s.name)===i);

  // Build colour suggestions
  const colorSuggestions = (COLOR_SUGGESTIONS_DB[YARD_CONDITION.sunLevel]||[])
    .map(s=>({...s, sourceType:"color", sourcePlant:null}));

  const allSuggestions = [...companionSuggestions, ...colorSuggestions]
    .filter((s,i,arr)=>arr.findIndex(x=>x.name===s.name)===i);

  const displayed = section==="companion"?companionSuggestions:section==="color"?colorSuggestions:allSuggestions;
  const dealsCount = displayed.filter(s=>s.dealId&&EXPAND_DEALS_DB[s.dealId]).length;

  return (
    <div style={{ marginTop:8 }}>
      {/* Section header */}
      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
        <div style={{ flex:1,height:1,background:G.border }} />
        <div style={{ fontSize:10,color:"#e8c13a",fontWeight:800,letterSpacing:2,textTransform:"uppercase",whiteSpace:"nowrap" }}>🌻 Expand your garden</div>
        <div style={{ flex:1,height:1,background:G.border }} />
      </div>

      {/* Yard condition pill */}
      <div onClick={()=>setShowYard(v=>!v)} style={{ background:G.bg2,border:`1px solid ${sunCfg.color}44`,borderRadius:14,padding:"10px 14px",marginBottom:14,cursor:"pointer" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:36,height:36,borderRadius:10,background:`${sunCfg.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,border:`1px solid ${sunCfg.color}44`,flexShrink:0 }}>{sunCfg.icon}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12,fontWeight:700,color:G.text }}>Your yard: {sunCfg.label}</div>
            <div style={{ fontSize:10,color:G.textMuted }}>{sunCfg.desc}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:10,color:sunCfg.color,fontWeight:700 }}>📸 {YARD_CONDITION.sunConfidence}%</div>
            <div style={{ fontSize:10,color:G.textMuted,marginTop:2 }}>{showYard?"▲":"▼ How?"}</div>
          </div>
        </div>
        {showYard&&(
          <div style={{ borderTop:`1px solid ${G.border}`,marginTop:10,paddingTop:10,animation:"fadeUp 0.25s ease both" }}>
            <div style={{ fontSize:11,color:G.textMuted,fontStyle:"italic",marginBottom:8 }}>"{YARD_CONDITION.photoEvidence}"</div>
            <div style={{ fontSize:11,color:G.textMuted,fontStyle:"italic",marginBottom:10 }}>"{YARD_CONDITION.colorEvidence}"</div>
            <div style={{ display:"flex",gap:6 }}>
              {Object.entries(SUN_CONFIG).map(([key,cfg])=>(
                <div key={key} style={{ flex:1,background:YARD_CONDITION.sunLevel===key?`${cfg.color}22`:G.bg3,border:`1px solid ${YARD_CONDITION.sunLevel===key?cfg.color:G.border}`,borderRadius:10,padding:"7px 4px",textAlign:"center" }}>
                  <div style={{ fontSize:16 }}>{cfg.icon}</div>
                  <div style={{ fontSize:9,color:YARD_CONDITION.sunLevel===key?cfg.color:G.textMuted,marginTop:3,fontWeight:YARD_CONDITION.sunLevel===key?700:400 }}>{cfg.label}</div>
                  {YARD_CONDITION.sunLevel===key&&<div style={{ fontSize:8,color:cfg.color,marginTop:1 }}>✓ Detected</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div style={{ display:"flex",background:G.bg2,borderRadius:13,padding:3,marginBottom:14,border:`1px solid ${G.border}` }}>
        {[{key:"companion",label:"🌱 Companions"},{key:"color",label:"🎨 Colour"},{key:"all",label:"✨ All"}].map(t=>(
          <div key={t.key} onClick={()=>setSection(t.key)} style={{ flex:1,padding:"8px 6px",borderRadius:10,background:section===t.key?G.bg3:"transparent",textAlign:"center",fontSize:11,fontWeight:section===t.key?800:400,color:section===t.key?G.text:G.textMuted,cursor:"pointer",transition:"all 0.2s" }}>{t.label}</div>
        ))}
      </div>

      {/* Deal count badge */}
      {dealsCount>0&&(
        <div style={{ background:`${G.green}14`,border:`1px solid ${G.green}33`,borderRadius:12,padding:"8px 13px",marginBottom:12,display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:16 }}>🏷️</span>
          <div style={{ fontSize:11,fontWeight:700,color:G.green }}>{dealsCount} of these are on sale this week</div>
        </div>
      )}

      {/* Suggestion cards */}
      {displayed.map((s,i)=>{
        const deal = s.dealId?EXPAND_DEALS_DB[s.dealId]:null;
        const store = deal?ALL_STORES.find(st=>st.id===deal.storeId):null;
        const key = `${s.sourceType}-${s.name}`;
        const isExp = expanded===key;
        const suitsSun = s.sunNeeds.includes(YARD_CONDITION.sunLevel);
        const inList = deal&&listItems.find(l=>l.id===`exp-${s.dealId}`);
        return (
          <div key={key} style={{ marginBottom:11,animation:`fadeUp 0.4s ease ${i*0.06}s both` }}>
            <div onClick={()=>setExpanded(isExp?null:key)} style={{ background:G.bg2,borderRadius:17,padding:"13px 15px",border:`1.5px solid ${isExp?s.colorHex+"55":G.border}`,cursor:"pointer",transition:"all 0.25s",boxShadow:isExp?`0 0 16px ${s.colorHex}18`:"none" }}>
              <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                {/* Colour circle */}
                <div style={{ width:50,height:50,borderRadius:14,background:`linear-gradient(135deg,${s.colorHex}44,${s.colorHex}22)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,border:`2px solid ${s.colorHex}55`,position:"relative" }}>
                  {s.emoji}
                  <div style={{ position:"absolute",bottom:-5,right:-5,width:18,height:18,borderRadius:"50%",background:suitsSun?G.green:G.orange,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,border:`2px solid ${G.bg}` }}>{suitsSun?"✓":"!"}</div>
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:800,fontSize:14,color:G.text }}>{s.name}</div>
                  {/* Colour strip */}
                  <div style={{ display:"flex",alignItems:"center",gap:5,marginTop:4 }}>
                    <div style={{ width:11,height:11,borderRadius:"50%",background:s.colorHex,flexShrink:0 }} />
                    <span style={{ fontSize:11,color:G.textMuted }}>Adds {s.colorAdds}</span>
                  </div>
                  {/* Source tag */}
                  <div style={{ marginTop:5 }}>
                    {s.sourceType==="companion"&&s.sourcePlant&&(
                      <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                        <div style={{ width:16,height:16,borderRadius:5,background:`${s.sourcePlant.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10 }}>{s.sourcePlant.emoji}</div>
                        <span style={{ fontSize:10,color:G.green,fontWeight:700 }}>Companion to your {s.sourcePlant.name}</span>
                      </div>
                    )}
                    {s.sourceType==="color"&&<span style={{ fontSize:10,color:s.colorHex,fontWeight:700 }}>🎨 Colour variety for your garden</span>}
                  </div>
                </div>
                <div style={{ textAlign:"right",flexShrink:0 }}>
                  <div style={{ fontSize:11,color:G.textMuted,marginBottom:4 }}>⏱ {s.weeks}wk</div>
                  {deal&&<div style={{ background:`${G.green}22`,color:G.green,fontSize:10,fontWeight:800,padding:"2px 7px",borderRadius:20 }}>{deal.off}</div>}
                  <div style={{ fontSize:12,color:G.textMuted,marginTop:4 }}>{isExp?"▲":"▼"}</div>
                </div>
              </div>

              {/* Expanded detail */}
              {isExp&&(
                <div style={{ borderTop:`1px solid ${G.border}`,marginTop:12,paddingTop:12,animation:"fadeUp 0.25s ease both" }}>
                  {/* Why */}
                  <div style={{ background:G.bg3,borderRadius:12,padding:"10px 13px",marginBottom:9 }}>
                    <div style={{ fontSize:11,fontWeight:700,color:G.text,marginBottom:4 }}>{s.sourceType==="companion"?"🌱 Companion benefit":"🎨 Colour benefit"}</div>
                    <div style={{ fontSize:12,color:G.textMuted,lineHeight:1.7 }}>{s.why}</div>
                  </div>
                  {/* Sun suitability */}
                  <div style={{ background:suitsSun?`${G.green}14`:`${G.orange}14`,border:`1px solid ${suitsSun?G.green:G.orange}33`,borderRadius:12,padding:"9px 13px",marginBottom:9,display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{ fontSize:15 }}>{sunCfg.icon}</span>
                    <div style={{ fontSize:11,color:suitsSun?G.green:G.orange,fontWeight:600 }}>
                      {suitsSun?`✓ Suits your ${sunCfg.label} yard`:`⚠️ Needs more shade than your yard — may still work with afternoon shading`}
                    </div>
                  </div>
                  {/* Colour preview */}
                  <div style={{ background:G.bg3,borderRadius:12,padding:"10px 13px",marginBottom:9 }}>
                    <div style={{ fontSize:11,fontWeight:700,color:G.text,marginBottom:8 }}>🎨 Colour impact</div>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:9,color:G.textMuted,marginBottom:4 }}>Now</div>
                        <div style={{ display:"flex",gap:3 }}>{["#52c478","#2d8a5f","#5bbf5b","#e85858","#e0924e"].map((c,i)=><div key={i} style={{ flex:1,height:14,borderRadius:3,background:c }} />)}</div>
                      </div>
                      <span style={{ fontSize:14,color:G.green }}>→</span>
                      <div style={{ flex:1.2 }}>
                        <div style={{ fontSize:9,color:G.textMuted,marginBottom:4 }}>With {s.name}</div>
                        <div style={{ display:"flex",gap:3 }}>
                          {["#52c478","#2d8a5f","#5bbf5b","#e85858","#e0924e"].map((c,i)=><div key={i} style={{ flex:1,height:14,borderRadius:3,background:c }} />)}
                          <div style={{ flex:1.4,height:14,borderRadius:3,background:s.colorHex,boxShadow:`0 0 8px ${s.colorHex}88` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Deal */}
                  {deal&&store&&(
                    <div style={{ background:`${G.green}14`,border:`1px solid ${G.green}33`,borderRadius:11,padding:"9px 12px",display:"flex",alignItems:"center",gap:10 }}>
                      <span style={{ fontSize:18 }}>{deal.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12,fontWeight:700,color:G.green }}>{deal.name} — {deal.off} OFF</div>
                        <div style={{ fontSize:10,color:G.textMuted }}>{store.icon} {store.name} · {deal.price}</div>
                      </div>
                      <button onClick={e=>{e.stopPropagation();addToList({...deal,id:`exp-${s.dealId}`,storeId:deal.storeId,orig:"$3.99",expires:"Mon",type:"grow",plantId:null,color:s.colorHex});}} style={{ background:inList?`${G.green}22`:"transparent",border:`1px solid ${inList?G.green:G.border}`,borderRadius:9,padding:"5px 10px",color:inList?G.green:G.textMuted,fontSize:11,fontFamily:"Georgia,serif",cursor:"pointer" }}>{inList?"✓":"+ List"}</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function EchoGardenDeal({ user, onLogout }) {
  const [tab, setTab]               = useState(0);
  const [showLogout, setShowLogout] = useState(false);
  const [subScreen, setSub]         = useState(null);
  const [activePlants, setActivePlants] = useState(INITIAL_PLANTS);
  const [gardenView, setGardenView] = useState("current");
  const [expandedPlant, setExpanded]= useState(null);
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [dealFilter, setDealFilter] = useState("All");
  const [tipFilter, setTipFilter]   = useState("All");
  const [listItems, setListItems]   = useState([]);
  const [savedDeals, setSaved]      = useState([]);
  const [selectedRecipe, setRecipe] = useState(null);
  const [toast, setToast]           = useState(null);
  const [profileTab, setProfileTab] = useState("stats");
  const [showNewSeason, setNewSeason] = useState(false);
  const [expiryOn, setExpiry]       = useState(true);
  const [weeklyOn, setWeekly]       = useState(true);
  const [digestDay, setDay]         = useState("Friday");
  const [digestTime, setTime]       = useState("3:00 PM");
  const [showDay, setShowDay]       = useState(false);
  const [showTimeP, setShowTimeP]   = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [notifScreen, setNotifScreen] = useState("settings");

  const [location, setLocation] = useState("Locating…");

  useEffect(() => {
    if(!navigator.geolocation) { setLocation("Location unavailable"); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`);
          const data = await res.json();
          const a    = data.address;
          const area = a.neighbourhood || a.suburb || a.village || a.town || a.city_district || "";
          const city = a.city || a.town || a.county || "";
          setLocation([area, city].filter(Boolean).join(", ") || data.display_name.split(",")[0]);
        } catch { setLocation("Location unavailable"); }
      },
      () => setLocation("Location unavailable"),
      { timeout: 8000 }
    );
  }, []);

  const userName  = user?.name || "Lilly";
  const firstName = userName.split(" ")[0];
  const appTitle  = `${firstName}'s Garden`;
  const plants    = activePlants;
  const activeStores = [1,2,3];

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(null),2200); };
  const addToList = deal => {
    if(listItems.find(d=>d.id===deal.id)) return;
    const store=ALL_STORES.find(s=>s.id===deal.storeId);
    setListItems(l=>[...l,{...deal,checked:false,qty:1,storeName:store?.name,storeIcon:store?.icon}]);
    showToast(`${deal.emoji} Added to list`);
  };
  const handleOverride = (plantId, newStatus) => {
    setActivePlants(prev=>prev.map(p=>p.id===plantId?{...p,userStatus:newStatus}:p));
    showToast(newStatus?`✏️ Status set to ${newStatus}`:"↺ Reset to AI prediction");
  };

  // Derived deal lists using smart logic
  const dealsForPlant = (plant, type) => ALL_DEALS.filter(d => {
    if(d.plantId !== plant.id || d.type !== type) return false;
    if(!activeStores.includes(d.storeId)) return false;
    // Cook deals: only shown when plant is ready to harvest
    if(type==="cook") {
      const final = getFinalStatus(plant);
      return STATUS_CONFIG[final.status]?.cookReady;
    }
    return true;
  });

  const growDeals = ALL_DEALS.filter(d=>d.type==="grow"&&activeStores.includes(d.storeId));
  const totalSaving = listItems.reduce((a,d)=>a+parsePrice(d.orig)-parsePrice(d.price),0);
  const readyPlants = plants.filter(p=>STATUS_CONFIG[getFinalStatus(p).status]?.cookReady);
  const growingPlants = plants.filter(p=>!STATUS_CONFIG[getFinalStatus(p).status]?.cookReady);

  const NAV=[{label:"Garden",icon:"🌱"},{label:"Deals",icon:"🏷️"},{label:"For You",icon:"✨"},{label:"Profile",icon:"👤"}];

  // ── Sub-screens ──────────────────────────────
  if(subScreen==="scan") return <ScanSubScreen onBack={()=>setSub(null)} onDone={newP=>{setActivePlants(newP);setSub(null);showToast(`✓ ${newP.length} plants identified!`);}} G={G} CSS={CSS} user={user} />;

  if(subScreen==="list") return (
    <div style={{ fontFamily:"Georgia,serif",background:G.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto" }}>
      <style>{CSS}</style>
      <div style={{ background:G.bg2,padding:"54px 22px 18px",borderBottom:`1px solid ${G.border}` }}>
        <button onClick={()=>setSub(null)} style={{ background:"transparent",border:"none",color:G.textMuted,fontSize:12,fontFamily:"Georgia,serif",cursor:"pointer",marginBottom:14 }}>← Back</button>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
          <div><div style={{ fontSize:24,fontWeight:800,color:G.text,letterSpacing:-0.3,marginBottom:4 }}>Shopping List</div><div style={{ fontSize:12,color:G.textMuted }}>{listItems.filter(d=>!d.checked).length} remaining · saving <strong style={{ color:G.green }}>${totalSaving.toFixed(2)}</strong></div></div>
          <button onClick={()=>showToast("✓ List shared!")} style={{ background:G.bg3,border:`1px solid ${G.border}`,borderRadius:12,padding:"8px 14px",color:G.textDim,fontSize:12,fontFamily:"Georgia,serif",cursor:"pointer" }}>Share 📤</button>
        </div>
        <div style={{ width:"100%",height:5,background:G.bg3,borderRadius:3,overflow:"hidden",marginTop:14 }}>
          <div style={{ height:"100%",borderRadius:3,width:listItems.length?`${(listItems.filter(d=>d.checked).length/listItems.length)*100}%`:"0%",background:`linear-gradient(90deg,${G.greenDark},${G.green})`,transition:"width 0.4s" }} />
        </div>
      </div>
      <div style={{ padding:"16px 18px 110px" }}>
        {listItems.length===0&&(
          <div style={{ textAlign:"center",padding:"56px 24px" }}>
            <div style={{ fontSize:48,marginBottom:16,opacity:0.4 }}>🛒</div>
            <div style={{ fontSize:16,fontWeight:700,color:G.text,marginBottom:8 }}>Your list is empty</div>
            <div style={{ fontSize:13,color:G.textMuted,lineHeight:1.8 }}>Tap "+ List" on any deal to add items.</div>
            <button onClick={()=>setSub(null)} style={{ marginTop:22,background:G.bg2,border:`1px solid ${G.border}`,borderRadius:14,padding:"12px 24px",color:G.textDim,fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer" }}>← Browse deals</button>
          </div>
        )}
        {listItems.map((deal,i)=>{
          const store=ALL_STORES.find(s=>s.id===deal.storeId);
          return (
            <div key={deal.id} style={{ background:deal.checked?G.bg2+"99":G.bg2,borderRadius:18,padding:"13px 16px",marginBottom:10,border:`1.5px solid ${deal.checked?G.border:G.borderBright}`,transition:"all 0.25s",position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",top:0,left:0,width:3,height:"100%",background:deal.color,borderRadius:"3px 0 0 3px" }} />
              <div style={{ paddingLeft:10,display:"flex",alignItems:"center",gap:12 }}>
                <div onClick={()=>setListItems(l=>l.map(d=>d.id===deal.id?{...d,checked:!d.checked}:d))} style={{ width:28,height:28,borderRadius:8,border:`2px solid ${deal.checked?G.green:G.border}`,background:deal.checked?G.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0 }}>{deal.checked&&<span style={{ color:"#fff",fontSize:14,fontWeight:700 }}>✓</span>}</div>
                <span style={{ fontSize:20 }}>{deal.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14,fontWeight:700,color:G.text,textDecoration:deal.checked?"line-through":"none",opacity:deal.checked?0.45:1 }}>{deal.name}</div>
                  <div style={{ fontSize:11,color:G.textMuted,marginTop:2 }}>{deal.storeIcon||store?.icon} {deal.storeName||store?.name} · {deal.price}</div>
                </div>
                <Pill color={deal.color} bg={`${deal.color}18`}>{deal.off}</Pill>
                <button onClick={()=>setListItems(l=>l.filter(d=>d.id!==deal.id))} style={{ background:"none",border:"none",color:G.textMuted,fontSize:18,cursor:"pointer",padding:"0 0 0 6px",flexShrink:0 }}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
      {listItems.length>0&&(
        <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:G.bg,borderTop:`1px solid ${G.border}`,padding:"14px 18px 30px",display:"flex",gap:10 }}>
          {[{label:"Remaining",value:listItems.filter(d=>!d.checked).length,color:G.text},{label:"Saving",value:`$${totalSaving.toFixed(2)}`,color:G.green}].map(s=>(
            <div key={s.label} style={{ flex:1,background:G.bg2,borderRadius:14,padding:"11px 8px",textAlign:"center",border:`1px solid ${G.border}` }}>
              <div style={{ fontSize:16,fontWeight:800,color:s.color }}>{s.value}</div>
              <div style={{ fontSize:9,color:G.textMuted,textTransform:"uppercase",letterSpacing:1,marginTop:2 }}>{s.label}</div>
            </div>
          ))}
          <button onClick={()=>showToast("✓ List shared!")} style={{ flex:2,background:`linear-gradient(135deg,${G.green},${G.greenDark})`,border:"none",borderRadius:14,padding:"13px",color:"#fff",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer" }}>Share 📤</button>
        </div>
      )}
      {toast&&<div style={{ position:"fixed",bottom:100,left:"50%",transform:"translateX(-50%)",background:G.green,color:"#fff",borderRadius:24,padding:"10px 22px",fontSize:13,fontWeight:700,animation:"toastIn 2.2s ease both",whiteSpace:"nowrap",zIndex:100 }}>{toast}</div>}
    </div>
  );

  if(subScreen==="notif") return (
    <div style={{ fontFamily:"Georgia,serif",background:notifScreen==="preview"?"#0a0a0a":G.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto" }}>
      <style>{CSS}</style>
      {notifScreen==="settings"&&(
        <div>
          <div style={{ background:G.bg2,padding:"54px 22px 18px",borderBottom:`1px solid ${G.border}` }}>
            <button onClick={()=>setSub(null)} style={{ background:"transparent",border:"none",color:G.textMuted,fontSize:12,fontFamily:"Georgia,serif",cursor:"pointer",marginBottom:14 }}>← Back</button>
            <div style={{ fontSize:24,fontWeight:800,color:G.text,marginBottom:4 }}>Notifications</div>
            <div style={{ fontSize:12,color:G.textMuted }}>Two types only — we won't bother you beyond these.</div>
          </div>
          <div style={{ padding:"20px 20px 40px" }}>
            <Card style={{ marginBottom:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:expiryOn?16:0 }}>
                <div style={{ flex:1,paddingRight:14 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:6 }}>
                    <div style={{ width:38,height:38,borderRadius:11,background:G.redSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19 }}>⏰</div>
                    <div style={{ fontSize:14,fontWeight:700,color:G.text }}>Saved deal expiring</div>
                  </div>
                  <div style={{ fontSize:12,color:G.textMuted,lineHeight:1.7 }}>Alert when a saved deal is about to expire.</div>
                </div>
                <Toggle on={expiryOn} color={G.red} onToggle={()=>setExpiry(v=>!v)} />
              </div>
              {expiryOn&&[{l:"Day before expiry",c:true},{l:"Morning of expiry",c:true},{l:"2 hours before close",c:false}].map((o,i)=>(
                <div key={o.l} style={{ display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderTop:`1px solid ${G.border}` }}>
                  <div style={{ width:20,height:20,borderRadius:6,border:`2px solid ${o.c?G.red:G.border}`,background:o.c?G.red:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{o.c&&<span style={{ color:"#fff",fontSize:11 }}>✓</span>}</div>
                  <span style={{ fontSize:13,color:G.text }}>{o.l}</span>
                </div>
              ))}
            </Card>
            <Card style={{ marginBottom:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:weeklyOn?16:0 }}>
                <div style={{ flex:1,paddingRight:14 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:6 }}>
                    <div style={{ width:38,height:38,borderRadius:11,background:`${G.green}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19 }}>📋</div>
                    <div style={{ fontSize:14,fontWeight:700,color:G.text }}>Weekly deal digest</div>
                  </div>
                  <div style={{ fontSize:12,color:G.textMuted,lineHeight:1.7 }}>One summary per week at a time you choose.</div>
                </div>
                <Toggle on={weeklyOn} color={G.green} onToggle={()=>setWeekly(v=>!v)} />
              </div>
              {weeklyOn&&<>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11,color:G.textDim,marginBottom:6,fontWeight:700 }}>Day</div>
                  <div onClick={()=>{setShowDay(v=>!v);setShowTimeP(false);}} style={{ background:G.bg3,border:`1px solid ${G.border}`,borderRadius:11,padding:"10px 13px",display:"flex",justifyContent:"space-between",cursor:"pointer" }}>
                    <span style={{ fontSize:13,color:G.text,fontWeight:700 }}>{digestDay}</span><span style={{ fontSize:12,color:G.textMuted }}>▾</span>
                  </div>
                  {showDay&&<div style={{ background:G.bg3,border:`1px solid ${G.border}`,borderRadius:11,marginTop:3,overflow:"hidden",zIndex:10,position:"relative" }}>
                    {DAYS.map(d=><div key={d} onClick={()=>{setDay(d);setShowDay(false);}} style={{ padding:"10px 13px",fontSize:13,color:d===digestDay?G.green:G.text,fontWeight:d===digestDay?700:400,background:d===digestDay?`${G.green}18`:"transparent",borderBottom:`1px solid ${G.border}`,cursor:"pointer" }}>{d===digestDay?"✓  ":""}{d}</div>)}
                  </div>}
                </div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11,color:G.textDim,marginBottom:6,fontWeight:700 }}>Time</div>
                  <div onClick={()=>{setShowTimeP(v=>!v);setShowDay(false);}} style={{ background:G.bg3,border:`1px solid ${G.border}`,borderRadius:11,padding:"10px 13px",display:"flex",justifyContent:"space-between",cursor:"pointer" }}>
                    <span style={{ fontSize:13,color:G.text,fontWeight:700 }}>{digestTime}</span><span style={{ fontSize:12,color:G.textMuted }}>▾</span>
                  </div>
                  {showTimeP&&<div style={{ background:G.bg3,border:`1px solid ${G.border}`,borderRadius:11,marginTop:3,overflow:"hidden",maxHeight:180,overflowY:"auto",zIndex:10,position:"relative" }}>
                    {TIMES.map(t=><div key={t} onClick={()=>{setTime(t);setShowTimeP(false);}} style={{ padding:"9px 13px",fontSize:13,color:t===digestTime?G.green:G.text,fontWeight:t===digestTime?700:400,background:t===digestTime?`${G.green}18`:"transparent",borderBottom:`1px solid ${G.border}`,cursor:"pointer" }}>{t===digestTime?"✓  ":""}{t}</div>)}
                  </div>}
                </div>
                <div style={{ background:`${G.green}14`,borderRadius:10,padding:"9px 12px",display:"flex",alignItems:"center",gap:8 }}>
                  <span>🗓️</span><div style={{ fontSize:12,color:G.green }}>Every <strong>{digestDay}</strong> at <strong>{digestTime}</strong></div>
                </div>
              </>}
            </Card>
            <Card style={{ marginBottom:20,border:`1px solid ${G.border}` }}>
              <div style={{ fontSize:11,color:G.textMuted,lineHeight:1.9 }}><strong style={{ color:G.textDim }}>Our promise:</strong> these are the only two notification types we will ever send.</div>
            </Card>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>setNotifScreen("preview")} style={{ flex:1,background:G.bg2,border:`1px solid ${G.border}`,borderRadius:14,padding:"13px",color:G.textDim,fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer" }}>Preview →</button>
              <button onClick={()=>{setSettingsSaved(true);setTimeout(()=>setSettingsSaved(false),2000);}} style={{ flex:2,background:`linear-gradient(135deg,${G.green},${G.greenDark})`,border:"none",borderRadius:14,padding:"13px",color:"#fff",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer" }}>{settingsSaved?"✓ Saved!":"Save settings"}</button>
            </div>
          </div>
        </div>
      )}
      {notifScreen==="preview"&&(
        <div style={{ background:"linear-gradient(180deg,#1a2a1a,#080808)",minHeight:"100vh",padding:"16px 18px 40px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28 }}>
            <span style={{ fontSize:14,fontWeight:700,color:"#fff" }}>9:41 AM</span>
            <button onClick={()=>setNotifScreen("settings")} style={{ background:"rgba(255,255,255,0.12)",border:"none",borderRadius:20,padding:"7px 15px",color:"#fff",fontSize:12,fontFamily:"Georgia,serif",cursor:"pointer" }}>← Settings</button>
          </div>
          <div style={{ textAlign:"center",marginBottom:28 }}><div style={{ fontSize:56,fontWeight:100,color:"#fff",letterSpacing:-3 }}>9:41</div><div style={{ fontSize:14,color:"rgba(255,255,255,0.6)",marginTop:4 }}>{digestDay} · {digestTime}</div></div>
          <div style={{ background:"rgba(28,28,30,0.95)",borderRadius:20,padding:"15px",marginBottom:12,border:"1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display:"flex",gap:12 }}>
              <div style={{ width:40,height:40,borderRadius:11,background:`linear-gradient(135deg,${G.green},${G.greenDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0 }}>🌿</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}><span style={{ fontSize:12,fontWeight:700,color:"#fff" }}>{firstName}'s Garden&Deal</span><span style={{ fontSize:10,color:"rgba(255,255,255,0.4)" }}>now</span></div>
                <div style={{ fontSize:13,fontWeight:700,color:"#fff",marginBottom:2 }}>⏰ Expires today — Fresh Mozzarella</div>
                <div style={{ fontSize:12,color:"rgba(255,255,255,0.6)",lineHeight:1.5 }}>You saved 🧀 Fresh Mozzarella at Whole Foods. Expires today!</div>
                <div style={{ display:"flex",gap:8,marginTop:10 }}>
                  <div style={{ background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"5px 12px",fontSize:11,color:"#fff",fontWeight:700,cursor:"pointer" }}>View deal</div>
                  <div style={{ background:"rgba(255,255,255,0.07)",borderRadius:8,padding:"5px 10px",fontSize:11,color:"rgba(255,255,255,0.5)",cursor:"pointer" }}>Dismiss</div>
                </div>
              </div>
            </div>
          </div>
          <button onClick={()=>{setNotifScreen("settings");setSub(null);}} style={{ marginTop:20,background:`linear-gradient(135deg,${G.green},${G.greenDark})`,border:"none",borderRadius:14,padding:"14px",color:"#fff",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",width:"100%" }}>Done</button>
        </div>
      )}
    </div>
  );

  // Recipe detail
  if(selectedRecipe) {
    const r=selectedRecipe;
    const usedPlants=r.usesPlantIds.map(pid=>plants.find(p=>p.id===pid)).filter(Boolean);
    const rDeals=r.dealIds.map(id=>ALL_DEALS.find(d=>d.id===id)).filter(Boolean);
    return (
      <div style={{ fontFamily:"Georgia,serif",background:G.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto" }}>
        <style>{CSS}</style>
        <div style={{ position:"relative",height:200,overflow:"hidden" }}>
          <img src={r.thumb} alt={r.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
          <div style={{ position:"absolute",inset:0,background:"linear-gradient(180deg,#080f0888,#080f08)" }} />
          <button onClick={()=>setRecipe(null)} style={{ position:"absolute",top:52,left:18,background:"rgba(0,0,0,0.5)",border:"none",borderRadius:20,padding:"7px 15px",color:"#fff",fontSize:12,fontFamily:"Georgia,serif",cursor:"pointer" }}>← Back</button>
          <div style={{ position:"absolute",bottom:16,left:20,right:20 }}>
            <div style={{ fontSize:22,fontWeight:800,color:"#fff",letterSpacing:-0.2 }}>{r.emoji} {r.name}</div>
            <div style={{ display:"flex",gap:8,marginTop:6 }}><Pill color="#fff" bg="rgba(255,255,255,0.15)">⏱ {r.time}</Pill><Pill color="#fff" bg="rgba(255,255,255,0.15)">{r.difficulty}</Pill></div>
          </div>
        </div>
        <div style={{ padding:"18px 20px 80px" }}>
          <Card style={{ marginBottom:14 }}>
            <div style={{ fontSize:11,color:G.textMuted,letterSpacing:2,textTransform:"uppercase",marginBottom:12 }}>From your garden</div>
            {usedPlants.map(p=>(
              <div key={p.id} style={{ display:"flex",alignItems:"center",gap:12,marginBottom:10 }}>
                <PlantPhoto src={p.thumb} emoji={p.emoji} color={p.color} size={40} radius={10} border={`2px solid ${p.color}`} />
                <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:700,color:G.text }}>{p.name}</div><StatusBadge plant={p} compact /></div>
                <Pill color={G.green}>✓ Ready</Pill>
              </div>
            ))}
          </Card>
          {rDeals.length>0&&(
            <Card style={{ marginBottom:14,border:`1px solid ${G.green}44`,background:`${G.green}08` }}>
              <div style={{ fontSize:11,color:G.green,letterSpacing:2,textTransform:"uppercase",marginBottom:12 }}>🏷️ On sale this week</div>
              {rDeals.map(d=>{
                const store=ALL_STORES.find(s=>s.id===d.storeId);
                return <div key={d.id} style={{ display:"flex",alignItems:"center",gap:12,marginBottom:8 }}>
                  <div style={{ width:40,height:40,borderRadius:11,background:`${G.green}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>{d.emoji}</div>
                  <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:700,color:G.text }}>{d.name}</div><div style={{ fontSize:11,color:G.textMuted }}>{store?.icon} {store?.name}</div></div>
                  <div style={{ textAlign:"right" }}><Pill color={G.green} bg={`${G.green}18`}>{d.off}</Pill><div style={{ fontSize:13,fontWeight:800,color:G.text,marginTop:4 }}>{d.price}</div></div>
                </div>;
              })}
            </Card>
          )}
          <Card style={{ marginBottom:14 }}>
            <div style={{ fontSize:11,color:G.textMuted,letterSpacing:2,textTransform:"uppercase",marginBottom:12 }}>How to make it</div>
            {r.steps.map((step,i)=>(
              <div key={i} style={{ display:"flex",gap:12,marginBottom:12 }}>
                <div style={{ width:24,height:24,borderRadius:"50%",background:`${G.green}22`,border:`1px solid ${G.green}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:G.green,flexShrink:0 }}>{i+1}</div>
                <div style={{ fontSize:13,color:G.text,lineHeight:1.7,paddingTop:2 }}>{step}</div>
              </div>
            ))}
          </Card>
          <button onClick={()=>{rDeals.forEach(d=>addToList(d));setRecipe(null);}} style={{ background:`linear-gradient(135deg,${G.green},${G.greenDark})`,border:"none",borderRadius:14,padding:"14px",color:"#fff",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",width:"100%",boxShadow:`0 6px 20px ${G.greenGlow}` }}>
            Add sale ingredients to list
          </button>
        </div>
      </div>
    );
  }

  // ── MAIN TABS ────────────────────────────────
  return (
    <div style={{ fontFamily:"Georgia,serif",background:G.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",position:"relative" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background:`linear-gradient(180deg,${G.bg2},${G.bg})`,padding:"52px 22px 18px",borderBottom:`1px solid ${G.border}`,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",background:G.greenGlow,filter:"blur(40px)" }} />
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,position:"relative" }}>
          <div>
            <div style={{ fontSize:10,letterSpacing:4,color:G.green,textTransform:"uppercase",marginBottom:4 }}>👋 Good morning, {firstName} · 📍 {location}</div>
            <div style={{ fontSize:25,fontWeight:800,color:G.text,lineHeight:1,letterSpacing:-0.5 }}>{appTitle}<span style={{ fontStyle:"italic",fontWeight:400 }}>&Deal</span></div>
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={()=>setSub("notif")} style={{ background:G.bg3,border:`1px solid ${G.border}`,borderRadius:"50%",width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,cursor:"pointer" }}>🔔</button>
            <button onClick={()=>setSub("list")} style={{ background:G.bg3,border:`1px solid ${G.border}`,borderRadius:"50%",width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,cursor:"pointer",position:"relative" }}>
              🛒{listItems.length>0&&<div style={{ position:"absolute",top:-4,right:-4,width:20,height:20,borderRadius:"50%",background:G.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",border:`2px solid ${G.bg}` }}>{listItems.length}</div>}
            </button>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,position:"relative" }}>
          {[{label:"Plants",value:plants.length},{label:"Ready",value:readyPlants.length},{label:"Saved",value:`$${totalSaving.toFixed(0)}`}].map(s=>(
            <div key={s.label} style={{ flex:1,background:G.glass,borderRadius:14,padding:"10px 8px",textAlign:"center",border:`1px solid ${G.glassBorder}` }}>
              <div style={{ fontSize:20,fontWeight:800,color:G.text }}>{s.value}</div>
              <div style={{ fontSize:9,color:G.textMuted,textTransform:"uppercase",letterSpacing:1.2,marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"18px 18px 110px" }}>

        {/* ════════ GARDEN TAB ════════ */}
        {tab===0&&(
          <div>
            {/* Sub-tab toggle */}
            <div style={{ display:"flex",background:G.bg2,borderRadius:14,padding:3,marginBottom:18,border:`1px solid ${G.border}` }}>
              {[["current","🌱 My Garden"],["history","📅 History"]].map(([key,label])=>(
                <div key={key} onClick={()=>setGardenView(key)} style={{ flex:1,padding:"9px 12px",borderRadius:11,background:gardenView===key?G.bg3:"transparent",textAlign:"center",fontSize:12,fontWeight:gardenView===key?800:400,color:gardenView===key?G.text:G.textMuted,cursor:"pointer",transition:"all 0.2s" }}>{label}</div>
              ))}
            </div>

            {gardenView==="current"&&(
              <div>
                {/* Header row */}
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                  <div style={{ fontSize:11,color:G.textMuted,fontStyle:"italic" }}>{plants.length>0?`${readyPlants.length} ready · ${growingPlants.length} growing`:"No plants this season"}</div>
                  {plants.length>0&&<button onClick={()=>setNewSeason(true)} style={{ background:"transparent",border:`1px solid ${G.red}55`,borderRadius:20,padding:"5px 12px",color:G.red,fontSize:11,fontFamily:"Georgia,serif",cursor:"pointer" }}>🌿 New season</button>}
                </div>

                {/* Empty state */}
                {plants.length===0&&(
                  <div style={{ animation:"fadeUp 0.4s ease both" }}>
                    <div style={{ textAlign:"center",padding:"36px 20px 28px",background:G.bg2,borderRadius:20,border:`2px dashed ${G.border}`,marginBottom:14 }}>
                      <div style={{ fontSize:48,marginBottom:14,opacity:0.5 }}>🌱</div>
                      <div style={{ fontSize:17,fontWeight:800,color:G.text,marginBottom:8 }}>Ready for a new season, {firstName}?</div>
                      <div style={{ fontSize:13,color:G.textMuted,lineHeight:1.9,marginBottom:20 }}>Scan your photos to add this season's plants.</div>
                      <button onClick={()=>setSub("scan")} style={{ background:`linear-gradient(135deg,${G.green},${G.greenDark})`,border:"none",borderRadius:14,padding:"13px 26px",color:"#fff",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer" }}>📸 Scan my garden photos</button>
                    </div>
                  </div>
                )}

                {/* ── 🌾 Ready to harvest — COOK + NURTURE ── */}
                {readyPlants.length>0&&(
                  <>
                    <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
                      <div style={{ flex:1,height:1,background:G.border }} />
                      <div style={{ fontSize:10,color:G.green,fontWeight:800,letterSpacing:2,textTransform:"uppercase",whiteSpace:"nowrap" }}>🌾 Ready to harvest</div>
                      <div style={{ flex:1,height:1,background:G.border }} />
                    </div>
                    {readyPlants.map(plant=>{
                      const cookDeals    = dealsForPlant(plant,"cook");
                      const nurtureDeals = dealsForPlant(plant,"nurture");
                      const isExpC = expandedMatch===`c${plant.id}`;
                      const isExpN = expandedMatch===`n${plant.id}`;
                      return (
                        <div key={plant.id}>
                          {/* Harvest status card with prediction */}
                          <Card onClick={()=>setExpanded(expandedPlant===plant.id?null:plant.id)} glow={expandedPlant===plant.id?plant.color:null} style={{ marginBottom:8 }}>
                            <div style={{ display:"flex",alignItems:"center",gap:13 }}>
                              <div style={{ position:"relative",flexShrink:0 }}>
                                <PlantPhoto src={plant.thumb} emoji={plant.emoji} color={plant.color} size={52} radius={14} border={`2.5px solid ${plant.color}66`} />
                                <div style={{ position:"absolute",bottom:-5,right:-5,width:22,height:22,borderRadius:"50%",background:STATUS_CONFIG[getFinalStatus(plant).status]?.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,border:`2px solid ${G.bg}` }}>{STATUS_CONFIG[getFinalStatus(plant).status]?.icon}</div>
                              </div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontWeight:800,fontSize:15,color:G.text }}>{plant.name}</div>
                                <div style={{ fontSize:11,color:G.textMuted,marginTop:1 }}>{plant.bed}</div>
                                <div style={{ marginTop:6 }}>
                                  <div style={{ width:"100%",height:4,background:G.bg3,borderRadius:2,overflow:"hidden" }}>
                                    <div style={{ height:"100%",width:`${STATUS_CONFIG[getFinalStatus(plant).status]?.bar||0}%`,background:`linear-gradient(90deg,${G.greenDark},${G.green})`,borderRadius:2 }} />
                                  </div>
                                </div>
                              </div>
                              <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5 }}>
                                <StatusBadge plant={plant} />
                                <div style={{ fontSize:11,color:G.green,fontWeight:700 }}>{cookDeals.length} cook deal{cookDeals.length!==1?"s":""}</div>
                              </div>
                            </div>
                            {expandedPlant===plant.id&&<HarvestDetail plant={plant} onOverride={handleOverride} />}
                          </Card>
                          {/* Cook match row */}
                          {cookDeals.length>0&&<MatchRow plant={plant} deals={cookDeals} type="cook" arrowColor={G.green} arrowIcon="🍳" isExpanded={isExpC} onToggle={()=>setExpandedMatch(isExpC?null:`c${plant.id}`)} onAddToList={addToList} listItems={listItems} />}
                          {/* Nurture match row */}
                          {nurtureDeals.length>0&&<MatchRow plant={plant} deals={nurtureDeals} type="nurture" arrowColor={G.blue} arrowIcon="🪴" isExpanded={isExpN} onToggle={()=>setExpandedMatch(isExpN?null:`n${plant.id}`)} onAddToList={addToList} listItems={listItems} />}
                        </div>
                      );
                    })}
                  </>
                )}

                {/* ── 🌱 Still growing — NURTURE only ── */}
                {growingPlants.length>0&&(
                  <>
                    <div style={{ display:"flex",alignItems:"center",gap:10,marginTop:8,marginBottom:14 }}>
                      <div style={{ flex:1,height:1,background:G.border }} />
                      <div style={{ fontSize:10,color:G.orange,fontWeight:800,letterSpacing:2,textTransform:"uppercase",whiteSpace:"nowrap" }}>🌱 Still growing</div>
                      <div style={{ flex:1,height:1,background:G.border }} />
                    </div>
                    {growingPlants.map(plant=>{
                      const nurtureDeals=dealsForPlant(plant,"nurture");
                      const isExpN=expandedMatch===`n${plant.id}`;
                      const timePred=getTimePrediction(plant);
                      return (
                        <div key={plant.id}>
                          <Card onClick={()=>setExpanded(expandedPlant===plant.id?null:plant.id)} style={{ marginBottom:8,opacity:0.9 }}>
                            <div style={{ display:"flex",alignItems:"center",gap:13 }}>
                              <div style={{ position:"relative",flexShrink:0 }}>
                                <PlantPhoto src={plant.thumb} emoji={plant.emoji} color={plant.color} size={52} radius={14} border={`2.5px solid ${plant.color}44`} />
                                <div style={{ position:"absolute",bottom:-5,right:-5,width:22,height:22,borderRadius:"50%",background:STATUS_CONFIG[getFinalStatus(plant).status]?.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,border:`2px solid ${G.bg}` }}>{STATUS_CONFIG[getFinalStatus(plant).status]?.icon}</div>
                              </div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontWeight:800,fontSize:15,color:G.text }}>{plant.name}</div>
                                <div style={{ fontSize:11,color:G.textMuted,marginTop:1 }}>{plant.bed}</div>
                                <div style={{ marginTop:6 }}>
                                  <div style={{ width:"100%",height:4,background:G.bg3,borderRadius:2,overflow:"hidden" }}>
                                    <div style={{ height:"100%",width:`${STATUS_CONFIG[getFinalStatus(plant).status]?.bar||0}%`,background:`linear-gradient(90deg,${G.greenDark},${STATUS_CONFIG[getFinalStatus(plant).status]?.color})`,borderRadius:2 }} />
                                  </div>
                                </div>
                                {timePred&&timePred.daysRemaining>0&&<div style={{ fontSize:10,color:G.orange,marginTop:4 }}>⏱ ~{timePred.daysRemaining} days to harvest</div>}
                              </div>
                              <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5 }}>
                                <StatusBadge plant={plant} />
                                <div style={{ fontSize:10,color:G.textMuted }}>Cook deals unlock when ready</div>
                              </div>
                            </div>
                            {expandedPlant===plant.id&&<HarvestDetail plant={plant} onOverride={handleOverride} />}
                          </Card>
                          {nurtureDeals.length>0&&<MatchRow plant={plant} deals={nurtureDeals} type="nurture" arrowColor={G.blue} arrowIcon="🪴" isExpanded={isExpN} onToggle={()=>setExpandedMatch(isExpN?null:`n${plant.id}`)} onAddToList={addToList} listItems={listItems} />}
                          {/* "Not ready yet" hint */}
                          <div style={{ background:`${G.orange}0d`,border:`1px solid ${G.orange}22`,borderRadius:12,padding:"9px 13px",marginBottom:14,fontSize:11,color:G.orange }}>
                            🍳 Cook deals will appear here once {plant.name.toLowerCase()} {getFinalStatus(plant).status==="Flowering"?"finishes flowering":"are ready to harvest"}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* ── 🌻 Grow new plants ── */}
                {/* ── 🌻 Expand your garden — smart expansion ── */}
                <ExpandGarden plants={plants} G={G} EXPAND_DEALS_DB={EXPAND_DEALS_DB} ALL_STORES={ALL_STORES} addToList={addToList} listItems={listItems} />

                {plants.length>0&&(
                  <div onClick={()=>setSub("scan")} style={{ border:`2px dashed ${G.border}`,borderRadius:16,padding:"14px",textAlign:"center",cursor:"pointer",marginTop:8 }}>
                    <div style={{ fontSize:22,marginBottom:4 }}>📸</div>
                    <div style={{ fontSize:13,color:G.green,fontWeight:700 }}>Re-scan photo library</div>
                    <div style={{ fontSize:11,color:G.textMuted,marginTop:2 }}>Updates statuses from new photos</div>
                  </div>
                )}
              </div>
            )}

            {gardenView==="history"&&(
              <div>
                <div style={{ fontSize:11,color:G.textMuted,marginBottom:16,fontStyle:"italic" }}>Your past harvests · {GARDEN_HISTORY.length} seasons recorded</div>
                <div style={{ display:"flex",gap:10,marginBottom:18 }}>
                  {[{label:"Seasons",value:"6"},{label:"Total yield",value:"16 kg"},{label:"Best",value:"🥒"}].map(s=>(
                    <div key={s.label} style={{ flex:1,background:G.bg2,borderRadius:14,padding:"12px 8px",textAlign:"center",border:`1px solid ${G.border}` }}>
                      <div style={{ fontSize:s.value.length>4?13:18,fontWeight:800,color:G.text }}>{s.value}</div>
                      <div style={{ fontSize:9,color:G.textMuted,textTransform:"uppercase",letterSpacing:1,marginTop:3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {GARDEN_HISTORY.map((h,i)=>(
                  <Card key={h.id} style={{ marginBottom:12,animation:`fadeUp 0.4s ease ${i*0.07}s both` }}>
                    <div style={{ display:"flex",gap:12,alignItems:"flex-start",marginBottom:10 }}>
                      <div style={{ width:44,height:44,borderRadius:12,background:`${h.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,border:`1px solid ${h.color}33`,flexShrink:0 }}>{h.emoji}</div>
                      <div style={{ flex:1 }}><div style={{ fontWeight:800,fontSize:14,color:G.text }}>{h.name}</div><div style={{ fontSize:11,color:G.textMuted,marginTop:1 }}>{h.season} · {h.bed}</div><Stars n={h.rating} /></div>
                      <div style={{ textAlign:"right" }}><div style={{ fontSize:17,fontWeight:800,color:h.color }}>{h.yield}</div><div style={{ fontSize:9,color:G.textMuted,marginTop:1 }}>harvested</div></div>
                    </div>
                    <div style={{ display:"flex",gap:3,marginBottom:8 }}>
                      {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m=>(
                        <div key={m} style={{ flex:1,height:5,borderRadius:2,background:h.months.includes(m)?h.color:G.bg3 }} />
                      ))}
                    </div>
                    <div style={{ background:G.bg3,borderRadius:10,padding:"8px 12px",fontSize:11,color:G.textMuted,fontStyle:"italic" }}>"{h.notes}"</div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════ DEALS TAB ════════ */}
        {tab===1&&(
          <div>
            <div style={{ fontSize:11,color:G.textMuted,marginBottom:16,fontStyle:"italic" }}>{activeStores.length} stores · updated this week</div>
            {/* Seasonal tips */}
            <div style={{ background:`linear-gradient(135deg,${G.bg3},${G.bg2})`,border:`1px solid ${G.green}44`,borderRadius:18,padding:"15px 17px",marginBottom:18,boxShadow:`0 0 24px ${G.greenGlow}` }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
                <div style={{ width:42,height:42,borderRadius:12,background:`${G.green}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,border:`1px solid ${G.green}33` }}>🌤️</div>
                <div><div style={{ fontSize:14,fontWeight:800,color:G.text }}>Plant now · Early Summer</div><div style={{ fontSize:11,color:G.textMuted }}>Mission District · Soil 18°C</div></div>
              </div>
              <div style={{ display:"flex",gap:8,marginBottom:12 }}>
                {["All","Plant Now","With Deals"].map(f=>(
                  <div key={f} onClick={()=>setTipFilter(f)} style={{ padding:"4px 12px",borderRadius:20,background:tipFilter===f?G.green:"transparent",color:tipFilter===f?"#fff":G.textMuted,fontSize:11,fontWeight:tipFilter===f?700:400,border:`1px solid ${tipFilter===f?G.green:G.border}`,cursor:"pointer",transition:"all 0.2s" }}>{f}</div>
                ))}
              </div>
              {SEASON_TIPS.filter(t=>tipFilter==="Plant Now"?t.timing==="Plant now":tipFilter==="With Deals"?t.dealAvailable:true).map((tip,i)=>(
                <div key={tip.id} style={{ display:"flex",alignItems:"center",gap:11,padding:"9px 0",borderBottom:i<SEASON_TIPS.length-1?`1px solid ${G.border}`:"none" }}>
                  <div style={{ width:36,height:36,borderRadius:10,background:`${tip.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,border:`1px solid ${tip.color}33`,flexShrink:0 }}>{tip.emoji}</div>
                  <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:700,color:G.text }}>{tip.name}</div><div style={{ fontSize:11,color:G.textMuted,marginTop:1,lineHeight:1.5 }}>{tip.reason}</div></div>
                  <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
                    <Pill color={tip.timing==="Plant now"?G.green:G.orange} bg={tip.timing==="Plant now"?`${G.green}18`:G.orangeSoft}>{tip.timing}</Pill>
                    {tip.dealAvailable&&<Pill color={G.green} bg={`${G.green}18`}>Deal ✓</Pill>}
                  </div>
                </div>
              ))}
            </div>

            {/* All deals with 3-type logic */}
            <div style={{ display:"flex",gap:8,marginBottom:14 }}>
              {["All","Cook 🍳","Nurture 🪴","Grow 🌱"].map(f=>(
                <div key={f} onClick={()=>setDealFilter(f)} style={{ padding:"5px 11px",borderRadius:20,whiteSpace:"nowrap",background:dealFilter===f?G.bg3:"transparent",color:dealFilter===f?G.text:G.textMuted,fontSize:10,fontWeight:dealFilter===f?800:400,border:`1px solid ${dealFilter===f?G.border:G.borderDim}`,cursor:"pointer",transition:"all 0.2s" }}>{f}</div>
              ))}
            </div>

            {ALL_DEALS.filter(d=>{
              if(!activeStores.includes(d.storeId)) return false;
              if(dealFilter==="Cook 🍳"&&d.type!=="cook") return false;
              if(dealFilter==="Nurture 🪴"&&d.type!=="nurture") return false;
              if(dealFilter==="Grow 🌱"&&d.type!=="grow") return false;
              // Hide cook deals for unready plants
              if(d.type==="cook"&&d.plantId){
                const plant=plants.find(p=>p.id===d.plantId);
                if(plant&&!STATUS_CONFIG[getFinalStatus(plant).status]?.cookReady) return false;
              }
              return true;
            }).map(d=>{
              const store=ALL_STORES.find(s=>s.id===d.storeId);
              const plant=d.plantId?plants.find(p=>p.id===d.plantId):null;
              const inList=listItems.find(l=>l.id===d.id);
              const typeColor=d.type==="cook"?G.green:d.type==="nurture"?G.blue:G.orange;
              return (
                <div key={d.id} style={{ background:G.bg2,borderRadius:16,padding:"13px 14px",marginBottom:10,position:"relative",overflow:"hidden" }}>
                  <div style={{ position:"absolute",top:0,left:0,width:4,height:"100%",background:d.color,borderRadius:"4px 0 0 4px" }} />
                  <div style={{ paddingLeft:9 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                      <div style={{ display:"flex",gap:11,alignItems:"center" }}>
                        <div style={{ width:44,height:44,borderRadius:12,background:`${d.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,border:`1px solid ${d.color}33` }}>{d.emoji}</div>
                        <div><div style={{ fontWeight:700,fontSize:14,color:G.text }}>{d.name}</div><div style={{ fontSize:11,color:G.textMuted,marginTop:2 }}>{store?.icon} {store?.name}</div></div>
                      </div>
                      <button onClick={()=>addToList(d)} style={{ background:inList?`${G.green}22`:"transparent",border:`1px solid ${inList?G.green:G.border}`,borderRadius:9,padding:"5px 10px",color:inList?G.green:G.textMuted,fontSize:11,fontFamily:"Georgia,serif",cursor:"pointer" }}>{inList?"✓":"+ List"}</button>
                    </div>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap" }}>
                      <Pill color={d.color} bg={`${d.color}18`}>{d.off} OFF</Pill>
                      <span style={{ fontSize:15,fontWeight:800,color:G.text }}>{d.price}</span>
                      <span style={{ marginLeft:"auto",fontSize:10,color:G.textMuted }}>Exp {d.expires}</span>
                    </div>
                    <div style={{ display:"flex",alignItems:"center",gap:6,background:`${typeColor}12`,borderRadius:9,padding:"6px 10px" }}>
                      {plant&&<PlantPhoto src={plant.thumb} emoji={plant.emoji} color={plant.color} size={20} radius={5} />}
                      <svg width="18" height="10" viewBox="0 0 18 10" style={{ flexShrink:0 }}><line x1="0" y1="5" x2="11" y2="5" stroke={typeColor} strokeWidth="1.5" strokeDasharray="3,2" opacity="0.7"/><polygon points="11,2 17,5 11,8" fill={typeColor} opacity="0.7"/></svg>
                      <span style={{ fontSize:11,color:typeColor,fontWeight:700 }}>
                        {d.type==="cook"?`🍳 Cook with your ${plant?.name}`
                          :d.type==="nurture"?`🪴 Helps your ${plant?.name} thrive`
                          :`🌱 New plant for your garden`} · {d.why}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ════════ FOR YOU TAB ════════ */}
        {tab===2&&(
          <div>
            <div style={{ fontSize:11,color:G.textMuted,marginBottom:16,fontStyle:"italic" }}>Personalised from your {plants.length} plants · {activeStores.length} stores</div>
            {/* Recipes — only from ready plants */}
            <div style={{ fontSize:13,fontWeight:800,color:G.text,marginBottom:14,letterSpacing:-0.2 }}>🍽️ Recipes from your garden</div>
            {RECIPES.filter(r=>r.usesPlantIds.some(pid=>{
              const plant=plants.find(p=>p.id===pid);
              return plant&&STATUS_CONFIG[getFinalStatus(plant).status]?.cookReady;
            })).map((r,i)=>{
              const usedPlants=r.usesPlantIds.map(pid=>plants.find(p=>p.id===pid)).filter(p=>p&&STATUS_CONFIG[getFinalStatus(p).status]?.cookReady);
              if(!usedPlants.length) return null;
              return (
                <div key={r.id} onClick={()=>setRecipe(r)} style={{ borderRadius:18,overflow:"hidden",marginBottom:14,cursor:"pointer",border:`1px solid ${G.border}`,animation:`fadeUp 0.4s ease ${i*0.08}s both` }}>
                  <div style={{ position:"relative",height:130,overflow:"hidden" }}>
                    <img src={r.thumb} alt={r.name} style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                    <div style={{ position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 30%,#080f08ee)" }} />
                    <div style={{ position:"absolute",bottom:12,left:14,right:14 }}>
                      <div style={{ fontSize:16,fontWeight:800,color:"#fff",letterSpacing:-0.2 }}>{r.emoji} {r.name}</div>
                      <div style={{ display:"flex",gap:8,marginTop:5 }}><Pill color="#fff" bg="rgba(255,255,255,0.15)">⏱ {r.time}</Pill><Pill color="#fff" bg="rgba(255,255,255,0.15)">{r.difficulty}</Pill></div>
                    </div>
                    {r.dealIds.length>0&&<div style={{ position:"absolute",top:10,right:10,background:G.green,borderRadius:20,padding:"3px 9px",fontSize:10,fontWeight:700,color:"#fff" }}>🏷️ Deals available</div>}
                  </div>
                  <div style={{ background:G.bg2,padding:"11px 14px",display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ display:"flex",gap:-4 }}>
                      {usedPlants.map(p=><div key={p.id} style={{ width:26,height:26,borderRadius:"50%",background:`${p.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,border:`2px solid ${G.bg2}` }}>{p.emoji}</div>)}
                    </div>
                    <div style={{ fontSize:12,color:G.textMuted,flex:1 }}>Uses your {usedPlants.map(p=>p.name).join(" & ")}</div>
                    <span style={{ fontSize:14,color:G.textMuted }}>›</span>
                  </div>
                </div>
              );
            })}

            {/* Plants not yet ready — coming soon */}
            {growingPlants.length>0&&(
              <div style={{ background:G.bg2,borderRadius:16,padding:"14px 16px",border:`1px solid ${G.border}`,marginTop:8 }}>
                <div style={{ fontSize:11,color:G.textMuted,letterSpacing:2,textTransform:"uppercase",marginBottom:12 }}>⏳ More recipes coming soon</div>
                {growingPlants.map(p=>{
                  const timePred=getTimePrediction(p);
                  return (
                    <div key={p.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${G.border}` }}>
                      <PlantPhoto src={p.thumb} emoji={p.emoji} color={p.color} size={34} radius={9} />
                      <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:700,color:G.text }}>{p.name}</div><StatusBadge plant={p} compact /></div>
                      <div style={{ fontSize:11,color:G.orange }}>{timePred?.daysRemaining>0?`~${timePred.daysRemaining}d`:"Almost!"}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════ PROFILE TAB ════════ */}
        {tab===3&&(
          <div>
            <div style={{ textAlign:"center",marginBottom:22,padding:"8px 0" }}>
              {user?.avatar
                ? <img src={user.avatar} alt={userName} style={{ width:76,height:76,borderRadius:"50%",objectFit:"cover",margin:"0 auto 14px",display:"block",boxShadow:`0 0 0 6px ${G.greenGlow}`,border:`2px solid ${G.green}` }} />
                : <div style={{ width:76,height:76,borderRadius:"50%",background:`linear-gradient(135deg,${G.green},${G.greenDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,margin:"0 auto 14px",boxShadow:`0 0 0 6px ${G.greenGlow}` }}>{firstName[0]?.toUpperCase()||"🌿"}</div>
              }
              <div style={{ fontSize:20,fontWeight:800,color:G.text,letterSpacing:-0.3 }}>{userName}</div>
              <div style={{ fontSize:12,color:G.textMuted,marginTop:4 }}>📍 {location}</div>
              {user?.provider&&(
                <div style={{ marginTop:8,display:"inline-flex",alignItems:"center",gap:6,background:G.bg3,border:`1px solid ${G.border}`,borderRadius:20,padding:"4px 12px" }}>
                  <span style={{ fontSize:13 }}>{user.provider==="google"?"🔵":user.provider==="apple"?"⚫":"📧"}</span>
                  <span style={{ fontSize:11,color:G.textMuted }}>Signed in with {user.provider==="guest"?"guest access":user.provider.charAt(0).toUpperCase()+user.provider.slice(1)}</span>
                </div>
              )}
            </div>
            <div style={{ display:"flex",background:G.bg2,borderRadius:14,padding:3,marginBottom:18,border:`1px solid ${G.border}` }}>
              {[["stats","📊 Stats"],["badges","🏆 Badges"],["history","📅 History"]].map(([key,label])=>(
                <div key={key} onClick={()=>setProfileTab(key)} style={{ flex:1,padding:"8px 10px",borderRadius:11,background:profileTab===key?G.bg3:"transparent",textAlign:"center",fontSize:11,fontWeight:profileTab===key?800:400,color:profileTab===key?G.text:G.textMuted,cursor:"pointer",transition:"all 0.2s" }}>{label}</div>
              ))}
            </div>

            {profileTab==="stats"&&(
              <div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18 }}>
                  {[{label:"Plants grown",value:PROFILE.stats.plantsGrown,icon:"🌱",color:G.green},{label:"Total harvests",value:PROFILE.stats.harvests,icon:"🌾",color:G.orange},{label:"Deals used",value:PROFILE.stats.dealsUsed,icon:"🏷️",color:G.blue},{label:"Total saved",value:PROFILE.stats.saved,icon:"💰",color:G.green},{label:"Recipes cooked",value:PROFILE.stats.recipesCooked,icon:"🍽️",color:G.purple},{label:"Stores tracked",value:activeStores.length,icon:"📍",color:G.orange}].map(s=>(
                    <Card key={s.label} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:24,marginBottom:6 }}>{s.icon}</div>
                      <div style={{ fontSize:20,fontWeight:800,color:s.color }}>{s.value}</div>
                      <div style={{ fontSize:10,color:G.textMuted,textTransform:"uppercase",letterSpacing:1,marginTop:3 }}>{s.label}</div>
                    </Card>
                  ))}
                </div>
                <Card>
                  <div style={{ fontSize:11,color:G.textMuted,letterSpacing:2,textTransform:"uppercase",marginBottom:12 }}>Current garden status</div>
                  {plants.map(p=>(
                    <div key={p.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"9px 0",borderBottom:`1px solid ${G.border}` }}>
                      <PlantPhoto src={p.thumb} emoji={p.emoji} color={p.color} size={36} radius={9} />
                      <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:700,color:G.text }}>{p.name}</div><div style={{ fontSize:11,color:G.textMuted }}>{p.bed}</div></div>
                      <StatusBadge plant={p} compact />
                    </div>
                  ))}
                </Card>
              </div>
            )}

            {profileTab==="badges"&&(
              <div>
                <div style={{ fontSize:11,color:G.textMuted,marginBottom:14,fontStyle:"italic" }}>{PROFILE.badges.filter(b=>b.earned).length} of {PROFILE.badges.length} earned</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                  {PROFILE.badges.map((b,i)=>(
                    <Card key={b.label} style={{ textAlign:"center",opacity:b.earned?1:0.4,border:`1px solid ${b.earned?G.borderBright:G.border}`,animation:`fadeUp 0.4s ease ${i*0.07}s both` }}>
                      <div style={{ fontSize:32,marginBottom:8,filter:b.earned?"none":"grayscale(1)" }}>{b.emoji}</div>
                      <div style={{ fontSize:12,fontWeight:700,color:b.earned?G.text:G.textMuted }}>{b.label}</div>
                      <div style={{ fontSize:10,color:b.earned?G.green:G.textMuted,marginTop:4 }}>{b.earned?"✓ Earned":"Locked"}</div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {profileTab==="history"&&(
              <div>
                {GARDEN_HISTORY.map((h,i)=>(
                  <Card key={h.id} style={{ marginBottom:12,animation:`fadeUp 0.4s ease ${i*0.07}s both` }}>
                    <div style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
                      <div style={{ width:42,height:42,borderRadius:12,background:`${h.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,border:`1px solid ${h.color}33`,flexShrink:0 }}>{h.emoji}</div>
                      <div style={{ flex:1 }}><div style={{ fontWeight:800,fontSize:14,color:G.text }}>{h.name}</div><div style={{ fontSize:11,color:G.textMuted,marginTop:1 }}>{h.season}</div><Stars n={h.rating} /><div style={{ display:"flex",gap:3,marginTop:7 }}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m=><div key={m} style={{ flex:1,height:4,borderRadius:2,background:h.months.includes(m)?h.color:G.bg3 }} />)}</div></div>
                      <div style={{ textAlign:"right" }}><div style={{ fontSize:16,fontWeight:800,color:h.color }}>{h.yield}</div><div style={{ fontSize:9,color:G.textMuted,marginTop:1 }}>harvested</div></div>
                    </div>
                    <div style={{ marginTop:9,background:G.bg3,borderRadius:10,padding:"7px 11px",fontSize:11,color:G.textMuted,fontStyle:"italic" }}>"{h.notes}"</div>
                  </Card>
                ))}
              </div>
            )}

            {/* Logout button */}
            <button onClick={()=>setShowLogout(true)} style={{ width:"100%",marginTop:8,padding:"14px",borderRadius:15,border:`1.5px solid ${G.red}44`,background:`${G.red}0d`,color:G.red,fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
              ↩ Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:G.bg,borderTop:`1px solid ${G.border}`,padding:"10px 0 24px",display:"flex",justifyContent:"space-around" }}>
        {NAV.map((n,i)=>(
          <button key={n.label} onClick={()=>setTab(i)} style={{ background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 12px",transform:tab===i?"scale(1.05)":"scale(1)",transition:"transform 0.15s" }}>
            <span style={{ fontSize:20,filter:tab===i?`drop-shadow(0 0 8px ${G.green}aa)`:"none",transition:"filter 0.2s" }}>{n.icon}</span>
            <span style={{ fontSize:9,fontFamily:"Georgia,serif",color:tab===i?G.green:G.textMuted,fontWeight:tab===i?800:400,letterSpacing:0.8 }}>{n.label.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {/* New season modal */}
      {showNewSeason&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }} onClick={()=>setNewSeason(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:G.bg2,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,padding:"28px 24px 44px",border:`1px solid ${G.border}`,animation:"sheetUp 0.35s cubic-bezier(0.34,1.2,0.64,1) both" }}>
            <div style={{ width:40,height:4,borderRadius:2,background:G.bg3,margin:"0 auto 22px" }} />
            <div style={{ textAlign:"center",marginBottom:22 }}>
              <div style={{ fontSize:42,marginBottom:10 }}>🌿</div>
              <div style={{ fontSize:20,fontWeight:800,color:G.text,marginBottom:8 }}>Start a new season?</div>
              <div style={{ fontSize:13,color:G.textMuted,lineHeight:1.9 }}>Clears {plants.length} current plants. Garden History & stores are kept.</div>
            </div>
            <div style={{ background:G.bg3,borderRadius:13,padding:"12px 14px",marginBottom:18 }}>
              {[{icon:"✓",text:"Garden History saved",c:G.green},{icon:"✓",text:"Store tracking stays active",c:G.green},{icon:"↺",text:"Current plants cleared",c:G.orange}].map(r=>(
                <div key={r.text} style={{ display:"flex",gap:10,alignItems:"center",padding:"6px 0" }}>
                  <span style={{ fontSize:13,color:r.c,fontWeight:700,flexShrink:0 }}>{r.icon}</span>
                  <span style={{ fontSize:12,color:G.textMuted }}>{r.text}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>setNewSeason(false)} style={{ flex:1,background:"transparent",border:`1px solid ${G.border}`,borderRadius:13,padding:"13px",color:G.textMuted,fontSize:14,fontFamily:"Georgia,serif",cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>{setActivePlants([]);setNewSeason(false);setExpanded(null);showToast("🌿 Garden cleared — ready for new season!");}} style={{ flex:2,background:`linear-gradient(135deg,${G.green},${G.greenDark})`,border:"none",borderRadius:13,padding:"13px",color:"#fff",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer" }}>Start new season →</button>
            </div>
          </div>
        </div>
      )}

      {/* Logout confirmation sheet */}
      {showLogout&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }} onClick={()=>setShowLogout(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:G.bg2,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,padding:"28px 24px 48px",border:`1px solid ${G.border}`,animation:"sheetUp 0.35s cubic-bezier(0.34,1.2,0.64,1) both" }}>
            <div style={{ width:40,height:4,borderRadius:2,background:G.bg3,margin:"0 auto 24px" }} />
            <div style={{ textAlign:"center",marginBottom:24 }}>
              <div style={{ width:64,height:64,borderRadius:"50%",background:`${G.red}18`,border:`2px solid ${G.red}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 14px" }}>↩</div>
              <div style={{ fontSize:20,fontWeight:800,color:G.text,marginBottom:8 }}>Sign out?</div>
              <div style={{ fontSize:13,color:G.textMuted,lineHeight:1.8 }}>You'll need to sign in again to access your garden.</div>
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>setShowLogout(false)} style={{ flex:1,background:"transparent",border:`1px solid ${G.border}`,borderRadius:13,padding:"14px",color:G.textMuted,fontSize:14,fontFamily:"Georgia,serif",cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>{ setShowLogout(false); onLogout(); }} style={{ flex:2,background:`linear-gradient(135deg,${G.red},#b03030)`,border:"none",borderRadius:13,padding:"14px",color:"#fff",fontSize:14,fontFamily:"Georgia,serif",fontWeight:700,cursor:"pointer" }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast&&<div style={{ position:"fixed",bottom:88,left:"50%",transform:"translateX(-50%)",background:G.green,color:"#fff",borderRadius:24,padding:"10px 22px",fontSize:13,fontWeight:700,animation:"toastIn 2.2s ease both",whiteSpace:"nowrap",zIndex:100,boxShadow:`0 4px 20px ${G.greenGlow}` }}>{toast}</div>}
    </div>
  );
}

const CSS = `
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes toastIn{0%{opacity:0;transform:translate(-50%,12px)}12%{opacity:1;transform:translate(-50%,0)}88%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,8px)}}
  @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
  @keyframes scanLine{0%,100%{top:8%;opacity:1}50%{top:86%;opacity:0.5}}
  @keyframes dashMove{from{stroke-dashoffset:18}to{stroke-dashoffset:0}}
`;
