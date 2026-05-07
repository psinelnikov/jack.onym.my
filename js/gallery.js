import { createArtViewer } from './artViewer.js';

export var artworks = [
  {
    id: "forma-primordial",
    title: { en: "Primordial Form", pt: "Forma Primordial" },
    description: {
      en: "An exploration of organic shapes that evoke the origins of life. The smooth curves and golden tones suggest something ancient yet timeless.",
      pt: "Uma exploração de formas orgânicas que evocam as origens da vida. As curvas suaves e os tons dourados sugerem algo antigo mas intemporal."
    },
    year: "2025",
    dimensions: "42 × 42 × 35 cm",
    glb: "assets/art/Scaniverse 2026-02-17 165431.glb",
    fallback: "torus"
  },
  {
    id: "fragmentos-de-lisboa",
    title: { en: "Fragments of Lisbon", pt: "Fragmentos de Lisboa" },
    description: {
      en: "Inspired by the tiled facades of Lisbon, this piece deconstructs geometric patterns into a three-dimensional meditation on the city's visual identity.",
      pt: "Inspirada nas fachadas azulejadas de Lisboa, esta peça desconstrói padrões geométricos numa meditação tridimensional sobre a identidade visual da cidade."
    },
    year: "2025",
    dimensions: "55 × 40 × 40 cm",
    glb: "assets/art/Scaniverse 2026-02-17 165803.glb",
    fallback: "abstract"
  },
  {
    id: "horizonte-dourado",
    title: { en: "Golden Horizon", pt: "Horizonte Dourado" },
    description: {
      en: "A spherical study in light and texture. The piece captures the warmth of the Alentejo plains at sunset, frozen in digital form.",
      pt: "Um estudo esférico de luz e textura. A peça captura o calor das planícies alentejanas ao pôr do sol, congelado em forma digital."
    },
    year: "2024",
    dimensions: "30 × 30 × 30 cm",
    glb: "assets/art/Scaniverse 2026-02-17 181553.glb",
    fallback: "sphere"
  },
  {
    id: "eco-do-atlantico",
    title: { en: "Echo of the Atlantic", pt: "Eco do Atlântico" },
    description: {
      en: "The ceaseless motion of ocean waves rendered as a frozen sculpture. Each ridge and valley maps the rhythm of the Portuguese coastline.",
      pt: "O movimento incessante das ondas do mar renderizado como escultura congelada. Cada crista e vale mapeia o ritmo da costa portuguesa."
    },
    year: "2024",
    dimensions: "60 × 35 × 25 cm",
    glb: "assets/art/Scaniverse 2026-02-17 182424.glb",
    fallback: "torus"
  },
  {
    id: "metamorfose-ii",
    title: { en: "Metamorphosis II", pt: "Metamorfose II" },
    description: {
      en: "The second in a series exploring transformation. A rigid geometric form softens into something organic, questioning the boundary between structure and nature.",
      pt: "A segunda de uma série que explora a transformação. Uma forma geométrica rígida suaviza-se em algo orgânico, questionando a fronteira entre estrutura e natureza."
    },
    year: "2025",
    dimensions: "50 × 50 × 45 cm",
    glb: "assets/art/Scaniverse 2026-02-17 184133.glb",
    fallback: "abstract"
  },
  {
    id: "silencio-azul",
    title: { en: "Blue Silence", pt: "Silêncio Azul" },
    description: {
      en: "A meditation on stillness and depth. The deep blue tones evoke the quiet of a Portuguese night, while the form hints at something stirring beneath the surface.",
      pt: "Uma meditação sobre o silêncio e a profundidade. Os tons azuis profundos evocam a quietude de uma noite portuguesa, enquanto a forma sugere algo a agitar-se sob a superfície."
    },
    year: "2024",
    dimensions: "38 × 38 × 30 cm",
    glb: "assets/art/Scaniverse 2026-02-17 191408.glb",
    fallback: "sphere"
  },
  {
    id: "aurora",
    title: { en: "Aurora", pt: "Aurora" },
    description: {
      en: "The first light breaking through darkness. This piece captures the tension between shadow and illumination, stillness and movement.",
      pt: "A primeira luz a romper a escuridão. Esta peça captura a tensão entre sombra e iluminação, imobilidade e movimento."
    },
    year: "2025",
    dimensions: "45 × 40 × 38 cm",
    glb: "assets/art/Scaniverse 2026-02-17 191825.glb",
    fallback: "torus"
  }
];

