const body = document.body;
const themeMeta = document.querySelector('meta[name="theme-color"]');
const toast = document.querySelector('.toast');
const switcher = document.querySelector('.concept-switcher');

const extraStyles = document.createElement('link');
extraStyles.rel = 'stylesheet';
extraStyles.href = 'extra-concepts.css';
document.head.appendChild(extraStyles);

const extraConcepts = [
  ['luxe', 'D · Luxe'],
  ['swiss', 'E · Swiss']
];
const shareButton = switcher?.querySelector('[data-share-concept]');
extraConcepts.forEach(([id, label]) => {
  if (switcher?.querySelector(`[data-set-concept="${id}"]`)) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.setConcept = id;
  button.textContent = label;
  switcher?.insertBefore(button, shareButton || null);
});

const buttons = [...document.querySelectorAll('[data-set-concept]')];
const concepts = buttons.map((button) => button.dataset.setConcept);
const themeColors = {
  editorial: '#f2f0e9',
  cosmos: '#07070a',
  brutal: '#fff331',
  luxe: '#f3eadf',
  swiss: '#f5f5f2'
};

function setConcept(concept, { updateUrl = false } = {}) {
  if (!concepts.includes(concept)) concept = 'editorial';
  body.dataset.concept = concept;
  buttons.forEach((button) => {
    const active = button.dataset.setConcept === concept;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  localStorage.setItem('rima-concept', concept);
  if (themeMeta) themeMeta.content = themeColors[concept] || themeColors.editorial;
  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set('concept', concept);
    history.replaceState({}, '', url);
  }
}

const fromUrl = new URLSearchParams(window.location.search).get('concept');
const saved = localStorage.getItem('rima-concept');
setConcept(concepts.includes(fromUrl) ? fromUrl : concepts.includes(saved) ? saved : 'editorial');

buttons.forEach((button) => button.addEventListener('click', () => setConcept(button.dataset.setConcept, { updateUrl: true })));

document.querySelector('[data-share-concept]')?.addEventListener('click', async () => {
  const url = new URL(window.location.href);
  url.searchParams.set('concept', body.dataset.concept);
  try {
    await navigator.clipboard.writeText(url.toString());
    toast?.classList.add('show');
    window.setTimeout(() => toast?.classList.remove('show'), 1800);
  } catch {
    window.location.href = url.toString();
  }
});

const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-nav');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  nav?.classList.toggle('is-open', !open);
});
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('is-open');
  menu?.setAttribute('aria-expanded', 'false');
}));

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px' });
  document.querySelectorAll('.case, .person, .plan, .display-copy').forEach((el) => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}
