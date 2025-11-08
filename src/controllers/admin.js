import axios from "axios";
import fs from "fs/promises";
import Content from "../models/Content.js";

export function addForm(req, res) {
  let message = null;
  if (req.query.message) {
    message = req.query.message;
  } else if (req.query.ok) {
    message = "התוכן נשמר!";
  }
  const error = req.query.error ? req.query.error : null;
  res.render("admin/add", { message, error });
}

export async function create(req, res) {
  const cleanupUpload = async () => {
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (error) {
        console.warn("Failed to remove uploaded video:", error.message);
      }
    }
  };

  try {
    let title = req.body.title || "";
    let type = req.body.type || "movie";
    const year = req.body.year;
    const genres = req.body.genres || "";
    const summary = req.body.summary || "";
    let posterUrl = req.body.posterUrl || "";
    let wikipedia = req.body.wikipedia || "";
    let stagemanager = req.body.stagemanager || "";
    const playersInput = req.body.players || "";
    const episodesInput = req.body.episodes || "";
    const primaryVideoFile = req.file ? req.file.filename : null;

    title = title.trim();
    if (!title) {
      await cleanupUpload();
      return res.redirect(
        "/admin/add?error=" + encodeURIComponent("נדרש שם תוכן (title)"),
      );
    }

    if (!primaryVideoFile) {
      await cleanupUpload();
      return res.redirect(
        "/admin/add?error=" + encodeURIComponent("חובה להעלות קובץ וידאו (MP4)"),
      );
    }

    if (type !== "movie" && type !== "series") {
      type = "movie";
    }

    const splitByComma = (value = "") =>
      value
        .split(",")
        .map(function (part) {
          return part.trim();
        })
        .filter(function (part) {
          return part.length > 0;
        });

    const genresList = splitByComma(genres);
    const playersList = splitByComma(playersInput);
    const episodesList = splitByComma(episodesInput);

    stagemanager = stagemanager.trim();

    let rating = undefined;
    const apiKey = process.env.OMDB_API_KEY;

    if (apiKey) {
      try {
        const params = new URLSearchParams();
        params.append("t", title);
        if (year) {
          params.append("y", String(year));
        }
        params.append("apikey", apiKey);

        const response = await axios.get(
          "https://www.omdbapi.com/?" + params.toString(),
        );
        const data = response.data;
        if (data && data.Response !== "False") {
          if (data.imdbRating && data.imdbRating !== "N/A") {
            rating = Number(data.imdbRating);
          }
          if (
            (!posterUrl || !posterUrl.trim()) &&
            data.Poster &&
            data.Poster !== "N/A"
          ) {
            posterUrl = data.Poster;
          }
        }
      } catch (error) {
        console.warn("OMDb fetch failed:", error.message);
      }
    }

    const doc = await Content.create({
      title,
      type,
      year: year ? Number(year) : undefined,
      genres: genresList,
      summary: summary.trim() || undefined,
      posterUrl: posterUrl.trim() || undefined,
      stagemanager: stagemanager || undefined,
      players: playersList,
      videoUrl: primaryVideoFile,
      episodes: episodesList,
      wikipedia: wikipedia.trim() || undefined,
      rating,
      ratingSrc: rating ? "OMDb" : undefined,
    });

    return res.redirect(
      "/admin/add?message=" + encodeURIComponent(doc.title + " נשמר בהצלחה"),
    );
  } catch (error) {
    console.error(error);
    await cleanupUpload();
    return res.redirect(
      "/admin/add?error=" + encodeURIComponent("שגיאה בשמירת התוכן"),
    );
  }
}
