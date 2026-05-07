# JACK — 3D Art Portfolio

A single-page portfolio website for a Portuguese contemporary artist selling 3D scanned artwork. Built with vanilla HTML, CSS, and JavaScript. Artwork is displayed as interactive 3D models using Three.js — hovering over a piece changes the visual perspective via cursor-driven parallax.

## Features

- **3D artwork viewer** — GLB files rendered with Three.js and GLTFLoader
- **Cursor parallax** — move the cursor over any artwork to rotate and explore it from different angles
- **Language toggle** — switch between Portuguese (default) and English; persists via `localStorage`
- **Gallery grid** — responsive card grid with inline 3D previews that open into a full modal viewer
- **Dark theme** — minimal, gallery-style design with Playfair Display + Inter fonts
- **Responsive** — mobile-friendly layout with touch support

## File Structure

```
├── index.html            Main page (all sections)
├── css/
│   └── styles.css        Dark theme, layout, responsive breakpoints
├── js/
│   ├── main.js           App init, scroll behavior, language toggle
│   ├── i18n.js           EN/PT translation dictionary
│   ├── artViewer.js      Three.js scene factory with GLB loader + parallax
│   └── gallery.js        Artwork data, grid rendering, modal viewer
├── assets/
│   ├── art/              GLB 3D model files
│   └── img/              Thumbnails, artist photo, etc.
```

## Running Locally

This project uses ES modules (`import`/`export`), so it must be served over HTTP. Opening `index.html` directly as a file will not work.

```bash
# Python
python3 -m http.server 8080

# Node.js (if npx available)
npx serve .

# Then open http://localhost:8080
```

## Adding Artwork

1. Place your `.glb` file in `assets/art/`
2. Add an entry to the `artworks` array in `js/gallery.js`:

```js
{
  id: "my-new-piece",
  title: { en: "My New Piece", pt: "A Minha Nova Peça" },
  description: {
    en: "Description in English.",
    pt: "Descrição em português."
  },
  year: "2025",
  dimensions: "40 × 30 × 25 cm",
  glb: "assets/art/my-new-piece.glb",
  fallback: "torus"
}
```

The `fallback` field (`"torus"`, `"sphere"`, or `"abstract"`) is used if the GLB file fails to load.

## Editing Translations

All translatable strings live in `js/i18n.js` as a dictionary keyed by `data-i18n` attributes. To add or edit a translation:

```js
"some.key": { en: "English text", pt: "Texto em português" }
```

Then add `data-i18n="some.key"` to the corresponding HTML element.

## Deployment

This is a static site — deploy to any static host:

- **Netlify**: drag and drop the project folder, or connect a Git repo
- **Vercel**: `vercel` from the project root
- **GitHub Pages**: push to a repo and enable Pages in settings

No build step required.
