(() => {
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealTargets = [
    '.about-main', '.about-side', '.section-heading', '.case',
    '.person', '.plan', '.sputnik-signature',
    '#contact .kicker', '#contact h2', '#contact > p', '#contact .contact-btn'
  ].join(',');

  let observer = null;
  let raf = 0;

  function disconnect() {
    observer?.disconnect();
    observer = null;
    body.classList.remove('motion-enhanced');
    document.querySelectorAll('.motion-node').forEach((node) => {
      node.classList.remove('motion-node', 'motion-in');
    });
    delete body.dataset.motionReady;
    delete body.dataset.motionLanguage;
    body.style.removeProperty('--mx');
    body.style.removeProperty('--my');
    body.style.removeProperty('--scroll-progress');
  }

  function markReducedMotionReady() {
    document.querySelectorAll(revealTargets).forEach((node) => {
      node.classList.add('motion-node', 'motion-in');
    });
    body.classList.add('motion-enhanced');
    body.dataset.motionReady = 'true';
  }

  function setupObserver() {
    document.querySelectorAll(revealTargets).forEach((node) => node.classList.add('motion-node'));

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('motion-in');
          observer?.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -7% 0px' });

    document.querySelectorAll('.motion-node').forEach((node) => observer.observe(node));
    body.classList.add('motion-enhanced');
    body.dataset.motionReady = 'true';
  }

  function setup() {
    disconnect();
    if (body.dataset.motion !== 'on') return;

    body.dataset.motionLanguage = body.dataset.concept || 'editorial';

    if (reduceMotion.matches) {
      markReducedMotionReady();
      return;
    }

    setupObserver();
  }

  function updatePointer(event) {
    if (body.dataset.motion !== 'on' || body.dataset.concept !== 'cosmos' || reduceMotion.matches) return;
    const x = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
    const y = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      body.style.setProperty('--mx', x.toFixed(3));
      body.style.setProperty('--my', y.toFixed(3));
    });
  }

  function updateScroll() {
    if (body.dataset.motion !== 'on' || reduceMotion.matches) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      body.style.setProperty('--scroll-progress', Math.min(1, window.scrollY / max).toFixed(4));
    });
  }

  window.addEventListener('rima:conceptchange', setup);
  window.addEventListener('pointermove', updatePointer, { passive: true });
  window.addEventListener('scroll', updateScroll, { passive: true });
  reduceMotion.addEventListener?.('change', setup);

  setup();
  updateScroll();
})();
