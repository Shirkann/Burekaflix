// controllers/admin.js (ESM)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import axios from 'axios';
import Content from '../models/Content.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// מראה את טופס ההוספה. אם יש לך קובץ סטטי ב-public/admin-add.html — נגיש אותו.
export function addForm(req, res) {
  // אם אתה משתמש ב-EJS: החזר res.render('admin-add')
  // כאן נגיש את הקובץ הסטטי שהצגת:
  const htmlPath = path.join(__dirname, '..', 'public', 'admin-add.html');
  return res.sendFile(htmlPath);
}

// POST /admin/add – יוצר רשומת תוכן ב-DB, משלים דירוג/פוסטר מ-OMDb אם חסרים.
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

    // שליפת דירוג + פוסטר מ-OMDb (אם יש api key)
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

// אופציונלי: אפשר להוסיף כאן גם edit/update/delete בהמשך
