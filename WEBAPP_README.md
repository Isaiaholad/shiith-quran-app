# Quran Web Application

A modern, responsive web application for reading and studying the Holy Quran with translations, audio recitations, bookmarks, and search functionality.

## Features

### Core Features
- **Complete Quran Text**: All 114 Surahs with Arabic (Uthmanic script) and English translations
- **Verse-by-Verse Display**: Clear, organized layout with Surah and Ayah numbers
- **Audio Recitation**: Play individual verses or entire Surahs with verse highlighting
- **Search Functionality**: Search through verses in both Arabic and English
- **Bookmarking System**: Save favorite verses with optional notes (requires login)
- **Reading Progress**: Track your reading progress automatically
- **Dark/Light Theme**: Toggle between themes for comfortable reading
- **Font Size Adjustment**: Customize text size for better readability
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **RTL Support**: Proper right-to-left text rendering for Arabic

### User Features
- **User Authentication**: Register and login to access personalized features
- **Personal Bookmarks**: Save and organize favorite verses
- **Copy & Share**: Easily copy verses or share links to specific verses
- **Navigation**: Jump to any Surah or Ayah quickly

## Technology Stack

- **Backend**: Flask 3.0.0 (Python web framework)
- **Database**: SQLite with SQLAlchemy ORM
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: Flask-Login with session management
- **API**: RESTful API design
- **Fonts**: Google Fonts (Amiri for Arabic, Inter for Latin)
- **Icons**: Font Awesome 6.4.0

## Project Structure

```
shitty-quran-app/
├── app/
│   ├── __init__.py           # Flask app initialization
│   ├── models.py             # Database models
│   ├── routes.py             # API and web routes
│   ├── static/
│   │   ├── css/
│   │   │   └── styles.css    # Main stylesheet
│   │   ├── js/
│   │   │   ├── main.js       # Core functionality
│   │   │   ├── read.js       # Reading interface
│   │   │   ├── search.js     # Search functionality
│   │   │   └── bookmarks.js  # Bookmarks management
│   │   └── images/
│   └── templates/
│       ├── base.html         # Base template
│       ├── index.html        # Home page
│       ├── read.html         # Reading interface
│       ├── search.html       # Search page
│       └── bookmarks.html    # Bookmarks page
├── config.py                 # Configuration settings
├── run.py                    # Application entry point
├── requirements.txt          # Python dependencies
├── fullquranDb.db           # Quran content database
└── WEBAPP_README.md         # This file
```

## Installation & Setup

### Prerequisites

- Python 3.9 or higher
- pip (Python package manager)
- Git

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd shitty-quran-app
```

### Step 2: Create Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Initialize Database

```bash
# Create necessary database tables
flask --app run init-db
```

### Step 5: Run the Application

```bash
# Development mode
python run.py

# Or using Flask CLI
flask --app run run --debug
```

The application will be available at: `http://localhost:5000`

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Flask configuration
FLASK_ENV=development
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=sqlite:///fullquranDb.db

# Optional: For production
# SESSION_COOKIE_SECURE=True
```

### Configuration Options

Edit `config.py` to customize:

- `SECRET_KEY`: Change for production
- `VERSES_PER_PAGE`: Number of verses to load initially
- `MAX_SEARCH_RESULTS`: Maximum search results to return
- Session settings and security options

## API Documentation

### Authentication Endpoints

#### POST /auth/register
Register a new user

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:** 201 Created
```json
{
  "message": "User created successfully",
  "user_id": 1
}
```

#### POST /auth/login
Log in a user

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "remember": false
}
```

