Последнее дополнение: [шестое видео и оборот бейджа](careers-sixth-scene-and-badge.md).

Актуальное дополнение: [возврат наклонной орбиты и шестой этап](careers-structure-and-glass.md).

# Дополнение после просмотра в браузере — 4 ноября 2026

Текущая версия фонов: [пять индивидуальных сцен, включая новые «Влияние» и «Реальные проекты»](careers-media.md). Ниже сохранена история предыдущих доработок.

Эта версия учитывает новые пожелания: закрепление секции как в «Нашем пути», более крупное и медленное видео, содержательный центр орбиты и вращение бейджа как в «Нашем подходе». Ранее запрещённые изменения центра, размера видео и темпа здесь выполнены по прямой просьбе пользователя. Остальные секции не менялись.

- Удалена подпись «Актуальные позиции — у HR в Telegram» и ссылка на её ID из aria-describedby. Назначение CTA сохранено.
- На desktop от 961 px и высоте от 700 px секция закрепляется под шапкой на 280 высот окна прокрутки. Каждый из пяти этапов сохраняет свою позицию первые 65% своего участка; последние 35% отведены мягкому переходу. Прокрутка остаётся нативной: без перехвата wheel, запрета обратного движения и scroll snapping. После последнего этапа страница естественно продолжает движение. На мобильных, низких окнах и при reduced motion закрепление выключено.
- Клик на преимущество совмещает выбранный этап с его участком прокрутки. Дальнейшее движение колёсиком продолжается от выбранного этапа. Hover и фокус дают временный просмотр.
- В центре появился типографический счётчик этапов «Твоя траектория · 01 / 05», связанный с активной отметкой. Логотип и стеклянный ромб не возвращались. Линия получила лавандовый градиент, мягкое двойное свечение и светящийся индикатор; геометрия линии и точки по-прежнему едина.
- Выявлена дополнительная причина боковой границы: радиальная фоновая подсветка имела ненулевую альфу на правом краю своего прямоугольника. Теперь она привязана к закреплённой сцене и полностью затухает до границ. На прежней границе x=1411 при 1440 px исчезла вертикальная ступень цвета. Само видео дополнительно растворяется пересечением горизонтальной, вертикальной и овальной масок.
- Видео увеличено с 72% до 86% ширины композиции, сохраняет полный кадр 16:9. Скорость 0.85×. Тот же исходный участок 6–10 секунд перемонтирован в `team-atmosphere-v4.mp4`: 86 кадров, 3.583 секунды файла, около 4.22 секунды воспроизведения. Движущийся cosine dissolve сокращён до 10 кадров: нет возврата к стоп-кадру, меньше времени двойной экспозиции. Статичный poster и fallback сохранены. Новое видео не генерировалось.
- Новый `CareerBadge` повторяет принципы `PrinciplesSculpture`: ограниченный наклон при наведении, свободное вращение **в плоскости изображения** при перетаскивании, полный оборот по нажатию, стрелки и Home/Escape. Есть pointer capture и обработка отмены. Это не имитация объёмной обратной стороны PNG. На touch сохраняется вертикальная прокрутка; при reduced motion нет автоматической анимации оборота.
- Компактная desktop-раскладка проверена со всеми пятью раскрытыми состояниями на 1024×700, 1024×768, 1440×700, 1440×768 и 1440×900. Найденное пересечение карточек на 700 px устранено.

Проверки: TypeScript и production build проходят; **11 файлов / 75 тестов** проходят. В настоящем Edge проверены обе темы, реальные wheel-события по 100 px, все пять остановок вперёд и назад, выход из закрепления в обе стороны, SVG-синхронизация, preview и клик, pointer drag (136.5°), оборот по нажатию (360°), клавиатура, два повтора видео на тему, CTA, reduced motion. Дополнительно проверены touch-выбор всех пяти преимуществ и вращение по tap, fallback постера при ошибке видео. Горизонтального скролла и пересечений карточек нет. Сборка сообщает только о прежних аннотациях комментариев Zod.

