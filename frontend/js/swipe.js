// ============================================
// LIKES PAGE
// ============================================

async function loadLikesPage() {
    if (!appState.currentUser) {
        showPage('home');
        return;
    }

    try {
        showLoading();
        const response = await feedAPI.whoLikedMe(appState.currentUser.id);

        console.log('[LIKES] Response:', response);

        const likesList = document.getElementById('likesList');
        const noLikes = document.getElementById('noLikes');

        if (!response.users || response.users.length === 0) {
            likesList.innerHTML = '';
            noLikes.style.display = 'block';
            hideLoading();
            return;
        }

        noLikes.style.display = 'none';
        likesList.innerHTML = '';

        response.users.forEach(user => {
            const card = createCandidateCard(user);
            likesList.appendChild(card);
        });

        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('[LIKES] Error:', error);
        showToast(`❌ Error loading likes: ${error.message}`, 'error');
    }
}

function createCandidateCard(user) {
    const card = document.createElement('div');
    card.className = 'candidate-item';

    // Get first photo or placeholder
    let photoUrl = 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect fill="#f0f0f0" width="220" height="220"/><text x="50%" y="50%" font-size="16" fill="#999" text-anchor="middle" dominant-baseline="middle">No Photo</text></svg>'
    );

    if (user.photos && user.photos.length > 0) {
        photoUrl = user.photos[0];
        console.log('[LIKES] Photo URL:', photoUrl);
    }

    const age = user.age || 'N/A';
    const firstName = user.first_name || 'User';
    const lastName = user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();

    card.innerHTML = `
        <div class="candidate-item-photo">
            <img
                src="${photoUrl}"
                alt="${fullName}"
                onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22220%22 height=%22220%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22220%22 height=%22220%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2216%22 fill=%22%23999%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ENo Photo%3C/text%3E%3C/svg%3E'"
            >
        </div>
        <div class="candidate-item-info">
            <div class="candidate-item-name">${fullName}</div>
            <div class="candidate-item-age">${age} years old</div>
            <button class="btn btn-primary btn-sm">View Profile</button>
        </div>
    `;

    // Add click listener
    const viewBtn = card.querySelector('button');
    viewBtn.addEventListener('click', () => {
        showUserModal(user);
    });

    return card;
}

async function loadMatchesPage() {
    if (!appState.currentUser) {
        showPage('home');
        return;
    }

    try {
        showLoading();
        const response = await matchesAPI.getMatches(appState.currentUser.id);

        console.log('[MATCHES] Response:', response);

        const matchesList = document.getElementById('matchesList');
        const noMatches = document.getElementById('noMatches');

        if (!response.matches || response.matches.length === 0) {
            matchesList.innerHTML = '';
            noMatches.style.display = 'block';
            hideLoading();
            return;
        }

        noMatches.style.display = 'none';
        matchesList.innerHTML = '';

        response.matches.forEach(user => {
            const card = createMatchCard(user);
            matchesList.appendChild(card);
        });

        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('[MATCHES] Error:', error);
        showToast(`❌ Error loading matches: ${error.message}`, 'error');
    }
}

function createMatchCard(user) {
    const card = document.createElement('div');
    card.className = 'candidate-item';

    // Get first photo or placeholder
    let photoUrl = 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect fill="#f0f0f0" width="220" height="220"/><text x="50%" y="50%" font-size="16" fill="#999" text-anchor="middle" dominant-baseline="middle">No Photo</text></svg>'
    );

    if (user.photos && user.photos.length > 0) {
        photoUrl = user.photos[0];
    }

    const age = user.age || 'N/A';
    const firstName = user.first_name || 'User';
    const lastName = user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();

    card.innerHTML = `
        <div class="candidate-item-photo">
            <div style="position: absolute; top: 10px; left: 10px; background: var(--success-color); color: white; padding: 5px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; z-index: 5;">
                ♥ Match
            </div>
            <img
                src="${photoUrl}"
                alt="${fullName}"
                onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22220%22 height=%22220%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22220%22 height=%22220%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2216%22 fill=%22%23999%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ENo Photo%3C/text%3E%3C/svg%3E'"
            >
        </div>
        <div class="candidate-item-info">
            <div class="candidate-item-name">${fullName}</div>
            <div class="candidate-item-age">${age} years old</div>
            <button class="btn btn-success btn-sm">Message</button>
        </div>
    `;

    return card;
}

function showUserModal(user) {
    const modal = document.createElement('div');
    modal.className = 'user-modal';

    const photos = user.photos || [];
    const photosHTML = photos.length > 0
        ? photos.map(photo => `<img src="${photo}" alt="${user.first_name}" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 10px;">`).join('')
        : '<p style="color: #999;">No photos</p>';

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${user.first_name} ${user.last_name || ''}, ${user.age || '?'}</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                ${photosHTML}
                <p><strong>Location:</strong> ${user.city || '?'}, ${user.country || '?'}</p>
                <p><strong>Bio:</strong> ${user.bio || 'No bio'}</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary">Close</button>
            </div>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        .user-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 999;
        }
        .modal-content {
            background: white;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #eee;
        }
        .modal-header h2 {
            margin: 0;
            color: var(--primary-color);
        }
        .modal-close {
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #999;
        }
        .modal-body {
            padding: 20px;
        }
        .modal-footer {
            padding: 20px;
            border-top: 1px solid #eee;
        }
        .modal-footer button {
            width: 100%;
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.modal-close');
    const footerBtn = modal.querySelector('.modal-footer button');

    const closeModal = () => {
        modal.remove();
        style.remove();
    };

    closeBtn.addEventListener('click', closeModal);
    footerBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupSwipePageListeners();
});

function setupSwipePageListeners() {
    console.log('[SWIPE] Setup listeners');
}