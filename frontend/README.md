# Frontend Uran-235

Фронтенд написан на `React 19`, `TypeScript` и `Vite`. Это интерфейс оператора, в котором можно авторизоваться, смотреть live-курсы по биржам и управлять условиями, правилами и назначениями.

Основной README проекта находится в корне репозитория:

- [README.md](/Users/antondanilov/Projects/uran-235/README.md)

## Локальный запуск

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

По умолчанию фронтенд обращается к API по адресу `http://localhost:8000`.

Если нужен другой адрес API:

```bash
VITE_API_URL=http://localhost:9000 npm run dev -- --host 0.0.0.0 --port 5173
```

## Сборка

```bash
npm run build
```

## Запуск через Docker Compose

Фронтенд подключён к общему `docker-compose.yaml` и стартует вместе с остальными сервисами проекта:

```bash
docker compose up --build
```

После запуска интерфейс доступен на `http://localhost:5173`.