Артефакты: [машинный отчёт](careers-refinement/followup/browser-report.json), [до](careers-refinement/followup/before.png), [тёмная desktop](careers-refinement/followup/after-dark-desktop.png), [светлая desktop](careers-refinement/followup/after-light-desktop.png), [тёмная mobile](careers-refinement/followup/after-dark-mobile.png), [светлая mobile](careers-refinement/followup/after-light-mobile.png), [1024×700](careers-refinement/followup/compact-1024.png), [стык видео](careers-refinement/followup/loop-v4.jpg). Mobile-снимки всей сцены сделаны на высоком viewport после проверки touch-управления на 390×844, чтобы шапка не перекрывала верх компонента при захвате.

Изменены в этом дополнении:

- `src/components/company-careers.tsx`
- `src/components/career-badge.tsx` (новый)
- `src/components/careers-atmosphere.tsx`
- `src/company-careers.css`
- `src/data/career-orbit.ts`
- `src/data/career-orbit.test.ts`
- `scripts/prepare-careers-video.py`
- `public/media/careers/team-atmosphere-v4.mp4` (новый)
- `public/media/careers/team-atmosphere-v4-poster.webp` (новый)
- `docs/design/company-careers.md` и артефакты в `docs/design/careers-refinement/followup/`.

Ограничение исходника: четыре секунды материала дают короткий цикл; мягкий монтажный dissolve остаётся различим при внимательном рассмотрении. Оборот бейджа выполнен в плоскости, как у знака в «Нашем подходе»; GLB/обратной стороны в проекте нет.

---

## Предыдущая итерация: итоговая доработка, 4 ноября 2026

Изменения ограничены секцией `#careers`, её данными, ассетами и проверками. Ранее существовавшие незакоммиченные изменения других секций сохранены. Hero, статистика, направления, история, принципы, будущее и ERP не редактировались.

## Что исправлено

- Второй бейдж создавали CSS-подложка с прямоугольной тенью и отдельные CSS-ремешок/пряжка поверх PNG, уже содержащего стекло, ткань и металл. Эти слои удалены. Сохранены исходный ракурс, размер, настоящий `yuc-mark.svg` и фирменная надпись. Тень повторяет альфа-силуэт; блик ограничен той же маской. Наклон ограничен 7°/9°, зависит от времени кадра и плавно возвращается к нулю. Изображение не имитирует полный оборот.
- Проверены альфа-каналы всех исходных PNG. У `projects.png` и `freedom.png` тёмные ореолы были частью изображения. Встроенным image_gen очищен только фон этих двух иконок. Другие три иконки и бейдж перекодированы из оригиналов с сохранением прозрачности. Шесть используемых WebP весят суммарно 195 040 байт вместо примерно 8.43 МБ PNG. Оригиналы сохранены.
- Центральный стеклянный объект удалён из React и данных. Новых декоративных предметов нет.
- Старые маски видео складывались, сохраняя боковые границы. Теперь одна эллиптическая альфа-маска достигает нуля на всех четырёх краях. Сохранён полный кадр 16:9 (`object-fit: contain`), без масштабирования, кропа, CSS-движения и размытия видео.
- Светлая тема использует тёплый белый холст сайта, графитовый текст, лавандовое стекло и мягкие тени. Видео растворяется в отдельной приглушённой атмосфере. Тёмная тема сохраняет существующую палитру.
- `pathLength="1000"` конфликтовал с реальной длиной SVG, а CSS-transition задерживал линию относительно точки. Теперь линия, точка, кольцо и активное преимущество обновляются из одной доли длины пути в одном кадре. Пять отметок находятся на 0/.2/.4/.6/.8; последняя больше не совпадает с первой на замкнутом пути.
- Наведение/фокус временно показывают преимущество; уход возвращает выбор по прокрутке или клику. Прокрутка отменяет ручной выбор. Одинаковая цель при enter/focus/click не перезапускает анимацию. Действуют стрелки, Home/End и нативные Enter/Space. Описания и иконки не перемонтируются при выборе.
- Пять различных однократных микроанимаций 420–490 мс работают с фрагментами тех же стеклянных ассетов: ступенчатая подсветка, проходящая волна, сближение фигур, сборка элементов и раскрытие половин. Нет вращения или постоянного подпрыгивания.
- На мобильных те же пять кнопок образуют доступный вертикальный список с иконками и описаниями; дублирующий tablist удалён. Видео не пересекает заголовок.
- Обе CTA получили согласованные стеклянные грани, отражение за указателем и видимый focus. «Открытые вакансии» ведёт к существующему HR-контакту; подпись объясняет назначение ссылки. Dialog использует настоящие `company.departments`. Исправлено наследование цветов портала, добавлены доступные размеры кнопки закрытия и поддержка reduced motion.

