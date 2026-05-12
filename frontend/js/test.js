// ============================================
// PERSONALITY TEST – CORRECTED VERSION
// ============================================

async function initializeTest() {
    if (!appState.currentUser) {
        showPage('home');
        return;
    }

    try {
        showLoading();
        const response = await testAPI.getQuestions();
        appState.testQuestions = response.questions;
        appState.testAnswers = {};
        appState.currentQuestionIndex = 0;

        hideLoading();
        displayQuestion(0);
        // Note: setupTestListeners() is NOT called here – it's called once on page load
    } catch (error) {
        hideLoading();
        showToast(`Error loading test: ${error.message}`, 'error');
    }
}

function displayQuestion(index) {
    if (index < 0 || index >= appState.testQuestions.length) return;

    appState.currentQuestionIndex = index;
    const question = appState.testQuestions[index];

    // Update counter
    document.getElementById('currentQuestion').textContent = index + 1;

    // Update progress bar
    const progress = ((index + 1) / appState.testQuestions.length) * 100;
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.innerHTML = `<div style="height: 100%; background: var(--primary-color); width: ${progress}%; transition: 0.3s;"></div>`;
    }

    // Display question
    document.getElementById('questionText').textContent = question.question_text;

    // Display answer options
    const answersContainer = document.getElementById('answersContainer');
    answersContainer.innerHTML = '';
    const answers = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

    answers.forEach((answer, i) => {
        const score = i + 1;
        const id = `answer-${index}-${score}`;
        const checked = appState.testAnswers[question.id] === score ? 'checked' : '';

        answersContainer.innerHTML += `
            <label class="answer-option">
                <input type="radio" name="answer" id="${id}" value="${score}" ${checked} data-question-id="${question.id}">
                <label for="${id}" class="answer-label">${answer}</label>
            </label>
        `;
    });

    // Update button states
    document.getElementById('prevQuestionBtn').disabled = index === 0;
    const isLast = index === appState.testQuestions.length - 1;
    document.getElementById('nextQuestionBtn').style.display = isLast ? 'none' : 'inline-block';
    document.getElementById('submitTestBtn').style.display = isLast ? 'inline-block' : 'none';

    // Add radio change listeners
    document.querySelectorAll('input[name="answer"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const questionId = parseInt(e.target.dataset.questionId);
            appState.testAnswers[questionId] = parseInt(e.target.value);
        });
    });
}

// ============================================
// EVENT LISTENERS – ATTACHED ONCE
// ============================================
function setupTestListeners() {
    const prevBtn = document.getElementById('prevQuestionBtn');
    const nextBtn = document.getElementById('nextQuestionBtn');
    const submitBtn = document.getElementById('submitTestBtn');

    // Remove any existing listeners to be safe (optional but clean)
    const newPrev = prevBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrev, prevBtn);

    const newNext = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNext, nextBtn);

    const newSubmit = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmit, submitBtn);

    // Attach fresh listeners
    document.getElementById('prevQuestionBtn').addEventListener('click', () => {
        if (appState.currentQuestionIndex > 0) {
            displayQuestion(appState.currentQuestionIndex - 1);
        }
    });

    document.getElementById('nextQuestionBtn').addEventListener('click', () => {
        if (appState.currentQuestionIndex < appState.testQuestions.length - 1) {
            displayQuestion(appState.currentQuestionIndex + 1);
        }
    });

    document.getElementById('submitTestBtn').addEventListener('click', submitTest);
}

async function submitTest() {
    const submitBtn = document.getElementById('submitTestBtn');
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;

    if (Object.keys(appState.testAnswers).length !== 15) {
        showToast('Please answer all 15 questions', 'error');
        submitBtn.disabled = false;
        return;
    }

    try {
        showLoading();
        const result = await testAPI.submitAnswers(appState.currentUser.id, appState.testAnswers);
        hideLoading();
        showToast('Test submitted! Results saved.', 'success');
        showPage('profile');
        loadProfile();
    } catch (error) {
        hideLoading();
        showToast(`Error submitting test: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
    }
}

// ============================================
// INITIALIZATION – RUN ONCE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    setupTestListeners();

    // Lazy load test when page is clicked (only if not already loaded)
    document.getElementById('test-page')?.addEventListener('click', () => {
        if (appState.testQuestions.length === 0) {
            initializeTest();
        }
    });
});