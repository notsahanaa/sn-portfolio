# Build in Public Portfolio Section - Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Build in Public" section with project dashboard, Twitter embeds, visitor likes, and password-protected admin.

**Architecture:** Express.js backend serves React frontend + JSON API. Data stored in `data/content.json`. JWT auth for admin. React Router for client-side navigation.

**Tech Stack:** React 19, Vite, React Router, Express.js, JWT, UUID

**Spec:** `docs/superpowers/specs/2026-03-20-build-in-public-design.md`

---

## Chunk 1: Project Setup & Backend Foundation

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install backend dependencies**

```bash
npm install express jsonwebtoken uuid cors dotenv
```

- [ ] **Step 2: Install frontend dependencies**

```bash
npm install react-router-dom
```

- [ ] **Step 3: Install dev dependency for running both servers**

```bash
npm install -D concurrently nodemon
```

- [ ] **Step 4: Verify installation**

Run: `cat package.json | grep -A5 '"dependencies"'`
Expected: express, jsonwebtoken, uuid, cors, dotenv, react-router-dom listed

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add backend and routing dependencies"
```

---

### Task 2: Create Data File Structure

**Files:**
- Create: `data/content.json`
- Create: `.env`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Create data directory and initial content file**

Create `data/content.json`:
```json
{
  "buildInPublic": {
    "projects": []
  }
}
```

- [ ] **Step 2: Create .env file**

Create `.env`:
```
ADMIN_PASSWORD=changeme123
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
```

- [ ] **Step 3: Create .env.example (safe to commit)**

Create `.env.example`:
```
ADMIN_PASSWORD=your-admin-password
JWT_SECRET=your-jwt-secret
PORT=3001
```

- [ ] **Step 4: Update .gitignore**

Add to `.gitignore`:
```
# Environment
.env

# Data (optional - remove if you want to version control your content)
# data/content.json
```

- [ ] **Step 5: Commit**

```bash
git add data/content.json .env.example .gitignore
git commit -m "chore: add data structure and env configuration"
```

---

### Task 3: Create Express Server Entry Point

**Files:**
- Create: `server/index.js`

- [ ] **Step 1: Create server directory**

```bash
mkdir -p server/routes server/middleware
```

- [ ] **Step 2: Create server entry point**

Create `server/index.js`:
```javascript
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API routes will be added here
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

- [ ] **Step 3: Update package.json scripts**

Add to `package.json` scripts:
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "vite",
    "dev:server": "nodemon server/index.js",
    "build": "vite build",
    "start": "NODE_ENV=production node server/index.js",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 4: Test server starts**

Run: `node server/index.js`
Expected: "Server running on port 3001"

Test: `curl http://localhost:3001/api/health`
Expected: `{"status":"ok"}`

- [ ] **Step 5: Commit**

```bash
git add server/index.js package.json
git commit -m "feat: add Express server with health endpoint"
```

---

## Chunk 2: Public API & Data Layer

### Task 4: Create Data Helper Module

**Files:**
- Create: `server/data.js`

- [ ] **Step 1: Create data helper**

Create `server/data.js`:
```javascript
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '../data/content.json');

export async function readData() {
  const content = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(content);
}

export async function writeData(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

export function getVisibleProjects(data) {
  return data.buildInPublic.projects.filter(p => p.visible);
}

export function findProjectBySlug(data, slug) {
  return data.buildInPublic.projects.find(p => p.slug === slug);
}

export function findProjectById(data, id) {
  return data.buildInPublic.projects.find(p => p.id === id);
}
```

- [ ] **Step 2: Commit**

```bash
git add server/data.js
git commit -m "feat: add data helper module for JSON file operations"
```

---

### Task 5: Implement Public Projects Routes

**Files:**
- Create: `server/routes/projects.js`
- Modify: `server/index.js`

- [ ] **Step 1: Create projects routes**

Create `server/routes/projects.js`:
```javascript
import express from 'express';
import { readData, writeData, getVisibleProjects, findProjectBySlug } from '../data.js';

const router = express.Router();

// GET /api/projects - List visible projects
router.get('/', async (req, res) => {
  try {
    const data = await readData();
    const projects = getVisibleProjects(data).map(p => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
      link: p.link,
      likes: p.likes,
      tweetCount: p.tweets.length
    }));
    res.json(projects);
  } catch (error) {
    console.error('Error reading projects:', error);
    res.status(500).json({ error: 'Failed to read projects' });
  }
});

// GET /api/projects/:slug - Get single project with tweets
router.get('/:slug', async (req, res) => {
  try {
    const data = await readData();
    const project = findProjectBySlug(data, req.params.slug);

    if (!project || !project.visible) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Sort tweets by addedAt descending (newest first)
    const sortedTweets = [...project.tweets].sort(
      (a, b) => new Date(b.addedAt) - new Date(a.addedAt)
    );

    res.json({
      ...project,
      tweets: sortedTweets
    });
  } catch (error) {
    console.error('Error reading project:', error);
    res.status(500).json({ error: 'Failed to read project' });
  }
});

// POST /api/projects/:slug/like - Increment like count
router.post('/:slug/like', async (req, res) => {
  try {
    const data = await readData();
    const project = findProjectBySlug(data, req.params.slug);

    if (!project || !project.visible) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.likes = (project.likes || 0) + 1;
    await writeData(data);

    res.json({ likes: project.likes });
  } catch (error) {
    console.error('Error updating likes:', error);
    res.status(500).json({ error: 'Failed to update likes' });
  }
});

export default router;
```

- [ ] **Step 2: Register routes in server**

Update `server/index.js` - add after middleware section:
```javascript
import projectsRouter from './routes/projects.js';

// API routes
app.use('/api/projects', projectsRouter);
```

- [ ] **Step 3: Test endpoints**