## Видео и ограничения контента

Источник: существующий утверждённый `gemini_generated_video_1d5bf0ea.mp4`. Используется только исходный фрагмент 6–10 секунд. Новые кадры не генерировались. `scripts/prepare-careers-video.py` создаёт `team-atmosphere-v3.mp4`: полный 1280×720, 24 fps, H.264, 3.5 секунды, 293 410 байт, без аудиодорожки. Последние 12 кадров смешиваются с **движущимися** первыми 12; затем следует соседний исходный кадр. Первый кадр файла — исходная 6.5-я секунда; участок 6–6.5 с участвует в переходе. Скорость воспроизведения — 1×. У v2 был переход к неподвижному начальному кадру и скорость 0.75×.

Исходный материал длится всего четыре секунды: в полусекундном dissolve может быть заметно мягкое смешение силуэтов. Это монтажный переход, без стоп-кадра, обратного движения или синтеза людей. [Кадры до и после стыка](careers-refinement/loop-v3.jpg) проверены визуально. В браузере наблюдались два повторения в каждой теме, воспроизведение и пауза вне экрана. Статичный постер остаётся при ошибке видео, запрете autoplay и reduced motion; при переключении системной настройки видео удаляется.

Видео — ранее утверждённая концептуальная атмосфера, а не подтверждённая съёмка сотрудников. Формулировки EVP остаются редактируемыми в `company-careers.ts` и помечены `employerValueStatus` как требующие согласования. Отдельная страница вакансий и настоящий GLB отсутствуют; используются существующий HR-контакт и качественный наклон PNG.

## Проверки

- TypeScript: `node node_modules/typescript/bin/tsc -b --pretty false`.
- Production build: `node node_modules/vite/bin/vite.js build` (после TypeScript; эквивалент `npm run build`).
- Существующий набор: `node node_modules/vitest/vitest.mjs run` — 11 файлов, 74 теста, включая три регрессии орбиты.
- Настоящий Microsoft Edge через Playwright: desktop 1440×1000 и touch/mobile 390×844, обе темы; также ширины 320, 640, 768, 960, 1024 и 1200. Нет горизонтального скролла, пересечений кнопок преимуществ или обрезанного текста.
- Все пять вариантов выбора, короткие описания, rapid hover enter/leave, возврат после preview, клавиатура, прокрутка в обе стороны по 11 позициям. По 15 кадров движения SVG на тему: геометрия точки и кольца совпала с концом линии, активная отметка соответствовала той же доле пути. [Машинный отчёт](careers-refinement/browser-report.json).
- Наклон бейджа и возврат к покою; muted/loop/1×; пауза вне экрана; ошибка загрузки видео; статичный reduced motion в обеих темах и переключение настройки во время работы.
- Обе CTA: открытие существующего URL HR проверено в перехваченной браузерной навигации без отправки сообщений; dialog, семь отделов, удержание фокуса, Escape и возврат фокуса. Мобильное окно проверено визуально после завершения анимации открытия.
- [Кадры пяти микроанимаций в браузере](careers-refinement/motion-contact-sheet.png): колонки 0/120/240/460 мс, строки в порядке преимуществ. Для проверки кадров CSS-анимации были приостановлены через Web Animations API; DOM и реальные ассеты оставались неизменными.
- Ошибок JavaScript в браузерной проверке нет. Сборка сообщает только о комментариях-аннотациях внутри существующей зависимости Zod.

