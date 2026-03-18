// ===========================
// Search Functionality
// ===========================

let searchResults = [];
let isSearching = false;

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

// ===========================
// Initialize Search Page
// ===========================

function initSearchPage() {
    setupSearchEventListeners();
}

// ===========================
// Perform Search
// ===========================

async function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();

    if (!query || query.length < 2) {
        showToast('Please enter at least 2 characters', 'error');
        return;
    }

    if (isSearching) return;

    isSearching = true;
    const searchLang = document.querySelector('input[name="searchLang"]:checked').value;
    const resultsContainer = document.getElementById('searchResults');

    // Show loading state
    resultsContainer.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Searching...</p>
        </div>
    `;

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&lang=${searchLang}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Search failed');
        }

        searchResults = data.results;
        displaySearchResults(query, searchResults);
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = `
            <div class="search-placeholder">
                <i class="fas fa-exclamation-circle"></i>
                <p>${escapeHtml(error.message || 'Failed to perform search. Please try again.')}</p>
            </div>
        `;
        showToast(error.message || 'Search failed', 'error');
    } finally {
        isSearching = false;
    }
}

// ===========================
// Display Search Results
// ===========================

function displaySearchResults(query, results) {
    const resultsContainer = document.getElementById('searchResults');
    const safeQuery = escapeHtml(query);

    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="search-placeholder">
                <i class="fas fa-search"></i>
                <p>No results found for "${safeQuery}"</p>
                <p>Try different keywords or check your spelling</p>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = `
        <div class="result-info">
            <strong>${results.length}</strong> result${results.length !== 1 ? 's' : ''} found for "${safeQuery}"
        </div>
        ${results.map(verse => `
            <div class="verse-card">
                <div class="verse-header">
                    <span class="verse-number">${verse.chapter}:${verse.verse}</span>
                    <div class="verse-actions">
                        <button class="btn-icon" onclick="playVerseAudioFromSearch(${verse.chapter}, ${verse.verse})" title="Play audio">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn-icon" onclick="bookmarkVerseFromSearch(${verse.chapter}, ${verse.verse})" title="Bookmark">
                            <i class="fas fa-bookmark"></i>
                        </button>
                        <button class="btn-icon" onclick="copyVerseFromSearch(${verse.chapter}, ${verse.verse})" title="Copy">
                            <i class="fas fa-copy"></i>
                        </button>
                        <a href="/read?surah=${verse.chapter}&verse=${verse.verse}" class="btn-icon" title="Go to verse">
                            <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
                <div class="verse-content">
                    <p class="arabic-content">${highlightText(verse.arabic, query)}</p>
                    <p class="verse-translation">${highlightText(verse.english, query)}</p>
                </div>
            </div>
        `).join('')}
    `;
}

// ===========================
// Highlight Search Terms
// ===========================

function highlightText(text, query) {
    const safeText = escapeHtml(text);
    if (!query || query.length < 2) return safeText;

    // Escape special regex characters
    const safeQuery = escapeHtml(query);
    const escapedQuery = safeQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Create case-insensitive regex
    const regex = new RegExp(`(${escapedQuery})`, 'gi');

    // Wrap matches in highlight span
    return safeText.replace(regex, '<mark style="background-color: var(--accent-color); padding: 2px 4px; border-radius: 3px;">$1</mark>');
}

// ===========================
// Verse Actions from Search
// ===========================

async function playVerseAudioFromSearch(chapter, verse) {
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

async function bookmarkVerseFromSearch(chapter, verse) {
    if (!currentUser) {
        showToast('Please log in to bookmark verses', 'info');
        openModal('loginModal');
        return;
    }

    try {
        const response = await apiCall('/bookmarks', {
            method: 'POST',
            body: JSON.stringify({ chapter, verse })
        });

        if (response.ok) {
            showToast('Verse bookmarked!', 'success');
        } else {
            const data = await response.json();
            showToast(data.error || 'Failed to bookmark verse', 'error');
        }
    } catch (error) {
        console.error('Error bookmarking verse:', error);
    }
}

function copyVerseFromSearch(chapter, verse) {
    const verseData = searchResults.find(v => v.chapter === chapter && v.verse === verse);

    if (!verseData) return;

    const text = `${verseData.arabic}\n\n${verseData.english}\n\n- Quran ${chapter}:${verse}`;
    copyToClipboard(text, 'Verse copied to clipboard!');
}

// ===========================
// Event Listeners
// ===========================

function setupSearchEventListeners() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }

    if (searchInput) {
        // Search on Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // Clear placeholder when typing
        searchInput.addEventListener('input', () => {
            if (searchInput.value.trim() === '') {
                const resultsContainer = document.getElementById('searchResults');
                resultsContainer.innerHTML = `
                    <div class="search-placeholder">
                        <i class="fas fa-search"></i>
                        <p>Enter a search term to find verses</p>
                        <div class="search-examples">
                            <p>Try searching for:</p>
                            <button class="example-query" data-query="mercy">mercy</button>
                            <button class="example-query" data-query="paradise">paradise</button>
                            <button class="example-query" data-query="prayer">prayer</button>
                            <button class="example-query" data-query="الله">الله</button>
                        </div>
                    </div>
                `;
                setupExampleQueries();
            }
        });
    }

    // Example queries
    setupExampleQueries();
}

function setupExampleQueries() {
    document.querySelectorAll('.example-query').forEach(btn => {
        btn.addEventListener('click', () => {
            const query = btn.getAttribute('data-query');
            document.getElementById('searchInput').value = query;
            performSearch();
        });
    });
}

// ===========================
// Initialize
// ===========================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchPage);
} else {
    initSearchPage();
}
