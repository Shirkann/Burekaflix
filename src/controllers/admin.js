// controllers/admin.js (ESM)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import axios from 'axios';
import Content from '../models/Content.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function addForm(req, res) {
  const htmlPath = path.join(__dirname, '..', 'public', 'admin-add.html');
  return res.sendFile(htmlPath);
}

export async function create(req, res) {
  try {
    let { title, type, year, genres, summary, posterUrl, videoUrl, wikipedia } = req.body;

    if (!title?.trim()) {
      return res.status(400).send('נדרש שם תוכן (title)');
    }

    if (!['movie', 'series'].includes(type)) type = 'movie';

    const genresList = (genres || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    let rating = undefined;
    const apiKey = process.env.OMDB_API_KEY;

    if (apiKey) {
      try {
        const qs = new URLSearchParams({
          t: title.trim(),
          ...(year ? { y: String(year) } : {}),
          apikey: apiKey
        }).toString();

        const { data } = await axios.get(`https://www.omdbapi.com/?${qs}`);
        if (data && data.Response !== 'False') {
          if (data.imdbRating && data.imdbRating !== 'N/A') {
            rating = Number(data.imdbRating);
          }
          if ((!posterUrl || !posterUrl.trim()) && data.Poster && data.Poster !== 'N/A') {
            posterUrl = data.Poster;
          }
        }
      } catch (e) {
        console.warn('OMDb fetch failed:', e.message);
      }
    }

    const doc = await Content.create({
      title: title.trim(),
      type,
      year: year ? Number(year) : undefined,
      genres: genresList,
      summary: summary?.trim(),
      posterUrl: posterUrl?.trim(),
      videoUrl: videoUrl?.trim(),
      wikipedia: wikipedia?.trim(),
      rating,
      ratingSrc: rating ? 'OMDb' : undefined
    });

    // החזרה גמישה: הפניה חזרה עם דגל הצלחה או JSON
    if (req.headers.accept?.includes('application/json')) {
      return res.status(201).json({ ok: true, id: doc._id, title: doc.title });
    }
    return res.redirect('/admin/add?ok=1');

  } catch (err) {
    console.error(err);
    return res.status(500).send('שגיאה בשמירת התוכן');
  }
}