Add a test project to `data/content.json`:
```json
{
  "buildInPublic": {
    "projects": [
      {
        "id": "test-1",
        "slug": "test-project",
        "name": "Test Project",
        "description": "A test project",
        "startDate": "2024-01-01",
        "endDate": null,
        "status": "in-progress",
        "link": "https://example.com",
        "visible": true,
        "likes": 0,
        "tweets": []
      }
    ]
  }
}
```

Run: `node server/index.js` (in one terminal)

Test list: `curl http://localhost:3001/api/projects`
Expected: Array with test project

Test single: `curl http://localhost:3001/api/projects/test-project`
Expected: Full project object

Test like: `curl -X POST http://localhost:3001/api/projects/test-project/like`
Expected: `{"likes":1}`

- [ ] **Step 4: Commit**

```bash
git add server/routes/projects.js server/index.js
git commit -m "feat: add public API endpoints for projects and likes"
```

---

## Chunk 3: Auth & Admin API

### Task 6: Create Auth Middleware

**Files:**
- Create: `server/middleware/auth.js`

- [ ] **Step 1: Create auth middleware**

Create `server/middleware/auth.js`:
```javascript
import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/middleware/auth.js
git commit -m "feat: add JWT authentication middleware"
```

---

### Task 7: Create Auth Routes

**Files:**
- Create: `server/routes/auth.js`
- Modify: `server/index.js`

- [ ] **Step 1: Create auth routes**

Create `server/routes/auth.js`:
```javascript
import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = jwt.sign(
    { role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token });
});

export default router;
```

- [ ] **Step 2: Register auth routes**

Update `server/index.js`:
```javascript
import authRouter from './routes/auth.js';

// Add after other routes
app.use('/api/auth', authRouter);
```

- [ ] **Step 3: Test login**

Run: `curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"password":"changeme123"}'`
Expected: `{"token":"eyJ..."}`

- [ ] **Step 4: Commit**

```bash
git add server/routes/auth.js server/index.js
git commit -m "feat: add admin login endpoint with JWT"
```

---

### Task 8: Create Admin Routes

**Files:**
- Create: `server/routes/admin.js`
- Modify: `server/index.js`

- [ ] **Step 1: Create admin routes**

Create `server/routes/admin.js`:
```javascript
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readData, writeData, findProjectById } from '../data.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

// GET /api/admin/projects - List ALL projects (including hidden)
router.get('/projects', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.buildInPublic.projects);
  } catch (error) {
    console.error('Error reading projects:', error);
    res.status(500).json({ error: 'Failed to read projects' });
  }
});

// POST /api/admin/projects - Create project
router.post('/projects', async (req, res) => {
  try {
    const { name, slug, description, startDate, endDate, status, link, visible } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const data = await readData();

    // Check slug uniqueness
    if (data.buildInPublic.projects.some(p => p.slug === slug)) {
      return res.status(400).json({ error: 'Slug already exists' });
    }

    const newProject = {
      id: uuidv4(),
      slug,
      name,
      description: description || '',
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || null,
      status: status || 'idea',
      link: link || '',
      visible: visible !== false,
      likes: 0,
      tweets: []
    };

    data.buildInPublic.projects.push(newProject);
    await writeData(data);

    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/admin/projects/:id - Update project
router.put('/projects/:id', async (req, res) => {
  try {
    const data = await readData();
    const project = findProjectById(data, req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { name, slug, description, startDate, endDate, status, link, visible } = req.body;

    // Check slug uniqueness if changing
    if (slug && slug !== project.slug) {
      if (data.buildInPublic.projects.some(p => p.slug === slug)) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
      project.slug = slug;
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (status !== undefined) project.status = status;
    if (link !== undefined) project.link = link;
    if (visible !== undefined) project.visible = visible;

    await writeData(data);
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/admin/projects/:id - Delete project
router.delete('/projects/:id', async (req, res) => {
  try {
    const data = await readData();
    const index = data.buildInPublic.projects.findIndex(p => p.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    data.buildInPublic.projects.splice(index, 1);
    await writeData(data);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// POST /api/admin/projects/:id/tweets - Add tweet
router.post('/projects/:id/tweets', async (req, res) => {
  try {
    const { tweetUrl } = req.body;

    if (!tweetUrl) {
      return res.status(400).json({ error: 'Tweet URL required' });
    }

    // Basic Twitter/X URL validation
    const twitterPattern = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/;
    if (!twitterPattern.test(tweetUrl)) {
      return res.status(400).json({ error: 'Invalid Twitter/X URL format' });
    }

    const data = await readData();
    const project = findProjectById(data, req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const newTweet = {
      id: uuidv4(),
      tweetUrl,
      addedAt: new Date().toISOString()
    };

    project.tweets.push(newTweet);
    await writeData(data);

    res.status(201).json(newTweet);
  } catch (error) {
    console.error('Error adding tweet:', error);
    res.status(500).json({ error: 'Failed to add tweet' });
  }
});

// DELETE /api/admin/projects/:id/tweets/:tweetId - Remove tweet
router.delete('/projects/:id/tweets/:tweetId', async (req, res) => {
  try {
    const data = await readData();
    const project = findProjectById(data, req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const tweetIndex = project.tweets.findIndex(t => t.id === req.params.tweetId);

    if (tweetIndex === -1) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    project.tweets.splice(tweetIndex, 1);
    await writeData(data);

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing tweet:', error);
    res.status(500).json({ error: 'Failed to remove tweet' });
  }
});

export default router;
```

- [ ] **Step 2: Register admin routes**

Update `server/index.js`:
```javascript
import adminRouter from './routes/admin.js';

// Add after other routes
app.use('/api/admin', adminRouter);
```

- [ ] **Step 3: Test admin endpoints**

