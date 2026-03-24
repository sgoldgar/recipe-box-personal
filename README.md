# 📖 Recipe Box

A playful, colorful React + TypeScript app for storing, displaying, and categorizing your home cooking recipes.

## Features

- 📤 **Upload** images (JPG, PNG, WEBP) or PDFs of your recipes
- 🗂️ **Organize** by category (breakfast, lunch, dinner, dessert, snack, drink)
- 🌍 **Filter by cuisine** (Italian, Asian, American, Mexican, Mediterranean, French, Indian)
- 🏷️ **Custom tags** — add any labels you like (e.g. #gluten-free, #quick, #family-favorite)
- 🔍 **Search** recipes by name
- 👁️ **Viewer** — full image display or in-browser PDF viewer
- ⬇️ **Download** any recipe file
- 💾 **Persists locally** — recipes are saved in your browser's localStorage

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Install & Run

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
recipe-box/
├── src/
│   ├── App.tsx       # All components (Header, Grid, Upload, Detail views)
│   └── main.tsx      # React entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Tech Stack

- **React 18** with hooks
- **TypeScript** — fully typed
- **Vite** — lightning-fast dev server & bundler
- **localStorage** — zero-backend persistence
- **No external UI libraries** — all styling is custom CSS-in-JS
