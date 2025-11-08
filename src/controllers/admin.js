import axios from "axios";
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
  try {
    let title = req.body.title || "";
    let type = req.body.type || "movie";
    const year = req.body.year;
    const genres = req.body.genres || "";
    const summary = req.body.summary || "";
    let posterUrl = req.body.posterUrl || "";
    let videoUrl = req.body.videoUrl || "";
    let wikipedia = req.body.wikipedia || "";

    title = title.trim();
    if (!title) {
      return res.redirect(
        "/admin/add?error=" + encodeURIComponent("נדרש שם תוכן (title)"),
      );
    }

    if (type !== "movie" && type !== "series") {
      type = "movie";
    }

    const genresList = genres
      .split(",")
      .map(function (value) {
        return value.trim();
      })
      .filter(function (value) {
        return value.length > 0;
      });

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
      videoUrl: videoUrl.trim() || undefined,
      wikipedia: wikipedia.trim() || undefined,
      rating,
      ratingSrc: rating ? "OMDb" : undefined,
    });

    return res.redirect(
      "/admin/add?message=" + encodeURIComponent(doc.title + " נשמר בהצלחה"),
    );
  } catch (error) {
    console.error(error);
    return res.redirect(
      "/admin/add?error=" + encodeURIComponent("שגיאה בשמירת התוכן"),
    );
  }
}