First get a token:
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"password":"changeme123"}' | jq -r '.token')
```

Test create project:
```bash
curl -X POST http://localhost:3001/api/admin/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"New Project","slug":"new-project"}'
```
Expected: New project object with id

- [ ] **Step 4: Commit**

```bash
git add server/routes/admin.js server/index.js
git commit -m "feat: add admin CRUD endpoints for projects and tweets"
```

---

## Chunk 4: Frontend Routing & Layout

### Task 9: Setup React Router

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/App.jsx`
- Create: `src/pages/Home.jsx`

- [ ] **Step 1: Update main.jsx with BrowserRouter**

Update `src/main.jsx`:
```javascript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 2: Create Home page from existing App content**

Create `src/pages/Home.jsx`:
```javascript
import '../styles/Home.css'

function Home() {
  const text = "Coming Soon :)"

  return (
    <div className="home-container">
      <h1 className="wave-text">
        {text.split('').map((letter, index) => (
          <span
            key={index}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        ))}
      </h1>
    </div>
  )
}

export default Home
```

- [ ] **Step 3: Create styles directory and move Home styles**

Create `src/styles/Home.css`:
```css
.home-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  background-color: #ffffff;
}

.wave-text span {
  display: inline-block;
  transition: transform 0.3s ease;
}

.wave-text:hover span {
  animation: wave 0.5s ease forwards;
}

@keyframes wave {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
```

- [ ] **Step 4: Update App.jsx with routes**

Update `src/App.jsx`:
```javascript
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}

export default App
```

- [ ] **Step 5: Update App.css to global styles**

Update `src/App.css`:
```css
/* Global styles */
h1, h2, h3 {
  font-family: 'VT323', monospace;
  font-weight: 400;
  color: #000000;
  letter-spacing: 0.1em;
}

h1 {
  font-size: clamp(1.5rem, 6vw, 3rem);
}

h2 {
  font-size: clamp(1.2rem, 4vw, 2rem);
}

