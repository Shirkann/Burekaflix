import fetch from "node-fetch";

const OMDB_ENDPOINT = "https://www.omdbapi.com/";

function normalizeRating(value) {
  if (!value || value === "N/A") return null;
  const asNumber = Number(value);
  if (Number.isFinite(asNumber)) {
    return asNumber;
  }
  return null;
}

function buildUrl({ title, apiKey }) {
  const params = new URLSearchParams();
  params.append("t", title);
  params.append("apikey", apiKey);
  return `${OMDB_ENDPOINT}?${params.toString()}`;
}

export async function fetchOmdbDetails({ title } = {}) {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey || !title) return null;

  const trimmedTitle = title.trim();
  if (!trimmedTitle) return null;

  const url = buildUrl({ title, apiKey });

  let data;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OMDb responded with status ${response.status}`);
    }
    data = await response.json();
  } catch (error) {
    console.warn("OMDb request failed:", error.message);
    return null;
  }

  if (data && data.Response === "False") return null;

  const imdbRating = normalizeRating(data ? data.imdbRating : null);
  let posterUrl;
  if (data && data.Poster && data.Poster !== "N/A") {
    posterUrl = data.Poster;
  }

  const result = { raw: data };
  if (typeof imdbRating === "number") {
    result.imdbRating = imdbRating;
  }
  if (posterUrl) {
    result.posterUrl = posterUrl;
  }
  return result;
}

export async function omdb(title) {
  const details = await fetchOmdbDetails({ title });
  if (details && typeof details.imdbRating === "number") {
    return details.imdbRating;
  }
  return null;
}
