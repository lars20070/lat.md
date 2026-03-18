# Website

Standalone Next.js app in `website/`. Deployed to Vercel at `lat.md`.

Completely separate from the npm package — has its own `package.json`, `tsconfig.json`, and `.gitignore`. Never included in `dist`.

## Current State

Black page with centered monospace ASCII art logo (inlined — Vercel can't access `templates/`).

Includes a "What's New" changelog (versions 0.5–0.9) with a text-brightness gradient — newest entries are lighter, older ones fade darker.