## Снимки до и после

До — исходные файлы текущей сессии, сохранённые до редактирования; после — финальная реализация. Настройки viewport и темы совпадают. Мобильные снимки показывают всю секцию, desktop — viewport с заголовком сайта.

| Вид | До | После |
| --- | --- | --- |
| Тёмная, desktop | [До](careers-refinement/before-dark-desktop.png) | [После](careers-refinement/after-dark-desktop.png) |
| Светлая, desktop | [До](careers-refinement/before-light-desktop.png) | [После](careers-refinement/after-light-desktop.png) |
| Тёмная, mobile | [До](careers-refinement/before-dark-mobile.png) | [После](careers-refinement/after-dark-mobile.png) |
| Светлая, mobile | [До](careers-refinement/before-light-mobile.png) | [После](careers-refinement/after-light-mobile.png) |

## Точные файлы изменения

Код и документация:

- `src/components/company-careers.tsx`
- `src/components/careers-atmosphere.tsx`
- `src/company-careers.css`
- `src/data/company-careers.ts`
- `src/data/company-careers.test.ts`
- `src/data/career-orbit.ts` — новый
- `src/data/career-orbit.test.ts` — новый
- `scripts/prepare-careers-video.py`
- `docs/design/company-careers.md`

Новые используемые ассеты:

- `public/media/careers/growth-refined.webp`
- `public/media/careers/impact-refined.webp`
- `public/media/careers/team-refined.webp`
- `public/media/careers/projects-refined.webp`
- `public/media/careers/freedom-refined.webp`
- `public/media/careers/employee-badge-blank-v2-refined.webp`
- `public/media/careers/team-atmosphere-v3.mp4`
- `public/media/careers/team-atmosphere-v3-poster.webp`

Артефакты проверки в `docs/design/careers-refinement/`: восемь PNG из таблицы, `browser-report.json`, `motion-contact-sheet.png`, `loop-v3.jpg`.

## Очистка изображений: сохранённые промпты

Использован встроенный image_gen, режим `background-extraction`, `transparent_background: true`; затем только уменьшение и перекодирование в WebP. Итоговые файлы находятся в `public/media/careers/`, исходные PNG не перезаписаны.

`freedom-refined.webp`:

> Use case: background-extraction. Edit target: supplied approved lavender glass infinity icon. Remove ONLY the black background, dark ragged cast shadow, surrounding purple light streaks and background haze. Output the exact same infinity glass object isolated on a genuinely transparent alpha background, including both open holes. Preserve its geometry, camera angle, proportions, polished lavender translucent glass material, internal reflections and edge highlights exactly. No new objects, no text, no ground shadow, no redesign. Keep original framing and object size.

`projects-refined.webp`:

> Use case: background-extraction. Edit target: supplied approved lavender glass lightning bolt icon. Remove ONLY the black background, dark ragged cast shadow and surrounding haze. Output the exact same glass lightning bolt isolated on a genuinely transparent alpha background. Preserve geometry, camera angle, proportions, polished lavender translucent glass material, layered facets, internal reflections and edge highlights exactly. No new objects, no text, no ground shadow, no redesign. Keep original framing and object size.

Изучены указанные ориентиры [Aceternity 3D Card](https://ui.aceternity.com/components/3d-card-effect), [Liquid Glass](https://ui.aceternity.com/components/liquid-glass), [Magic Card](https://v3.magicui.design/docs/components/magic-card) и [Border Beam](https://magicui.design/docs/components/border-beam). Использованы ограниченный наклон, направленный блик и аккуратные отражения; новые библиотеки не добавлялись.
