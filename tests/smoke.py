from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
CSS_FILES = ['styles.css', 'enhancements.css', 'extra-concepts.css', 'ux.css', 'polish.css']
CSS = ''.join((ROOT / name).read_text(encoding='utf-8') for name in CSS_FILES)
JS = (ROOT / 'app.js').read_text(encoding='utf-8')
PAGES = (ROOT / '.github/workflows/pages.yml').read_text(encoding='utf-8')
CI = (ROOT / '.github/workflows/ci.yml').read_text(encoding='utf-8')
IMPORTER = (ROOT / 'scripts/import_official_assets.py').read_text(encoding='utf-8')

class AuditParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set(); self.hrefs = []; self.scripts = []; self.styles = []
        self.concepts = []; self.classes = []; self.official_sources = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f'duplicate id: {attrs["id"]}'
            self.ids.add(attrs['id'])
        if tag == 'a' and 'href' in attrs: self.hrefs.append(attrs['href'])
        if tag == 'script' and 'src' in attrs: self.scripts.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') == 'stylesheet': self.styles.append(attrs.get('href'))
        if 'data-set-concept' in attrs: self.concepts.append(attrs['data-set-concept'])
        if 'data-official-src' in attrs: self.official_sources.append(attrs['data-official-src'])
        if 'class' in attrs: self.classes.extend(attrs['class'].split())

p = AuditParser(); p.feed(HTML)
for required in ['top','about','work','case-grid','team','plans','contact','main','site-nav']:
    assert required in p.ids, f'missing section id: {required}'
for local in CSS_FILES:
    assert local in p.styles and (ROOT / local).exists(), f'missing stylesheet: {local}'
assert 'app.js' in p.scripts and (ROOT / 'app.js').exists(), 'missing app.js'
for target in ['#about','#work','#team','#plans','#contact','#top']:
    assert target in p.hrefs, f'missing internal navigation target: {target}'

bases = ['editorial','cosmos','brutal','luxe','swiss']
expected = bases + [f'{concept}-photo' for concept in bases]
assert p.concepts == expected, f'concept controls must be static and ordered: {p.concepts}'
for concept in bases:
    assert concept in JS, f'missing JS support for concept: {concept}'
for themed in ['cosmos','brutal','luxe','swiss']:
    assert themed in CSS, f'missing CSS theme: {themed}'
assert "data-media=\"abstract\"" in HTML, 'default media mode missing'
assert "dataset.media" in JS and "dataset.variant" in JS, 'art/photo variant state missing'
assert "-photo" in JS and "official" in JS, 'photo variant parsing missing'
assert ':root' in CSS and '--bg:' in CSS and '--accent:' in CSS, 'theme variables missing'
assert '#f1edd2' in CSS.lower() and '#1a1b2c' in CSS.lower() and '#ed7709' in CSS.lower(), 'official brand anchors missing from audited palette'
assert 'prefers-reduced-motion' in CSS, 'reduced-motion support missing'
assert 'aria-expanded' in HTML and 'aria-pressed' in JS, 'interactive accessibility state missing'
assert 'URLSearchParams' in JS and 'searchParams.set' in JS, 'shareable concept URLs missing'
assert 'primary-btn' in p.classes and 'secondary-btn' in p.classes, 'hero CTA pair missing'
assert 'header-cta' in p.classes and 'nav-cta' in p.classes, 'desktop/mobile project CTAs missing'
assert 'projects-btn' in p.classes, 'all-projects CTA missing'
assert 'https://www.behance.net/sputnikagency' in p.hrefs, 'studio Behance profile link missing'
assert 'href="https://www.behance.net/"' not in HTML, 'generic Behance root must not be used for projects CTA'
assert HTML.count('href="#contact"') >= 6, 'project CTA should be reachable from header, hero, mobile nav and plans'

assert len(p.official_sources) >= 13, f'not enough official image placements: {len(p.official_sources)}'
for src in p.official_sources:
    assert src.startswith('assets/official/'), f'official asset must be local in deployed artifact: {src}'
assert 'ASSETS = {' in IMPORTER and 'sha256' in IMPORTER, 'pinned official asset importer missing'
assert IMPORTER.count('static.tildacdn.com') >= 13, 'official importer must pin all selected public assets'
assert 'scripts/import_official_assets.py' in PAGES, 'Pages must import official assets before deploy'
assert 'scripts/import_official_assets.py' in CI, 'browser QA must import official assets before rendering'

assert 'actions/configure-pages@v5' in PAGES, 'Pages configure action missing'
assert 'actions/upload-pages-artifact@v4' in PAGES, 'Pages artifact action missing'
assert 'actions/deploy-pages@v4' in PAGES, 'Pages deploy action missing'
assert 'pages: write' in PAGES and 'id-token: write' in PAGES, 'Pages permissions missing'
assert not re.search(r'mailto:hello@example\.com', HTML), 'placeholder email leaked into preview'
print('RIMA static QA: OK — 10 variants + audited palettes + pinned official image layer')
