// public/hub/answer/answer.js
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const surveyId = params.get('id');

    const surveyContainer = document.getElementById('survey-container');
    const surveyTitleElement = document.getElementById('survey-title');
    const surveyDescriptionElement = document.getElementById('survey-description');
    const loadingState = document.getElementById('loading-state');
    const surveyForm = document.getElementById('survey-form');
    const surveyContent = document.getElementById('survey-content');
    const progressBarContainer = document.getElementById('progress-bar-container');
    const progressBar = document.getElementById('progress-bar');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitButton = document.getElementById('submit-survey-btn');
    const toastContainer = document.getElementById('toast-container');
    const autosaveIndicator = document.getElementById('autosave-indicator');
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');

    let surveyData = {};
    let surveyParts = [];
    let currentPartIndex = 0;
    let isReviewing = false;
    let autosaveTimeout;
    const localStorageKey = `survey_progress_${surveyId}`;

    function escapeHtml(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/[&<>"']/g, match => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match]));
    }

    function showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    function showAutosaveIndicator() {
        if (autosaveTimeout) clearTimeout(autosaveTimeout);
        autosaveIndicator.classList.add('opacity-100');
        autosaveTimeout = setTimeout(() => { autosaveIndicator.classList.remove('opacity-100'); }, 2000);
    }

    function saveProgress() {
        const formData = new FormData(surveyForm);
        const data = {};
        for (let [key, value] of formData.entries()) { data[key] = value; }
        localStorage.setItem(localStorageKey, JSON.stringify(data));
        showAutosaveIndicator();
    }

    function loadProgress() {
        const savedData = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
        Object.keys(savedData).forEach(key => {
            const el = surveyForm.querySelector(`[name="${key}"]`);
            if (el) {
                if (el.type === 'radio') {
                    const radioToCheck = surveyForm.querySelector(`[name="${key}"][value="${savedData[key]}"]`);
                    if (radioToCheck) radioToCheck.checked = true;
                } else {
                    el.value = savedData[key];
                }
            }
        });
        document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    function renderQuestion(question) {
        let questionHtml = `<div id="q-block-${question.id}" class="question-block p-4 rounded-lg bg-white/5 space-y-3 mb-6 transition-all duration-300"><label for="${question.id}" class="font-medium text-slate-200 mb-3 block">${escapeHtml(question.text)} ${question.required ? '<span class="text-red-400">*</span>' : ''}</label>`;
        switch (question.type) {
            case 'text':
                questionHtml += `<input type="text" id="${question.id}" name="${question.id}" class="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500">`;
                break;
            case 'radio':
                question.options.forEach(opt => {
                    const value = (typeof opt === 'object' && opt.value) ? opt.value : opt;
                    const label = (typeof opt === 'object' && opt.label) ? opt.label : opt;
                    const optionId = `q_${question.id}_${value.replace(/\W/g, '_')}`;
                    questionHtml += `<div class="flex items-center"><input type="radio" id="${optionId}" name="${question.id}" value="${escapeHtml(value)}" class="form-radio text-indigo-500 focus:ring-indigo-500 h-4 w-4 bg-slate-700 border-slate-600 cursor-pointer"><label for="${optionId}" class="ml-3 text-slate-300 cursor-pointer">${escapeHtml(label)}</label></div>`;
                });
                if (question.hasOther) {
                    questionHtml += `<div class="flex items-center"><input type="radio" id="q_${question.id}_other_radio" name="${question.id}" value="_other_" class="form-radio text-indigo-500 focus:ring-indigo-500 h-4 w-4 bg-slate-700 border-slate-600 cursor-pointer"><label for="q_${question.id}_other_radio" class="ml-3 text-slate-300 cursor-pointer">其他</label></div><input type="text" id="q_${question.id}_other_text" name="${question.id}_other" class="hidden w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 mt-2" placeholder="请输入其他选项内容">`;
                }
                break;
            case 'select':
                questionHtml += `<select id="${question.id}" name="${question.id}" class="w-full custom-select bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"><option value="" disabled selected>${escapeHtml(question.placeholder || '请选择...')}</option>`;
                question.options.forEach(opt => {
                    const value = (typeof opt === 'object' && opt.value) ? opt.value : opt;
                    const label = (typeof opt === 'object' && opt.label) ? opt.label : opt;
                    questionHtml += `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
                });
                questionHtml += `</select>`;
                break;
        }
        questionHtml += `</div>`;
        return questionHtml;
    }

    function renderCurrentPart() {
        isReviewing = false;
        const part = surveyParts[currentPartIndex];
        let partHtml = `<fieldset class="survey-section"><legend class="text-xl font-semibold text-white mb-6 px-2 border-b-2 border-indigo-500/50 pb-2">${escapeHtml(part.legend)}</legend>`;
        part.questions.forEach(question => { partHtml += renderQuestion(question); });
        partHtml += `</fieldset>`;
        surveyContent.innerHTML = partHtml;
        loadProgress();
        attachEventListenersForPart();
        updateNavigation();
        updateProgressBar();
    }
    
    function renderReviewPage() {
        isReviewing = true;
        const allAnswers = collectAllAnswers(); // We still call it here to get data for display
        let reviewHtml = `<div class="review-section space-y-6"><h3 class="text-2xl font-bold text-white text-center mb-6">回顾你的答案</h3>`;
        surveyParts.forEach((part, index) => {
            reviewHtml += `<div class="mb-4"><h4 class="text-lg font-semibold text-indigo-300 mb-3">${escapeHtml(part.legend)}</h4>`;
            part.questions.forEach(q => {
                let answerText = allAnswers[q.id] ? escapeHtml(allAnswers[q.id]) : '<i class="text-slate-400">未作答</i>';
                reviewHtml += `<div class="review-answer-block p-4 rounded-md mb-3"><p class="font-medium text-slate-300 mb-2">${escapeHtml(q.text)}</p><div class="flex justify-between items-center"><p class="text-white text-lg">${answerText}</p><button type="button" class="edit-answer-btn text-indigo-400 hover:text-white text-sm" data-part-index="${index}">编辑</button></div></div>`;
            });
            reviewHtml += `</div>`;
        });
        reviewHtml += `</div>`;
        surveyContent.innerHTML = reviewHtml;
        updateNavigation();
        updateProgressBar();
        document.querySelectorAll('.edit-answer-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentPartIndex = parseInt(e.target.dataset.partIndex, 10);
                renderCurrentPart();
            });
        });
    }

    function attachEventListenersForPart() {
        surveyForm.addEventListener('input', saveProgress);
        surveyForm.addEventListener('change', saveProgress);
        document.querySelectorAll('input[type="radio"][name]').forEach(radio => {
            radio.addEventListener('change', e => {
                const name = e.target.name;
                const otherInput = document.getElementById(`q_${name}_other_text`);
                if (otherInput) {
                    const isOtherChecked = document.getElementById(`q_${name}_other_radio`).checked;
                    otherInput.classList.toggle('hidden', !isOtherChecked);
                    otherInput.required = isOtherChecked;
                }
            });
        });
        document.querySelectorAll('input[type="text"]').forEach((input, index, allInputs) => {
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const nextInput = allInputs[index + 1];
                    if (nextInput) nextInput.focus(); else nextBtn.click();
                }
            });
        });
    }

    function validateCurrentPart() {
        document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
        const part = surveyParts[currentPartIndex];
        for (const question of part.questions) {
            let isValid = true; let el;
            if (question.type === 'radio') {
                const selected = surveyForm.querySelector(`input[name="${question.id}"]:checked`);
                if (question.required && !selected) isValid = false;
                if (selected && selected.value === '_other_') {
                    el = document.getElementById(`q_${question.id}_other_text`);
                    if (question.required && !el.value.trim()) isValid = false;
                }
            } else {
                el = document.getElementById(question.id);
                if (question.required && !el.value.trim()) isValid = false;
            }
            if (!isValid) {
                showToast(`请回答: ${question.text}`, 'warning');
                const block = document.getElementById(`q-block-${question.id}`);
                block.classList.add('input-error');
                block.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return false;
            }
        }
        return true;
    }

    function collectAllAnswers() {
        const savedData = JSON.parse(localStorage.getItem(localStorageKey) || '{}');
        const allAnswers = {};

        surveyParts.flat().flatMap(p => p.questions).forEach(q => {
            const questionId = q.id;
            let answer = savedData[questionId] || '';

            if (q.type === 'radio' && answer === '_other_') {
                answer = savedData[`${questionId}_other`] || '';
            }
            allAnswers[questionId] = answer;
        });

        return allAnswers;
    }

    function updateNavigation() {
        prevBtn.classList.toggle('hidden', currentPartIndex === 0 || isReviewing);
        const isLastPart = currentPartIndex >= surveyParts.length - 1;
        nextBtn.classList.toggle('hidden', isLastPart || isReviewing);
        if (!isReviewing && isLastPart) {
            nextBtn.classList.remove('hidden');
            nextBtn.innerHTML = '完成并回顾答案 <i class="fa fa-check-square-o ml-2"></i>';
        } else { nextBtn.innerHTML = '下一步 <i class="fa fa-arrow-right ml-2"></i>'; }
        submitButton.classList.toggle('hidden', !isReviewing);
    }
    
    function updateProgressBar() {
        const totalSteps = surveyParts.length;
        const currentStep = isReviewing ? totalSteps : currentPartIndex + 1;
        const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
        progressBar.style.width = `${progress}%`;
    }

    function handleScrollButtons() {
        const atTop = window.scrollY < 200;
        const atBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200;
        scrollToTopBtn.classList.toggle('visible', !atTop);
        scrollToBottomBtn.classList.toggle('visible', !atBottom);
    }
    
    function handleNext() {
        if (validateCurrentPart()) {
            if (currentPartIndex >= surveyParts.length - 1) { renderReviewPage(); } else { currentPartIndex++; renderCurrentPart(); }
            surveyContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function handlePrev() {
        currentPartIndex--; renderCurrentPart();
        surveyContainer.scrollIntoView({ behavior: 'smooth' });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fa fa-spinner fa-spin mr-3"></i> 提交中...';
        
        const answers = collectAllAnswers();
        
        const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem(`survey_answers_${submissionId}`, JSON.stringify(answers));
        
        try {
            const response = await fetch('/api/submissions.mjs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ surveyId: surveyId, answers: answers })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || '提交失败');
            localStorage.removeItem(localStorageKey);
            window.location.href = `./submission-result.html?status=success&surveyId=${surveyId}&submissionId=${submissionId}`;
        } catch (error) {
            window.location.href = `./submission-result.html?status=error&message=${encodeURIComponent(error.message)}`;
        }
    }

    async function fetchSurveyData() {
        if (!surveyId) {
            surveyTitleElement.textContent = '错误：问卷ID缺失';
            loadingState.classList.add('hidden');
            return;
        }
        try {
            const response = await fetch(`/api/survey-details.mjs?id=${surveyId}`);
            if (!response.ok) throw new Error(response.status === 404 ? '问卷未找到。' : '加载问卷失败。');
            surveyData = await response.json();
            surveyParts = surveyData.questions || [];
            if (surveyParts.length === 0) {
                surveyTitleElement.textContent = '此问卷暂无问题';
                loadingState.classList.add('hidden');
                return;
            }
            surveyTitleElement.textContent = surveyData.title || '无标题问卷';
            surveyDescriptionElement.textContent = surveyData.description || '';
            loadingState.classList.add('hidden');
            surveyForm.classList.remove('hidden');
            progressBarContainer.classList.remove('hidden');
            renderCurrentPart();
        } catch (error) {
            surveyTitleElement.textContent = '问卷加载失败';
            surveyDescriptionElement.textContent = error.message;
            loadingState.classList.add('hidden');
            showToast(error.message, 'error');
        }
    }
    
    nextBtn.addEventListener('click', handleNext);
    prevBtn.addEventListener('click', handlePrev);
    surveyForm.addEventListener('submit', handleSubmit);
    scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    scrollToBottomBtn.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
    window.addEventListener('scroll', handleScrollButtons, { passive: true });
    
    handleScrollButtons();
    fetchSurveyData();
});