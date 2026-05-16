# Uran-235

`Uran-235` — это небольшая операторская панель для работы с валютными курсами и торговыми правилами. Проект состоит из API на FastAPI, эмулятора биржевых данных и фронтенда на React. После запуска можно зарегистрировать пользователя, подключиться к эмулируемым биржам, смотреть live-курсы и управлять правилами, которые применяются к этим данным.

## Что внутри

- `api` — REST API и WebSocket-сервер. Отвечает за авторизацию, хранение правил, наборов правил и назначений.
- `frontend` — интерфейс оператора на React + Vite.
- `emulator` — сервис, который читает `exchanges.yaml` и отправляет тестовые курсы в API по WebSocket.
- `postgres` — основная база данных.
- `redis` — вспомогательное хранилище для токенов и сессионных данных.

## Основные возможности

- регистрация и вход по JWT;
- просмотр подключённых бирж;
- live-лента курсов по WebSocket;
- создание условий;
- создание наборов правил и привязка условий к ним;
- управление назначениями правил.

## Быстрый старт

Самый простой вариант — поднять весь проект одной командой через Docker Compose.

```bash
docker compose up --build
```

После запуска будут доступны:

- фронтенд: `http://localhost:5173`
- API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- healthcheck API: `http://localhost:8000/health`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

Если хотите запустить контейнеры в фоне:

```bash
docker compose up --build -d
```

Остановить проект:

```bash
docker compose down
```

Если нужно удалить ещё и данные PostgreSQL/Redis:

```bash
docker compose down -v
```

## Как это работает

1. `postgres` и `redis` поднимаются первыми.
2. `api` стартует после них и при запуске автоматически прогоняет миграции Alembic.
3. `emulator` подключается к API по WebSocket и начинает слать тестовые курсы.
4. `frontend` собирается в контейнере и открывается в браузере на `localhost:5173`.

Обычный сценарий после старта:

1. Открыть `http://localhost:5173`.
2. Зарегистрировать нового пользователя.
3. Перейти на главный экран и выбрать биржу.
4. Проверить, что курсы приходят и обновляются.
5. Создать условия, правила и назначения через интерфейс.

## Переменные окружения

Compose использует значения из корневого файла `.env`.

Сейчас проекту нужны:

```env
POSTGRES_USER=uran
POSTGRES_PASSWORD=uran
POSTGRES_DB=uran
```

Дополнительно можно задать:

- `EMULATOR_INGEST_SECRET` — общий секрет между API и эмулятором, если хотите закрыть ingest WebSocket.
- `VITE_API_URL` — адрес API, который будет зашит во фронтенд на этапе сборки контейнера. По умолчанию используется `http://localhost:8000`.

## Полезные команды

Посмотреть состояние контейнеров:

```bash
docker compose ps
```

Посмотреть логи:

```bash
docker compose logs -f api
docker compose logs -f frontend
docker compose logs -f emulator
```

Пересобрать только фронтенд:

```bash
docker compose build frontend
docker compose up -d frontend
```

## Локальная разработка без Docker

Если удобнее запускать части проекта отдельно, можно работать и так:

### API

```bash
cd api
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

По умолчанию фронтенд ходит в `http://localhost:8000`. При необходимости адрес можно переопределить через `VITE_API_URL`.

### Emulator

```bash
cd emulator
pip install -r requirements.txt
python main.py
```

## Где что лежит

- [docker-compose.yaml](/Users/antondanilov/Projects/uran-235/docker-compose.yaml)
- [api](/Users/antondanilov/Projects/uran-235/api)
- [frontend](/Users/antondanilov/Projects/uran-235/frontend)
- [emulator](/Users/antondanilov/Projects/uran-235/emulator)
- [exchanges.yaml](/Users/antondanilov/Projects/uran-235/exchanges.yaml)

## Нюансы

- Фронтенд в Docker собирается как статическое приложение, поэтому `VITE_API_URL` нужно задавать до сборки контейнера.
- Если меняете `exchanges.yaml`, достаточно перезапустить `emulator`.
- При первом запуске интерфейс может открыться раньше, чем появятся данные по биржам: обычно это решается само через несколько секунд, когда эмулятор полностью подключится к API.
