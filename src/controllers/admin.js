import Content from '../models/Content.js';
import path from 'path';

export const gate = (req, res, next) =>
  !req.session.user?.isAdmin
    ? res.status(403).sendFile(path.join(process.cwd(), 'public', 'errors', '403.html'))
    : next();

export const addForm = (req, res) => res.sendFile(path.join(process.cwd(), 'public', 'admin-add.html'));

export const create = async (req, res) => {
  const b = req.body;

  const genres = (b.genres || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const cast = (b.cast || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const doc = await Content.create({
    title: b.title,
    type: b.type,
    year: b.year ? Number(b.year) : undefined,
    genres,
    summary: b.summary,
    posterUrl: b.posterUrl,
    videoUrl: b.videoUrl,
    wikipedia: b.wikipedia,
    cast
  });

  res.redirect('/content/' + doc._id);
};
