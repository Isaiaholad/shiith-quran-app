from flask import Blueprint, current_app, jsonify, render_template, request
from flask_login import current_user, login_required, login_user, logout_user
from sqlalchemy import or_
from app import db
from app.models import User, Quran, Bookmark, ReadingProgress
from datetime import datetime

# Create blueprints
main_bp = Blueprint('main', __name__)
api_bp = Blueprint('api', __name__)
auth_bp = Blueprint('auth', __name__)

# ===========================
# WEB ROUTES (Main Pages)
# ===========================

@main_bp.route('/')
def index():
    """Home page"""
    return render_template('index.html')

@main_bp.route('/read')
def read():
    """Main reading interface"""
    return render_template('read.html')

@main_bp.route('/search')
def search_page():
    """Search page"""
    return render_template('search.html')

@main_bp.route('/bookmarks')
def bookmarks_page():
    """Bookmarks page"""
    return render_template('bookmarks.html')

# ===========================
# AUTHENTICATION ROUTES
# ===========================

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()

    if not data or not all(k in data for k in ('username', 'email', 'password')):
        return jsonify({'error': 'Missing required fields'}), 400

    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409

    # Create new user
    user = User(username=data['username'], email=data['email'])
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'User created successfully', 'user_id': user.id}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Log in a user"""
    data = request.get_json()

    if not data or not all(k in data for k in ('username', 'password')):
        return jsonify({'error': 'Missing username or password'}), 400

    user = User.query.filter_by(username=data['username']).first()

    if user and user.check_password(data['password']):
        login_user(user, remember=data.get('remember', False))
        user.last_login = datetime.utcnow()
        db.session.commit()
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }), 200

    return jsonify({'error': 'Invalid username or password'}), 401

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """Log out the current user"""
    logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/me')
@login_required
def get_current_user():
    """Get current user info"""
    return jsonify({
        'id': current_user.id,
        'username': current_user.username,
        'email': current_user.email
    }), 200

# ===========================
# API ROUTES - QURAN DATA
# ===========================

@api_bp.route('/surahs', methods=['GET'])
def get_surahs():
    """Get list of all surahs with verse counts"""
    surah_info = [
        {"number": 1, "name": "Al-Fatihah", "name_arabic": "الفاتحة", "verses": 7, "revelation": "Meccan"},
        {"number": 2, "name": "Al-Baqarah", "name_arabic": "البقرة", "verses": 286, "revelation": "Medinan"},
        {"number": 3, "name": "Ali 'Imran", "name_arabic": "آل عمران", "verses": 200, "revelation": "Medinan"},
        {"number": 4, "name": "An-Nisa", "name_arabic": "النساء", "verses": 176, "revelation": "Medinan"},
        {"number": 5, "name": "Al-Ma'idah", "name_arabic": "المائدة", "verses": 120, "revelation": "Medinan"},
        {"number": 6, "name": "Al-An'am", "name_arabic": "الأنعام", "verses": 165, "revelation": "Meccan"},
        {"number": 7, "name": "Al-A'raf", "name_arabic": "الأعراف", "verses": 206, "revelation": "Meccan"},
        {"number": 8, "name": "Al-Anfal", "name_arabic": "الأنفال", "verses": 75, "revelation": "Medinan"},
        {"number": 9, "name": "At-Tawbah", "name_arabic": "التوبة", "verses": 129, "revelation": "Medinan"},
        {"number": 10, "name": "Yunus", "name_arabic": "يونس", "verses": 109, "revelation": "Meccan"},
        {"number": 11, "name": "Hud", "name_arabic": "هود", "verses": 123, "revelation": "Meccan"},
        {"number": 12, "name": "Yusuf", "name_arabic": "يوسف", "verses": 111, "revelation": "Meccan"},
        {"number": 13, "name": "Ar-Ra'd", "name_arabic": "الرعد", "verses": 43, "revelation": "Medinan"},
        {"number": 14, "name": "Ibrahim", "name_arabic": "إبراهيم", "verses": 52, "revelation": "Meccan"},
        {"number": 15, "name": "Al-Hijr", "name_arabic": "الحجر", "verses": 99, "revelation": "Meccan"},
        {"number": 16, "name": "An-Nahl", "name_arabic": "النحل", "verses": 128, "revelation": "Meccan"},
        {"number": 17, "name": "Al-Isra", "name_arabic": "الإسراء", "verses": 111, "revelation": "Meccan"},
        {"number": 18, "name": "Al-Kahf", "name_arabic": "الكهف", "verses": 110, "revelation": "Meccan"},
        {"number": 19, "name": "Maryam", "name_arabic": "مريم", "verses": 98, "revelation": "Meccan"},
        {"number": 20, "name": "Taha", "name_arabic": "طه", "verses": 135, "revelation": "Meccan"},
        {"number": 21, "name": "Al-Anbya", "name_arabic": "الأنبياء", "verses": 112, "revelation": "Meccan"},
        {"number": 22, "name": "Al-Hajj", "name_arabic": "الحج", "verses": 78, "revelation": "Medinan"},
        {"number": 23, "name": "Al-Mu'minun", "name_arabic": "المؤمنون", "verses": 118, "revelation": "Meccan"},
        {"number": 24, "name": "An-Nur", "name_arabic": "النور", "verses": 64, "revelation": "Medinan"},
        {"number": 25, "name": "Al-Furqan", "name_arabic": "الفرقان", "verses": 77, "revelation": "Meccan"},
        {"number": 26, "name": "Ash-Shu'ara", "name_arabic": "الشعراء", "verses": 227, "revelation": "Meccan"},
        {"number": 27, "name": "An-Naml", "name_arabic": "النمل", "verses": 93, "revelation": "Meccan"},
        {"number": 28, "name": "Al-Qasas", "name_arabic": "القصص", "verses": 88, "revelation": "Meccan"},
        {"number": 29, "name": "Al-'Ankabut", "name_arabic": "العنكبوت", "verses": 69, "revelation": "Meccan"},
        {"number": 30, "name": "Ar-Rum", "name_arabic": "الروم", "verses": 60, "revelation": "Meccan"},
        {"number": 31, "name": "Luqman", "name_arabic": "لقمان", "verses": 34, "revelation": "Meccan"},
        {"number": 32, "name": "As-Sajdah", "name_arabic": "السجدة", "verses": 30, "revelation": "Meccan"},
        {"number": 33, "name": "Al-Ahzab", "name_arabic": "الأحزاب", "verses": 73, "revelation": "Medinan"},
        {"number": 34, "name": "Saba", "name_arabic": "سبأ", "verses": 54, "revelation": "Meccan"},
        {"number": 35, "name": "Fatir", "name_arabic": "فاطر", "verses": 45, "revelation": "Meccan"},
        {"number": 36, "name": "Ya-Sin", "name_arabic": "يس", "verses": 83, "revelation": "Meccan"},
        {"number": 37, "name": "As-Saffat", "name_arabic": "الصافات", "verses": 182, "revelation": "Meccan"},
        {"number": 38, "name": "Sad", "name_arabic": "ص", "verses": 88, "revelation": "Meccan"},
        {"number": 39, "name": "Az-Zumar", "name_arabic": "الزمر", "verses": 75, "revelation": "Meccan"},
        {"number": 40, "name": "Ghafir", "name_arabic": "غافر", "verses": 85, "revelation": "Meccan"},
        {"number": 41, "name": "Fussilat", "name_arabic": "فصلت", "verses": 54, "revelation": "Meccan"},
        {"number": 42, "name": "Ash-Shuraa", "name_arabic": "الشورى", "verses": 53, "revelation": "Meccan"},
        {"number": 43, "name": "Az-Zukhruf", "name_arabic": "الزخرف", "verses": 89, "revelation": "Meccan"},
        {"number": 44, "name": "Ad-Dukhan", "name_arabic": "الدخان", "verses": 59, "revelation": "Meccan"},
        {"number": 45, "name": "Al-Jathiyah", "name_arabic": "الجاثية", "verses": 37, "revelation": "Meccan"},
        {"number": 46, "name": "Al-Ahqaf", "name_arabic": "الأحقاف", "verses": 35, "revelation": "Meccan"},
        {"number": 47, "name": "Muhammad", "name_arabic": "محمد", "verses": 38, "revelation": "Medinan"},
        {"number": 48, "name": "Al-Fath", "name_arabic": "الفتح", "verses": 29, "revelation": "Medinan"},
        {"number": 49, "name": "Al-Hujurat", "name_arabic": "الحجرات", "verses": 18, "revelation": "Medinan"},
        {"number": 50, "name": "Qaf", "name_arabic": "ق", "verses": 45, "revelation": "Meccan"},
        {"number": 51, "name": "Adh-Dhariyat", "name_arabic": "الذاريات", "verses": 60, "revelation": "Meccan"},
        {"number": 52, "name": "At-Tur", "name_arabic": "الطور", "verses": 49, "revelation": "Meccan"},
        {"number": 53, "name": "An-Najm", "name_arabic": "النجم", "verses": 62, "revelation": "Meccan"},
        {"number": 54, "name": "Al-Qamar", "name_arabic": "القمر", "verses": 55, "revelation": "Meccan"},
        {"number": 55, "name": "Ar-Rahman", "name_arabic": "الرحمن", "verses": 78, "revelation": "Medinan"},
        {"number": 56, "name": "Al-Waqi'ah", "name_arabic": "الواقعة", "verses": 96, "revelation": "Meccan"},
        {"number": 57, "name": "Al-Hadid", "name_arabic": "الحديد", "verses": 29, "revelation": "Medinan"},
        {"number": 58, "name": "Al-Mujadila", "name_arabic": "المجادلة", "verses": 22, "revelation": "Medinan"},
        {"number": 59, "name": "Al-Hashr", "name_arabic": "الحشر", "verses": 24, "revelation": "Medinan"},
        {"number": 60, "name": "Al-Mumtahanah", "name_arabic": "الممتحنة", "verses": 13, "revelation": "Medinan"},
        {"number": 61, "name": "As-Saf", "name_arabic": "الصف", "verses": 14, "revelation": "Medinan"},
        {"number": 62, "name": "Al-Jumu'ah", "name_arabic": "الجمعة", "verses": 11, "revelation": "Medinan"},
        {"number": 63, "name": "Al-Munafiqun", "name_arabic": "المنافقون", "verses": 11, "revelation": "Medinan"},
        {"number": 64, "name": "At-Taghabun", "name_arabic": "التغابن", "verses": 18, "revelation": "Medinan"},
        {"number": 65, "name": "At-Talaq", "name_arabic": "الطلاق", "verses": 12, "revelation": "Medinan"},
        {"number": 66, "name": "At-Tahrim", "name_arabic": "التحريم", "verses": 12, "revelation": "Medinan"},
        {"number": 67, "name": "Al-Mulk", "name_arabic": "الملك", "verses": 30, "revelation": "Meccan"},
        {"number": 68, "name": "Al-Qalam", "name_arabic": "القلم", "verses": 52, "revelation": "Meccan"},
        {"number": 69, "name": "Al-Haqqah", "name_arabic": "الحاقة", "verses": 52, "revelation": "Meccan"},
        {"number": 70, "name": "Al-Ma'arij", "name_arabic": "المعارج", "verses": 44, "revelation": "Meccan"},
        {"number": 71, "name": "Nuh", "name_arabic": "نوح", "verses": 28, "revelation": "Meccan"},
        {"number": 72, "name": "Al-Jinn", "name_arabic": "الجن", "verses": 28, "revelation": "Meccan"},
        {"number": 73, "name": "Al-Muzzammil", "name_arabic": "المزمل", "verses": 20, "revelation": "Meccan"},
        {"number": 74, "name": "Al-Muddaththir", "name_arabic": "المدثر", "verses": 56, "revelation": "Meccan"},
        {"number": 75, "name": "Al-Qiyamah", "name_arabic": "القيامة", "verses": 40, "revelation": "Meccan"},
        {"number": 76, "name": "Al-Insan", "name_arabic": "الإنسان", "verses": 31, "revelation": "Medinan"},
        {"number": 77, "name": "Al-Mursalat", "name_arabic": "المرسلات", "verses": 50, "revelation": "Meccan"},
        {"number": 78, "name": "An-Naba", "name_arabic": "النبأ", "verses": 40, "revelation": "Meccan"},
        {"number": 79, "name": "An-Nazi'at", "name_arabic": "النازعات", "verses": 46, "revelation": "Meccan"},
        {"number": 80, "name": "Abasa", "name_arabic": "عبس", "verses": 42, "revelation": "Meccan"},
        {"number": 81, "name": "At-Takwir", "name_arabic": "التكوير", "verses": 29, "revelation": "Meccan"},
        {"number": 82, "name": "Al-Infitar", "name_arabic": "الإنفطار", "verses": 19, "revelation": "Meccan"},
        {"number": 83, "name": "Al-Mutaffifin", "name_arabic": "المطففين", "verses": 36, "revelation": "Meccan"},
        {"number": 84, "name": "Al-Inshiqaq", "name_arabic": "الإنشقاق", "verses": 25, "revelation": "Meccan"},
        {"number": 85, "name": "Al-Buruj", "name_arabic": "البروج", "verses": 22, "revelation": "Meccan"},
        {"number": 86, "name": "At-Tariq", "name_arabic": "الطارق", "verses": 17, "revelation": "Meccan"},
        {"number": 87, "name": "Al-A'la", "name_arabic": "الأعلى", "verses": 19, "revelation": "Meccan"},
        {"number": 88, "name": "Al-Ghashiyah", "name_arabic": "الغاشية", "verses": 26, "revelation": "Meccan"},
        {"number": 89, "name": "Al-Fajr", "name_arabic": "الفجر", "verses": 30, "revelation": "Meccan"},
        {"number": 90, "name": "Al-Balad", "name_arabic": "البلد", "verses": 20, "revelation": "Meccan"},
        {"number": 91, "name": "Ash-Shams", "name_arabic": "الشمس", "verses": 15, "revelation": "Meccan"},
        {"number": 92, "name": "Al-Layl", "name_arabic": "الليل", "verses": 21, "revelation": "Meccan"},
        {"number": 93, "name": "Ad-Duhaa", "name_arabic": "الضحى", "verses": 11, "revelation": "Meccan"},
        {"number": 94, "name": "Ash-Sharh", "name_arabic": "الشرح", "verses": 8, "revelation": "Meccan"},
        {"number": 95, "name": "At-Tin", "name_arabic": "التين", "verses": 8, "revelation": "Meccan"},
        {"number": 96, "name": "Al-'Alaq", "name_arabic": "العلق", "verses": 19, "revelation": "Meccan"},
        {"number": 97, "name": "Al-Qadr", "name_arabic": "القدر", "verses": 5, "revelation": "Meccan"},
        {"number": 98, "name": "Al-Bayyinah", "name_arabic": "البينة", "verses": 8, "revelation": "Medinan"},
        {"number": 99, "name": "Az-Zalzalah", "name_arabic": "الزلزلة", "verses": 8, "revelation": "Medinan"},
        {"number": 100, "name": "Al-'Adiyat", "name_arabic": "العاديات", "verses": 11, "revelation": "Meccan"},
        {"number": 101, "name": "Al-Qari'ah", "name_arabic": "القارعة", "verses": 11, "revelation": "Meccan"},
        {"number": 102, "name": "At-Takathur", "name_arabic": "التكاثر", "verses": 8, "revelation": "Meccan"},
        {"number": 103, "name": "Al-'Asr", "name_arabic": "العصر", "verses": 3, "revelation": "Meccan"},
        {"number": 104, "name": "Al-Humazah", "name_arabic": "الهمزة", "verses": 9, "revelation": "Meccan"},
        {"number": 105, "name": "Al-Fil", "name_arabic": "الفيل", "verses": 5, "revelation": "Meccan"},
        {"number": 106, "name": "Quraysh", "name_arabic": "قريش", "verses": 4, "revelation": "Meccan"},
        {"number": 107, "name": "Al-Ma'un", "name_arabic": "الماعون", "verses": 7, "revelation": "Meccan"},
        {"number": 108, "name": "Al-Kawthar", "name_arabic": "الكوثر", "verses": 3, "revelation": "Meccan"},
        {"number": 109, "name": "Al-Kafirun", "name_arabic": "الكافرون", "verses": 6, "revelation": "Meccan"},
        {"number": 110, "name": "An-Nasr", "name_arabic": "النصر", "verses": 3, "revelation": "Medinan"},
        {"number": 111, "name": "Al-Masad", "name_arabic": "المسد", "verses": 5, "revelation": "Meccan"},
        {"number": 112, "name": "Al-Ikhlas", "name_arabic": "الإخلاص", "verses": 4, "revelation": "Meccan"},
        {"number": 113, "name": "Al-Falaq", "name_arabic": "الفلق", "verses": 5, "revelation": "Meccan"},
        {"number": 114, "name": "An-Nas", "name_arabic": "الناس", "verses": 6, "revelation": "Meccan"}
    ]

    return jsonify({'surahs': surah_info, 'total': 114}), 200

@api_bp.route('/surah/<int:surah_id>', methods=['GET'])
def get_surah(surah_id):
    """Get all verses for a specific surah"""
    if surah_id < 1 or surah_id > 114:
        return jsonify({'error': 'Invalid surah number'}), 400

    verses = Quran.query.filter_by(chapter=surah_id).order_by(Quran.verse).all()

    if not verses:
        return jsonify({'error': 'Surah not found'}), 404

    return jsonify({
        'surah': surah_id,
        'verses': [v.to_dict() for v in verses],
        'total_verses': len(verses)
    }), 200

@api_bp.route('/ayah/<int:surah_id>/<int:ayah_id>', methods=['GET'])
def get_ayah(surah_id, ayah_id):
    """Get a specific verse"""
    verse = Quran.query.filter_by(chapter=surah_id, verse=ayah_id).first()

    if not verse:
        return jsonify({'error': 'Verse not found'}), 404

    return jsonify(verse.to_dict()), 200

@api_bp.route('/search', methods=['GET'])
def search():
    """Search verses by text (Arabic or English)"""
    query = request.args.get('q', '').strip()
    lang = request.args.get('lang', 'both')  # 'arabic', 'english', or 'both'
    max_results = current_app.config.get('MAX_SEARCH_RESULTS', 100)
    limit = min(request.args.get('limit', max_results, type=int), max_results)

    if not query or len(query) < 2:
        return jsonify({'error': 'Search query too short'}), 400

    if lang not in ('arabic', 'english', 'both'):
        return jsonify({'error': 'Invalid search language'}), 400

    # Build search query
    search_filters = []
    if lang in ('english', 'both'):
        search_filters.append(Quran.english_content.ilike(f'%{query}%'))
    if lang in ('arabic', 'both'):
        search_filters.append(Quran.arabic_content.like(f'%{query}%'))

    results = Quran.query.filter(or_(*search_filters)).limit(limit).all()

    return jsonify({
        'query': query,
        'results': [v.to_dict() for v in results],
        'total': len(results)
    }), 200

# ===========================
# API ROUTES - BOOKMARKS
# ===========================

@api_bp.route('/bookmarks', methods=['GET'])
@login_required
def get_bookmarks():
    """Get user's bookmarks"""
    bookmarks = Bookmark.query.filter_by(user_id=current_user.id)\
        .order_by(Bookmark.created_at.desc()).all()

    # Get verse details for each bookmark
    bookmarks_with_verses = []
    for bookmark in bookmarks:
        verse = Quran.query.filter_by(
            chapter=bookmark.chapter,
            verse=bookmark.verse
        ).first()

        if verse:
            bookmark_data = bookmark.to_dict()
            bookmark_data['verse_data'] = verse.to_dict()
            bookmarks_with_verses.append(bookmark_data)

    return jsonify({'bookmarks': bookmarks_with_verses}), 200

