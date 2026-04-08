// routes/lookbook.js
const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const multer  = require('multer');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');
const { logActivity } = require('../lib/activityLogger');
const { optimizeImage } = require('../utils/imageOptimizer');

const LB_FILE  = path.join(__dirname, '../data/lookbook.json');
const LB_DIR   = path.join(__dirname, '../uploads/lookbook');

const storage = multer.diskStorage({
  destination: LB_DIR,
  filename: (req, file, cb) => cb(null, `tmp_${Date.now()}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({ storage, limits:{ fileSize: 20*1024*1024 },
  fileFilter:(req,file,cb)=>{ if(file.mimetype.startsWith('image/')) cb(null,true); else cb(new Error('Images only')); }
});

function read()      { try { return JSON.parse(fs.readFileSync(LB_FILE,'utf8')); } catch { return []; } }
function write(data) { fs.writeFileSync(LB_FILE, JSON.stringify(data, null, 2)); }

// GET /api/lookbook
router.get('/', (req, res) => res.json(read()));

// POST /api/lookbook
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  if (!req.file) return res.status(400).json({ error: 'Image required' });

  const id   = 'lb_' + uuidv4().slice(0,8);
  let imgFile;
  try {
    const results = await optimizeImage(req.file.path, LB_DIR, id);
    imgFile = results.find(r=>r.size==='medium')?.file || results[0]?.file;
    fs.unlinkSync(req.file.path);
  } catch {
    const ext  = path.extname(req.file.path);
    imgFile    = `${id}${ext}`;
    fs.renameSync(req.file.path, path.join(LB_DIR, imgFile));
  }

  const entry = { id, title, description: description||'', image: imgFile, createdAt: new Date().toISOString() };
  const items = read(); items.unshift(entry); write(items);
  logActivity(req.admin.email, 'Added lookbook entry', title);
  res.status(201).json(entry);
});

// DELETE /api/lookbook/:id
router.delete('/:id', requireAuth, (req, res) => {
  const items = read();
  const item  = items.find(i=>i.id===req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  write(items.filter(i=>i.id!==req.params.id));
  try { const f=path.join(LB_DIR,item.image); if(fs.existsSync(f)) fs.unlinkSync(f); } catch {}
  logActivity(req.admin.email, 'Deleted lookbook entry', item.title);
  res.json({ success:true });
});

module.exports = router;
