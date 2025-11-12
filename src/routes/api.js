import { Router } from "express";
import { auth, profile } from "./guards.js";
import {
  catalogList,
  genreList,
  genreOptions,
  genreNewest,
  genreContents,
  popular,
  newestByGenre,
  contentDetails,
  profilesHistory,
  profileWatchedList,
  profilesRecommendations,
  profilePlayStats,
  genrePopularityStats,
  continueWatchingList,
  continueWatchingEntry,
  upsertContinueWatching,
} from "../controllers/api.js";
import Content from "../models/Content.js";

const r = Router();

r.get("/catalog", auth, catalogList);
r.get("/genres", auth, genreOptions);
r.get("/genres/:genre/newest", auth, profile, genreNewest);
r.get("/genres/:genre/contents", auth, profile, genreContents);
r.get("/genre/:genre", auth, genreList);
r.get("/popular", auth, popular);
r.get("/newest-by-genre", auth, newestByGenre);
r.get("/content/:id", auth, contentDetails); // JSON for player.ejs

r.get("/profiles/history", auth, profile, profilesHistory);
r.get("/profiles/watched", auth, profile, profileWatchedList);
r.get("/profiles/recommendations", auth, profile, profilesRecommendations);

r.get("/continue-watching", auth, profile, continueWatchingList);
r.get("/continue-watching/:videoName", auth, profile, continueWatchingEntry);
r.post("/continue-watching", auth, profile, upsertContinueWatching);

r.get("/stats/plays", auth, profile, profilePlayStats);
r.get("/stats/genres-popularity", auth, genrePopularityStats);

r.get("/movies", auth, catalogList);

r.get("/movies/:id", async (req, res) => {
  try {
    const movie = await Content.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }
    res.json(movie);
  } catch (error) {
    console.error("Error fetching movie details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default r;
