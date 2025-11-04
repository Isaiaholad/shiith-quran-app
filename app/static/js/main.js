// ===========================
// Global State & Configuration
// ===========================

const API_BASE = '/api';
let currentUser = null;
let fontSize = parseInt(localStorage.getItem('fontSize') || '16');
let arabicFontSize = parseInt(localStorage.getItem('arabicFontSize') || '24');

// ===========================
// Theme Management
// ===========================

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// ===========================
// Font Size Management
// ===========================

function increaseFontSize() {
    fontSize = Math.min(fontSize + 2, 24);
    arabicFontSize = Math.min(arabicFontSize + 2, 36);
    applyFontSize();
}

function decreaseFontSize() {
    fontSize = Math.max(fontSize - 2, 12);
    arabicFontSize = Math.max(arabicFontSize - 2, 18);
    applyFontSize();
}

function applyFontSize() {
    document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`);
    document.documentElement.style.setProperty('--font-size-arabic', `${arabicFontSize}px`);
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('arabicFontSize', arabicFontSize);
}

// ===========================
// Authentication
// ===========================

async function checkAuthStatus() {
    try {
        const response = await fetch('/auth/me', {
            credentials: 'include'
        });

        if (response.ok) {
            currentUser = await response.json();
            updateUIForLoggedInUser();
        } else {
            currentUser = null;
            updateUIForLoggedOutUser();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        currentUser = null;
        updateUIForLoggedOutUser();
    }
}

function updateUIForLoggedInUser() {
    const loggedInDiv = document.getElementById('userLoggedIn');
    const loggedOutDiv = document.getElementById('userLoggedOut');
    const usernameDisplay = document.getElementById('usernameDisplay');

    if (loggedInDiv) loggedInDiv.style.display = 'block';
    if (loggedOutDiv) loggedOutDiv.style.display = 'none';
    if (usernameDisplay) usernameDisplay.textContent = currentUser.username;
}

function updateUIForLoggedOutUser() {
    const loggedInDiv = document.getElementById('userLoggedIn');
    const loggedOutDiv = document.getElementById('userLoggedOut');

    if (loggedInDiv) loggedInDiv.style.display = 'none';
    if (loggedOutDiv) loggedOutDiv.style.display = 'block';
}

async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('loginRemember').checked;

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password, remember })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Login successful!', 'success');
            closeModal('loginModal');
            currentUser = data.user;
            updateUIForLoggedInUser();
            document.getElementById('loginForm').reset();
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('An error occurred during login', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Registration successful! Please log in.', 'success');
            closeModal('registerModal');
            document.getElementById('registerForm').reset();
            openModal('loginModal');
        } else {
            showToast(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('An error occurred during registration', 'error');
    }
}

async function handleLogout() {
    try {
        const response = await fetch('/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            showToast('Logged out successfully', 'success');
            currentUser = null;
            updateUIForLoggedOutUser();
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Logout error:', error);
        showToast('An error occurred during logout', 'error');
    }
}

// ===========================
// Modal Management
// ===========================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// ===========================
// Toast Notifications
// ===========================

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    const toastIcon = toast.querySelector('.toast-icon');

    toastMessage.textContent = message;

    // Set icon based on type
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };

    toastIcon.className = `toast-icon ${icons[type] || icons.info}`;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===========================
// Copy to Clipboard
// ===========================

async function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
    try {
        await navigator.clipboard.writeText(text);
        showToast(successMessage, 'success');
    } catch (error) {
        console.error('Failed to copy:', error);
        showToast('Failed to copy to clipboard', 'error');
    }
}

// ===========================
// API Helper Functions
// ===========================

async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...defaultOptions,
        ...options
    });

    if (!response.ok && response.status === 401) {
        // Unauthorized - user needs to log in
        showToast('Please log in to continue', 'info');
        openModal('loginModal');
        throw new Error('Unauthorized');
    }

    return response;
}

// ===========================
// Event Listeners Setup
// ===========================

function setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Font size controls
    const fontIncrease = document.getElementById('fontIncrease');
    const fontDecrease = document.getElementById('fontDecrease');

    if (fontIncrease) fontIncrease.addEventListener('click', increaseFontSize);
    if (fontDecrease) fontDecrease.addEventListener('click', decreaseFontSize);

    // User menu
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            userDropdown.classList.remove('active');
        });
    }

    // Auth buttons
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginBtn) loginBtn.addEventListener('click', () => openModal('loginModal'));
    if (registerBtn) registerBtn.addEventListener('click', () => openModal('registerModal'));
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // Modal switches
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');

    if (switchToRegister) {
        switchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('loginModal');
            openModal('registerModal');
        });
    }

    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('registerModal');
            openModal('loginModal');
        });
    }

    // Form submissions
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    // Modal close buttons
    document.querySelectorAll('.btn-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-close');
            closeModal(modalId);
        });
    });

    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');

    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

// ===========================
// Initialization
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    applyFontSize();
    setupEventListeners();
    checkAuthStatus();
});
