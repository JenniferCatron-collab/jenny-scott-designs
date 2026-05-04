# Copilot Instructions for Jenny Scott Designs Website

## Project Overview
Jenny Scott Designs is a static website for a floral design business with an Express.js Node server for image uploads, authentication, and in-browser content editing. The site is a portfolio/storefront with features for authenticated admins to manage content and images.

**Key Architecture:**
- **Frontend:** Vanilla HTML/CSS/JS (no frameworks) - pages linked via `index.html`, `page1.html`, `page2.html`, `page3.html`, `gallery.html`, `videos.html`, `diy.html`
- **Backend:** Express.js server (`server.js`, runs on port 3000) handles uploads, authentication, file editing, and static file serving
- **Assets:** All CSS and JavaScript in `assets/` directory; images stored in `images/`
- **Dependencies:** `express`, `multer`, `sharp` (image optimization), `compression` (gzip)

## Critical Patterns & Conventions

### Authentication & Admin Features
- **Password-based auth:** Uses HTTP-only cookie `upload_auth=true` with `SameSite=Lax` (default password: `'letmein'`, override via `UPLOAD_PASSWORD` env var)
- **Cookie checking:** `isAuthenticated()` function checks if cookie starts with `upload_auth=` (flexible value)
- **Admin detection:** Check `document.body.classList.contains('can-upload')` on client; server checks `isAuthenticated(req)` helper
- **Protected endpoints:** `/upload`, `/admin/files`, `/admin/file`, `/admin/save`, `/admin/save-snippet` (return 401 if not authenticated)
- **Login flow:** User submits password to `/login` → if correct, cookie is set and user redirected to home page → JavaScript checks `/auth-status` and adds `can-upload` class

### Content Editing System
Authenticated admins can edit content inline using HTML marker comments and `/admin/save-snippet` endpoint:
```html
<!-- editable:start id=unique_id -->Editable content here<!-- editable:end id=unique_id -->
```
Client-side JS (`site.js`) detects elements with `data-editable-id` attributes and wraps them with edit buttons. Save fetches `/admin/save-snippet` with `{path, id, content}` JSON.

### Image Uploads & Optimization
- **Upload flow:** POST to `/upload` (authenticated) → multer saves to `images/` → sharp resizes to max 1200×1200 (JPEG, 80% quality)
- **Filename collision handling:** Auto-increments filenames (e.g., `photo.jpg` → `photo_1.jpg`) if file exists
- **Allowed types:** JPG, PNG, GIF only; 5 MB max size
- **Client-side:** File inputs with class `uploader` trigger upload on change; upload button class `upload-btn` is hidden until authenticated

### Gallery & Video Management
- **Image galleries:** Use `.gallery` or `.image-grid` with `data-src` attributes for lightbox; `.image-description` divs hold editable captions
- **Video system:** Client-side localStorage management (`KEY='jenny_videos_v1'`) stores YouTube video metadata; parsed from URL via regex; thumbnails from YouTube CDN
- **Lightbox:** Triggered by clicking gallery items; closes by clicking close button or overlay

### Styling Architecture
- **CSS variables:** `--bg`, `--card`, `--accent`, `--accent-2` in `:root`
- **Responsive:** Mobile nav (`.mobile-nav`) slides in from right; grid layouts use `auto-fit` with minmax
- **Upload UI:** Only visible when authenticated (`.can-upload` class on body)

## Development Workflow

### Running the Server
```bash
npm start  # runs "node server.js", starts on http://localhost:3000
```

### Image Optimization
Standalone script `optimize-images.js` exists for batch image processing (uses `sharp`).

### Server Caching Strategy
- **Static assets** (`.js`, `.css`, `.jpg`, `.png`, etc.): 1-year cache (`max-age=31536000, immutable`)
- **HTML pages:** 1-hour cache (`max-age=3600`)
- **Gzip compression:** Applied to all responses if `compression` module is available

## Common Tasks

### Add Editable Content Block
1. Wrap content in HTML markers: `<!-- editable:start id=my_id -->content<!-- editable:end id=my_id -->`
2. Add `data-editable-id="my_id"` attribute to container element
3. Ensure container is inside body; client JS auto-detects and adds edit button

### Add New Gallery Image
1. Place image in `images/` folder
2. Add HTML card in gallery section with `data-src` attribute and `.image-description` div
3. Mark description with `data-editable-id` and HTML comment markers for admin editing

### Modify Authentication
- Change default password: Set `UPLOAD_PASSWORD` environment variable
- Add logout: `/logout` endpoint clears cookie and redirects to `/`
- Check auth status: Fetch `/auth-status` endpoint (returns `{authenticated: boolean}`)

## Files to Reference for Patterns
- `index.html` - Hero header, mobile nav, section layout patterns
- `gallery.html` - Full example of image grid + editable descriptions
- `assets/site.js` - Client-side auth check, upload flow, inline editing implementation
- `assets/styles.css` - CSS variables, responsive grid, upload UI visibility patterns
- `server.js` - Express middleware, authentication, multer config, file serving

## Important Notes
- **No database:** All content editing writes directly to HTML files on disk
- **No build step:** Vanilla JS (no minification/bundling in development)
- **Minified JS:** `site.js` is heavily minified; preserve minification on updates or expand for readability
- **Image paths:** Use relative paths starting with `images/` (e.g., `images/photo.jpg`)
