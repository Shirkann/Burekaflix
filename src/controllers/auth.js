
import User from '../models/User.js';
export const loginGet=(req,res)=>req.session.user?res.redirect('/catalog'):res.render('auth/login');
export const loginPost=async(req,res)=>{const{email,password}=req.body;const u=await User.findOne({email});if(!u||!(await u.validatePassword(password))) return res.render('auth/login',{error:'אימייל או סיסמה שגויים'}); req.session.user={id:u._id,email:u.email,isAdmin:u.isAdmin}; res.redirect('/profiles');};
export const registerGet=(req,res)=>res.render('auth/register');
export const registerPost=async(req,res)=>{const{email,password}=req.body; if(await User.findOne({email})) return res.render('auth/register',{error:'משתמש כבר קיים'}); const u=new User({email}); await u.setPassword(password); u.profiles.push({name:'אני'}); await u.save(); req.session.user={id:u._id,email:u.email,isAdmin:u.isAdmin}; res.redirect('/profiles');};
export const logout=(req,res)=>req.session.destroy(()=>res.redirect('/login'));
