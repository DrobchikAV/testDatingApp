// ============================================
// PROFILE MANAGEMENT
// ============================================

async function loadProfile() {
    if (!appState.currentUser) {
        showPage('home');
        return;
    }

    const userId = appState.currentUser.id;
    console.log('[PROFILE] Loading profile for user:', userId);

    try {
        showLoading();

        // Fetch profile from API
        let profile;
        try {
            profile = await profileAPI.getProfile(userId);
            console.log('[PROFILE] Raw API response:', profile);
        } catch (error) {
            console.error('[PROFILE] API error:', error);
            hideLoading();
            showToast(`❌ Could not load profile: ${error.message}`, 'error');
            return;
        }

        // Handle different response formats
        // API might return {success: true, ...data} or just the data directly
        if (profile.success === false) {
            hideLoading();
            showToast('Profile not found', 'error');
            return;
        }

        // Fill in profile info
        document.getElementById('profileUsername').textContent = profile.username || 'N/A';
        document.getElementById('profileName').textContent =
            `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'N/A';
        document.getElementById('profileAge').textContent = profile.age || 'N/A';
        document.getElementById('profileGender').textContent = profile.gender || 'N/A';
        document.getElementById('profileLocation').textContent =
            `${profile.city || '?'}, ${profile.country || '?'}`;
        document.getElementById('profileBio').textContent = profile.bio || 'No bio yet';

        console.log('[PROFILE] Basic info displayed');

        // Display tags
        const tagsContainer = document.getElementById('profileTags');
        tagsContainer.innerHTML = '';
        const tags = profile.tags || [];
        if (tags.length > 0) {
            tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'tag';
                tagEl.textContent = tag;
                tagsContainer.appendChild(tagEl);
            });
        } else {
            tagsContainer.innerHTML = '<p style="color: #999;">No tags selected</p>';
        }

        // Display photos
        const photosContainer = document.getElementById('profilePhotos');
        photosContainer.innerHTML = '';
        const photos = profile.photos || [];
        if (photos.length > 0) {
            photos.forEach(photoUrl => {
                const photoEl = document.createElement('div');
                photoEl.className = 'photo-item';
                photoEl.innerHTML = `<img src="${photoUrl}" alt="Photo" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22150%22 height=%22150%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2214%22 fill=%22%23999%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ENo Photo%3C/text%3E%3C/svg%3E'">`;
                photosContainer.appendChild(photoEl);
            });
        } else {
            photosContainer.innerHTML = '<p style="color: #999;">No photos uploaded</p>';
        }

        // Display test results
        const testResults = profile.test_results;
        displayTestResults(testResults);

        hideLoading();
        console.log('[PROFILE] Profile loaded successfully');

    } catch (error) {
        hideLoading();
        console.error('[PROFILE] Error:', error);
        showToast(`❌ Error loading profile: ${error.message}`, 'error');
    }
}

function displayTestResults(testResults) {
    const resultsContainer = document.getElementById('testResults');
    resultsContainer.innerHTML = '';

    if (!testResults) {
        resultsContainer.innerHTML = '<p style="color: #999;">Complete the personality test to see your results!</p>';
        return;
    }

    const dimensions = {
        'openness': '🎨 Openness',
        'conscientiousness': '⚙️ Conscientiousness',
        'extraversion': '🎭 Extraversion',
        'agreeableness': '🤝 Agreeableness',
        'neuroticism': '😰 Neuroticism'
    };

    Object.entries(dimensions).forEach(([key, label]) => {
        const score = testResults[key] || 0;
        const card = document.createElement('div');
        card.className = 'test-result-card';
        card.innerHTML = `
            <h4>${label}</h4>
            <div class="test-result-score">${score}/10</div>
        `;
        resultsContainer.appendChild(card);
    });
}

// ============================================
// PROFILE EDIT
// ============================================

