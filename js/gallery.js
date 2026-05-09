import { createArtViewer, createThumbnailSnapshot } from './artViewer.js';

var isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

var _heroViewer = null;
var _destroyHero = null;
var _recreateHero = null;
export function setHeroViewer(v) { _heroViewer = v; }
export function setHeroCallbacks(destroy, recreate) { _destroyHero = destroy; _recreateHero = recreate; }

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
    id: "fragmentos-de-ericeira",
    title: { en: "Fragments of Ericeira", pt: "Fragmentos de Ericeira" },
    description: {
      en: "Inspired by the whitewashed facades and wave-worn stone of Ericeira, this piece deconstructs the town's raw geometry into a three-dimensional meditation on place and memory.",
      pt: "Inspirada nas fachadas caiadas e nas pedras desgastadas pelo mar de Ericeira, esta peça desconstrói a geometria crua da vila numa meditação tridimensional sobre o lugar e a memória."
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
    id: "corpo-e-pedra",
    title: { en: "Body and Stone", pt: "Corpo e Pedra" },
    description: {
      en: "An inquiry into the collision of organic and mineral. The work holds the tension between something that grows and something that endures.",
      pt: "Uma indagação sobre o encontro entre o orgânico e o mineral. A obra sustém a tensão entre aquilo que cresce e aquilo que perdura."
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
    id: "peso-da-ausencia",
    title: { en: "Weight of Absence", pt: "Peso da Ausência" },
    description: {
      en: "A hollow form that carries more presence than mass. The void at its centre is not emptiness but a space charged with what was once there.",
      pt: "Uma forma oca que carrega mais presença do que massa. O vazio no seu centro não é ausência, mas um espaço carregado do que outrora existiu."
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
var _scrollY = 0;

function lockScroll() {
  _scrollY = window.scrollY;
  document.body.style.top = '-' + _scrollY + 'px';
  document.body.classList.add('modal-open');
}

function unlockScroll() {
  document.body.classList.remove('modal-open');
  document.body.style.top = '';
  window.scrollTo(0, _scrollY);
}


export function renderGallery(lang) {
  currentLang = lang;
  var grid = document.getElementById("gallery-grid");
  grid.innerHTML = "";

  cardViewers.forEach(function(v) { v.destroy(); });
  cardViewers = [];

  artworks.forEach(function(art, index) {
    var card = document.createElement("div");
    card.className = "gallery__card fade-in loading";
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
      openModal(art, currentLang);
    });

    grid.appendChild(card);

    var snapshotObserver = new IntersectionObserver(function(entries, obs) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        var thumbContainer = card.querySelector('[data-viewer-thumb]');
        createThumbnailSnapshot(art.glb, art.fallback, 0x141414, function(dataUrl) {
          var img = document.createElement('img');
          img.src = dataUrl;
          img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
          thumbContainer.appendChild(img);
          card.classList.remove('loading');
        });
      });
    }, { rootMargin: '200px' });
    snapshotObserver.observe(card);
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
  lockScroll();
  if (_destroyHero) _destroyHero();

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
  unlockScroll();
  if (_recreateHero) _recreateHero();

  if (modalViewer) {
    setTimeout(function() {
      modalViewer.destroy();
      modalViewer = null;
    }, 400);
  }
}

export function updateGalleryLanguage(lang) {
  currentLang = lang;

  artworks.forEach(function(art, index) {
    var thumb = document.querySelector('[data-viewer-thumb="' + index + '"]');
    if (!thumb) return;
    var card = thumb.closest('.gallery__card');
    if (!card) return;
    var titleEl = card.querySelector('.gallery__card-title');
    if (titleEl) titleEl.textContent = art.title[lang];
    var overlaySpan = thumb.querySelector('[data-i18n="btn.viewIn3d"]');
    if (overlaySpan) overlaySpan.textContent = lang === 'en' ? 'View in 3D' : 'Ver em 3D';
  });

  var modal = document.getElementById("artwork-modal");
  if (modal.classList.contains("active")) {
    var modalTitle = document.getElementById("modal-title");
    var modalDesc = document.getElementById("modal-description");
    var activeArt = artworks.find(function(a) {
      return a.title["en"] === modalTitle.textContent || a.title["pt"] === modalTitle.textContent;
    });
    if (activeArt) {
      modalTitle.textContent = activeArt.title[lang];
      modalDesc.textContent = activeArt.description[lang];
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
