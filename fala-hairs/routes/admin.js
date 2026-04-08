const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const { requireAuth } = require('../middleware/auth');
const { getAnalytics } = require('../lib/analytics');
const ACTIVITY_FILE = path.join(__dirname,'../data/activity.json');

router.get('/analytics',requireAuth,(req,res)=>{
  res.json(getAnalytics(parseInt(req.query.days)||7));
});
router.get('/activity',requireAuth,(req,res)=>{
  try{
    const logs=JSON.parse(fs.readFileSync(ACTIVITY_FILE,'utf8'));
    res.json(req.admin.role==='supreme' ? logs : logs.filter(l=>l.admin===req.admin.email));
  }catch{ res.json([]); }
});
router.get('/me',requireAuth,(req,res)=>{
  res.json({email:req.admin.email,name:req.admin.name,role:req.admin.role});
});
module.exports=router;