@api_bp.route('/bookmarks', methods=['POST'])
@login_required
def add_bookmark():
    """Add a bookmark"""
    data = request.get_json()

    if not data or not all(k in data for k in ('chapter', 'verse')):
        return jsonify({'error': 'Missing chapter or verse'}), 400

    # Check if bookmark already exists
    existing = Bookmark.query.filter_by(
        user_id=current_user.id,
        chapter=data['chapter'],
        verse=data['verse']
    ).first()

    if existing:
        return jsonify({'error': 'Bookmark already exists'}), 409

    # Verify verse exists
    verse = Quran.query.filter_by(
        chapter=data['chapter'],
        verse=data['verse']
    ).first()

    if not verse:
        return jsonify({'error': 'Verse not found'}), 404

    bookmark = Bookmark(
        user_id=current_user.id,
        chapter=data['chapter'],
        verse=data['verse'],
        note=data.get('note')
    )

    db.session.add(bookmark)
    db.session.commit()

    return jsonify({
        'message': 'Bookmark added',
        'bookmark': bookmark.to_dict()
    }), 201

@api_bp.route('/bookmarks/<int:bookmark_id>', methods=['DELETE'])
@login_required
def delete_bookmark(bookmark_id):
    """Delete a bookmark"""
    bookmark = Bookmark.query.filter_by(
        id=bookmark_id,
        user_id=current_user.id
    ).first()

    if not bookmark:
        return jsonify({'error': 'Bookmark not found'}), 404

    db.session.delete(bookmark)
    db.session.commit()

    return jsonify({'message': 'Bookmark deleted'}), 200