a {
  color: inherit;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
```

- [ ] **Step 6: Test routing works**

Run: `npm run dev:client`
Navigate to http://localhost:5173
Expected: "Coming Soon :)" text with wave animation

- [ ] **Step 7: Commit**

```bash
git add src/main.jsx src/App.jsx src/App.css src/pages/Home.jsx src/styles/Home.css
git commit -m "feat: add React Router and restructure pages"
```

---

### Task 10: Create Page Stubs and Routes

**Files:**
- Create: `src/pages/BuildInPublic.jsx`
- Create: `src/pages/Project.jsx`
- Create: `src/pages/Admin.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create BuildInPublic page stub**

Create `src/pages/BuildInPublic.jsx`:
```javascript
import '../styles/BuildInPublic.css'

function BuildInPublic() {
  return (
    <div className="build-in-public">
      <h1>Build in Public</h1>
      <p>Projects coming soon...</p>
    </div>
  )
}

export default BuildInPublic
```

Create `src/styles/BuildInPublic.css`:
```css
.build-in-public {
  min-height: 100vh;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.build-in-public h1 {
  text-align: center;
  margin-bottom: 2rem;
}
```

- [ ] **Step 2: Create Project page stub**

Create `src/pages/Project.jsx`:
```javascript
import { useParams } from 'react-router-dom'
import '../styles/Project.css'

function Project() {
  const { slug } = useParams()

  return (
    <div className="project-page">
      <h1>Project: {slug}</h1>
    </div>
  )
}

export default Project
```

Create `src/styles/Project.css`:
```css
.project-page {
  min-height: 100vh;
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}
```

- [ ] **Step 3: Create Admin page stub**

Create `src/pages/Admin.jsx`:
```javascript
import '../styles/Admin.css'

function Admin() {
  return (
    <div className="admin-page">
      <h1>Admin</h1>
      <p>Login form coming soon...</p>
    </div>
  )
}

export default Admin
```

Create `src/styles/Admin.css`:
```css
.admin-page {
  min-height: 100vh;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.admin-page h1 {
  text-align: center;
  margin-bottom: 2rem;
}
```

- [ ] **Step 4: Add routes to App.jsx**

Update `src/App.jsx`:
```javascript
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import BuildInPublic from './pages/BuildInPublic'
import Project from './pages/Project'
import Admin from './pages/Admin'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/projects" element={<BuildInPublic />} />
      <Route path="/projects/:slug" element={<Project />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}

export default App
```

- [ ] **Step 5: Test all routes**

Run: `npm run dev:client`
Test: http://localhost:5173/ → Home
Test: http://localhost:5173/projects → BuildInPublic
Test: http://localhost:5173/projects/test → Project with "test" slug
Test: http://localhost:5173/admin → Admin

- [ ] **Step 6: Commit**

```bash
git add src/pages/ src/styles/ src/App.jsx
git commit -m "feat: add page stubs for BuildInPublic, Project, and Admin"
```

---

### Task 11: Create API Client Helper

**Files:**
- Create: `src/api/client.js`

- [ ] **Step 1: Create API client**

Create `src/api/client.js`:
```javascript
const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Public endpoints
export const getProjects = () => request('/projects');

export const getProject = (slug) => request(`/projects/${slug}`);

export const likeProject = (slug) => request(`/projects/${slug}/like`, { method: 'POST' });

// Auth
export const login = (password) =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password })
  });

// Admin endpoints
export const getAdminProjects = () => request('/admin/projects');

export const createProject = (data) =>
  request('/admin/projects', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const updateProject = (id, data) =>
  request(`/admin/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

export const deleteProject = (id) =>
  request(`/admin/projects/${id}`, { method: 'DELETE' });

export const addTweet = (projectId, tweetUrl) =>
  request(`/admin/projects/${projectId}/tweets`, {
    method: 'POST',
    body: JSON.stringify({ tweetUrl })
  });

export const removeTweet = (projectId, tweetId) =>
  request(`/admin/projects/${projectId}/tweets/${tweetId}`, { method: 'DELETE' });
```

- [ ] **Step 2: Configure Vite proxy for dev**

Update `vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 3: Commit**

```bash
git add src/api/client.js vite.config.js
git commit -m "feat: add API client helper and Vite proxy config"
```

---

## Chunk 5: Public Components

### Task 12: Create LikeButton Component

**Files:**
- Create: `src/components/LikeButton.jsx`
- Create: `src/styles/LikeButton.css`

- [ ] **Step 1: Create LikeButton component**

Create `src/components/LikeButton.jsx`:
```javascript
import { useState, useEffect } from 'react'
import { likeProject } from '../api/client'
import '../styles/LikeButton.css'

function LikeButton({ slug, initialLikes = 0 }) {
  const [likes, setLikes] = useState(initialLikes)
  const [hasLiked, setHasLiked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check localStorage for previous like
    const likedProjects = JSON.parse(localStorage.getItem('likedProjects') || '[]')
    setHasLiked(likedProjects.includes(slug))
  }, [slug])

  const handleLike = async () => {
    if (hasLiked || isLoading) return

    setIsLoading(true)
    // Optimistic update
    setLikes(prev => prev + 1)
    setHasLiked(true)

    try {
      const result = await likeProject(slug)
      setLikes(result.likes)

      // Save to localStorage
      const likedProjects = JSON.parse(localStorage.getItem('likedProjects') || '[]')
      likedProjects.push(slug)
      localStorage.setItem('likedProjects', JSON.stringify(likedProjects))
    } catch (error) {
      // Revert optimistic update
      setLikes(prev => prev - 1)
      setHasLiked(false)
      console.error('Failed to like:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      className={`like-button ${hasLiked ? 'liked' : ''}`}
      onClick={handleLike}
      disabled={hasLiked || isLoading}
      aria-label={hasLiked ? 'Already liked' : 'Like this project'}
    >
      <span className="heart">{hasLiked ? '♥' : '♡'}</span>
      <span className="count">{likes}</span>
    </button>
  )
}

export default LikeButton
```

- [ ] **Step 2: Create LikeButton styles**

Create `src/styles/LikeButton.css`:
```css
.like-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  background: transparent;
  border: 2px solid #000;
  cursor: pointer;
  transition: all 0.2s ease;
}

.like-button:hover:not(:disabled) {
  background: #000;
  color: #fff;
}

.like-button:disabled {
  cursor: default;
}

.like-button.liked {
  border-color: #e74c3c;
  color: #e74c3c;
}

.like-button.liked .heart {
  animation: pulse 0.3s ease;
}

@keyframes pulse {
  50% {
    transform: scale(1.3);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/LikeButton.jsx src/styles/LikeButton.css
git commit -m "feat: add LikeButton component with optimistic updates"
```

---

### Task 13: Create ProjectCard Component

**Files:**
- Create: `src/components/ProjectCard.jsx`
- Create: `src/styles/ProjectCard.css`

- [ ] **Step 1: Create ProjectCard component**

Create `src/components/ProjectCard.jsx`:
```javascript
import { Link } from 'react-router-dom'
import LikeButton from './LikeButton'
import '../styles/ProjectCard.css'

const STATUS_LABELS = {
  'idea': 'Idea',
  'in-progress': 'In Progress',
  'paused': 'Paused',
  'completed': 'Completed',
  'abandoned': 'Abandoned'
}

function ProjectCard({ project }) {
  const { slug, name, description, startDate, endDate, status, link, likes } = project

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Present'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <article className="project-card">
      <Link to={`/projects/${slug}`} className="card-link">
        <h2 className="card-title">{name}</h2>
        <p className="card-description">{description}</p>
        <div className="card-meta">
          <span className={`status-badge status-${status}`}>
            {STATUS_LABELS[status] || status}
          </span>
          <span className="date-range">
            {formatDate(startDate)} - {formatDate(endDate)}
          </span>
        </div>
      </Link>
      <div className="card-footer">
        <LikeButton slug={slug} initialLikes={likes} />
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
            onClick={(e) => e.stopPropagation()}
          >
            Visit →
          </a>
        )}
      </div>
    </article>
  )
}

export default ProjectCard
```

- [ ] **Step 2: Create ProjectCard styles**

Create `src/styles/ProjectCard.css`:
```css
.project-card {
  border: 2px solid #000;
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 4px 4px 0 #000;
}

.card-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.card-title {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}

.card-description {
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'VT323', monospace;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border: 1px solid currentColor;
}

.status-in-progress { color: #27ae60; }
.status-idea { color: #3498db; }
.status-paused { color: #f39c12; }
.status-completed { color: #9b59b6; }
.status-abandoned { color: #95a5a6; }

.date-range {
  color: #666;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.external-link {
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  padding: 0.5rem 1rem;
  border: 2px solid #000;
  transition: all 0.2s ease;
}

.external-link:hover {
  background: #000;
  color: #fff;
  text-decoration: none;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ProjectCard.jsx src/styles/ProjectCard.css
git commit -m "feat: add ProjectCard component for dashboard grid"
```

---

### Task 14: Create TweetEmbed Component

**Files:**
- Create: `src/components/TweetEmbed.jsx`
- Create: `src/styles/TweetEmbed.css`

- [ ] **Step 1: Create TweetEmbed component**

Create `src/components/TweetEmbed.jsx`:
```javascript
import { useEffect, useRef, useState } from 'react'
import '../styles/TweetEmbed.css'

function TweetEmbed({ tweetUrl }) {
  const containerRef = useRef(null)
  const [error, setError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Extract tweet ID from URL
    const tweetIdMatch = tweetUrl.match(/status\/(\d+)/)
    if (!tweetIdMatch) {
      setError(true)
      setIsLoading(false)
      return
    }

    const tweetId = tweetIdMatch[1]

    // Load Twitter widget script if not already loaded
    const loadTwitterWidget = () => {
      return new Promise((resolve) => {
        if (window.twttr) {
          resolve(window.twttr)
          return
        }

        const script = document.createElement('script')
        script.src = 'https://platform.twitter.com/widgets.js'
        script.async = true
        script.onload = () => resolve(window.twttr)
        document.head.appendChild(script)
      })
    }

    const embedTweet = async () => {
      try {
        const twttr = await loadTwitterWidget()

        if (containerRef.current) {
          containerRef.current.innerHTML = ''
          await twttr.widgets.createTweet(tweetId, containerRef.current, {
            theme: 'light',
            align: 'center'
          })
        }
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to embed tweet:', err)
        setError(true)
        setIsLoading(false)
      }
    }

    // Use IntersectionObserver for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          embedTweet()
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [tweetUrl])

  if (error) {
    return (
      <div className="tweet-embed tweet-error">
        <p>Tweet unavailable</p>
        <a href={tweetUrl} target="_blank" rel="noopener noreferrer">
          View on Twitter →
        </a>
      </div>
    )
  }

  return (
    <div className="tweet-embed" ref={containerRef}>
      {isLoading && <div className="tweet-loading">Loading tweet...</div>}
    </div>
  )
}

export default TweetEmbed
```

- [ ] **Step 2: Create TweetEmbed styles**

Create `src/styles/TweetEmbed.css`:
```css
.tweet-embed {
  margin: 1.5rem 0;
  min-height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.tweet-loading {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  color: #666;
  padding: 2rem;
  border: 2px dashed #ccc;
  width: 100%;
  text-align: center;
}

.tweet-error {
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  border: 2px solid #e74c3c;
  background: #ffeaea;
}

.tweet-error p {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  margin: 0;
  color: #e74c3c;
}

.tweet-error a {
  font-family: 'VT323', monospace;
  font-size: 1rem;
  color: #e74c3c;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TweetEmbed.jsx src/styles/TweetEmbed.css
git commit -m "feat: add TweetEmbed component with lazy loading"
```

---

### Task 15: Implement BuildInPublic Page

**Files:**
- Modify: `src/pages/BuildInPublic.jsx`
- Modify: `src/styles/BuildInPublic.css`

- [ ] **Step 1: Update BuildInPublic page**

Update `src/pages/BuildInPublic.jsx`:
```javascript
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProjects } from '../api/client'
import ProjectCard from '../components/ProjectCard'
import '../styles/BuildInPublic.css'

function BuildInPublic() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await getProjects()
        setProjects(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  return (
    <div className="build-in-public">
      <nav className="breadcrumb">
        <Link to="/">Home</Link> / <span>Build in Public</span>
      </nav>

      <h1>Build in Public</h1>
      <p className="page-description">
        Follow along as I build projects in the open, sharing progress, learnings, and updates.
      </p>

      {loading && <p className="loading">Loading projects...</p>}

      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && projects.length === 0 && (
        <p className="empty">No projects yet. Check back soon!</p>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="projects-grid">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}

export default BuildInPublic
```

- [ ] **Step 2: Update BuildInPublic styles**

Update `src/styles/BuildInPublic.css`:
```css
.build-in-public {
  min-height: 100vh;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.breadcrumb {
  font-family: 'VT323', monospace;
  font-size: 1rem;
  margin-bottom: 2rem;
  color: #666;
}

.breadcrumb a {
  color: #000;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.build-in-public h1 {
  text-align: center;
  margin-bottom: 0.5rem;
}

.page-description {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  text-align: center;
  color: #666;
  margin-bottom: 3rem;
}

.loading, .error, .empty {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  text-align: center;
  padding: 3rem;
}

.error {
  color: #e74c3c;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

@media (max-width: 400px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Test the page**

Run: `npm run dev` (both client and server)
Navigate to http://localhost:5173/projects
Expected: Grid of project cards (or empty state if no visible projects)

- [ ] **Step 4: Commit**

```bash
git add src/pages/BuildInPublic.jsx src/styles/BuildInPublic.css
git commit -m "feat: implement BuildInPublic dashboard with project grid"
```

---

### Task 16: Implement Project Detail Page

**Files:**
- Modify: `src/pages/Project.jsx`
- Modify: `src/styles/Project.css`

- [ ] **Step 1: Update Project page**

Update `src/pages/Project.jsx`:
```javascript
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProject } from '../api/client'
import LikeButton from '../components/LikeButton'
import TweetEmbed from '../components/TweetEmbed'
import '../styles/Project.css'

