
import Content from '../models/Content.js';
export const gate=(req,res,next)=>!req.session.user?.isAdmin?res.status(403).render('errors/403'):next();
export const addForm=(req,res)=>res.render('admin/add');
export const create=async(req,res)=>{const b=req.body; const genres=(b.genres||'').split(',').map(s=>s.trim()).filter(Boolean); const cast=(b.cast||'').split(',').map(s=>s.trim()).filter(Boolean); const doc=await Content.create({title:b.title,type:b.type,year:b.year?Number(b.year):undefined,genres,summary:b.summary,posterUrl:b.posterUrl,videoUrl:b.videoUrl,wikipedia:b.wikipedia,cast}); res.redirect('/content/'+doc._id);};
