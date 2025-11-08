import { Router } from 'express';
import { addForm, create } from '../controllers/admin.js';

const router = Router();

function requireAdmin(req, res, next) {
  if (req.session?.user?.isAdmin) return next();
  if (req.prefersJson) return res.status(401).json({ error: 'Unauthorized' });
  return res.status(403).render('errors/403');
}

router.get('/add', requireAdmin, addForm);
router.post('/add', requireAdmin, create);

export default router;
