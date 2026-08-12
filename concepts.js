const body = document.body;
const concepts = ['editorial','cosmos','brutal'];
const buttons = [...document.querySelectorAll('[data-concept-set]')];
const themeMeta = document.querySelector('meta[name="theme-color"]');
const toast = document.querySelector('.toast');

function getFromUrl(){ const c=new URLSearchParams(location.search).get('concept'); return concepts.includes(c)?c:null; }
function setConcept(c,{push=false}={}){
  if(!concepts.includes(c)) c='editorial';
  body.dataset.concept=c;
  buttons.forEach(b=>{ const active=b.dataset.conceptSet===c; b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active)); });
  themeMeta?.setAttribute('content', c==='cosmos'?'#07070a':c==='brutal'?'#fff331':'#f2efe8');
  localStorage.setItem('rima-concept',c);
  if(push){const u=new URL(location.href);u.searchParams.set('concept',c);history.replaceState({},'',u);}
}
setConcept(getFromUrl() || localStorage.getItem('rima-concept') || 'editorial');
buttons.forEach(b=>b.addEventListener('click',()=>setConcept(b.dataset.conceptSet,{push:true})));

document.querySelector('[data-share]')?.addEventListener('click',async()=>{const u=new URL(location.href);u.searchParams.set('concept',body.dataset.concept);try{await navigator.clipboard.writeText(u.toString());toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800)}catch{location.href=u.toString()}});

const menu=document.querySelector('.menu'), nav=document.querySelector('#nav');
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));nav.classList.toggle('open',!open)});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu?.setAttribute('aria-expanded','false')}));

if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -30px'});
 document.querySelectorAll('.case,.person,.plan,.statement').forEach(el=>{el.classList.add('reveal');io.observe(el)});
}