const STATUS_LABELS = {
  'idea': 'Idea',
  'in-progress': 'In Progress',
  'paused': 'Paused',
  'completed': 'Completed',
  'abandoned': 'Abandoned'
}

function Project() {
  const { slug } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProject() {
      try {
        const data = await getProject(slug)
        setProject(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [slug])

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Present'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="project-page">
        <p className="loading">Loading project...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="project-page">
        <nav className="breadcrumb">
          <Link to="/">Home</Link> / <Link to="/projects">Projects</Link> / <span>Not Found</span>
        </nav>
        <p className="error">Project not found</p>
        <Link to="/projects" className="back-link">← Back to projects</Link>
      </div>
    )
  }

  return (
    <div className="project-page">
      <nav className="breadcrumb">
        <Link to="/">Home</Link> / <Link to="/projects">Projects</Link> / <span>{project.name}</span>
      </nav>

      <header className="project-header">
        <h1>{project.name}</h1>
        <p className="project-description">{project.description}</p>

        <div className="project-meta">
          <span className={`status-badge status-${project.status}`}>
            {STATUS_LABELS[project.status] || project.status}
          </span>
          <span className="date-range">
            {formatDate(project.startDate)} - {formatDate(project.endDate)}
          </span>
        </div>

        <div className="project-actions">
          <LikeButton slug={slug} initialLikes={project.likes} />
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="visit-link"
            >
              Visit Project →
            </a>
          )}
        </div>
      </header>

      <section className="tweets-section">
        <h2>Updates</h2>
        {project.tweets.length === 0 ? (
          <p className="no-tweets">No updates yet. Check back soon!</p>
        ) : (
          <div className="tweets-timeline">
            {project.tweets.map(tweet => (
              <TweetEmbed key={tweet.id} tweetUrl={tweet.tweetUrl} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Project
```

- [ ] **Step 2: Update Project styles**

Update `src/styles/Project.css`:
```css
.project-page {
  min-height: 100vh;
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.breadcrumb {
  font-family: 'VT323', monospace;
  font-size: 1rem;
  margin-bottom: 2rem;
  color: #666;
}

.breadcrumb a {
  color: #000;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.project-header {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #000;
}

.project-header h1 {
  margin-bottom: 1rem;
}

.project-description {
  font-family: 'VT323', monospace;
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 1.5rem;
  line-height: 1.4;
}

.project-meta {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  margin-bottom: 1.5rem;
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border: 2px solid currentColor;
}

.status-in-progress { color: #27ae60; }
.status-idea { color: #3498db; }
.status-paused { color: #f39c12; }
.status-completed { color: #9b59b6; }
.status-abandoned { color: #95a5a6; }

.date-range {
  color: #666;
}

.project-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.visit-link {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  padding: 0.5rem 1rem;
  border: 2px solid #000;
  transition: all 0.2s ease;
}

.visit-link:hover {
  background: #000;
  color: #fff;
  text-decoration: none;
}

.tweets-section h2 {
  margin-bottom: 1.5rem;
}

.no-tweets {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  color: #666;
  text-align: center;
  padding: 3rem;
  border: 2px dashed #ccc;
}

.tweets-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading, .error {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  text-align: center;
  padding: 3rem;
}

.error {
  color: #e74c3c;
}

.back-link {
  display: block;
  text-align: center;
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  margin-top: 1rem;
}
```

- [ ] **Step 3: Test the page**

Navigate to http://localhost:5173/projects/test-project
Expected: Project header with details and empty tweets section

- [ ] **Step 4: Commit**

```bash
git add src/pages/Project.jsx src/styles/Project.css
git commit -m "feat: implement Project detail page with tweet timeline"
```

---

## Chunk 6: Admin UI

### Task 17: Create AdminLogin Component

**Files:**
- Create: `src/components/AdminLogin.jsx`
- Create: `src/styles/AdminLogin.css`

- [ ] **Step 1: Create AdminLogin component**

Create `src/components/AdminLogin.jsx`:
```javascript
import { useState } from 'react'
import { login } from '../api/client'
import '../styles/AdminLogin.css'

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { token } = await login(password)
      localStorage.setItem('adminToken', token)
      onLogin()
    } catch (err) {
      setError(err.message || 'Invalid password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <h1>Admin Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          autoFocus
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}

export default AdminLogin
```

- [ ] **Step 2: Create AdminLogin styles**

Create `src/styles/AdminLogin.css`:
```css
.admin-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}

.admin-login h1 {
  margin-bottom: 2rem;
}

.admin-login form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 300px;
}

.admin-login input {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  padding: 0.75rem 1rem;
  border: 2px solid #000;
  outline: none;
}

.admin-login input:focus {
  box-shadow: 4px 4px 0 #000;
}

.admin-login button {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  padding: 0.75rem 1rem;
  border: 2px solid #000;
  background: #000;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-login button:hover:not(:disabled) {
  background: #fff;
  color: #000;
}

.admin-login button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.admin-login .error {
  color: #e74c3c;
  font-family: 'VT323', monospace;
  font-size: 1rem;
  text-align: center;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/AdminLogin.jsx src/styles/AdminLogin.css
git commit -m "feat: add AdminLogin component"
```

---

### Task 18: Implement Admin Dashboard

**Files:**
- Modify: `src/pages/Admin.jsx`
- Modify: `src/styles/Admin.css`

- [ ] **Step 1: Update Admin page with full functionality**

Update `src/pages/Admin.jsx`:
```javascript
import { useState, useEffect } from 'react'
import {
  getAdminProjects,
  createProject,
  updateProject,
  deleteProject,
  addTweet,
  removeTweet
} from '../api/client'
import AdminLogin from '../components/AdminLogin'
import '../styles/Admin.css'

const INITIAL_PROJECT = {
  name: '',
  slug: '',
  description: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  status: 'idea',
  link: '',
  visible: true
}

function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingProject, setEditingProject] = useState(null)
  const [formData, setFormData] = useState(INITIAL_PROJECT)
  const [newTweetUrl, setNewTweetUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsLoggedIn(true)
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      fetchProjects()
    }
  }, [isLoggedIn])

  const fetchProjects = async () => {
    try {
      const data = await getAdminProjects()
      setProjects(data)
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('Authentication')) {
        handleLogout()
      }
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    setIsLoggedIn(false)
    setProjects([])
  }

  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg)
      setSuccess('')
    } else {
      setSuccess(msg)
      setError('')
    }
    setTimeout(() => {
      setError('')
      setSuccess('')
    }, 3000)
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    try {
      const newProject = await createProject(formData)
      setProjects([...projects, newProject])
      setFormData(INITIAL_PROJECT)
      showMessage('Project created!')
    } catch (err) {
      showMessage(err.message, true)
    }
  }

  const handleUpdateProject = async (e) => {
    e.preventDefault()
    try {
      const updated = await updateProject(editingProject.id, formData)
      setProjects(projects.map(p => p.id === updated.id ? updated : p))
      setEditingProject(null)
      setFormData(INITIAL_PROJECT)
      showMessage('Project updated!')
    } catch (err) {
      showMessage(err.message, true)
    }
  }

  const handleDeleteProject = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return
    try {
      await deleteProject(id)
      setProjects(projects.filter(p => p.id !== id))
      showMessage('Project deleted!')
    } catch (err) {
      showMessage(err.message, true)
    }
  }

  const handleToggleVisibility = async (project) => {
    try {
      const updated = await updateProject(project.id, { visible: !project.visible })
      setProjects(projects.map(p => p.id === updated.id ? updated : p))
    } catch (err) {
      showMessage(err.message, true)
    }
  }

  const handleAddTweet = async (projectId) => {
    if (!newTweetUrl.trim()) return
    try {
      const tweet = await addTweet(projectId, newTweetUrl)
      setProjects(projects.map(p =>
        p.id === projectId
          ? { ...p, tweets: [...p.tweets, tweet] }
          : p
      ))
      setNewTweetUrl('')
      showMessage('Tweet added!')
    } catch (err) {
      showMessage(err.message, true)
    }
  }

  const handleRemoveTweet = async (projectId, tweetId) => {
    if (!confirm('Remove this tweet?')) return
    try {
      await removeTweet(projectId, tweetId)
      setProjects(projects.map(p =>
        p.id === projectId
          ? { ...p, tweets: p.tweets.filter(t => t.id !== tweetId) }
          : p
      ))
      showMessage('Tweet removed!')
    } catch (err) {
      showMessage(err.message, true)
    }
  }

  const startEditing = (project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      slug: project.slug,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate || '',
      status: project.status,
      link: project.link,
      visible: project.visible
    })
  }

  const cancelEditing = () => {
    setEditingProject(null)
    setFormData(INITIAL_PROJECT)
  }

  if (!isLoggedIn) {
    return (
      <div className="admin-page">
        <AdminLogin onLogin={() => setIsLoggedIn(true)} />
      </div>
    )
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      <section className="admin-section">
        <h2>{editingProject ? 'Edit Project' : 'New Project'}</h2>
        <form onSubmit={editingProject ? handleUpdateProject : handleCreateProject} className="project-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="Project Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="slug-for-url"
              value={formData.slug}
              onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
              required
            />
          </div>
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
          />
          <div className="form-row">
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
            />
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              placeholder="End date (optional)"
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="idea">Idea</option>
              <option value="in-progress">In Progress</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>
          <input
            type="url"
            placeholder="Project URL (optional)"
            value={formData.link}
            onChange={(e) => setFormData({...formData, link: e.target.value})}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.visible}
              onChange={(e) => setFormData({...formData, visible: e.target.checked})}
            />
            Visible to public
          </label>
          <div className="form-actions">
            <button type="submit">{editingProject ? 'Update' : 'Create'} Project</button>
            {editingProject && <button type="button" onClick={cancelEditing}>Cancel</button>}
          </div>
        </form>
      </section>

      <section className="admin-section">
        <h2>Projects ({projects.length})</h2>
        {loading ? (
          <p>Loading...</p>
        ) : projects.length === 0 ? (
          <p>No projects yet.</p>
        ) : (
          <div className="projects-list">
            {projects.map(project => (
              <div key={project.id} className={`project-item ${!project.visible ? 'hidden' : ''}`}>
                <div className="project-info">
                  <h3>{project.name}</h3>
                  <span className={`status-badge status-${project.status}`}>{project.status}</span>
                  {!project.visible && <span className="hidden-badge">Hidden</span>}
                </div>
                <div className="project-actions">
                  <button onClick={() => handleToggleVisibility(project)}>
                    {project.visible ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => startEditing(project)}>Edit</button>
                  <button onClick={() => handleDeleteProject(project.id)} className="danger">Delete</button>
                </div>

                <div className="tweets-manager">
                  <h4>Tweets ({project.tweets.length})</h4>
                  <div className="add-tweet">
                    <input
                      type="url"
                      placeholder="https://twitter.com/user/status/123..."
                      value={editingProject?.id === project.id ? '' : newTweetUrl}
                      onChange={(e) => setNewTweetUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTweet(project.id))}
                    />
                    <button onClick={() => handleAddTweet(project.id)}>Add</button>
                  </div>
                  {project.tweets.length > 0 && (
                    <ul className="tweet-list">
                      {project.tweets.map(tweet => (
                        <li key={tweet.id}>
                          <a href={tweet.tweetUrl} target="_blank" rel="noopener noreferrer">
                            {tweet.tweetUrl.substring(0, 50)}...
                          </a>
                          <button onClick={() => handleRemoveTweet(project.id, tweet.id)} className="danger small">×</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Admin
```

- [ ] **Step 2: Update Admin styles**

Update `src/styles/Admin.css`:
```css
.admin-page {
  min-height: 100vh;
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #000;
}

.admin-header h1 {
  margin: 0;
}

.logout-btn {
  font-family: 'VT323', monospace;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border: 2px solid #000;
  background: transparent;
  cursor: pointer;
}

.logout-btn:hover {
  background: #000;
  color: #fff;
}

.message {
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 2px solid;
}

.message.error {
  border-color: #e74c3c;
  background: #ffeaea;
  color: #e74c3c;
}

.message.success {
  border-color: #27ae60;
  background: #eafff0;
  color: #27ae60;
}

.admin-section {
  margin-bottom: 3rem;
}

.admin-section h2 {
  margin-bottom: 1rem;
}

.project-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row input,
.form-row select {
  flex: 1;
}

.project-form input,
.project-form select,
.project-form textarea {
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  padding: 0.75rem;
  border: 2px solid #000;
}

.project-form input:focus,
.project-form select:focus,
.project-form textarea:focus {
  outline: none;
  box-shadow: 4px 4px 0 #000;
}

.checkbox-label {
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input {
  width: 1.2rem;
  height: 1.2rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
}

.form-actions button,
.project-actions button,
.add-tweet button {
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid #000;
  background: #000;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.form-actions button:hover,
.project-actions button:hover,
.add-tweet button:hover {
  background: #fff;
  color: #000;
}

.form-actions button:last-child {
  background: transparent;
  color: #000;
}

.projects-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.project-item {
  border: 2px solid #000;
  padding: 1.5rem;
}

.project-item.hidden {
  opacity: 0.6;
  border-style: dashed;
}

.project-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.project-info h3 {
  margin: 0;
  font-size: 1.3rem;
}

.status-badge {
  font-family: 'VT323', monospace;
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid currentColor;
}

.status-in-progress { color: #27ae60; }
.status-idea { color: #3498db; }
.status-paused { color: #f39c12; }
.status-completed { color: #9b59b6; }
.status-abandoned { color: #95a5a6; }

.hidden-badge {
  font-family: 'VT323', monospace;
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  background: #f0f0f0;
  color: #666;
}

.project-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.project-actions button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.project-actions button.danger {
  border-color: #e74c3c;
  background: #e74c3c;
}

.project-actions button.danger:hover {
  background: #fff;
  color: #e74c3c;
}

.tweets-manager {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.tweets-manager h4 {
  font-family: 'VT323', monospace;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.add-tweet {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.add-tweet input {
  flex: 1;
  font-family: 'VT323', monospace;
  font-size: 1rem;
  padding: 0.5rem;
  border: 2px solid #000;
}

.add-tweet button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.tweet-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tweet-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
  font-family: 'VT323', monospace;
  font-size: 1rem;
}

.tweet-list a {
  color: #3498db;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.tweet-list button.small {
  padding: 0.25rem 0.5rem;
  font-size: 1rem;
  min-width: 2rem;
}

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
  }

  .project-actions {
    flex-wrap: wrap;
  }
}
```

- [ ] **Step 3: Test admin functionality**

Run: `npm run dev`
Navigate to http://localhost:5173/admin
1. Login with password "changeme123"
2. Create a new project
3. Add a tweet URL
4. Toggle visibility
5. Edit project
6. Delete tweet/project

- [ ] **Step 4: Commit**

```bash
git add src/pages/Admin.jsx src/styles/Admin.css
git commit -m "feat: implement full Admin dashboard with CRUD and tweet management"
```

---

### Task 19: Add Navigation Link to Home

**Files:**
- Modify: `src/pages/Home.jsx`
- Modify: `src/styles/Home.css`

- [ ] **Step 1: Add navigation to Home**

Update `src/pages/Home.jsx`:
```javascript
import { Link } from 'react-router-dom'
import '../styles/Home.css'

function Home() {
  const text = "Coming Soon :)"

  return (
    <div className="home-container">
      <h1 className="wave-text">
        {text.split('').map((letter, index) => (
          <span
            key={index}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        ))}
      </h1>
      <nav className="home-nav">
        <Link to="/projects">Build in Public</Link>
      </nav>
    </div>
  )
}

export default Home
```

- [ ] **Step 2: Add nav styles**

Add to `src/styles/Home.css`:
```css
.home-nav {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
}

.home-nav a {
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  padding: 0.5rem 1rem;
  border: 2px solid #000;
  transition: all 0.2s ease;
}

.home-nav a:hover {
  background: #000;
  color: #fff;
  text-decoration: none;
}
```

- [ ] **Step 3: Make home-container position relative**

Update `.home-container` in `src/styles/Home.css`:
```css
.home-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  background-color: #ffffff;
  position: relative;
}
```

- [ ] **Step 4: Test navigation**

Navigate to http://localhost:5173/
Expected: "Build in Public" link at bottom of page

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home.jsx src/styles/Home.css
git commit -m "feat: add navigation link from home to build-in-public"
```

---

### Task 20: Final Testing & Cleanup

- [ ] **Step 1: Remove test data from content.json**

Reset `data/content.json`:
```json
{
  "buildInPublic": {
    "projects": []
  }
}
```

- [ ] **Step 2: Delete old App.css if redundant**

Check if `src/App.css` still needed, clean up any duplicate styles.

- [ ] **Step 3: Full end-to-end test**

1. Start both servers: `npm run dev`
2. Visit http://localhost:5173/ - see "Coming Soon" with nav link
3. Click "Build in Public" - see empty dashboard
4. Visit /admin - login
5. Create a project with all fields
6. Add a Twitter URL (use a real tweet URL)
7. Go to /projects - see the project card
8. Click into project - see tweet embed
9. Like the project
10. Toggle visibility in admin - project disappears from public
11. Logout from admin

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: cleanup and finalize build-in-public feature"
```

---

## Verification

To verify the complete implementation:

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Test public pages:**
   - Home page loads with navigation
   - /projects shows project grid (empty initially)
   - /projects/:slug shows project detail with tweets

3. **Test admin:**
   - /admin requires login
   - Can create/edit/delete projects
   - Can add/remove tweets
   - Can toggle visibility

4. **Test likes:**
   - Like button works on project cards and detail pages
   - Likes persist (check data/content.json)
   - Same browser can't like twice (localStorage)

5. **Test Twitter embeds:**
   - Tweets load lazily when scrolled into view
   - Invalid URLs show fallback message
   - Clicking embedded tweet interactions work

6. **Run linter:**
   ```bash
   npm run lint
   ```
