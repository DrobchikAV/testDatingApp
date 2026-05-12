// ============================================
// API CONFIGURATION
// ============================================

const API_BASE_URL = 'http://localhost:8000/api';

// ============================================
// API HELPER FUNCTION
// ============================================

async function apiCall(method, endpoint, data = null) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        console.log(`[API] ${method} ${url}`, data || '');

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        // Try to parse JSON
        let result;
        const text = await response.text();

        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error('[API] Non-JSON response:', text);
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
        }

        console.log(`[API] Response:`, result);

        if (!response.ok) {
            const errorMessage = result.detail || result.message || `HTTP ${response.status}`;
            throw new Error(errorMessage);
        }

        return result;
    } catch (error) {
        console.error('[API] Error:', error.message);
        throw error;
    }
}

// ============================================
// AUTH API
// ============================================

const authAPI = {
    register: (data) => apiCall('POST', '/auth/register', data),
    login: (telegramId) => apiCall('GET', `/auth/login?telegram_id=${telegramId}`),
    checkExists: (telegramId) => apiCall('GET', `/auth/exists/${telegramId}`),
};

// ============================================
// PROFILE API
// ============================================

const profileAPI = {
    getProfile: (userId) => apiCall('GET', `/profile/${userId}`),
    updateProfile: (userId, data) => apiCall('PUT', `/profile/${userId}`, data),
    getTags: (userId) => apiCall('GET', `/profile/${userId}/tags`),
    updateTags: (userId, tags) => apiCall('POST', `/profile/${userId}/tags`, tags),
    uploadPhoto: async (userId, file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const url = `${API_BASE_URL}/profile/${userId}/photos`;
            console.log(`[API] Uploading photo to ${url}`);

            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                throw new Error('Upload failed: non-JSON response');
            }

            if (!response.ok) {
                throw new Error(result.detail || 'Upload failed');
            }

            return result;
        } catch (error) {
            console.error('[API] Upload error:', error);
            throw error;
        }
    },
};

// ============================================
// TEST API
// ============================================

const testAPI = {
    getQuestions: () => apiCall('GET', '/test/questions'),
    submitAnswers: (userId, answers) =>
        apiCall('POST', '/test/submit', { user_id: userId, answers }),
    getResults: (userId) => apiCall('GET', `/test/results/${userId}`),
    checkStatus: (userId) => apiCall('GET', `/test/status/${userId}`),
    retakeTest: (userId, answers) =>
        apiCall('POST', '/test/retake', { user_id: userId, answers }),
};

// ============================================
// FEED API
// ============================================

const feedAPI = {
    getNextCandidate: (userId, filters = {}) => {
        let url = `/feed/next-candidate?user_id=${userId}`;

        if (filters.radius_km) url += `&radius_km=${filters.radius_km}`;
        if (filters.age_min) url += `&age_min=${filters.age_min}`;
        if (filters.age_max) url += `&age_max=${filters.age_max}`;
        if (filters.gender) url += `&gender=${filters.gender}`;

        return apiCall('GET', url);
    },
    whoLikedMe: (userId) => apiCall('GET', `/feed/who-liked-me?user_id=${userId}`),
};

// ============================================
// SWIPE API
// ============================================

const swipeAPI = {
    like: (userId, candidateId) =>
        apiCall('POST', `/swipe/like?user_id=${userId}`, { candidate_id: candidateId }),
    dislike: (userId, candidateId) =>
        apiCall('POST', `/swipe/dislike?user_id=${userId}`, { candidate_id: candidateId }),
};

// ============================================
// MATCHES API
// ============================================

const matchesAPI = {
    getMatches: (userId) => apiCall('GET', `/swipe/my-matches?user_id=${userId}`),
};