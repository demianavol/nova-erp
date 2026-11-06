# Секция 5: «Наши принципы и ценности» (Company Principles & Values)

## 1. Обзор реализации

Секция «Наши принципы и ценности» внедрена как пятый экран лендинга Young Unicorn строго по согласованной структуре:
1. Hero (`#hero`)
2. Company Statistics (`#results`)
3. Business Directions (`#directions`)
4. Company History (`#about`)
5. **Principles & Values (`#principles`)**
6. Supplier Role & Advantages (`#advantages`)
7. Team & Opportunities (`#team`)
8. Partnerships & Contacts (`#partners`)

Секция воссоздана на чистом React / HTML / CSS со стеклянным 3D-дизайном (3D glassmorphism) в точном соответствии с дизайн-референсом, без использования статичной подложки.

---

## 2. Исходные и обработанные ассеты

Все 6 оригинальных 3D-иконок из лавандового стекла были найдены в папке `c:\Users\bekas\OneDrive\Desktop\Работа\Работа и карьера\SVG Иконки\` и скопированы в `public/media/principles-icons/`:

1. `lavender_glass_light_bulb_icon.png` (876 KB) + 600px PNG (233 KB) + WebP (54 KB)
   - Исходник: `ChatGPT Image Nov 3, 2026, 04_57_57 PM-4.png`
   - Принцип 01: «Экспериментируем»
2. `lavender_glass_bullseye_with_dart.png` (1296 KB) + 600px PNG (359 KB) + WebP (119 KB)
   - Исходник: `ChatGPT Image Nov 3, 2026, 04_57_58 PM-5.png`
   - Принцип 02: «Опираемся на данные»
3. `glossy_lavender_glass_rocket.png` (919 KB) + 600px PNG (248 KB) + WebP (61 KB)
   - Исходник: `ChatGPT Image Nov 3, 2026, 04_57_53 PM-2.png`
   - Принцип 03: «Постоянно развиваемся»
4. `glossy_lavender_glass_handshake.png` (881 KB) + 600px PNG (235 KB) + WebP (56 KB)
   - Исходник: `ChatGPT Image Nov 3, 2026, 04_57_52 PM-1.png`
   - Принцип 04: «Работаем вместе»
5. `lavender_glass_heart_icon.png` (1018 KB) + 600px PNG (265 KB) + WebP (58 KB)
   - Исходник: `ChatGPT Image Nov 3, 2026, 04_58_00 PM-6.png`
   - Принцип 05: «Создаём ценность»
6. `glossy_purple_glass_shield_checkmark.png` (1169 KB) + 600px PNG (303 KB) + WebP (61 KB)
   - Исходник: `ChatGPT Image Nov 3, 2026, 04_58_02 PM-7.png`
   - Принцип 06: «Отвечаем за результат»

Скульптура бренда в нижнем левом углу использует прозрачный стеклянный токен `public/media/history-icons/lavender_glass_unicorn_token.png` в обеих темах, без прямоугольной подложки. Надзаголовок — «Наш подход», основной заголовок — «Наши принципы и ценности».

---

## 3. Архитектура и структура файлов

1. **`src/data/company-principles.ts`**
   - Централизованный источник данных. Содержит 6 утвержденных принципов, ссылки на слайды Welcome-презентации (слайды 4, 6, 10–12, 15, 19, 23), тексты, пути к иконкам и alt-описания.
2. **`src/data/company-principles.test.ts`**
   - Unit-тесты vitest, проверяющие нумерацию (01–06), непустые заголовки, описания, иконки и заголовки блока.
3. **`src/components/company-principles.tsx`**
   - Компонент секции и карточек `PrincipleCard`.
   - Интерактивность:
     * Компактные карточки без наклона: высота описания плавно раскрывается на `hover`/`focus` через CSS Grid за 440 мс; нижний ряд перемещается вместе с раскрытием.
     * Статичный блик проявляется по прозрачности.
     * Закрепление по клику/тапу (Pin). Закрепить можно одну карточку; наведение и фокус раскрывают карточки независимо.
     * Снятие закрепления по `Escape` или клику вне секции.
     * Полная клавиатурная доступность (`Tab`, `Enter`, `Space`, `Escape`, `aria-expanded`, `aria-controls`).
     * Поддержка `prefers-reduced-motion` (отключение наклонов и анимаций).
4. **`src/company-principles.css`**
   - Полный набор стилей:
     * Бесшовный полноэкранный фон `::before` для светлой и темной темы.
     * Стеклянные градиенты, полупрозрачные границы и лавандовое свечение под иконками; без `backdrop-filter` у карточек.
     * Адаптивная сетка: десктоп 3×2 + колонка слева, планшет 2×3, мобильный 1 колонка.
5. **Навигация**:
   - `src/components/hero-expertise.tsx`: добавлен пункт «Принципы» (`#principles`, иконка `ExpandingLayersIcon`).
   - `src/components/public-header.tsx`: добавлен якорь `["principles", "Принципы"]`.
   - `src/pages/landing.tsx`: секция включена в разметку лендинга между `#about` и `#advantages`, а также добавлена в навигацию подвала.
6. **`src/components/principles-sculpture.tsx`**:
   - Лёгкое парение, наклон по курсору и блик по маске прозрачного изображения.
   - Перетаскивание поворачивает знак; отпускание плавно выравнивает наклон. Нажатие запускает оборот.
   - Нативная кнопка: стрелки меняют наклон, Home/Escape сбрасывают положение; Enter/Space запускают вращение.
   - Координаты и углы хранятся вне React state; обновления сглажены через `requestAnimationFrame`, без чтения размеров на каждом движении мыши.
   - Анимации приостанавливаются вне экрана и в скрытой вкладке. При `prefers-reduced-motion` парение и инерция отключаются, ручные изменения применяются сразу; нажатие поворачивает на 15° вместо полного оборота.

---

## 4. Результаты тестов и верификации

- **TypeScript Typecheck**:
  `node node_modules/typescript/bin/tsc -b --pretty false` → **0 ошибок**.
- **Vitest Unit Tests**:
  `node node_modules/vitest/vitest.mjs run` → **9 test suites, 68 passed (68 of 68)**.
- **Production Build**:
  `node node_modules/vite/bin/vite.js build` → **Успешно за 8.37s**.
- **Playwright Visual Audit**:
  * Десктоп 1440px: Dark и Light проверены, скриншоты сохранены в `test-results/principles-desktop-dark.png` и `test-results/principles-desktop-light.png`.
  * Планшет 820px: Сетка 2×3, все 6 иконок загружены (complete=true), горизонтальный скролл отсутствует (`scrollWidth === innerWidth === 820`).
  * Мобильный 390px: Tap-to-expand проверен, карточка раскрывается по тапу, переполнение отсутствует (`scrollWidth === innerWidth === 390`).
  * Взаимодействия: Hover Card 1, Click/Pin Card 4, Escape dismissal — проверены скриптом `test-results/principles-visual-check.cjs`.
