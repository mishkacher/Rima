# RIMA — 15 client-ready redesign variants

Пять арт-дирекшенов редизайна RIMA представлены в трёх уровнях — **ART / ФОТО / АНИМАЦИЯ** — на одной адаптивной странице для сравнения и презентации заказчику.

Публичный preview: https://mishkacher.github.io/Rima/

Исходный публичный сайт: https://xn--h1aehhjhg.agency/

## 5 × 3 концепции

### ART

- **A · Editorial** — светлая premium/editorial подача, крупная типографика и мягкая орбитальная метафора.
- **B · Cosmos** — тёмная digital-система с космической глубиной и технологичной типографикой.
- **C · Brutal** — контрастный creative/brutalist вариант с жёсткой сеткой и выразительной палитрой.
- **D · Luxe** — тёплая premium editorial-система с serif-типографикой, мягкими формами и бордовым акцентом.
- **E · Swiss** — строгая швейцарская сетка, монохром и функциональная типографика.

### ФОТО

Те же пять дизайн-систем с реальным контентом официального сайта там, где фотография действительно добавляет ценность:

- 3 портрета команды;
- 5 artworks опубликованных кейсов;
- hero сохраняет собственную орбитальную композицию;
- `Тайга Озеро` показана как состояние готовности **99% / почти готово**;
- `Старт / Орбита / Галактика` отрисованы нативными HTML/CSS-модулями в характере каждого стиля;
- нижний `Спутник — дизайнерское агентство` пересобран нативно под каждый концепт.

### АНИМАЦИЯ

Пять `*-motion` вариантов используют тот же реальный content layer, но каждый получает собственный motion language:

- **Editorial Motion** — мягкий clip/reveal, спокойное движение планеты и орбит, restrained lift;
- **Cosmos Motion** — depth, glow, orbital rotation и pointer-parallax;
- **Brutal Motion** — короткие snap/slam transitions, stepped easing и controlled jolt;
- **Luxe Motion** — cinematic masks, медленный serif reveal и деликатный scale;
- **Swiss Motion** — grid-locked directional reveal, line motion и axis-based transitions.

Motion layer реализован без GSAP/Framer: `transform`, `opacity`, короткие `clip-path` reveal, `IntersectionObserver` и `requestAnimationFrame`. `prefers-reduced-motion: reduce` полностью отключает декоративное движение и не оставляет контент скрытым.

## Deep links

- `?concept=editorial` … `?concept=swiss`
- `?concept=editorial-photo` … `?concept=swiss-photo`
- `?concept=editorial-motion` … `?concept=swiss-motion`

## Design / motion audit

- [`DESIGN_AUDIT.md`](DESIGN_AUDIT.md) — композиция, цвет, контраст, image/content strategy.
- [`MOTION_AUDIT.md`](MOTION_AUDIT.md) — Lead Design & Motion audit и отдельный motion language для пяти направлений.

Общий цветовой якорь исходного бренда: `#F1EDD2`, `#1A1B2C`, `#ED7709`. При этом Editorial / Cosmos / Brutal / Luxe / Swiss остаются самостоятельными арт-дирекшенами.

## Mobile UX

На desktop selector показывает три строки **ART / ФОТО / АНИМАЦИЯ**. На mobile fixed selector по умолчанию свёрнут в компактную строку, чтобы не перекрывать hero CTA. По тапу он раскрывает все 15 вариантов и после выбора снова сворачивается.

Автоматически проверяются ширины `320 / 360 / 375 / 390 / 430 px`, safe-area, отсутствие horizontal overflow и попадание всех 15 контролов внутрь viewport.

## Официальные изображения

`./scripts/import_official_assets.py` скачивает **8** закреплённых публичных assets с `static.tildacdn.com` в `assets/official/` и проверяет SHA-256 каждого файла:

- 3 фотографии команды;
- 5 artworks опубликованных кейсов.

GitHub Pages импортирует assets перед созданием deployment artifact, поэтому публичный preview не hotlink-ит изображения во время просмотра.

## Качество

GitHub Actions запускает два уровня проверки:

1. **Static QA** — структура 15 вариантов, CTA/navigation contracts, color-audit anchors, official assets, motion lifecycle, accessibility и deployment config.
2. **Browser QA** — 15 вариантов реально открываются в Chromium на desktop `1440×1000` и mobile `390×844`.

Дополнительно Browser QA проверяет:

- active state и deep links;
- ART / ФОТО / АНИМАЦИЯ state machine;
- реальную инициализацию motion variants;
- `prefers-reduced-motion` для всех пяти motion-направлений;
- mobile selector на `320 / 360 / 375 / 390 / 430 px`;
- 8 official assets;
- TAIGA 99%, три tariff visuals и native Sputnik signature;
- отсутствие JS errors и horizontal overflow.

После прогона сохраняются full-page и mobile viewport screenshots в artifact `rima-fifteen-concepts`.

## Локальный preview

```bash
python3 scripts/import_official_assets.py
python3 -m http.server 8080
```

Открыть `http://localhost:8080/`.
