import fetch from "node-fetch";
export async function omdb(title, year) {
  const k = process.env.OMDB_API_KEY;
  if (!k) return null;
  const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}${year ? "&y=" + year : ""}&apikey=${k}`;
  try {
    const r = await fetch(url);
    const d = await r.json();
    if (d?.imdbRating && d.imdbRating !== "N/A")
      return parseFloat(d.imdbRating);
  } catch {}
  return null;
}
