// ============================================
// APP STATE
// ============================================

const appState = {
    currentUser: null,
    currentPage: 'home',
    testQuestions: [],
    testAnswers: {},
    currentQuestionIndex: 0,
    currentCandidate: null,
    allCandidates: [],
    feedLoaded: false,
};

// ============================================
// PAGE NAVIGATION
// ============================================

function showPage(pageId) {
    console.log('[NAV] Switching to page:', pageId);

    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const page = document.getElementById(`${pageId}-page`);
    if (page) {
        page.classList.add('active');
        appState.currentPage = pageId;
    }

    // Update navbar highlight
    updateNavbar();

    // Load page-specific data
    switch (pageId) {
        case 'profile':
            loadProfile();
            break;
        case 'feed':
            loadFeed();
            break;
        case 'likes':
            loadLikesPage();
            break;
        case 'matches':
            loadMatchesPage();
            break;
        case 'test':
            if (appState.testQuestions.length === 0) {
                initializeTest();
            }
            break;
    }
}

function updateNavbar() {
    document.querySelectorAll('.navbar-menu a').forEach(link => {
        if (link.dataset.page === appState.currentPage) {
            link.style.color = 'var(--primary-color)';
            link.style.fontWeight = 'bold';
        } else {
            link.style.color = '';
            link.style.fontWeight = '';
        }
    });
}

// ============================================
// LOADING SPINNER
// ============================================

function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info') {
    const toast = document.getElementById('toastNotification');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// ============================================
// LOCAL STORAGE
// ============================================

function saveCurrentUser(user) {
    console.log('[AUTH] Saving user:', user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    appState.currentUser = user;
}

function loadCurrentUser() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
        try {
            appState.currentUser = JSON.parse(stored);
            console.log('[AUTH] Loaded user from storage:', appState.currentUser);
            return appState.currentUser;
        } catch (e) {
            console.error('[AUTH] Failed to parse stored user');
            localStorage.removeItem('currentUser');
        }
    }
    return null;
}

function clearCurrentUser() {
    localStorage.removeItem('currentUser');
    appState.currentUser = null;
    appState.feedLoaded = false;
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Navigation links
    document.querySelectorAll('.navbar-menu a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;

            if (page === 'logout') {
                logout();
                return;
            }

            if (!appState.currentUser && page !== 'home') {
                showToast('Please login first', 'error');
                showPage('home');
                return;
            }

            showPage(page);
        });
    });

    // Home page buttons
    document.getElementById('loginBtn')?.addEventListener('click', () => {
        const telegramId = prompt('Enter your Telegram ID:');
        if (telegramId && telegramId.trim() !== '') {
            login(parseInt(telegramId));
        }
    });

    document.getElementById('registerBtn')?.addEventListener('click', () => {
        showPage('auth');
    });
}

// ============================================
// LOGIN / LOGOUT
// ============================================

async function login(telegramId) {
    try {
        showLoading();
        const result = await authAPI.login(telegramId);

        if (result.success) {
            saveCurrentUser(result.user);
            hideLoading();
            showToast('✅ Logged in!', 'success');
            showPage('feed');
        }
    } catch (error) {
        hideLoading();
        showToast(`❌ ${error.message}`, 'error');
    }
}

function logout() {
    clearCurrentUser();
    showPage('home');
    showToast('Logged out', 'info');
}

// ============================================
// INITIALIZATION
// ============================================

//document.addEventListener('DOMContentLoaded', () => {
//    console.log('[APP] Initializing...');
//
//    const user = loadCurrentUser();
//    if (user) {
//        console.log('[APP] User found, showing feed');
//        showPage('feed');
//    } else {
//        console.log('[APP] No user found, showing home');
//        showPage('home');
//    }
//
//    setupEventListeners();
//    console.log('[APP] Ready!');
//});

document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();

    // First try Telegram auto-login
    const loggedIn = await initTelegramAuth();
    if (loggedIn) return; // already redirected to feed

    // Fallback to localStorage / home page
    const user = loadCurrentUser();
    if (user) {
        showPage("feed");
    } else {
        showPage("home");
    }
});