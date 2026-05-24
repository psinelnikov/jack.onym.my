export const translations = {
  "nav.logo":       { en: "JACK", pt: "JACK" },
  "nav.gallery":    { en: "Gallery",   pt: "Galeria" },
  "nav.about":      { en: "About",     pt: "Sobre" },

  "hero.tagline":   { en: "Contemporary Portuguese Artist", pt: "Artista Português Contemporâneo" },
  "hero.title":     { en: "Art That Comes Alive", pt: "Obras que Ganham Vida" },
  "hero.subtitle":  {
    en: "Explore digital artwork in three dimensions. Hover over the pieces to discover new perspectives.",
    pt: "Explore arte digital em três dimensões. Mova o cursor sobre as obras para descobrir novos ângulos."
  },
  "hero.cta":       { en: "View Gallery", pt: "Ver Galeria" },
  "hero.scroll":    { en: "Scroll", pt: "Scroll" },

  "gallery.title":    { en: "Gallery",   pt: "Galeria" },
  "gallery.subtitle": { en: "Click on a piece to explore it in 3D", pt: "Clique numa obra para a explorar em 3D" },

  "about.title": { en: "About the Artist", pt: "Sobre o Artista" },
  "about.bio1":  {
    en: "JACK is a Portuguese artist born in Lisbon in 1961. His practice explores the intersection between traditional sculpture and digital technology, creating works that exist in the space between the physical and the virtual.",
    pt: "JACK é um artista português nascido em Lisboa em 1961. A sua prática artística explora a interseção entre escultura tradicional e tecnologia digital, criando obras que existem no espaço entre o físico e o virtual."
  },
  "about.bio2": {
    en: "Graduated in Fine Arts from the University of Life, JACK began experimenting with 3D modeling in 2015. Since then, his works have been exhibited in galleries across the country and internationally.",
    pt: "Formado em Belas Artes pela Universidade da Vida, JACK começou a experimentar modelação 3D em 2015. Desde então, as suas obras têm sido exibidas em galerias por todo o país e internacionalmente."
  },
  "about.bio3": {
    en: "Each piece is conceived as an experience — looking is not enough. The viewer is invited to move around the work, to discover hidden details, to feel the presence of the object in space.",
    pt: "Cada peça é concebida como uma experiência — não basta olhar. O espectador é convidado a mover-se à volta da obra, a descobrir detalhes escondidos, a sentir a presença do objeto no espaço."
  },

  "footer.rights": { en: "\u00a9 2026 JACK. All rights reserved.", pt: "\u00a9 2026 JACK. Todos os direitos reservados." },
  "footer.made":   { en: "Made with passion in Ericeira", pt: "Feito com paixão em Ericeira" },

  "btn.viewIn3d":   { en: "View in 3D", pt: "Ver em 3D" },
  "btn.close":      { en: "Close",     pt: "Fechar" },

  "modal.hint": {
    en: "Move your cursor over the artwork to explore",
    pt: "Mova o cursor sobre a obra para explorar"
  }
};

export function setLanguage(lang) {
  document.querySelectorAll("[data-i18n]").forEach(function(el) {
    var key = el.getAttribute("data-i18n");
    if (translations[key] && translations[key][lang]) {
      el.textContent = translations[key][lang];
    }
  });
  document.documentElement.lang = lang;
  localStorage.setItem("lang", lang);

  var flagEl = document.getElementById("lang-flag");
  var textEl = document.getElementById("lang-text");
  if (lang === "pt") {
    flagEl.textContent = "\ud83c\uddec\ud83c\udde7";
    textEl.textContent = "EN";
  } else {
    flagEl.textContent = "\ud83c\uddf5\ud83c\uddf9";
    textEl.textContent = "PT";
  }
}

export function getSavedLanguage() {
  var saved = localStorage.getItem("lang");
  if (saved === "en" || saved === "pt") return saved;
  return "pt";
}
