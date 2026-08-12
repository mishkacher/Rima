from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
CSS_FILES = ['styles.css', 'enhancements.css', 'extra-concepts.css', 'ux.css', 'polish.css', 'motion.css']
CSS = ''.join((ROOT / name).read_text(encoding='utf-8') for name in CSS_FILES)
JS = (ROOT / 'app.js').read_text(encoding='utf-8')
MOTION_JS = (ROOT / 'motion.js').read_text(encoding='utf-8')
PAGES = (ROOT / '.github/workflows/pages.yml').read_text(encoding='utf-8')
CI = (ROOT / '.github/workflows/ci.yml').read_text(encoding='utf-8')
IMPORTER = (ROOT / 'scripts/import_official_assets.py').read_text(encoding='utf-8')


def luminance(value: str) -> float:
    value = value.lstrip('#')
    if len(value) == 3:
        value = ''.join(ch * 2 for ch in value)
    rgb = [int(value[i:i+2], 16) / 255 for i in (0, 2, 4)]
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def contrast(a: str, b: str) -> float:
    hi, lo = sorted((luminance(a), luminance(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


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
for script in ['app.js', 'motion.js']:
    assert script in p.scripts and (ROOT / script).exists(), f'missing script: {script}'
for target in ['#about','#work','#team','#plans','#contact','#top']:
    assert target in p.hrefs, f'missing internal navigation target: {target}'

bases = ['editorial','cosmos','brutal','luxe','swiss']
expected = bases + [f'{concept}-photo' for concept in bases] + [f'{concept}-motion' for concept in bases]
assert p.concepts == expected, f'concept controls must be static and ordered: {p.concepts}'
for concept in bases:
    assert concept in JS and concept in CSS, f'missing support for concept: {concept}'
    assert f"{concept}-motion" in HTML, f'missing motion control for {concept}'
assert HTML.count('class="concept-row') == 3, 'chooser must contain ART, PHOTO and MOTION rows'
assert 'АНИМАЦИЯ' in HTML, 'motion row label missing'
assert "data-motion=\"off\"" in HTML, 'default motion state missing'
assert "dataset.motion" in JS and "-motion" in JS, 'motion variant parsing missing'
assert "rima:conceptchange" in JS and "rima:conceptchange" in MOTION_JS, 'motion lifecycle event missing'
assert "dataset.motionReady" in MOTION_JS, 'motion readiness marker missing'
assert "IntersectionObserver" in MOTION_JS, 'motion reveal observer missing'
assert "pointermove" in MOTION_JS, 'Cosmos pointer parallax hook missing'
assert "prefers-reduced-motion" in CSS and "prefers-reduced-motion" in MOTION_JS, 'reduced-motion support missing'
for language in ['Editorial', 'Cosmos', 'Brutal', 'Luxe', 'Swiss']:
    assert language.lower() in CSS.lower(), f'motion language missing: {language}'
for token in ['editorialPlanet', 'cosmosPulse', 'brutalHero', 'luxeHero', 'swissHero']:
    assert token in CSS, f'concept-specific motion keyframe missing: {token}'

assert "data-media=\"abstract\"" in HTML, 'default media mode missing'
assert "dataset.media" in JS and "dataset.variant" in JS, 'variant state missing'
assert "-photo" in JS and "official" in JS, 'photo variant parsing missing'
assert ':root' in CSS and '--bg:' in CSS and '--accent:' in CSS, 'theme variables missing'
assert '#f1edd2' in CSS.lower() and '#1a1b2c' in CSS.lower() and '#ed7709' in CSS.lower(), 'official brand anchors missing from audited palette'
assert 'aria-expanded' in HTML and 'aria-pressed' in JS, 'interactive accessibility state missing'
assert 'URLSearchParams' in JS and 'searchParams.set' in JS, 'shareable concept URLs missing'
assert 'primary-btn' in p.classes and 'secondary-btn' in p.classes, 'hero CTA pair missing'
assert 'header-cta' in p.classes and 'nav-cta' in p.classes, 'desktop/mobile project CTAs missing'
assert 'projects-btn' in p.classes, 'all-projects CTA missing'
assert 'https://www.behance.net/sputnikagency' in p.hrefs, 'studio Behance profile link missing'
assert 'href="https://www.behance.net/"' not in HTML, 'generic Behance root must not be used'
assert HTML.count('href="#contact"') >= 6, 'project CTA should stay reachable'

color_contract = {
    'editorial': {'fg': '#1a1b2c', 'bg': '#f4f0df', 'cta_fg': '#1a1b2c', 'cta_bg': '#ed7709'},
    'cosmos': {'fg': '#f6f1df', 'bg': '#0b0d18', 'cta_fg': '#ffffff', 'cta_bg': '#7557ff'},
    'brutal': {'fg': '#111111', 'bg': '#f3ef38', 'cta_fg': '#111111', 'cta_bg': '#ff4c2f'},
    'luxe': {'fg': '#281817', 'bg': '#f5e9dc', 'cta_fg': '#ffffff', 'cta_bg': '#8d1836'},
    'swiss': {'fg': '#101010', 'bg': '#f7f6f0', 'cta_fg': '#0a0a0a', 'cta_bg': '#ed5a23'},
}
for name, colors in color_contract.items():
    assert contrast(colors['fg'], colors['bg']) >= 7.0, f'{name} body contrast below AAA'
    assert contrast(colors['cta_fg'], colors['cta_bg']) >= 4.5, f'{name} CTA contrast below AA'

assert len(p.official_sources) == 8, f'photo/motion modes must use exactly 8 official image placements: {len(p.official_sources)}'
for src in p.official_sources:
    assert src.startswith('assets/official/'), f'official asset must be local: {src}'
for removed in ['hero.png', 'plan-start.png', 'plan-orbit.png', 'plan-galaxy.png', 'agency-mark.png']:
    assert removed not in HTML, f'removed source image leaked into HTML: {removed}'
assert 'ASSETS = {' in IMPORTER and 'sha256' in IMPORTER, 'pinned official asset importer missing'
assert IMPORTER.count('static.tildacdn.com') == 8, 'official importer must pin 8 retained assets'
assert 'scripts/import_official_assets.py' in PAGES, 'Pages must import official assets'
assert 'scripts/import_official_assets.py' in CI, 'browser QA must import official assets'

for cls in ['taiga-progress', 'plan-visual', 'sputnik-signature', 'photo-generated']:
    assert cls in p.classes, f'missing generated module: {cls}'
for text in [
    '99', 'Почти готово', 'Логотип', 'Фирменный стиль', 'Цветовая палитра',
    'Шрифтовая система', 'Графические элементы', 'Руководство',
    'Сайт / лендинг под ключ', 'Посты-знакомства', 'Печатная продукция',
    'Мерчендайз', 'Презентации', 'Шаблоны для соцсетей', 'Долгосрочное сопровождение',
    'СПУТНИК', 'дизайнерское агентство'
]:
    assert text in HTML, f'missing source-derived content: {text}'

assert 'actions/configure-pages@v5' in PAGES, 'Pages configure action missing'
assert 'actions/upload-pages-artifact@v4' in PAGES, 'Pages artifact action missing'
assert 'actions/deploy-pages@v4' in PAGES, 'Pages deploy action missing'
assert 'pages: write' in PAGES and 'id-token: write' in PAGES, 'Pages permissions missing'
assert not re.search(r'mailto:hello@example\\.com', HTML), 'placeholder email leaked'
assert 'rima-fifteen-concepts' in CI, 'CI artifact should reflect fifteen concepts'
print('RIMA static QA: OK — 15 variants + five motion languages + reduced-motion contract')