**Response:** 200 OK
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string"
  }
}
```

#### POST /auth/logout
Log out the current user (requires authentication)

**Response:** 200 OK

#### GET /auth/me
Get current user info (requires authentication)

**Response:** 200 OK

### Quran Data Endpoints

#### GET /api/surahs
Get list of all Surahs

**Response:** 200 OK
```json
{
  "surahs": [
    {
      "number": 1,
      "name": "Al-Fatihah",
      "name_arabic": "الفاتحة",
      "verses": 7,
      "revelation": "Meccan"
    }
  ],
  "total": 114
}
```

#### GET /api/surah/{id}
Get all verses for a specific Surah

**Parameters:**
- `id` (path): Surah number (1-114)

**Response:** 200 OK
```json
{
  "surah": 1,
  "verses": [
    {
      "id": 1,
      "chapter": 1,
      "verse": 1,
      "english": "In the name of Allah...",
      "arabic": "بِسْمِ اللَّهِ..."
    }
  ],
  "total_verses": 7
}
```

#### GET /api/ayah/{surah_id}/{ayah_id}
Get a specific verse

**Parameters:**
- `surah_id` (path): Surah number
- `ayah_id` (path): Verse number

**Response:** 200 OK

#### GET /api/search
Search verses

**Query Parameters:**
- `q` (required): Search query
- `lang` (optional): 'arabic', 'english', or 'both' (default: 'both')
- `limit` (optional): Maximum results (default: 100)

**Response:** 200 OK
```json
{
  "query": "mercy",
  "results": [...],
  "total": 50
}
```

#### GET /api/audio/{surah}/{ayah}
Get audio URL for a verse

**Parameters:**
- `surah` (path): Surah number
- `ayah` (path): Verse number
- `reciter` (query, optional): Reciter name (default: 'Alafasy_128kbps')

**Response:** 200 OK
```json
{
  "surah": 1,
  "ayah": 1,
  "audio_url": "https://...",
  "reciter": "Alafasy_128kbps"
}
```

### Bookmark Endpoints (Require Authentication)

#### GET /api/bookmarks
Get user's bookmarks

**Response:** 200 OK
```json
{
  "bookmarks": [
    {
      "id": 1,
      "chapter": 1,
      "verse": 1,
      "note": "optional note",
      "created_at": "2024-01-01T00:00:00",
      "verse_data": {...}
    }
  ]
}
```

#### POST /api/bookmarks
Add a bookmark

**Request Body:**
```json
{
  "chapter": 1,
  "verse": 1,
  "note": "optional note"
}
```

**Response:** 201 Created

#### DELETE /api/bookmarks/{id}
Delete a bookmark

**Parameters:**
- `id` (path): Bookmark ID

**Response:** 200 OK

### Progress Endpoints (Require Authentication)

#### GET /api/progress
Get reading progress

**Response:** 200 OK

#### POST /api/progress
Update reading progress

**Request Body:**
```json
{
  "chapter": 1,
  "verse": 5
}
```

**Response:** 200 OK

## Deployment

### Production Deployment

#### Using Gunicorn (Recommended)

1. Install Gunicorn:
```bash
pip install gunicorn
```

2. Run with Gunicorn:
```bash
gunicorn -w 4 -b 0.0.0.0:8000 'app:create_app()'
```

#### Using Docker

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:create_app()"]
```

Build and run:
```bash
docker build -t quran-app .
docker run -p 5000:5000 quran-app
```

#### Environment Setup for Production

1. Set environment variables:
```bash
export FLASK_ENV=production
export SECRET_KEY=<your-secure-random-key>
```

2. Use a production database (PostgreSQL recommended):
```bash
export DATABASE_URL=postgresql://user:pass@localhost/quran_db
```

3. Enable HTTPS and secure cookies in `config.py`

### Nginx Configuration (Optional)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /static {
        alias /path/to/app/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Usage Guide

### For Readers

1. **Browse Surahs**: Click "Start Reading" or select a Surah from the dropdown
2. **Navigate**: Use Previous/Next buttons or jump to specific verses
3. **Listen**: Click the play button on any verse for audio recitation
4. **Search**: Use the search page to find verses by keyword
5. **Customize**: Adjust font size and toggle themes as preferred

### For Registered Users

1. **Register**: Click the user icon and select "Register"
2. **Bookmark**: Click the bookmark icon on any verse to save it
3. **View Bookmarks**: Access your saved verses from the Bookmarks page
4. **Track Progress**: Your reading position is automatically saved

## Troubleshooting

### Database Issues

If you encounter database errors:

```bash
# Delete existing database
rm fullquranDb.db

# Reinitialize
flask --app run init-db
```

### Port Already in Use

Change the port in `run.py`:

```python
app.run(debug=True, host='0.0.0.0', port=5001)  # Use different port
```

### CSS/JS Not Loading

Clear browser cache or use hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-flask

# Run tests
pytest
```

### Code Style

Follow PEP 8 for Python code:

```bash
# Install flake8
pip install flake8

# Check code style
flake8 app/
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is for educational and religious purposes.

## Credits

- **Quran Text**: Original database content
- **Audio**: EveryAyah.com (configurable)
- **Fonts**: Google Fonts (Amiri, Inter)
- **Icons**: Font Awesome

## Support

For issues, questions, or suggestions:
- Create an issue on GitHub
- Contact the development team

## Acknowledgments

May Allah accept this work and make it beneficial for the Muslim community. All praise is due to Allah, Lord of all the worlds.
