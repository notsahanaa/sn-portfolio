# Build in Public Portfolio Section - Design Spec

## Overview

Add a "Build in Public" section to the portfolio showcasing projects with their associated Twitter/X posts. Includes a password-protected admin UI for content management and visitor-interactive like buttons.

## Requirements

### Functional
- Dashboard displaying project cards with: name, description, date range, status, link, like count
- Individual project pages showing embedded Twitter posts (chronological, latest first)
- Interactive Twitter embeds (visitors can like/retweet/reply via Twitter)
- Real visitor likes persisted to backend
- Password-protected admin UI for managing projects and tweets
- Projects can be hidden (disabled) without deletion

### Non-Functional
- Retro VT323 aesthetic consistent with existing site
- Fast page loads (lazy-load Twitter embeds)
- Future-proof structure for additional CMS content types

## Data Model

```json
{
  "buildInPublic": {
    "projects": [
      {
        "id": "uuid",
        "slug": "my-saas-app",
        "name": "My SaaS App",
        "description": "Building a productivity tool in public",
        "startDate": "2024-01-15",
        "endDate": null,
        "status": "in-progress",
        "link": "https://mysaas.com",
        "visible": true,
        "likes": 42,
        "tweets": [
          {
            "id": "tweet-uuid",
            "tweetUrl": "https://twitter.com/you/status/123456789",
            "addedAt": "2024-03-15T10:00:00Z"
          }
        ]
      }
    ]
  }
}
```

**Status options:** `idea`, `in-progress`, `paused`, `completed`, `abandoned`

**Notes:**
- `visible: false` hides from public but retains in data
- `endDate: null` indicates ongoing project
- Structure namespaced for future content types (`portfolio`, `blog`, etc.)

## Architecture

### File Structure

```
sn-portfolio/
├── src/                          # React frontend
│   ├── components/
│   │   ├── ProjectCard.jsx       # Card for dashboard
│   │   ├── ProjectDetail.jsx     # Full project page with tweets
│   │   ├── TweetEmbed.jsx        # Wrapper for Twitter embed
│   │   ├── LikeButton.jsx        # Heart button with count
│   │   └── AdminLogin.jsx        # Password form
│   ├── pages/
│   │   ├── Home.jsx              # Landing page
│   │   ├── BuildInPublic.jsx     # Project dashboard
│   │   ├── Project.jsx           # Individual project page
│   │   └── Admin.jsx             # Admin panel
│   ├── api/
│   │   └── client.js             # API helper functions
│   ├── App.jsx                   # Routes setup
│   └── ...
├── server/                       # Express backend
│   ├── index.js                  # Server entry
│   ├── routes/
│   │   ├── projects.js           # CRUD for projects
│   │   ├── likes.js              # Like endpoint
│   │   └── auth.js               # Admin login
│   └── middleware/
│       └── auth.js               # JWT verification
├── data/
│   └── content.json              # All site content
├── .env                          # ADMIN_PASSWORD, JWT_SECRET
└── package.json
```

### Tech Stack
- **Frontend:** React 19, Vite, React Router
- **Backend:** Express.js
- **Storage:** JSON file
- **Auth:** Simple JWT-based session
- **Styling:** Plain CSS (VT323 font)

## API Endpoints

### Public (no auth)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/projects` | List visible projects |
| GET | `/api/projects/:slug` | Get single project + tweets |
| POST | `/api/projects/:slug/like` | Increment like count |

### Admin (requires JWT)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/admin/projects` | Create project |
| PUT | `/api/admin/projects/:id` | Update project |
| DELETE | `/api/admin/projects/:id` | Delete project |
| POST | `/api/admin/projects/:id/tweets` | Add tweet URL |
| DELETE | `/api/admin/projects/:id/tweets/:tweetId` | Remove tweet |

## User Interface

### Dashboard (`/projects`)
- Responsive grid of project cards (1 col mobile, 2-3 cols desktop)
- Each card: name, truncated description, status badge, date range, like count, link icon
- Cards clickable → navigate to project detail
- Retro VT323 styling, subtle hover animations

### Project Page (`/projects/:slug`)
- Header: project name, full description, status, dates, link button, like button
- Below: vertical timeline of Twitter embeds (newest first)
- Embeds loaded via Twitter's official widget (interactive)

### Admin (`/admin`)
- Login: simple password input, retro styled
- Dashboard: list all projects (including hidden)
- Actions: create, edit, toggle visibility, delete
- Edit view: form for all project fields
- Tweet management: URL input, list with delete buttons

### Navigation
- Nav link from homepage to "Build in Public"
- Breadcrumbs on project detail pages

## Error Handling

### Twitter Embeds
- Invalid/deleted tweets: show "Tweet unavailable" fallback with link
- Lazy load embeds (intersection observer) for performance

### Likes
- localStorage tracks liked projects per visitor
- Optimistic UI update, then sync with server
- Graceful degradation if localStorage unavailable

### Admin
- 24-hour session expiry, redirect to login
- Confirm dialogs before destructive actions
- Basic URL validation on save

### API
- 404 for non-existent projects
- 401 for unauthenticated admin requests
- 500 with logging for file write failures

## Security

- Admin password stored in `.env` (never committed)
- JWT secret in `.env`
- Rate limiting on like endpoint (optional enhancement)
- No sensitive data exposed in public API responses

## Future Considerations

- Additional content types under same CMS (`portfolio`, `blog`)
- Image uploads for project thumbnails
- Tag/category filtering
- Search functionality
