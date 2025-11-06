import Content from "../models/Content.js";
import User from "../models/User.js";
import path from "path";

export const home = async (req, res) => {
  // Serve the static catalog page; the client will fetch data from /api
  return res.sendFile(path.join(process.cwd(), "public", "catalog.html"));
};
export const byGenre = async (req, res) => {
  // Keep existing server-side genre rendering for backward compatibility
  const items = await Content.find({ genres: req.params.genre })
    .sort({ popularity: -1 })
    .limit(60);
  // For now, send static page as well — client can call /api/genre/:genre
  return res.sendFile(path.join(process.cwd(), "public", "catalog.html"));
};
// (previous server-side render removed; client will use /api/genre/:genre)
