// ============================================
// MULTI-STEP REGISTRATION (NO BACK BUTTONS)
// ============================================

let isLoginMode = false;
let currentStep = 1;
let selectedTags = [];
let uploadedPhotoUrls = [];

function setupAuthListeners() {
    // Login/Register toggle
    const toggleBtn = document.getElementById('toggleAuthMode');
    toggleBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });

    // Basic info form submission
    const basicForm = document.getElementById('basicInfoForm');
    basicForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await registerBasicInfo();
    });

    // Next buttons (no back buttons)
    document.getElementById('step2Next')?.addEventListener('click', () => saveTagsAndGoToStep3());
    document.getElementById('step3Next')?.addEventListener('click', () => goToStep(4));
    document.getElementById('step4Finish')?.addEventListener('click', finishRegistrationAndGoToTest);

    // Location button
    document.getElementById('useCurrentLocation')?.addEventListener('click', useCurrentLocation);
}

async function registerBasicInfo() {
    const userData = {
        telegram_id: parseInt(document.getElementById('telegramId').value),
        username: document.getElementById('username').value,
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        date_of_birth: document.getElementById('dateOfBirth').value,
        gender: document.getElementById('gender').value,
        country: document.getElementById('country').value,
        city: document.getElementById('city').value,
        latitude: parseFloat(document.getElementById('latitude').value),
        longitude: parseFloat(document.getElementById('longitude').value),
    };

    if (!userData.telegram_id || !userData.username || !userData.first_name) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    try {
        showLoading();
        const result = await authAPI.register(userData);
        if (result.success) {
            saveCurrentUser({ id: result.user_id, ...userData });
            hideLoading();
            showToast('✅ Basic info saved!', 'success');
            goToStep(2);
            loadTagsForStep2();  // load available tags
        }
    } catch (error) {
        hideLoading();
        showToast(`❌ Registration failed: ${error.message}`, 'error');
    }
}

function loadTagsForStep2() {
    // Use hardcoded tags (fallback if API doesn't exist)
    const defaultTags = [
        'travel', 'music', 'sports', 'reading', 'gaming',
        'cooking', 'photography', 'art', 'fitness', 'movies',
        'nature', 'technology', 'fashion', 'dancing', 'meditation'
    ];
    const container = document.getElementById('tagsSelection');
    if (!container) return;
    container.innerHTML = '';
    defaultTags.forEach(tag => {
        const div = document.createElement('div');
        div.className = 'tag-checkbox';
        div.innerHTML = `
            <input type="checkbox" value="${tag}" id="regTag_${tag}">
            <label for="regTag_${tag}">${tag}</label>
        `;
        container.appendChild(div);
    });
    // Enforce max 5 selections
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const checked = Array.from(checkboxes).filter(c => c.checked);
            if (checked.length > 5) {
                cb.checked = false;
                showToast('Maximum 5 tags allowed', 'error');
            }
        });
    });
}

async function saveTagsAndGoToStep3() {
    selectedTags = Array.from(document.querySelectorAll('#tagsSelection input:checked'))
        .map(cb => cb.value);
    if (selectedTags.length > 5) {
        showToast('Maximum 5 tags allowed', 'error');
        return;
    }
    if (selectedTags.length > 0) {
        try {
            showLoading();
            await profileAPI.updateTags(appState.currentUser.id, selectedTags);
            hideLoading();
            showToast('✅ Tags saved!', 'success');
        } catch (error) {
            hideLoading();
            showToast(`❌ Failed to save tags: ${error.message}`, 'error');
            return;
        }
    } else {
        showToast('No tags selected (you can skip)', 'info');
    }
    goToStep(3);
    setupPhotoUploadForStep3();
}

function setupPhotoUploadForStep3() {
    const input = document.getElementById('regPhotoUpload');
    const preview = document.getElementById('regPhotoPreview');
    // Remove old listener to avoid duplication
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    newInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 3) {
            showToast('Maximum 3 photos allowed', 'error');
            newInput.value = '';
            return;
        }
        preview.innerHTML = '';
        uploadedPhotoUrls = [];
        for (let file of files) {
            try {
                showLoading();
                const result = await profileAPI.uploadPhoto(appState.currentUser.id, file);
                hideLoading();
                if (result.success) {
                    uploadedPhotoUrls.push(result.photo_url);
                    const imgDiv = document.createElement('div');
                    imgDiv.className = 'photo-item';
                    imgDiv.innerHTML = `<img src="${result.photo_url}" alt="Uploaded photo">`;
                    preview.appendChild(imgDiv);
                } else {
                    showToast(`Photo rejected: ${result.reason}`, 'error');
                }
            } catch (err) {
                hideLoading();
                showToast(`Upload failed: ${err.message}`, 'error');
            }
        }
    });
}

function goToStep(step) {
    document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
}

function finishRegistrationAndGoToTest() {
    showToast('✅ Registration complete! Taking personality test...', 'success');
    showPage('test');
    setTimeout(() => {
        if (typeof initializeTest === 'function') initializeTest();
    }, 500);
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('authTitle');
    const submitBtn = document.querySelector('#step1Submit');
    const toggleLink = document.getElementById('toggleAuthMode');
    const registerFields = document.getElementById('registerFields');

    if (isLoginMode) {
        title.textContent = 'Login';
        submitBtn.textContent = 'Login';
        registerFields.style.display = 'none';
        toggleLink.textContent = 'Don\'t have account? Register';
        const basicForm = document.getElementById('basicInfoForm');
        basicForm.onsubmit = async (e) => {
            e.preventDefault();
            await loginUser();
        };
    } else {
        title.textContent = 'Register';
        submitBtn.textContent = 'Next →';
        registerFields.style.display = 'block';
        toggleLink.textContent = 'Already have account? Login';
        const basicForm = document.getElementById('basicInfoForm');
        basicForm.onsubmit = async (e) => {
            e.preventDefault();
            await registerBasicInfo();
        };
    }
}

async function loginUser() {
    const telegramId = parseInt(document.getElementById('telegramId').value);
    if (!telegramId) {
        showToast('Please enter your Telegram ID', 'error');
        return;
    }
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

function useCurrentLocation() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                document.getElementById('latitude').value = position.coords.latitude.toFixed(4);
                document.getElementById('longitude').value = position.coords.longitude.toFixed(4);
                hideLoading();
                showToast('✅ Location updated!', 'success');
            },
            (error) => {
                hideLoading();
                showToast(`❌ Location error: ${error.message}`, 'error');
            }
        );
    } else {
        showToast('Geolocation not supported', 'error');
    }
}

// Initialize auth listeners when page loads
document.addEventListener('DOMContentLoaded', () => {
    setupAuthListeners();
    toggleAuthMode();  // default to registration mode
});