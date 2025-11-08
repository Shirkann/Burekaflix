import { Router } from "express";
import { addForm, create } from "../controllers/admin.js";

const router = Router();

function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.isAdmin) {
    return next();
  }
  return res.status(403).render("errors/403");
}

router.get("/add", requireAdmin, addForm);
router.post("/add", requireAdmin, create);

export default router;
