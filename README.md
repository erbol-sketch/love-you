# Для Саши ❤️ — сайт-подарок (Next.js)

Тот же сайт, перенесённый на Next.js (App Router). Дизайн, тексты и анимации не менялись.

## Запуск
```bash
npm install
npm run dev      # http://localhost:3000
```
Продакшен: `npm run build && npm start`.

## Что где менять
- **Всё содержимое** (фото, подписи, даты, причины, письмо, P.S.) — `lib/content.js`.
- **Фото** — положи файлы в `public/images/` (photo1.jpg … photo4.jpg) или поменяй пути в `lib/content.js`. Нет файла — покажется заглушка.
- **Музыка** — положи песню в `public/music/our-song.mp3`. Сама не включается, только по кнопке.
- **Стили** — `app/globals.css` (тот же style.css).
- **Пасхалка** — 5 нажатий на едва заметную ✦ слева внизу. Текст — `ps` в `lib/content.js`.

## Структура
- `app/layout.js` — `<html>`, шрифты, метаданные
- `app/page.js` — главная страница
- `components/Gift.jsx` — вся страница (клиентский компонент)
- `lib/fx.js` — частицы на canvas
- `lib/content.js` — контент

## Бесплатный деплой
**Vercel:** залей проект на GitHub → vercel.com → Import Project → Deploy. Next.js определится автоматически.
