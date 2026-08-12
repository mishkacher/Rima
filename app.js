const body = document.body;
const themeMeta = document.querySelector('meta[name="theme-color"]');
const toast = document.querySelector('.toast');
const buttons = [...document.querySelectorAll('[data-set-concept]')];
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
  const base = photo ? variant.slice(0, -6) : variant;
  return {
    variant: variants.includes(variant) && baseConcepts.includes(base) ? variant : 'editorial',
    base: baseConcepts.includes(base) ? base : 'editorial',
    media: photo && baseConcepts.includes(base) ? 'official' : 'abstract'
  };
}

function hydrateOfficialMedia() {
  document.querySelectorAll('[data-official-src]').forEach((node) => {
    if (!node.getAttribute('src')) {
      // The photo variant is an explicit user choice, so preload the complete visual layer.
      // This also keeps screenshots and rapid concept switching deterministic.
      node.loading = 'eager';
      node.setAttribute('src', node.dataset.officialSrc);
    }
  });
}

function setConcept(variant, { updateUrl = false } = {}) {
  const parsed = parseVariant(variant);
  body.dataset.concept = parsed.base;
  body.dataset.media = parsed.media;
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
}

const fromUrl = new URLSearchParams(window.location.search).get('concept');
const saved = localStorage.getItem('rima-concept');
setConcept(variants.includes(fromUrl) ? fromUrl : variants.includes(saved) ? saved : 'editorial');

buttons.forEach((button) => {
  button.addEventListener('click', () => setConcept(button.dataset.setConcept, { updateUrl: true }));
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
    closeMenu();
    menu?.focus();
  }
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) closeMenu();
});
