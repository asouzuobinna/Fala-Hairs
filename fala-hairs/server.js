require('dotenv').config();
const express      = require('express');
const path         = require('path');
const cookieParser = require('cookie-parser');
const bodyParser   = require('body-parser');
const cors         = require('cors');
const { trackVisit } = require('./lib/analytics');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(cookieParser());
app.use(bodyParser.json({ limit:'10mb' }));
app.use(bodyParser.urlencoded({ extended:true, limit:'10mb' }));

app.use(express.static(path.join(__dirname,'public')));
app.use('/uploads', express.static(path.join(__dirname,'uploads')));

app.use((req,res,next)=>{
  if(!req.path.startsWith('/api')&&!req.path.startsWith('/uploads')&&req.method==='GET') trackVisit();
  next();
});

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/settings',  require('./routes/settings'));
app.use('/api/subadmins', require('./routes/subadmins'));
app.use('/api/lookbook',  require('./routes/lookbook'));

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));

app.listen(PORT,()=>{
  console.log(`\n✨ FALA Hairs → http://localhost:${PORT}`);
  console.log(`   Admin       → http://localhost:${PORT}/admin\n`);
});
module.exports = app;
