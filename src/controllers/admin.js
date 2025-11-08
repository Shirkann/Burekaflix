import axios from 'axios';
import Content from '../models/Content.js';

export function addForm(req, res) {
  return res.render('admin/add', {
    message: req.query.message || (req.query.ok ? 'התוכן נשמר!' : null),
    error: req.query.error || null,
  });
}

export async function create(req, res) {
  try {
    let { title, type, year, genres, summary, posterUrl, videoUrl, wikipedia } = req.body;

    if (!title?.trim()) {
      const msg = 'נדרש שם תוכן (title)';
      if (req.prefersJson) return res.status(400).json({ error: msg });
      return res.redirect('/admin/add?error=' + encodeURIComponent(msg));
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
    if (req.prefersJson) {
      return res.status(201).json({ ok: true, id: doc._id, title: doc.title });
    }
    return res.redirect('/admin/add?message=' + encodeURIComponent(`${doc.title} נשמר בהצלחה`));

  } catch (err) {
    console.error(err);
    if (req.prefersJson) return res.status(500).json({ error: 'שגיאה בשמירת התוכן' });
    return res.redirect('/admin/add?error=' + encodeURIComponent('שגיאה בשמירת התוכן'));
  }
}
