// ===========================
// Reading Interface State
// ===========================

let currentSurah = 1;
let currentVerse = 1;
let allSurahs = [];
let currentSurahVerses = [];
let displayedVerses = [];
let versesPerPage = 10;
let currentPage = 1;
let audioPlayer = null;
let isPlaying = false;
let currentPlayingVerse = null;

// ===========================
// Initialization
// ===========================

async function initReadingInterface() {
    audioPlayer = document.getElementById('audioPlayer');

    // Get surah from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const surahParam = urlParams.get('surah');
    const verseParam = urlParams.get('verse');

    if (surahParam) {
        currentSurah = parseInt(surahParam);
    }

    if (verseParam) {
        currentVerse = parseInt(verseParam);
    }

    await loadSurahs();
    setupReadingEventListeners();
    await loadSurah(currentSurah);

    // Scroll to specific verse if provided
    if (verseParam) {
        setTimeout(() => scrollToVerse(currentVerse), 500);
    }
}

// ===========================
// Load Surahs List
// ===========================

async function loadSurahs() {
    try {
        const response = await fetch('/api/surahs');
        const data = await response.json();

        allSurahs = data.surahs;
        populateSurahSelector();
    } catch (error) {
        console.error('Error loading surahs:', error);
        showToast('Failed to load surah list', 'error');
    }
}

function populateSurahSelector() {
    const select = document.getElementById('surahSelect');

    if (!select) return;

    select.innerHTML = allSurahs.map(surah => `
        <option value="${surah.number}" ${surah.number === currentSurah ? 'selected' : ''}>
            ${surah.number}. ${surah.name} (${surah.name_arabic}) - ${surah.verses} verses
        </option>
    `).join('');
}

// ===========================
// Load Surah Content
// ===========================

async function loadSurah(surahNumber) {
    const container = document.getElementById('versesContainer');

    if (!container) return;

    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Loading verses...</p></div>';

    try {
        const response = await fetch(`/api/surah/${surahNumber}`);
        const data = await response.json();

        currentSurah = surahNumber;
        currentSurahVerses = data.verses;
        currentPage = 1;

        displayVerses();
        updateURL();
    } catch (error) {
        console.error('Error loading surah:', error);
        container.innerHTML = '<div class="loading"><p>Failed to load verses</p></div>';
        showToast('Failed to load surah', 'error');
    }
}

// ===========================
// Display Verses
// ===========================

function displayVerses() {
    const container = document.getElementById('versesContainer');
    const translationEnabled = document.getElementById('translationToggle').checked;
    const arabicOnly = document.getElementById('arabicOnlyToggle').checked;

    if (!container) return;

    const startIndex = 0;
    const endIndex = currentPage * versesPerPage;
    displayedVerses = currentSurahVerses.slice(startIndex, endIndex);

    container.innerHTML = displayedVerses.map(verse => `
        <div class="verse-card" data-chapter="${verse.chapter}" data-verse="${verse.verse}" id="verse-${verse.verse}">
            <div class="verse-header">
                <span class="verse-number">${verse.chapter}:${verse.verse}</span>
                <div class="verse-actions">
                    <button class="btn-icon" onclick="playVerseAudio(${verse.chapter}, ${verse.verse})" title="Play audio">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn-icon" onclick="bookmarkVerse(${verse.chapter}, ${verse.verse})" title="Bookmark">
                        <i class="fas fa-bookmark"></i>
                    </button>
                    <button class="btn-icon" onclick="copyVerse(${verse.chapter}, ${verse.verse})" title="Copy">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn-icon" onclick="shareVerse(${verse.chapter}, ${verse.verse})" title="Share">
                        <i class="fas fa-share"></i>
                    </button>
                </div>
            </div>
            <div class="verse-content">
                ${!arabicOnly ? `<p class="arabic-content">${verse.arabic}</p>` : ''}
                ${translationEnabled && !arabicOnly ? `<p class="verse-translation">${verse.english}</p>` : ''}
                ${arabicOnly ? `<p class="arabic-content" style="font-size: 32px;">${verse.arabic}</p>` : ''}
            </div>
        </div>
    `).join('');

    // Update pagination
    updatePagination();
}

function updatePagination() {
    const pagination = document.getElementById('pagination');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    if (!pagination || !loadMoreBtn) return;

    if (displayedVerses.length < currentSurahVerses.length) {
        pagination.style.display = 'block';
    } else {
        pagination.style.display = 'none';
    }
}

function loadMoreVerses() {
    currentPage++;
    displayVerses();
}

// ===========================
// Navigation
// ===========================

function goToPreviousVerse() {
    if (currentVerse > 1) {
        currentVerse--;
        scrollToVerse(currentVerse);
    } else if (currentSurah > 1) {
        // Go to previous surah's last verse
        loadSurah(currentSurah - 1).then(() => {
            currentVerse = currentSurahVerses.length;
            scrollToVerse(currentVerse);
        });
    }
}

function goToNextVerse() {
    if (currentVerse < currentSurahVerses.length) {
        currentVerse++;
        scrollToVerse(currentVerse);
    } else if (currentSurah < 114) {
        // Go to next surah's first verse
        loadSurah(currentSurah + 1).then(() => {
            currentVerse = 1;
            scrollToVerse(currentVerse);
        });
    }
}

function jumpToVerse() {
    const verseInput = document.getElementById('verseNumber');
    const verseNum = parseInt(verseInput.value);

    if (verseNum && verseNum > 0 && verseNum <= currentSurahVerses.length) {
        currentVerse = verseNum;
        scrollToVerse(verseNum);
    } else {
        showToast('Invalid verse number', 'error');
    }
}

