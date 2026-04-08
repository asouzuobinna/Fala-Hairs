const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const multer  = require('multer');
const { v4: uuidv4 } = require('uuid');
const { requireAuth, requireSupreme } = require('../middleware/auth');
const { trackProductView, trackWhatsAppClick } = require('../lib/analytics');
const { buildWhatsAppMessage, buildWhatsAppURL }  = require('../utils/whatsappBuilder');
const { optimizeImage }  = require('../utils/imageOptimizer');
const { logActivity }    = require('../lib/activityLogger');

const PRODUCTS_FILE = path.join(__dirname,'../data/products.json');
const SETTINGS_FILE = path.join(__dirname,'../data/settings.json');
const UPLOAD_DIR    = path.join(__dirname,'../uploads/products');
const VIDEO_DIR     = path.join(__dirname,'../uploads/videos');

const storage = multer.diskStorage({
  destination:(req,file,cb)=>cb(null, file.mimetype.startsWith('video/') ? VIDEO_DIR : UPLOAD_DIR),
  filename:(req,file,cb)=>cb(null,`tmp_${Date.now()}_${uuidv4().slice(0,6)}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({ storage, limits:{fileSize:150*1024*1024},
  fileFilter:(req,file,cb)=>{
    const ok=['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm'];
    ok.includes(file.mimetype)?cb(null,true):cb(new Error('File type not allowed'));
  }
});
const uploadFields = upload.fields([{name:'cover',maxCount:1},{name:'images',maxCount:10},{name:'videos',maxCount:5}]);

function readProducts()  { try{return JSON.parse(fs.readFileSync(PRODUCTS_FILE,'utf8'));}catch{return[];} }
function writeProducts(d){ fs.writeFileSync(PRODUCTS_FILE,JSON.stringify(d,null,2)); }
function readSettings()  { try{return JSON.parse(fs.readFileSync(SETTINGS_FILE,'utf8'));}catch{return{};} }

async function processImage(tmpPath,baseName){
  try{
    const results=await optimizeImage(tmpPath,UPLOAD_DIR,baseName);
    fs.unlinkSync(tmpPath);
    return results.find(r=>r.size==='medium')?.file||results[0]?.file;
  }catch{
    const ext=path.extname(tmpPath);
    const dest=path.join(UPLOAD_DIR,`${baseName}${ext}`);
    fs.renameSync(tmpPath,dest);
    return path.basename(dest);
  }
}
function moveVideo(tmpPath){
  const ext=path.extname(tmpPath).toLowerCase();
  const name=`vid_${uuidv4().slice(0,8)}${ext}`;
  fs.renameSync(tmpPath,path.join(VIDEO_DIR,name));
  return name;
}

// GET /api/products
router.get('/',(req,res)=>{
  let p=readProducts();
  const {category,search,availability}=req.query;
  if(category&&category!=='All') p=p.filter(x=>x.category===category);
  if(availability) p=p.filter(x=>x.availability===availability);
  if(search){ const q=search.toLowerCase(); p=p.filter(x=>x.name.toLowerCase().includes(q)||x.texture.toLowerCase().includes(q)); }
  res.json(p.map(({images,videos,...rest})=>rest));
});

// GET /api/products/bestseller
router.get('/bestseller',(req,res)=>{
  const settings=readSettings();
  if(!settings.bestsellerProductId) return res.json(null);
  const p=readProducts().find(x=>x.id===settings.bestsellerProductId);
  if(!p) return res.json(null);
  const {images,videos,...slim}=p;
  res.json(slim);
});

// GET /api/products/:id
router.get('/:id',(req,res)=>{
  const p=readProducts().find(x=>x.id===req.params.id);
  if(!p) return res.status(404).json({error:'Not found'});
  trackProductView();
  res.json(p);
});

// POST /api/products/:id/whatsapp
router.post('/:id/whatsapp',(req,res)=>{
  const p=readProducts().find(x=>x.id===req.params.id);
  if(!p) return res.status(404).json({error:'Not found'});
  const {length,color,quantity}=req.body;
  trackWhatsAppClick();
  const msg=buildWhatsAppMessage(p,length,color,quantity||1);
  const url=buildWhatsAppURL(p.whatsapp||readSettings().whatsapp,msg);
  res.json({url,message:msg});
});

// POST /api/products/:id/bestseller — supreme only
router.post('/:id/bestseller', requireSupreme, (req,res)=>{
  const products=readProducts();
  if(!products.find(p=>p.id===req.params.id)) return res.status(404).json({error:'Not found'});
  const settings=readSettings();
  settings.bestsellerProductId=req.params.id;
  fs.writeFileSync(SETTINGS_FILE,JSON.stringify(settings,null,2));
  logActivity('supreme','Set bestseller',req.params.id);
  res.json({success:true,bestsellerProductId:req.params.id});
});

// DELETE /api/products/:id/bestseller — supreme only
router.delete('/:id/bestseller', requireSupreme, (req,res)=>{
  const settings=readSettings();
  if(settings.bestsellerProductId===req.params.id) {
    settings.bestsellerProductId=null;
    fs.writeFileSync(SETTINGS_FILE,JSON.stringify(settings,null,2));
  }
  res.json({success:true});
});

// POST /api/products
router.post('/',requireAuth,(req,res)=>{
  uploadFields(req,res,async(err)=>{
    if(err) return res.status(400).json({error:err.message});
    if(!req.files?.cover?.[0]) return res.status(400).json({error:'Cover image is required'});
    const{name,category,subcategory,texture,description,price,lengths,colors,availability,tag,whatsapp}=req.body;
    if(!name||!price) return res.status(400).json({error:'Name and price required'});
    const id=name.toLowerCase().replace(/[^a-z0-9]/g,'')+Date.now().toString().slice(-4);
    const coverName=await processImage(req.files.cover[0].path,`${id}_cover`);
    const imageNames=[]; for(const f of(req.files.images||[])){ const s=await processImage(f.path,`${id}_img_${uuidv4().slice(0,6)}`); if(s)imageNames.push(s); }
    const videoNames=[]; for(const f of(req.files.videos||[])) videoNames.push(moveVideo(f.path));
    const product={
      id,name,category,subcategory:subcategory||texture||category,texture:texture||category,
      description:description||'',price:Number(price),
      lengths:JSON.parse(lengths||'[18,20,22]'),
      colors:JSON.parse(colors||'["1B","2"]'),
      cover:coverName,images:imageNames,videos:videoNames,
      availability:availability||'available',tag:tag||'',
      whatsapp:whatsapp||readSettings().whatsapp||'+2348000000000',
      createdAt:new Date().toISOString()
    };
    const products=readProducts(); products.unshift(product); writeProducts(products);
    logActivity(req.admin.email,'Added product',name);
    res.status(201).json(product);
  });
});

// PUT /api/products/:id
router.put('/:id',requireAuth,(req,res)=>{
  uploadFields(req,res,async(err)=>{
    if(err) return res.status(400).json({error:err.message});
    const products=readProducts();
    const idx=products.findIndex(p=>p.id===req.params.id);
    if(idx<0) return res.status(404).json({error:'Not found'});
    const p=products[idx];
    const updates={};
    for(const f of['name','category','subcategory','texture','description','availability','tag','whatsapp']){
      if(req.body[f]!==undefined) updates[f]=req.body[f];
    }
    if(req.body.price)   updates.price=Number(req.body.price);
    if(req.body.lengths) updates.lengths=JSON.parse(req.body.lengths);
    if(req.body.colors)  updates.colors=JSON.parse(req.body.colors);
    if(req.files?.cover?.[0]){ const s=await processImage(req.files.cover[0].path,`${p.id}_cover_${Date.now()}`); if(s)updates.cover=s; }
    const newImgs=[]; for(const f of(req.files?.images||[])){ const s=await processImage(f.path,`${p.id}_img_${uuidv4().slice(0,6)}`); if(s)newImgs.push(s); }
    if(newImgs.length) updates.images=[...(p.images||[]),...newImgs];
    const newVids=[]; for(const f of(req.files?.videos||[])) newVids.push(moveVideo(f.path));
    if(newVids.length) updates.videos=[...(p.videos||[]),...newVids];
    if(req.body.removeImages){ const r=JSON.parse(req.body.removeImages); updates.images=(updates.images||p.images||[]).filter(f=>!r.includes(f)); }
    if(req.body.removeVideos){ const r=JSON.parse(req.body.removeVideos); updates.videos=(updates.videos||p.videos||[]).filter(f=>!r.includes(f)); }
    products[idx]={...p,...updates};
    writeProducts(products);
    logActivity(req.admin.email,`Updated product`,products[idx].name);
    res.json(products[idx]);
  });
});

// DELETE /api/products/:id/media
router.delete('/:id/media',requireAuth,(req,res)=>{
  const{filename,type}=req.body;
  const products=readProducts();
  const idx=products.findIndex(p=>p.id===req.params.id);
  if(idx<0) return res.status(404).json({error:'Not found'});
  const p=products[idx];
  if(type==='cover') products[idx].cover=null;
  else if(type==='image') products[idx].images=(p.images||[]).filter(f=>f!==filename);
  else if(type==='video') products[idx].videos=(p.videos||[]).filter(f=>f!==filename);
  writeProducts(products);
  try{ const dir=type==='video'?VIDEO_DIR:UPLOAD_DIR; const full=path.join(dir,filename); if(fs.existsSync(full))fs.unlinkSync(full); }catch{}
  logActivity(req.admin.email,`Removed ${type}`,p.name);
  res.json({success:true,product:products[idx]});
});

// DELETE /api/products/:id
router.delete('/:id',requireSupreme,(req,res)=>{
  const products=readProducts();
  const p=products.find(x=>x.id===req.params.id);
  if(!p) return res.status(404).json({error:'Not found'});
  writeProducts(products.filter(x=>x.id!==req.params.id));
  logActivity(req.admin.email,'Deleted product',p.name);
  res.json({success:true});
});

module.exports=router;
