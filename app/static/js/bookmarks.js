// ===========================
// Bookmarks Page
// ===========================

let userBookmarks = [];

// ===========================
// Initialize Bookmarks Page
// ===========================

async function initBookmarksPage() {
    await loadBookmarks();
}

// ===========================
// Load User Bookmarks
// ===========================

async function loadBookmarks() {
    const container = document.getElementById('bookmarksList');

    if (!container) return;

    // Check if user is logged in
    if (!currentUser) {
        container.innerHTML = `
            <div class="bookmark-empty">
                <i class="fas fa-lock"></i>
                <h3>Please Log In</h3>
                <p>You need to be logged in to view your bookmarks</p>
                <button class="btn btn-primary" onclick="openModal('loginModal')">
                    <i class="fas fa-sign-in-alt"></i> Log In
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading bookmarks...</p>
        </div>
    `;

    try {
        const response = await apiCall('/bookmarks');
        const data = await response.json();

        userBookmarks = data.bookmarks;
        displayBookmarks();
    } catch (error) {
        console.error('Error loading bookmarks:', error);
        container.innerHTML = `
            <div class="bookmark-empty">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load bookmarks</p>
            </div>
        `;
    }
}

// ===========================
// Display Bookmarks
// ===========================

function displayBookmarks() {
    const container = document.getElementById('bookmarksList');

    if (!container) return;

    if (userBookmarks.length === 0) {
        container.innerHTML = `
            <div class="bookmark-empty">
                <i class="fas fa-bookmark"></i>
                <h3>No Bookmarks Yet</h3>
                <p>Start reading and bookmark your favorite verses</p>
                <a href="/read" class="btn btn-primary">
                    <i class="fas fa-book-open"></i> Start Reading
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = userBookmarks.map(bookmark => {
        const verse = bookmark.verse_data;
        const date = new Date(bookmark.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <div class="verse-card">
                <div class="verse-header">
                    <span class="verse-number">${verse.chapter}:${verse.verse}</span>
                    <div class="verse-actions">
                        <button class="btn-icon" onclick="playBookmarkedVerse(${verse.chapter}, ${verse.verse})" title="Play audio">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn-icon" onclick="copyBookmarkedVerse(${verse.chapter}, ${verse.verse})" title="Copy">
                            <i class="fas fa-copy"></i>
                        </button>
                        <a href="/read?surah=${verse.chapter}&verse=${verse.verse}" class="btn-icon" title="Go to verse">
                            <i class="fas fa-arrow-right"></i>
                        </a>
                        <button class="btn-icon" onclick="removeBookmark(${bookmark.id})" title="Remove bookmark">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="verse-content">
                    <p class="arabic-content">${verse.arabic}</p>
                    <p class="verse-translation">${verse.english}</p>
                    ${bookmark.note ? `<p class="bookmark-note"><i class="fas fa-sticky-note"></i> ${bookmark.note}</p>` : ''}
                </div>
                <div class="bookmark-meta">
                    <small><i class="fas fa-calendar"></i> Bookmarked on ${date}</small>
                </div>
            </div>
        `;
    }).join('');
}

// ===========================
// Bookmark Actions
// ===========================

async function removeBookmark(bookmarkId) {
    if (!confirm('Are you sure you want to remove this bookmark?')) {
        return;
    }

    try {
        const response = await apiCall(`/bookmarks/${bookmarkId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Bookmark removed', 'success');
            // Remove from local array
            userBookmarks = userBookmarks.filter(b => b.id !== bookmarkId);
            displayBookmarks();
        } else {
            showToast('Failed to remove bookmark', 'error');
        }
    } catch (error) {
        console.error('Error removing bookmark:', error);
        showToast('Failed to remove bookmark', 'error');
    }
}

async function playBookmarkedVerse(chapter, verse) {
    try {
        const response = await fetch(`/api/audio/${chapter}/${verse}`);
        const data = await response.json();

        const audio = new Audio(data.audio_url);
        audio.play();

        showToast(`Playing ${chapter}:${verse}`, 'info');
    } catch (error) {
        console.error('Error playing audio:', error);
        showToast('Failed to load audio', 'error');
    }
}

function copyBookmarkedVerse(chapter, verse) {
    const bookmark = userBookmarks.find(b =>
        b.verse_data.chapter === chapter && b.verse_data.verse === verse
    );

    if (!bookmark) return;

    const verseData = bookmark.verse_data;
    const text = `${verseData.arabic}\n\n${verseData.english}\n\n- Quran ${chapter}:${verse}`;
    copyToClipboard(text, 'Verse copied to clipboard!');
}

// ===========================
// Initialize
// ===========================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for currentUser to be loaded
        setTimeout(initBookmarksPage, 500);
    });
} else {
    setTimeout(initBookmarksPage, 500);
}
