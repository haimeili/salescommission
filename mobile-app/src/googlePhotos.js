// Known plants — labels Vision API might return for each
const PLANT_LABELS = {
  1: ["tomato","tomatoes","cherry tomato","roma tomato","solanum lycopersicum","tomato plant"],
  2: ["basil","sweet basil","ocimum basilicum","herb","thai basil"],
  3: ["zucchini","courgette","marrow","summer squash","cucurbita"],
  4: ["pepper","peppers","bell pepper","capsicum","chili","chilli","jalapeño","paprika"],
  5: ["kale","curly kale","brassica","leafy green","collard","cavolo nero"],
};

// Photo categories to search in Google Photos
const PHOTO_FILTERS = {
  contentFilter: {
    includedContentCategories: ["GARDENS","FOOD_AND_DRINK","NATURE"],
  },
  mediaTypeFilter: { mediaTypes: ["PHOTO"] },
};

export async function fetchGardenPhotos(accessToken) {
  const res = await fetch(
    "https://photoslibrary.googleapis.com/v1/mediaItems:search",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filters: PHOTO_FILTERS, pageSize: 25 }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Photos API error ${res.status}`);
  }
  const data = await res.json();
  return (data.mediaItems || []).filter(
    (m) => m.mimeType?.startsWith("image/")
  );
}

export async function detectPlantsInPhoto(baseUrl, visionKey) {
  // Google Photos baseUrl needs =w800-h800 suffix for a usable size
  const imageUri = `${baseUrl}=w800-h800`;
  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${visionKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUri } },
            features: [
              { type: "LABEL_DETECTION", maxResults: 15 },
              { type: "WEB_DETECTION",   maxResults: 5  },
            ],
          },
        ],
      }),
    }
  );
  if (!res.ok) throw new Error(`Vision API error ${res.status}`);
  const data = await res.json();
  return data.responses?.[0] || {};
}

export function matchPlantFromLabels(visionResponse) {
  const labels = [
    ...(visionResponse.labelAnnotations || []).map((l) =>
      l.description.toLowerCase()
    ),
    ...(visionResponse.webDetection?.webEntities || []).map((e) =>
      (e.description || "").toLowerCase()
    ),
  ];

  for (const [idStr, keywords] of Object.entries(PLANT_LABELS)) {
    const id = Number(idStr);
    if (keywords.some((kw) => labels.some((l) => l.includes(kw)))) {
      return id;
    }
  }
  return null; // no match
}

// Scan a list of photos and return detected plant IDs (deduped)
export async function scanPhotosForPlants(photos, visionKey, onProgress) {
  const detected = new Map(); // plantId → { photo, confidence }

  for (let i = 0; i < photos.length; i++) {
    onProgress(Math.round(((i + 1) / photos.length) * 100), i);
    try {
      const result  = await detectPlantsInPhoto(photos[i].baseUrl, visionKey);
      const plantId = matchPlantFromLabels(result);
      if (plantId && !detected.has(plantId)) {
        const best = result.labelAnnotations?.[0];
        detected.set(plantId, {
          photo,
          confidence: Math.round((best?.score || 0.85) * 100),
          thumb: `${photos[i].baseUrl}=w200-h200`,
        });
      }
    } catch {
      // skip photo if Vision call fails
    }
  }

  return detected;
}
