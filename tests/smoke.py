from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
CSS = (
    (ROOT / 'styles.css').read_text(encoding='utf-8')
    + (ROOT / 'enhancements.css').read_text(encoding='utf-8')
    + (ROOT / 'extra-concepts.css').read_text(encoding='utf-8')
)
JS = (ROOT / 'app.js').read_text(encoding='utf-8')
PAGES = (ROOT / '.github/workflows/pages.yml').read_text(encoding='utf-8')

class AuditParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set(); self.hrefs = []; self.scripts = []; self.styles = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f'duplicate id: {attrs["id"]}'
            self.ids.add(attrs['id'])
        if tag == 'a' and 'href' in attrs: self.hrefs.append(attrs['href'])
        if tag == 'script' and 'src' in attrs: self.scripts.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') == 'stylesheet': self.styles.append(attrs.get('href'))

p = AuditParser(); p.feed(HTML)
for required in ['top','about','work','team','plans','contact','main','site-nav']:
    assert required in p.ids, f'missing section id: {required}'
for local in ['styles.css','enhancements.css']:
    assert local in p.styles and (ROOT / local).exists(), f'missing stylesheet: {local}'
assert (ROOT / 'extra-concepts.css').exists(), 'missing extra concept stylesheet'
assert 'app.js' in p.scripts and (ROOT / 'app.js').exists(), 'missing app.js'
for target in ['#about','#work','#team','#plans','#top']:
    assert target in p.hrefs, f'missing internal navigation target: {target}'
for concept in ['editorial','cosmos','brutal','luxe','swiss']:
    assert concept in JS, f'missing JS support for concept: {concept}'
for themed in ['cosmos','brutal','luxe','swiss']:
    assert themed in CSS, f'missing CSS theme: {themed}'
assert ':root' in CSS and '--bg:' in CSS and '--accent:' in CSS, 'editorial base theme variables missing'
assert 'prefers-reduced-motion' in CSS, 'reduced-motion support missing'
assert 'aria-expanded' in HTML and 'aria-pressed' in JS, 'interactive accessibility state missing'
assert 'URLSearchParams' in JS and 'searchParams.set' in JS, 'shareable concept URLs missing'
assert 'actions/configure-pages@v5' in PAGES, 'Pages configure action missing'
assert 'actions/upload-pages-artifact@v4' in PAGES, 'Pages artifact action missing'
assert 'actions/deploy-pages@v4' in PAGES, 'Pages deploy action missing'
assert 'pages: write' in PAGES and 'id-token: write' in PAGES, 'Pages permissions missing'
assert not re.search(r'mailto:hello@example\.com', HTML), 'placeholder email leaked into preview'
print('RIMA static smoke audit: OK — 5 concepts + Pages workflow')