var modalViewer = null;
var currentLang = "pt";
var cardViewers = [];

export function renderGallery(lang) {
  currentLang = lang;
  var grid = document.getElementById("gallery-grid");
  grid.innerHTML = "";

  cardViewers.forEach(function(v) { v.destroy(); });
  cardViewers = [];

  artworks.forEach(function(art, index) {
    var card = document.createElement("div");
    card.className = "gallery__card fade-in";
    card.innerHTML =
      '<div class="gallery__card-thumb" data-viewer-thumb="' + index + '">' +
        '<div class="gallery__card-overlay"><span data-i18n="btn.viewIn3d">' +
          (lang === "en" ? "View in 3D" : "Ver em 3D") +
        '</span></div>' +
      '</div>' +
      '<div class="gallery__card-info">' +
        '<h3 class="gallery__card-title">' + art.title[lang] + '</h3>' +
        '<p class="gallery__card-year">' + art.year + '</p>' +
        '<div class="gallery__card-footer">' +
          '<span class="gallery__card-tag">3D</span>' +
        '</div>' +
      '</div>';

    card.addEventListener("click", function() {
      openModal(art, lang);
    });

    grid.appendChild(card);

    setTimeout(function() {
      var thumbContainer = card.querySelector('[data-viewer-thumb]');
      var viewer = createArtViewer(thumbContainer, {
        glbUrl: art.glb,
        fallbackGeometry: art.fallback,
        backgroundColor: 0x141414,
        parallaxIntensity: 0.2,
        autoRotate: true
      });
      cardViewers.push(viewer);

      card.classList.add("visible");
    }, 100 + index * 80);
  });
}

export function openModal(art, lang) {
  var modal = document.getElementById("artwork-modal");
  var viewer = document.getElementById("modal-viewer");
  var loader = document.getElementById("modal-loader");
  var title = document.getElementById("modal-title");
  var desc = document.getElementById("modal-description");
  var dims = document.getElementById("modal-dimensions");

  if (modalViewer) {
    modalViewer.destroy();
  }

  loader.classList.remove("hidden");
  viewer.querySelectorAll("canvas").forEach(function(c) { c.remove(); });

  title.textContent = art.title[lang];
  desc.textContent = art.description[lang];
  dims.textContent = art.dimensions;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  setTimeout(function() {
    modalViewer = createArtViewer(viewer, {
      glbUrl: art.glb,
      fallbackGeometry: art.fallback,
      backgroundColor: 0x0a0a0a,
      parallaxIntensity: 0.45,
      autoRotate: false,
      zoomOnStart: true,
      onLoad: function() {
        loader.classList.add("hidden");
      }
    });
    modalViewer.resize();
  }, 450);
}

export function closeModal() {
  var modal = document.getElementById("artwork-modal");
  modal.classList.remove("active");
  document.body.style.overflow = "";

  if (modalViewer) {
    setTimeout(function() {
      modalViewer.destroy();
      modalViewer = null;
    }, 400);
  }
}

export function updateGalleryLanguage(lang) {
  currentLang = lang;
  var modal = document.getElementById("artwork-modal");
  if (modal.classList.contains("active")) {
    var titleEl = document.getElementById("modal-title");
    var descEl = document.getElementById("modal-description");

    var activeArt = artworks.find(function(a) {
      return a.title["en"] === titleEl.textContent || a.title["pt"] === titleEl.textContent;
    });
    if (activeArt) {
      titleEl.textContent = activeArt.title[lang];
      descEl.textContent = activeArt.description[lang];
    }
  }
}

export function initGallery() {
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-backdrop").addEventListener("click", closeModal);
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") closeModal();
  });
}
