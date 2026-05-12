// ============================================
// FEED MANAGEMENT
// ============================================

async function loadFeed() {
    if (!appState.currentUser) {
        showPage('home');
        return;
    }

    try {
        showLoading();

        const filters = {
            radius_km: parseInt(document.getElementById('filterRadius')?.value) || 50,
            age_min: document.getElementById('ageMin')?.value || null,
            age_max: document.getElementById('ageMax')?.value || null,
            gender: document.getElementById('filterGender')?.value || null
        };

        console.log('[FEED] Loading with filters:', filters);

        const response = await feedAPI.getNextCandidate(appState.currentUser.id, filters);
        console.log('[FEED] Response:', response);

        const candidateCard = document.getElementById('candidateCard');
        const noMore = document.getElementById('noMoreCandidates');

        if (!response.candidate) {
            candidateCard.style.display = 'none';
            noMore.style.display = 'block';
            hideLoading();
            return;
        }

        noMore.style.display = 'none';
        candidateCard.style.display = 'flex';

        appState.currentCandidate = response.candidate;
        displayCandidate(response.candidate);
        hideLoading();

    } catch (error) {
        hideLoading();
        console.error('[FEED] Error:', error);
        showToast(`❌ Feed error: ${error.message}`, 'error');
    }
}

function displayCandidate(candidate) {
    console.log('[FEED] Displaying candidate:', candidate);

    // ===== PHOTO =====
    const photoEl = document.getElementById('candidatePhoto');
    const photos = candidate.photos || [];

    if (photos.length > 0) {
        photoEl.src = photos[0];
        photoEl.style.display = 'block';
        photoEl.onerror = () => {
            console.warn('[FEED] Photo failed to load');
            photoEl.src = 'data:image/svg+xml,' + encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect fill="#e0e0e0" width="400" height="500"/><text x="50%" y="50%" font-size="20" fill="#999" text-anchor="middle" dominant-baseline="middle">Photo unavailable</text></svg>'
            );
        };
        document.getElementById('photoCounter').textContent = `1 / ${photos.length}`;
    } else {
        photoEl.src = 'data:image/svg+xml,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect fill="#e0e0e0" width="400" height="500"/><text x="50%" y="50%" font-size="20" fill="#999" text-anchor="middle" dominant-baseline="middle">No photos</text></svg>'
        );
        photoEl.style.display = 'block';
        document.getElementById('photoCounter').textContent = '0 / 0';
    }

    // ===== NAME, AGE =====
    const firstName = candidate.first_name || 'Unknown';
    const lastName = candidate.last_name || '';
    const age = candidate.age || '?';
    document.getElementById('candidateName').textContent = `${firstName} ${lastName}, ${age}`.trim();

    // ===== AGE LINE =====
    document.getElementById('candidateAge').textContent = `${age} years old`;

    // ===== LOCATION =====
    document.getElementById('candidateLocation').textContent =
        `📍 ${candidate.city || '?'}, ${candidate.country || '?'}`;

    // ===== BIO =====
    document.getElementById('candidateBio').textContent = candidate.bio || '';

    // ===== TAGS =====
    const tagsContainer = document.getElementById('candidateTags');
    tagsContainer.innerHTML = '';
    const tags = candidate.tags || [];
    if (tags.length > 0) {
        tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'tag';
            tagEl.textContent = tag;
            tagsContainer.appendChild(tagEl);
        });
    }

    // ===== COMPATIBILITY =====
    const compat = Math.round(candidate.compatibility_percentage || 0);
    document.getElementById('compatibilityPercent').textContent = `${compat}%`;
    const fill = document.getElementById('compatibilityFill');
    if (fill) fill.style.width = `${compat}%`;
}

// ============================================
// LIKE / DISLIKE
// ============================================

async function likeCandidate() {
    if (!appState.currentCandidate) {
        showToast('No candidate selected', 'error');
        return;
    }

    const candidateName = `${appState.currentCandidate.first_name} ${appState.currentCandidate.last_name || ''}`.trim();
    const candidateId = appState.currentCandidate.id;
    const userId = appState.currentUser.id;

    try {
        showLoading();
        console.log(`[LIKE] User ${userId} liking candidate ${candidateId}`);

        const requestBody = {
            candidate_id: candidateId
        };

        console.log('[LIKE] Request body:', requestBody);

        const url = `${API_BASE_URL}/swipe/like?user_id=${userId}`;
        console.log('[LIKE] URL:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('[LIKE] Response status:', response.status);

        const responseText = await response.text();
        console.log('[LIKE] Response body:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('[LIKE] Failed to parse response:', e);
            throw new Error(`Server returned invalid JSON: ${responseText}`);
        }

        if (!response.ok) {
            throw new Error(data.detail || `HTTP ${response.status}`);
        }

        hideLoading();

        if (data.is_match) {
            showToast(`🎉 It's a match with ${candidateName}!`, 'success');
        } else {
            showToast(`❤️ Liked ${candidateName}!`, 'success');
        }

        console.log('[LIKE] Success:', data);

        // Load next candidate
        setTimeout(() => loadFeed(), 500);

    } catch (error) {
        hideLoading();
        console.error('[LIKE] Error:', error);
        showToast(`❌ ${error.message}`, 'error');
    }
}

async function dislikeCandidate() {
    if (!appState.currentCandidate) {
        showToast('No candidate selected', 'error');
        return;
    }

    const candidateName = `${appState.currentCandidate.first_name} ${appState.currentCandidate.last_name || ''}`.trim();
    const candidateId = appState.currentCandidate.id;
    const userId = appState.currentUser.id;

    try {
        showLoading();
        console.log(`[DISLIKE] User ${userId} disliking candidate ${candidateId}`);

        const requestBody = {
            candidate_id: candidateId
        };

        console.log('[DISLIKE] Request body:', requestBody);

        const url = `${API_BASE_URL}/swipe/dislike?user_id=${userId}`;
        console.log('[DISLIKE] URL:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('[DISLIKE] Response status:', response.status);

        const responseText = await response.text();
        console.log('[DISLIKE] Response body:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('[DISLIKE] Failed to parse response:', e);
            throw new Error(`Server returned invalid JSON: ${responseText}`);
        }

        if (!response.ok) {
            throw new Error(data.detail || `HTTP ${response.status}`);
        }

        hideLoading();
        showToast(`Passed on ${candidateName}`, 'info');
        console.log('[DISLIKE] Success:', data);

        // Load next candidate
        setTimeout(() => loadFeed(), 500);

    } catch (error) {
        hideLoading();
        console.error('[DISLIKE] Error:', error);
        showToast(`❌ ${error.message}`, 'error');
    }
}

// ============================================
// FILTER PANEL
// ============================================

function setupFeedListeners() {
    document.getElementById('filterBtn')?.addEventListener('click', () => {
        const panel = document.getElementById('filterPanel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('applyFiltersBtn')?.addEventListener('click', () => {
        document.getElementById('filterPanel').style.display = 'none';
        loadFeed();
    });

    document.getElementById('likeBtn')?.addEventListener('click', likeCandidate);
    document.getElementById('dislikeBtn')?.addEventListener('click', dislikeCandidate);
    document.getElementById('refreshFeedBtn')?.addEventListener('click', loadFeed);

    console.log('[FEED] Listeners ready');
}

// Initialize
document.addEventListener('DOMContentLoaded', setupFeedListeners);