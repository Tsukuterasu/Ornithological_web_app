# Ornithological Web App

This project contains a Flask API backend and HTML mockups for the future UI.

## Prerequisites

- Python 3.10+ (recommended)

## Run the API (Windows PowerShell)

1. Open a terminal at the repository root.
2. Create and activate a virtual environment:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3. Install dependencies:

```powershell
pip install -r requirements.txt
```

4. Initialize the database (SQLite by default):

```powershell
$env:FLASK_APP="app:create_app"
flask init-db
```

5. (Optional) Seed the database with fake data:

```powershell
flask seed-db
```

To auto-seed on startup:

```powershell
$env:SEED_ON_STARTUP="1"
```

6. Start the API:

```powershell
flask run
```

The API will run at `http://127.0.0.1:5000`.

## Run the Frontend (React + Vite)

1. Open a terminal at the repository root.
2. Install dependencies:

```powershell
cd bird_app
npm install
```

3. Start the Vite dev server:

```powershell
npm run dev
```

The frontend will run at `http://127.0.0.1:5173`.

You can also run Vite directly:

```powershell
cd bird_app
npx vite
```

To use a different API base URL, set:

```powershell
$env:VITE_API_BASE_URL="http://127.0.0.1:5000"
```

## Configuration (optional)

You can override defaults using environment variables:

- `DATABASE_URL` (default: `sqlite:///ornithology.db`)
- `UPLOAD_FOLDER` (default: `uploads`)

Example:

```powershell
$env:DATABASE_URL="sqlite:///ornithology.db"
$env:UPLOAD_FOLDER="uploads"
```

## API Endpoints

- `POST /api/species` (create a species, optional image upload or image URL)
- `GET /api/species` (list species, optional sort)
- `GET /api/species/<id>` (get species by id, UUID)
- `PUT /api/species/<id>` (update species, UUID)
- `DELETE /api/species/<id>` (delete species, UUID)

Sorting options:

- `sort=population_estimate|year_of_discovery|created_at`
- `order=asc|desc`

## Mockups

Static mockup pages are located in `Web_Pages_Mockup/`.
