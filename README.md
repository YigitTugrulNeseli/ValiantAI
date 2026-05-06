# Valiant Flow

Valiant Flow is a premium workspace for planning daily work as movable project islands and detailed task-flow trees.

## Highlights

- Large dotted workspace canvas with draggable project islands.
- Project overview with selected, pinned, and last-opened island states.
- Zoom, pan, minimap, and fit-to-workspace controls.
- Task cards with status, priority, owner, due date, notes, and progress.
- Drag-and-drop node layout with persistent manual positions.
- Curved/orthogonal node connections with hidden connection handles.
- Resizable glass inspector panel with grouped controls.
- Undo/redo, JSON import/export, and versioned localStorage migration.
- Dark/light theme support.
- Node backend with decision-engine API endpoints for the future AI layer.

## Run Locally

```bash
PORT=3001 node src/server.js
```

Then open the local app at:

```text
http://127.0.0.1:3001/
```

This local address only works on your own machine. It is not a public GitHub or Netlify link.

## Deploy on Netlify

This repo is ready for Netlify as a static frontend deploy.

Netlify should use these settings:

- Build command: `node --check public/app.js`
- Publish directory: `public`
- Node version: `20`

The same settings are included in `netlify.toml`, so a GitHub-connected Netlify site should pick them up automatically on the next deploy.

## Tests

```bash
node --check public/app.js
node --test
```

The visual smoke test is included at `tests/visual-smoke.test.js` and runs automatically when Playwright is available.

## API

- `GET /api/health`
- `GET /api/playbooks`
- `POST /api/decide`

## Status

Valiant Flow is an active prototype evolving from a task mindmap into a large multi-project workspace.
