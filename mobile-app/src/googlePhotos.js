// Google Photos API — fetch garden photos from last N years
export async function fetchGardenPhotos(accessToken, years = 2) {
  const now   = new Date();
  const start = new Date(now);
  start.setFullYear(start.getFullYear() - years);

  const body = {
    filters: {
      dateFilter: {
        ranges: [{
          startDate: { year: start.getFullYear(), month: start.getMonth() + 1, day: start.getDate() },
          endDate:   { year: now.getFullYear(),   month: now.getMonth() + 1,   day: now.getDate()   },
        }],
      },
      contentFilter: {
        includedContentCategories: ["GARDENS", "FOOD_AND_DRINK", "NATURE"],
      },
      mediaTypeFilter: { mediaTypes: ["PHOTO"] },
    },
    pageSize: 50,
  };

  const res = await fetch("https://photoslibrary.googleapis.com/v1/mediaItems:search", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Photos API error ${res.status}`);
  }
  const data = await res.json();
  return (data.mediaItems || []).filter(m => m.mimeType?.startsWith("image/"));
}

// Call Google Cloud Vision on a single photo URL
export async function detectPlantsInPhoto(baseUrl, visionKey) {
  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${visionKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{
          image: { source: { imageUri: `${baseUrl}=w800-h800` } },
          features: [
            { type: "LABEL_DETECTION", maxResults: 15 },
            { type: "WEB_DETECTION",   maxResults: 5  },
          ],
        }],
      }),
    }
  );
  if (!res.ok) throw new Error(`Vision API ${res.status}`);
  const data = await res.json();
  return data.responses?.[0] || {};
}

// Map Vision labels → plant id
const PLANT_LABELS = {
  1: ["tomato","tomatoes","cherry tomato","roma tomato","solanum lycopersicum"],
  2: ["basil","sweet basil","ocimum basilicum","thai basil"],
  3: ["zucchini","courgette","summer squash","cucurbita","marrow"],
  4: ["pepper","bell pepper","capsicum","chili","chilli","jalapeño","paprika"],
  5: ["kale","curly kale","brassica","collard","cavolo nero","leafy green"],
};

export function matchPlantFromLabels(visionResponse) {
  const labels = [
    ...(visionResponse.labelAnnotations || []).map(l => l.description.toLowerCase()),
    ...(visionResponse.webDetection?.webEntities || []).map(e => (e.description || "").toLowerCase()),
  ];
  for (const [idStr, keywords] of Object.entries(PLANT_LABELS)) {
    if (keywords.some(kw => labels.some(l => l.includes(kw)))) return Number(idStr);
  }
  return null;
}
