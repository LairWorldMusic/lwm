# Сайт Lair World Music

## Структура проекта

Статический сайт для Lair World Music.

### Файлы:
- `index.html` - главная страница
- `contact.html` - страница контактов (форма обращений)
- `about.html` - о нас
- `news.html` - новости
- `documentation.html` - документация
- `assets/` - статические ресурсы (CSS, JS, изображения)

### Настройка формы обращений:

В файле `contact.html` (строка 168) укажите URL вашего бота на Render:

```javascript
const BOT_API_URL = window.BOT_API_URL || 'https://YOUR_BOT_NAME.onrender.com/api/appeal';
```

Замените `YOUR_BOT_NAME` на реальное имя вашего сервиса на Render.

### Деплой:

Сайт можно разместить на:
- GitHub Pages
- Netlify
- Vercel
- Любом статическом хостинге

### API:

Форма обращений отправляет запросы на Flask API бота:
- Endpoint: `POST /api/appeal`
- Формат: JSON
- Поля: `name`, `contact`, `text`

