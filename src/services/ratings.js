import fetch from "node-fetch";

const OMDB_ENDPOINT = "https://www.omdbapi.com/";

function normalizeRating(value) {
  if (!value || value === "N/A") return null;
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : null;
}

function buildUrl({ title, year, apiKey }) {
  const params = new URLSearchParams();
  params.append("t", title.trim());
  if (year) params.append("y", String(year));
  params.append("apikey", apiKey);
  return `${OMDB_ENDPOINT}?${params.toString()}`;
}

export async function fetchOmdbDetails({ title, year } = {}) {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey || !title?.trim()) return null;

  const url = buildUrl({ title, year, apiKey });

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OMDb responded with status ${response.status}`);
    const data = await response.json();
    if (data?.Response === "False") return null;

    const imdbRating = normalizeRating(data?.imdbRating);
    const posterUrl =
      data?.Poster && data.Poster !== "N/A" ? data.Poster : undefined;

    return {
      imdbRating: imdbRating ?? undefined,
      posterUrl,
      raw: data,
    };
  } catch (error) {
    console.warn("OMDb request failed:", error.message);
    return null;
  }
}

export async function omdb(title, year) {
  const details = await fetchOmdbDetails({ title, year });
  return details?.imdbRating ?? null;
}
