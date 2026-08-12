# RIMA — Lead Design & Motion Audit

Дата: 12 августа 2026  
Объект: пять арт-дирекшенов RIMA + пять фото-версий + пять motion-версий.

## 1. Общий вывод

Сильная сторона текущей системы — пять направлений действительно различаются по композиции, типографике, форме и цвету. Главный риск перед motion-этапом был обратный: если добавить одинаковый `fade-up` ко всем пяти темам, визуальная разница быстро сведётся к палитре.

Поэтому motion не является отдельным «эффектом поверх сайта». Для каждого направления задан собственный язык движения, при этом ART и ФОТО остаются контрольными статичными версиями.

## 2. Что проверено после предыдущих итераций

### Композиция и иерархия
- Hero сохраняет один главный тезис, два действия и орбитальную метафору.
- CTA больше не конкурируют друг с другом по весу.
- Кейсы читаются одним ритмом во всех темах, хотя визуальный характер карточек различается.
- Тарифные блоки сохраняют одинаковую информационную структуру, но визуализируются нативно под тему.
- Финальная композиция «Спутник» не зависит от source screenshot.

### Типографика
- Editorial: крупная спокойная grotesk/editorial иерархия.
- Cosmos: технологичная Unbounded/Inter подача.
- Brutal: максимально прямой display-язык и жёсткая сетка.
- Luxe: serif-first и более медленный визуальный темп.
- Swiss: функциональная uppercase-типографика и точная геометрия.

### Цвет и контраст
Контракт сохранён:
- основной текст на фоне — AAA;
- normal-size CTA — не ниже AA;
- брендовые якоря `#F1EDD2`, `#1A1B2C`, `#ED7709` не заставляют темы выглядеть одинаково.

### Mobile
Главный UI-риск — fixed selector. Для третьего ряда он не должен превращаться в горизонтальную ленту и не должен постоянно перекрывать CTA. Поэтому на mobile selector по умолчанию свёрнут в одну компактную строку. По тапу он раскрывает три grid-строки по пять кнопок, после выбора снова сворачивается. Добавлены safe-area, compact-height режим и автоматизированный width sweep 320/360/375/390/430 px.

## 3. Motion language

### A — Editorial
Цель: ощущение дорогой журнальной вёрстки.
- мягкий clip/reveal;
- спокойное движение планеты;
- две орбиты с разной скоростью;
- restrained image scale;
- медленный lift карточек.

### B — Cosmos
Цель: глубина и цифровое пространство.
- pointer-reactive hero parallax;
- orbital rotation;
- glow pulse;
- появление секций из небольшой глубины;
- мягкое свечение карточек.

### C — Brutal
Цель: motion как печатный плакат, который физически встал на место.
- короткие snap/slam-переходы;
- stepped easing;
- небольшие angular offsets;
- жёсткая реакция hover;
- редкий controlled jolt у hero-объекта.

### D — Luxe
Цель: cinematic luxury.
- длинный serif reveal;
- мягкие clipping masks;
- очень небольшое scale;
- медленное дыхание hero-объекта;
- почти незаметный image zoom.

### E — Swiss
Цель: движение как продолжение модульной сетки.
- строгое horizontal reveal;
- линии масштабируются от grid origin;
- блоки двигаются только по выбранной оси;
- square hero-object использует stepped micro-motion;
- без декоративного parallax.

## 4. Производительность

Motion layer использует `transform`, `opacity`, короткие `clip-path` reveal, IntersectionObserver и один `requestAnimationFrame` для pointer/scroll CSS variables. GSAP, Framer Motion и другие runtime-зависимости не добавлены.

## 5. Accessibility

`prefers-reduced-motion: reduce` — обязательный hard stop: content никогда не остаётся скрытым, infinite animation отключается, transitions становятся практически мгновенными, навигация и deep-links продолжают работать.

## 6. Система сравнения

Переключатель теперь имеет три строки:
1. **ART** — чистая арт-дирекция.
2. **ФОТО** — реальный контент без motion.
3. **АНИМАЦИЯ** — тот же реальный контент + индивидуальный motion language.

Deep links:
- `?concept=editorial-motion`
- `?concept=cosmos-motion`
- `?concept=brutal-motion`
- `?concept=luxe-motion`
- `?concept=swiss-motion`

## 7. Acceptance gate

Перед merge требуется:
- 15 вариантов × desktop/mobile;
- отсутствие JS errors и horizontal overflow;
- 8 official assets в PHOTO/MOTION;
- TAIGA 99%, тарифные modules и Sputnik signature в PHOTO/MOTION;
- `data-motion-ready=true` только для motion;
- пять разных motion languages;
- width sweep 320/360/375/390/430;
- reduced-motion проверка для всех пяти motion-направлений;
- full-page и mobile-viewport screenshots в CI artifact.

## 8. Дополнительная визуальная правка после render review

- Brutal mobile: уменьшен display-size hero на узких экранах, чтобы слово «ЗАМЕТНЫМ» не клипалось справа.
- Swiss/Brutal mobile: fixed selector больше не находится постоянно поверх hero CTA — 15 вариантов раскрываются только по запросу пользователя.