# ===========================
# API ROUTES - READING PROGRESS
# ===========================

@api_bp.route('/progress', methods=['GET'])
@login_required
def get_progress():
    """Get user's reading progress"""
    progress = ReadingProgress.query.filter_by(user_id=current_user.id)\
        .order_by(ReadingProgress.last_read.desc()).all()

    return jsonify({'progress': [p.to_dict() for p in progress]}), 200

@api_bp.route('/progress', methods=['POST'])
@login_required
def update_progress():
    """Update reading progress"""
    data = request.get_json()

    if not data or not all(k in data for k in ('chapter', 'verse')):
        return jsonify({'error': 'Missing chapter or verse'}), 400

    # Check if progress exists for this chapter
    progress = ReadingProgress.query.filter_by(
        user_id=current_user.id,
        chapter=data['chapter']
    ).first()

    if progress:
        # Update existing progress
        progress.verse = data['verse']
        progress.last_read = datetime.utcnow()
    else:
        # Create new progress entry
        progress = ReadingProgress(
            user_id=current_user.id,
            chapter=data['chapter'],
            verse=data['verse']
        )
        db.session.add(progress)

    db.session.commit()

    return jsonify({
        'message': 'Progress updated',
        'progress': progress.to_dict()
    }), 200

# ===========================
# AUDIO ENDPOINT (Placeholder)
# ===========================

@api_bp.route('/audio/<int:surah>/<int:ayah>', methods=['GET'])
def get_audio(surah, ayah):
    """Get audio URL for a verse (placeholder)"""
    # Using EveryAyah.com as example - you can change to your preferred source
    reciter = request.args.get('reciter', 'Alafasy_128kbps')

    # Format: surah (3 digits) + ayah (3 digits)
    audio_url = f"https://everyayah.com/data/{reciter}/{surah:03d}{ayah:03d}.mp3"

    return jsonify({
        'surah': surah,
        'ayah': ayah,
        'audio_url': audio_url,
        'reciter': reciter
    }), 200