function scrollToVerse(verseNum) {
    const verseElement = document.getElementById(`verse-${verseNum}`);

    if (verseElement) {
        verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        verseElement.style.backgroundColor = 'var(--secondary-color)';
        setTimeout(() => {
            verseElement.style.backgroundColor = '';
        }, 2000);
    } else {
        // Verse not loaded yet, load more pages
        while (displayedVerses.length < verseNum && displayedVerses.length < currentSurahVerses.length) {
            currentPage++;
        }
        displayVerses();
        setTimeout(() => scrollToVerse(verseNum), 100);
    }
}

function updateURL() {
    const url = new URL(window.location);
    url.searchParams.set('surah', currentSurah);
    window.history.pushState({}, '', url);
}

// ===========================
// Audio Playback
// ===========================

async function playVerseAudio(chapter, verse) {
    if (!audioPlayer) return;

    try {
        const response = await fetch(`/api/audio/${chapter}/${verse}`);
        const data = await response.json();

        audioPlayer.src = data.audio_url;
        audioPlayer.play();

        currentPlayingVerse = `${chapter}:${verse}`;
        highlightPlayingVerse(chapter, verse);

        showToast(`Playing ${chapter}:${verse}`, 'info');
    } catch (error) {
        console.error('Error playing audio:', error);
        showToast('Failed to load audio', 'error');
    }
}

function highlightPlayingVerse(chapter, verse) {
    // Remove previous highlight
    document.querySelectorAll('.verse-card').forEach(card => {
        card.classList.remove('playing');
    });

    // Add highlight to current verse
    const verseCard = document.querySelector(`.verse-card[data-chapter="${chapter}"][data-verse="${verse}"]`);
    if (verseCard) {
        verseCard.classList.add('playing');
    }
}

async function playWholeSurah() {
    if (isPlaying) {
        stopAudio();
        return;
    }

    isPlaying = true;
    document.getElementById('playAllBtn').style.display = 'none';
    document.getElementById('stopAudioBtn').style.display = 'block';

    for (let i = 0; i < currentSurahVerses.length; i++) {
        if (!isPlaying) break;

        const verse = currentSurahVerses[i];
        await playVerseAudio(verse.chapter, verse.verse);

        // Wait for audio to finish
        await new Promise(resolve => {
            audioPlayer.onended = resolve;
        });
    }

    isPlaying = false;
    document.getElementById('playAllBtn').style.display = 'block';
    document.getElementById('stopAudioBtn').style.display = 'none';
}

function stopAudio() {
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    }

    isPlaying = false;
    document.getElementById('playAllBtn').style.display = 'block';
    document.getElementById('stopAudioBtn').style.display = 'none';

    // Remove highlights
    document.querySelectorAll('.verse-card').forEach(card => {
        card.classList.remove('playing');
    });
}

// ===========================
// Verse Actions
// ===========================

async function bookmarkVerse(chapter, verse) {
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

function copyVerse(chapter, verse) {
    const verseData = currentSurahVerses.find(v => v.chapter === chapter && v.verse === verse);

    if (!verseData) return;

    const text = `${verseData.arabic}\n\n${verseData.english}\n\n- Quran ${chapter}:${verse}`;
    copyToClipboard(text, 'Verse copied to clipboard!');
}

function shareVerse(chapter, verse) {
    const url = `${window.location.origin}/read?surah=${chapter}&verse=${verse}`;

    if (navigator.share) {
        navigator.share({
            title: `Quran ${chapter}:${verse}`,
            text: `Read Quran ${chapter}:${verse}`,
            url: url
        }).catch(error => console.log('Error sharing:', error));
    } else {
        copyToClipboard(url, 'Link copied to clipboard!');
    }
}

// ===========================
// Event Listeners
// ===========================

function setupReadingEventListeners() {
    // Surah selector
    const surahSelect = document.getElementById('surahSelect');
    if (surahSelect) {
        surahSelect.addEventListener('change', (e) => {
            loadSurah(parseInt(e.target.value));
        });
    }

    // Navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const jumpBtn = document.getElementById('jumpBtn');

    if (prevBtn) prevBtn.addEventListener('click', goToPreviousVerse);
    if (nextBtn) nextBtn.addEventListener('click', goToNextVerse);
    if (jumpBtn) jumpBtn.addEventListener('click', jumpToVerse);

    // Verse input - jump on Enter
    const verseInput = document.getElementById('verseNumber');
    if (verseInput) {
        verseInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') jumpToVerse();
        });
    }

    // Audio controls
    const playAllBtn = document.getElementById('playAllBtn');
    const stopAudioBtn = document.getElementById('stopAudioBtn');

    if (playAllBtn) playAllBtn.addEventListener('click', playWholeSurah);
    if (stopAudioBtn) stopAudioBtn.addEventListener('click', stopAudio);

    // Display toggles
    const translationToggle = document.getElementById('translationToggle');
    const arabicOnlyToggle = document.getElementById('arabicOnlyToggle');

    if (translationToggle) {
        translationToggle.addEventListener('change', displayVerses);
    }

    if (arabicOnlyToggle) {
        arabicOnlyToggle.addEventListener('change', displayVerses);
    }

    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreVerses);
    }
}

// ===========================
// Initialize on Page Load
// ===========================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReadingInterface);
} else {
    initReadingInterface();
}
