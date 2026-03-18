# Shiith Quran App

Flask-based Quran web app with reading, search, authentication, bookmarks, and a bundled SQLite Quran database.

## Clean Repo Layout

- `app/` - Flask package, templates, CSS, JavaScript, favicon
- `fullquranDb.db` - bundled Quran content database
- `config.py` - configuration
- `run.py` - local development entrypoint
- `wsgi.py` - production WSGI entrypoint
- `Procfile` - simple deployment command for platforms that support it
- `.github/workflows/ci.yml` - lightweight GitHub Actions validation

## Local Install

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
flask --app run init-db
```

### Windows

```bat
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
flask --app run init-db
```

## Local Run

### macOS / Linux

```bash
source .venv/bin/activate
python3 run.py
```

### Windows

```bat
.venv\Scripts\activate
python run.py
```

App URL: [http://127.0.0.1:5000](http://127.0.0.1:5000)

## Manual Smoke Tests

Run these after the server starts:

```bash
curl -I http://127.0.0.1:5000/
curl -s "http://127.0.0.1:5000/api/surah/1" | python3 -m json.tool
curl -s "http://127.0.0.1:5000/api/search?q=mercy&lang=both" | python3 -c "import json,sys; data=json.load(sys.stdin); print(data['query'], len(data['results']))"
curl -s http://127.0.0.1:5000/auth/me
```

Expected results:

- `/` returns `200 OK`
- `/api/surah/1` returns Surah 1 JSON
- `/api/search` returns a result count
- `/auth/me` returns `{"error": "Authentication required"}` while logged out

## Deployment

Install dependencies and run with `gunicorn`:

```bash
pip install -r requirements.txt
gunicorn --bind 0.0.0.0:${PORT:-5000} wsgi:app
```

Recommended environment variables:

```bash
FLASK_ENV=production
SECRET_KEY=replace-this-with-a-real-secret
PORT=5000
```

`DATABASE_URL` is optional. If you leave it unset, the app uses the bundled `fullquranDb.db`.
