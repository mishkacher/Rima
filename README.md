# RIMA — ten client-ready redesign variants

Пять арт-дирекшенов редизайна сайта дизайн-студии RIMA и пять их image-rich версий с официальными изображениями — на одной адаптивной странице для сравнения и презентации заказчику.

Публичный preview: https://mishkacher.github.io/Rima/

Исходный публичный сайт: https://xn--h1aehhjhg.agency/

## 5 × 2 концепции

Первый ряд переключателя — **ART**:

- **A · Editorial** — светлая premium/editorial подача, крупная типографика и мягкая орбитальная метафора.
- **B · Cosmos** — тёмная digital-система с космической глубиной и технологичной типографикой.
- **C · Brutal** — контрастный creative/brutalist вариант с жёсткой сеткой и выразительной палитрой.
- **D · Luxe** — тёплая premium editorial-система с serif-типографикой, мягкими формами и бордовым акцентом.
- **E · Swiss** — строгая швейцарская сетка, монохром и функциональная типографика.

Второй ряд — **ФОТО**: те же Editorial / Cosmos / Brutal / Luxe / Swiss, но с импортированным публичным контентом официального сайта: hero-art, три фотографии команды, пять опубликованных case artworks, три тарифные карточки и фирменный знак.

Любой вариант имеет отдельную shareable-ссылку:

- `?concept=editorial` … `?concept=swiss`
- `?concept=editorial-photo` … `?concept=swiss-photo`

## Design / color audit

Подробный аудит находится в [`DESIGN_AUDIT.md`](DESIGN_AUDIT.md).

Ключевые изменения:

- сокращён избыточный вертикальный воздух между секциями;
- контент больше не скрывается через `opacity: 0` до IntersectionObserver;
- кейсы, команда и тарифы собраны в более плотный ритм;
- переключатель переработан в два понятных ряда;
- на mobile добавлен safe-area под двухрядный fixed switcher;
- палитры сохранили пять разных характеров, но получили общий брендовый якорь исходного сайта: `#F1EDD2`, `#1A1B2C`, `#ED7709`.

## UX действий

Во всех десяти вариантах используется одинаковая логика действий, а визуальный характер кнопок адаптируется под выбранную дизайн-систему:

- главный CTA **«Обсудить проект»** доступен в шапке и hero;
- на мобильном CTA находится внутри компактного меню;
- второе действие hero — **«Смотреть кейсы»**;
- **«Все проекты»** ведёт на Behance-профиль студии;
- карточки опубликованных кейсов кликабельны целиком;
- CTA тарифов ведут к контактному блоку;
- sticky-header и scroll-offset не перекрывают заголовки секций;
- интерактивные элементы имеют tap-target, focus и hover states.

## Официальные изображения

`./scripts/import_official_assets.py` скачивает 13 выбранных публичных assets с `static.tildacdn.com` в `assets/official/` и **проверяет SHA-256 каждого файла**. URL и checksums закреплены в скрипте, поэтому сборка не принимает неожиданно изменившийся контент.

Это не копирование Tilda-разметки: HTML/CSS/JS редизайна независимы, а исходные изображения используются как отдельный контентный слой только в пяти `*-photo` вариантах.

GitHub Pages импортирует assets перед созданием deployment artifact, поэтому публичный preview не hotlink-ит изображения во время просмотра.

## Качество

GitHub Actions запускает два уровня проверки:

1. **Static QA** — структура, 10 вариантов, CTA/navigation contracts, color-audit anchors, official asset placements, accessibility states и deployment config.
2. **Browser QA** — все 10 вариантов реально открываются в Chromium на desktop `1440×1000` и mobile `390×844`.

Browser QA проверяет active state, ART/ФОТО mode, видимость CTA, мобильное меню, Behance destination, загрузку 13 официальных изображений, отсутствие JS errors и горизонтального overflow. После прогона сохраняются **20 full-page screenshots** в artifact `rima-ten-concepts`.

## Локальный preview

```bash
python3 scripts/import_official_assets.py
python3 -m http.server 8080
```

Открыть `http://localhost:8080/`.
