const buttons = [...document.querySelectorAll('[data-set-concept]')];
const body = document.body;

function setConcept(concept) {
  body.dataset.concept = concept;
  buttons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.setConcept === concept);
  });
  localStorage.setItem('rima-concept', concept);
}

const saved = localStorage.getItem('rima-concept');
if (saved && buttons.some((button) => button.dataset.setConcept === saved)) {
  setConcept(saved);
}

buttons.forEach((button) => {
  button.addEventListener('click', () => setConcept(button.dataset.setConcept));
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('in-view');
  });
}, { threshold: 0.12 });

document.querySelectorAll('.case, .person, .plan').forEach((el) => observer.observe(el));
