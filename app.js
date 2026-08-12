const body = document.body;
const themeMeta = document.querySelector('meta[name="theme-color"]');
const toast = document.querySelector('.toast');
const buttons = [...document.querySelectorAll('[data-set-concept]')];
const conceptSwitcher = document.querySelector('.concept-switcher');
const conceptToggle = document.querySelector('[data-concept-toggle]');
const variants = buttons.map((button) => button.dataset.setConcept);
const baseConcepts = ['editorial', 'cosmos', 'brutal', 'luxe', 'swiss'];
const themeColors = {
  editorial: '#f4f0df',
  cosmos: '#0b0d18',
  brutal: '#f3ef38',
  luxe: '#f5e9dc',
  swiss: '#f7f6f0'
};

function parseVariant(variant) {
  const photo = variant.endsWith('-photo');
  const motion = variant.endsWith('-motion');
  const base = photo ? variant.slice(0, -6) : motion ? variant.slice(0, -7) : variant;
  const valid = variants.includes(variant) && baseConcepts.includes(base);
  return {
    variant: valid ? variant : 'editorial',
    base: valid ? base : 'editorial',
    media: valid && (photo || motion) ? 'official' : 'abstract',
    motion: valid && motion ? 'on' : 'off'
  };
}

function hydrateOfficialMedia() {
  document.querySelectorAll('[data-official-src]').forEach((node) => {
    if (!node.getAttribute('src')) {
      node.loading = 'eager';
      node.setAttribute('src', node.dataset.officialSrc);
    }
  });
}

function setConcept(variant, { updateUrl = false } = {}) {
  const parsed = parseVariant(variant);
  body.dataset.concept = parsed.base;
  body.dataset.media = parsed.media;
  body.dataset.motion = parsed.motion;
  body.dataset.variant = parsed.variant;

  buttons.forEach((button) => {
    const active = button.dataset.setConcept === parsed.variant;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  if (parsed.media === 'official') hydrateOfficialMedia();
  localStorage.setItem('rima-concept', parsed.variant);
  if (themeMeta) themeMeta.content = themeColors[parsed.base];

  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set('concept', parsed.variant);
    history.replaceState({}, '', url);
  }

  window.dispatchEvent(new CustomEvent('rima:conceptchange', { detail: parsed }));
}

const fromUrl = new URLSearchParams(window.location.search).get('concept');
const saved = localStorage.getItem('rima-concept');
setConcept(variants.includes(fromUrl) ? fromUrl : variants.includes(saved) ? saved : 'editorial');

function setConceptChooserOpen(open) {
  conceptSwitcher?.classList.toggle('is-open', open);
  conceptToggle?.setAttribute('aria-expanded', String(open));
  conceptToggle?.setAttribute('aria-label', open ? 'Закрыть выбор дизайн-концепции' : 'Открыть выбор дизайн-концепции');
}

conceptToggle?.addEventListener('click', () => {
  setConceptChooserOpen(!conceptSwitcher?.classList.contains('is-open'));
});

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    setConcept(button.dataset.setConcept, { updateUrl: true });
    if (window.innerWidth <= 900) setConceptChooserOpen(false);
  });
});

document.querySelector('[data-share-concept]')?.addEventListener('click', async () => {
  const url = new URL(window.location.href);
  url.searchParams.set('concept', body.dataset.variant || 'editorial');
  try {
    await navigator.clipboard.writeText(url.toString());
    toast?.classList.add('show');
    window.setTimeout(() => toast?.classList.remove('show'), 1800);
  } catch {
    history.replaceState({}, '', url);
    if (toast) toast.textContent = 'Ссылка готова в адресной строке';
    toast?.classList.add('show');
    window.setTimeout(() => toast?.classList.remove('show'), 1800);
  }
});

const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-nav');

function closeMenu() {
  nav?.classList.remove('is-open');
  menu?.setAttribute('aria-expanded', 'false');
}

menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  nav?.classList.toggle('is-open', !open);
});

nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const chooserWasOpen = conceptSwitcher?.classList.contains('is-open');
    closeMenu();
    setConceptChooserOpen(false);
    (chooserWasOpen ? conceptToggle : menu)?.focus();
  }
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    closeMenu();
    setConceptChooserOpen(false);
  }
});
