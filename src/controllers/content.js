
import Content from '../models/Content.js'; import User from '../models/User.js'; import {omdb} from '../services/ratings.js';
export const details=async(req,res)=>{const c=await Content.findById(req.params.id); if(!c) return res.render('errors/404'); if(!c.rating){const r=await omdb(c.title,c.year); if(r){c.rating=r; await c.save();}} const similar=await Content.find({genres:{$in:c.genres},_id:{$ne:c._id}}).limit(10); res.render('content/details',{content:c,similar});};
export const like=async(req,res)=>{const u=await User.findById(req.session.user.id); const p=u.profiles.find(p=>String(p._id)===req.session.profile); const id=req.params.id; const i=p.liked.findIndex(x=>String(x)===id); if(i>=0) p.liked.splice(i,1); else p.liked.push(id); await u.save(); res.json({ok:true});};
