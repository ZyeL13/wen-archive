# WEN Project Structure

```
wen-agent/
│
├── public/                    ← Static assets & HTML
│   ├── altar.html            ← Main HTML (landing + scroll screens)
│   ├── rite.css              ← All styling
│   │
│   ├── awaken.js             ← Entry point
│   ├── ritual.js             ← Flow orchestrator
│   ├── tear.js               ← Drag interaction
│   ├── shatter.js            ← Canvas animation
│   ├── memory.js             ← State & Supabase
│   ├── oracle.js             ← API & auth
│   ├── manifest.js           ← Result generation
│   └── sigil.js              ← Constants
│
├── api/                       ← Backend API (Vercel Serverless)
│   ├── user.js               ← GET/POST/PATCH user
│   ├── entry.js              ← POST entry
│   ├── history.js            ← GET history
│   └── health.js             ← Health check
│
├── package.json
├── vite.config.js
├── vercel.json
├── .env.local                ← API keys (not committed)
├── .gitignore
└── README.md
```

---

## Module Dependencies

```
awaken.js
  ↓
  ├─→ sigil.js (config)
  ├─→ oracle.js (auth)
  └─→ ritual.js (start app)
       ↓
       ├─→ memory.js (state)
       ├─→ manifest.js (results)
       ├─→ tear.js (interaction)
       └─→ shatter.js (animation)
```

---

## What You Still Need to Create

### 1. `public/altar.html`
The main HTML file with:
- Landing screen
- Scroll intact screen
- Scroll torn screen
- History list
- About section
- Navigation

### 2. `public/rite.css`
All styling including:
- Layout & typography
- Scroll design
- Animation keyframes
- Torn scroll split
- Glass shatter support
- Responsive design

### 3. Backend API (`api/` folder)
Vercel serverless functions:
- `api/user.js` - CRUD for users table
- `api/entry.js` - Create entries
- `api/history.js` - Fetch user history
- `api/health.js` - Simple health check

### 4. Supabase Setup
- Create project
- Run SQL schema (in README)
- Get API URL + anon key
- Add to `.env.local`

### 5. Farcaster Auth Kit
- Install `@farcaster/auth-kit`
- Get app credentials
- Implement in `oracle.js`

---

## Files Already Created

✅ `awaken.js` - Entry point  
✅ `ritual.js` - Flow control  
✅ `tear.js` - Interaction logic  
✅ `shatter.js` - Animation  
✅ `memory.js` - State management  
✅ `oracle.js` - API wrapper  
✅ `manifest.js` - Result generation  
✅ `sigil.js` - Configuration  
✅ `package.json` - Dependencies  
✅ `vite.config.js` - Build config  
✅ `vercel.json` - Deployment config  
✅ `.gitignore` - Git ignore rules  
✅ `README.md` - Documentation  

---

## Next Steps

1. **Create `altar.html`** based on wireframe v2
2. **Create `rite.css`** for styling
3. **Setup Supabase** and get credentials
4. **Create API endpoints** in `api/` folder
5. **Integrate Farcaster Auth Kit**
6. **Test locally** with `npm run dev`
7. **Deploy to Vercel**

---

## Import/Export Flow

All modules use ES6 imports:

```javascript
// In ritual.js
import { initTear } from './tear.js';
import { generateResult } from './manifest.js';

// In tear.js
export function initTear(scrollElement) { ... }
```

Vite will bundle everything automatically.

---

## Environment Variables

Required in `.env.local`:

```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# Farcaster
VITE_FARCASTER_CLIENT_ID=your_client_id
VITE_FARCASTER_REDIRECT_URI=http://localhost:3000

# API (for production)
VITE_API_BASE=https://wen.vercel.app/api
```

Note: Vite requires `VITE_` prefix for env vars.

---

## Testing Checklist

- [ ] Landing page loads
- [ ] Farcaster auth works
- [ ] Scroll appears on first day
- [ ] Drag interaction triggers at 50px
- [ ] Glass shatter animates
- [ ] Result appears correctly
- [ ] State saves to Supabase
- [ ] Can't tear twice same day
- [ ] New day resets tear ability
- [ ] History page shows entries
- [ ] Cultivation level increments
- [ ] Navigation works between screens

---

## Performance Notes

- Canvas animation runs at 60fps
- Supabase queries cached locally
- Images/assets served from CDN
- Minimal bundle size (~50kb gzipped)
- No third-party analytics
- No tracking scripts

Keep it light. Keep it fast.
