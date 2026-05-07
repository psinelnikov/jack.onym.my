import { setLanguage, getSavedLanguage } from './i18n.js';
import { createArtViewer } from './artViewer.js';
import { renderGallery, initGallery, updateGalleryLanguage, artworks } from './gallery.js';

var heroViewer = null;
var currentLang = getSavedLanguage();

function initNav() {
  var nav = document.getElementById("nav");

  window.addEventListener("scroll", function() {
    if (window.scrollY > 60) {
      nav.classList.add("nav--scrolled");
    } else {
      nav.classList.remove("nav--scrolled");
    }
  }, { passive: true });
}

function initLangToggle() {
  var btn = document.getElementById("lang-toggle");
  btn.addEventListener("click", function() {
    currentLang = currentLang === "pt" ? "en" : "pt";
    setLanguage(currentLang);
    updateGalleryLanguage(currentLang);
  });
}

function initHero() {
  var container = document.getElementById("hero-viewer");
  heroViewer = createArtViewer(container, {
    glbUrl: artworks[0].glb,
    fallbackGeometry: artworks[0].fallback,
    backgroundColor: 0x141414,
    parallaxIntensity: 0.4,
    autoRotate: true
  });
}

function initScrollAnimations() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".fade-in").forEach(function(el) {
    observer.observe(el);
  });
}

function init() {
  setLanguage(currentLang);
  initNav();
  initLangToggle();
  initHero();
  initGallery();
  renderGallery(currentLang);

  setTimeout(initScrollAnimations, 200);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
