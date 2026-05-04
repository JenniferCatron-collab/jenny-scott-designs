const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

let compression;
try {
  compression = require('compression');
} catch (e) {
  compression = null; // optional, will skip if not installed
}

const app = express();
const PORT = 3000;

// enable gzip compression for all responses (if available)
if (compression) {
  app.use(compression());
}

// set caching headers for static assets (1 year for versioned files, 1 hour for html)
app.use((req, res, next) => {
  if (/\.(js|css|jpg|jpeg|png|gif|svg|woff|woff2|ttf|eot)$/i.test(req.path)) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year for assets
  } else if (/\.html$/i.test(req.path)) {
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hour for HTML
  }
  next();
});

// parse urlencoded bodies for login
app.use(express.urlencoded({ extended: false }));

// ensure images directory exists
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

// storage: save file into images/ with original name but avoid collisions
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    const base = path.parse(file.originalname).name.replace(/[^a-z0-9-_]/gi, '_');
    const ext = path.extname(file.originalname).toLowerCase();
    let name = base + ext;
    let counter = 1;
    while (fs.existsSync(path.join(imagesDir, name))) {
      name = `${base}_${counter}${ext}`;
      counter++;
    }
    cb(null, name);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedExt = /\.jpe?g|\.png|\.gif$/i;
    const mimetypes = ['image/jpeg','image/png','image/gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.test(ext)) return cb(new Error('Only JPG, PNG, GIF images are allowed'));
    if (mimetypes.indexOf(file.mimetype) === -1) return cb(new Error('Invalid image MIME type'));
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB max
});

// simple auth helper (checks cookie named upload_auth)
function isAuthenticated(req){
  var c = req.headers && req.headers.cookie; 
  if(!c) return false;
  var cookies = c.split(';').map(function(x){return x.trim()});
  return cookies.some(function(cookie){ return cookie.indexOf('upload_auth=') === 0; });
}

// login endpoint (POST from login.html). Password from env UPLOAD_PASSWORD or 'letmein'
app.post('/login', function(req,res){
  var pw = req.body && req.body.password;
  var expected = process.env.UPLOAD_PASSWORD || 'letmein';
  if(pw && pw === expected){
    // set httpOnly cookie - use SameSite for security
    res.setHeader('Set-Cookie','upload_auth=true; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400');
    // Redirect to home page or referer
    var redirectTo = req.headers.referer ? req.headers.referer.replace(/\?.*/, '') : '/';
    if(redirectTo.includes('/login')) redirectTo = '/';
    return res.redirect(redirectTo);
  }
  return res.redirect('/login.html?failed=1');
});

app.get('/auth-status', function(req,res){
  res.json({ authenticated: !!isAuthenticated(req) });
});

app.get('/logout', function(req,res){
  res.setHeader('Set-Cookie','upload_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.redirect('/');
});

// serve static site files
app.use(express.static(__dirname));

// upload endpoint (protected)
app.post('/upload', function(req,res,next){
  if(!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
  return upload.single('image')(req,res,function(err){
    if(err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file' });
    
    // Resize and optimize image using sharp
    const filePath = req.file.path;
    const rel = path.join('images', req.file.filename).replace(/\\/g, '/');
    
    sharp(filePath)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toFile(filePath, function(err, info) {
        if(err) {
          // If optimization fails, still return the original file
          console.error('Image optimization error:', err);
        }
        res.json({ file: rel });
      });
  });
});

// ADMIN: list editable files (html, css, js)
app.get('/admin/files', function(req,res){
  if(!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
  const walk = function(dir){
    let results=[]; fs.readdirSync(dir).forEach(function(f){ const p=path.join(dir,f); const stat=fs.statSync(p); if(stat && stat.isDirectory()){ results=results.concat(walk(p)); } else { const rel=path.relative(__dirname,p).replace(/\\/g,'/'); if(/\.(html|css|js)$/.test(rel)) results.push(rel); } }); return results;
  };
  try{ const files = walk(__dirname); res.json({ files: files }); }catch(e){ res.status(500).json({ error: e.message }); }
});

// read file
app.get('/admin/file', function(req,res){
  if(!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
  const p = req.query.path; if(!p) return res.status(400).json({ error: 'Missing path' });
  const safe = path.normalize(p).replace(/^\.+/,''); const abs = path.join(__dirname, safe);
  if(!abs.startsWith(__dirname)) return res.status(400).json({ error: 'Invalid path' });
  try{ const txt = fs.readFileSync(abs,'utf8'); res.json({ content: txt }); }catch(e){ res.status(500).json({ error: e.message }); }
});

// save file
app.post('/admin/save', function(req,res){
  if(!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
  let body=''; req.on('data', function(ch){ body += ch.toString(); }); req.on('end', function(){ try{ const obj = JSON.parse(body); if(!obj.path) return res.status(400).json({ error: 'Missing path' }); const safe = path.normalize(obj.path).replace(/^\.+/,''); const abs = path.join(__dirname, safe); if(!abs.startsWith(__dirname)) return res.status(400).json({ error: 'Invalid path' }); fs.writeFileSync(abs, obj.content, 'utf8'); res.json({ ok:true }); }catch(e){ res.status(500).json({ error: e.message }); } });
});

// save snippet between markers: <!-- editable:start id=NAME --> ... <!-- editable:end id=NAME -->
app.post('/admin/save-snippet', function(req,res){
  if(!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
  let body=''; req.on('data', function(ch){ body += ch.toString(); }); req.on('end', function(){ try{ const obj = JSON.parse(body); if(!obj.path||!obj.id) return res.status(400).json({ error: 'Missing path or id' }); const safe = path.normalize(obj.path).replace(/^\.+/,''); const abs = path.join(__dirname, safe); if(!abs.startsWith(__dirname)) return res.status(400).json({ error: 'Invalid path' }); let txt = fs.readFileSync(abs,'utf8'); const start = `<!-- editable:start id=${obj.id} -->`; const end = `<!-- editable:end id=${obj.id} -->`; const s = txt.indexOf(start); const e = txt.indexOf(end); if(s===-1||e===-1||e<s) return res.status(400).json({ error: 'Snippet markers not found' }); const before = txt.slice(0,s+start.length); const after = txt.slice(e); const newtxt = before + '\n' + obj.content + '\n' + after; fs.writeFileSync(abs,newtxt,'utf8'); res.json({ ok:true }); }catch(e){ res.status(500).json({ error: e.message }); } });
});

app.listen(PORT, () => console.log(`Upload server running: http://localhost:${PORT}`));