function setupProfileListeners() {
    document.getElementById('editProfileBtn')?.addEventListener('click', async () => {
        document.getElementById('profileView').style.display = 'none';
        document.getElementById('profileEdit').style.display = 'block';

        // Load available tags for selection
        await loadAvailableTags();
    });

    document.getElementById('cancelEditBtn')?.addEventListener('click', () => {
        document.getElementById('profileView').style.display = 'block';
        document.getElementById('profileEdit').style.display = 'none';
    });

    document.getElementById('profileEditForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProfileChanges();
    });

    document.getElementById('photoUpload')?.addEventListener('change', async (e) => {
        const files = e.target.files;
        for (let i = 0; i < files.length; i++) {
            await uploadPhoto(files[i]);
        }
        e.target.value = '';
    });

    document.getElementById('retakeTestBtn')?.addEventListener('click', async () => {
        appState.testQuestions = [];
        appState.testAnswers = {};
        appState.currentQuestionIndex = 0;
        showPage('test');
        await initializeTest();  // Explicitly load questions
    });
}

async function loadAvailableTags() {
    try {
        // Fetch all available tags from database
        const response = await apiCall('GET', '/profile/tags/all');
        const tagsList = document.getElementById('tagsList');
        tagsList.innerHTML = '';

        // If endpoint doesn't exist, use hardcoded tags
        const tags = response.tags || [
            'travel', 'music', 'sports', 'reading', 'gaming',
            'cooking', 'photography', 'art', 'fitness', 'movies',
            'nature', 'technology', 'fashion', 'dancing', 'meditation'
        ];

        tags.forEach(tag => {
            const div = document.createElement('div');
            div.className = 'tag-checkbox';
            div.innerHTML = `
                <input type="checkbox" id="tag-${tag}" value="${tag}">
                <label for="tag-${tag}">${tag}</label>
            `;
            tagsList.appendChild(div);
        });
    } catch (error) {
        console.log('[PROFILE] Using default tags list');
        const tagsList = document.getElementById('tagsList');
        tagsList.innerHTML = '';
        const defaultTags = [
            'travel', 'music', 'sports', 'reading', 'gaming',
            'cooking', 'photography', 'art', 'fitness', 'movies',
            'nature', 'technology', 'fashion', 'dancing', 'meditation'
        ];

        defaultTags.forEach(tag => {
            const div = document.createElement('div');
            div.className = 'tag-checkbox';
            div.innerHTML = `
                <input type="checkbox" id="tag-${tag}" value="${tag}">
                <label for="tag-${tag}">${tag}</label>
            `;
            tagsList.appendChild(div);
        });
    }
}

async function uploadPhoto(file) {
    try {
        showLoading();
        const result = await profileAPI.uploadPhoto(appState.currentUser.id, file);
        hideLoading();

        if (result.success) {
            showToast('✅ Photo uploaded!', 'success');
        } else {
            showToast(`❌ Photo rejected: ${result.reason}`, 'error');
        }

        loadProfile();
    } catch (error) {
        hideLoading();
        showToast(`❌ Upload failed: ${error.message}`, 'error');
    }
}

async function saveProfileChanges() {
    try {
        showLoading();

        // Save bio
        const bio = document.getElementById('editBio').value;
        if (bio) {
            await profileAPI.updateProfile(appState.currentUser.id, { bio });
        }

        // Save selected tags
        const selectedTags = Array.from(document.querySelectorAll('#tagsList input:checked'))
            .map(input => input.value);

        if (selectedTags.length > 5) {
            hideLoading();
            showToast('❌ Maximum 5 tags allowed!', 'error');
            return;
        }

        if (selectedTags.length > 0) {
            await profileAPI.updateTags(appState.currentUser.id, selectedTags);
        }

        hideLoading();
        showToast('✅ Profile updated!', 'success');

        document.getElementById('profileView').style.display = 'block';
        document.getElementById('profileEdit').style.display = 'none';

        loadProfile();
    } catch (error) {
        hideLoading();
        showToast(`❌ Error: ${error.message}`, 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', setupProfileListeners);