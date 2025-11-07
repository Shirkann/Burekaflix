import Content from "../models/Content.js";
import User from "../models/User.js";
import path from "path";

export const home = async (req, res) => {
  return res.sendFile(path.join(process.cwd(), "public", "catalog.html"));
};
export const byGenre = async (req, res) => {
  const items = await Content.find({ genres: req.params.genre })
    .sort({ popularity: -1 })
    .limit(60);
  return res.sendFile(path.join(process.cwd(), "public", "catalog.html"));
};
