export const auth=(req,res,next)=>!req.session.user?res.redirect('/login'):next();
export const profile=(req,res,next)=>!req.session.profile?res.redirect('/profiles'):next();
