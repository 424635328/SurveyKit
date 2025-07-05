document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const surveyId = params.get('id');

    const surveyTitleElement = document.getElementById('survey-title');
    const surveyDescriptionElement = document.getElementById('survey-description');
    const loadingState = document.getElementById('loading-state');
    const surveyForm = document.getElementById('survey-form');
    const surveyContent = document.getElementById('survey-content');
    const submitButton = document.getElementById('submit-survey-btn');
    const toastContainer = document.getElementById('toast-container');
    const autosaveIndicator = document.getElementById('autosave-indicator');
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');
    const previewModal = document.getElementById('preview-modal');
    const previewModalContent = document.getElementById('preview-modal-content');
    const closePreviewBtn = document.getElementById('close-preview-btn');
    const editAnswersBtn = document.getElementById('edit-answers-btn');
    const finalSubmitBtn = document.getElementById('final-submit-btn');
    const previewAnswersList = document.getElementById('preview-answers-list');

    let surveyData = {};
    let allQuestions = [];
    let collectedAnswers = {};
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
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    function renderQuestion(question) {
        let questionHtml = `<div id="q-block-${question.id}" class="question-block p-4 rounded-lg bg-white/5 space-y-3 transition-all duration-300"><label for="${question.id}" class="font-medium text-slate-200 mb-3 block">${escapeHtml(question.text)} ${question.required ? '<span class="text-red-400">*</span>' : ''}</label>`;
        switch (question.type) {
            case 'text':
                questionHtml += `<input type="text" id="${question.id}" name="${question.id}" class="w-full form-input">`;
                break;
            case 'radio':
                question.options.forEach(opt => {
                    const value = (typeof opt === 'object' && opt.value) ? opt.value : opt;
                    const label = (typeof opt === 'object' && opt.label) ? opt.label : opt;
                    questionHtml += `<div class="flex items-center"><input type="radio" id="q_${question.id}_${value.replace(/\W/g, '_')}" name="${question.id}" value="${escapeHtml(value)}" class="form-radio"><label for="q_${question.id}_${value.replace(/\W/g, '_')}" class="ml-3 text-slate-300 cursor-pointer">${escapeHtml(label)}</label></div>`;
                });
                if (question.hasOther) {
                    questionHtml += `<div class="flex items-center"><input type="radio" id="q_${question.id}_other_radio" name="${question.id}" value="_other_" class="form-radio"><label for="q_${question.id}_other_radio" class="ml-3 text-slate-300 cursor-pointer">其他</label></div><input type="text" id="q_${question.id}_other_text" name="${question.id}_other" class="hidden w-full form-input mt-2" placeholder="请输入其他选项内容">`;
                }
                break;
            case 'select':
                questionHtml += `<select id="${question.id}" name="${question.id}" class="w-full custom-select form-input"><option value="" disabled selected>${escapeHtml(question.placeholder || '请选择...')}</option>`;
                question.options.forEach(opt => {
                    const value = (typeof opt === 'object' && opt.value) ? opt.value : opt;
                    const label = (typeof opt === 'object' && opt.label) ? opt.label : opt;
                    questionHtml += `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
                });
                questionHtml += `</select>`;
                break;
            case 'color':
                questionHtml += `<div class="flex items-center gap-4"><input type="color" id="${question.id}" name="${question.id}" value="${escapeHtml(question.defaultValue || '#6366f1')}" class="form-color-picker"><span id="color-preview-${question.id}" class="w-10 h-10 rounded-md border border-slate-600"></span></div>`;
                break;
            case 'range':
                const { min = 0, max = 100, step = 1, defaultValue = 50 } = question;
                questionHtml += `<div class="flex items-center gap-4"><input type="range" id="${question.id}" name="${question.id}" min="${min}" max="${max}" step="${step}" value="${defaultValue}" class="w-full form-range"><output for="${question.id}" class="font-mono text-lg text-white bg-slate-700/50 rounded-md px-3 py-1 w-16 text-center">${defaultValue}</output></div>`;
                break;
        }
        questionHtml += `</div>`;
        return questionHtml;
    }

    function attachEventListeners() {
        surveyForm.addEventListener('input', saveProgress);
        surveyForm.addEventListener('change', saveProgress);

        allQuestions.forEach(q => {
            if (q.type === 'radio' && q.hasOther) {
                const radioGroup = surveyForm.querySelectorAll(`input[name="${q.id}"]`);
                radioGroup.forEach(radio => radio.addEventListener('change', () => {
                    const otherInput = document.getElementById(`q_${q.id}_other_text`);
                    const isOtherChecked = document.getElementById(`q_${q.id}_other_radio`).checked;
                    otherInput.classList.toggle('hidden', !isOtherChecked);
                    if (isOtherChecked) otherInput.focus();
                }));
            } else if (q.type === 'range') {
                const slider = document.getElementById(q.id);
                const output = surveyForm.querySelector(`output[for="${q.id}"]`);
                if(slider && output) slider.addEventListener('input', () => { output.value = slider.value; });
            } else if (q.type === 'color') {
                const colorPicker = document.getElementById(q.id);
                const preview = document.getElementById(`color-preview-${q.id}`);
                if(colorPicker && preview) {
                    preview.style.backgroundColor = colorPicker.value;
                    colorPicker.addEventListener('input', () => { preview.style.backgroundColor = colorPicker.value; });
                }
            }
        });
    }

    function validateForm() {
        document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
        let firstInvalidElement = null;

        for (const question of allQuestions) {
            let isValid = true;
            let el;
            if (question.required) {
                if (question.type === 'radio') {
                    const selected = surveyForm.querySelector(`input[name="${question.id}"]:checked`);
                    if (!selected) isValid = false;
                    else if (selected.value === '_other_') {
                        el = document.getElementById(`q_${question.id}_other_text`);
                        if (!el || !el.value.trim()) isValid = false;
                    }
                } else {
                    el = document.getElementById(question.id);
                    if (!el || !el.value.trim()) isValid = false;
                }
            }
            if (!isValid) {
                const block = document.getElementById(`q-block-${question.id}`);
                block.classList.add('input-error');
                if (!firstInvalidElement) {
                    firstInvalidElement = block;
                    showToast(`请回答必填项: "${question.text}"`, 'warning');
                }
            }
        }
        
        if (firstInvalidElement) {
            firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }
        return true;
    }

    function collectAllAnswers() {
        const formData = new FormData(surveyForm);
        const answers = {};
        allQuestions.forEach(q => {
            const questionId = q.id;
            let answer = formData.get(questionId) || '';
            if (q.type === 'radio' && answer === '_other_') {
                answer = formData.get(`${questionId}_other`) || '';
            }
            answers[questionId] = answer;
        });
        return answers;
    }

    function showPreviewModal() {
        collectedAnswers = collectAllAnswers();
        let previewHtml = '';
        allQuestions.forEach(q => {
            const answer = collectedAnswers[q.id];
            let displayAnswer = answer ? escapeHtml(answer) : '<i class="text-slate-400">未作答</i>';
            if (q.type === 'color' && answer) {
                displayAnswer = `<span class="inline-flex items-center gap-2">${escapeHtml(answer)} <span class="w-5 h-5 rounded border border-slate-500" style="background-color: ${escapeHtml(answer)};"></span></span>`;
            }
            previewHtml += `<div class="py-3 border-b border-slate-700"><p class="font-semibold text-slate-300">${escapeHtml(q.text)}</p><p class="text-white text-lg mt-1">${displayAnswer}</p></div>`;
        });
        previewAnswersList.innerHTML = previewHtml;
        previewModal.classList.remove('hidden');
        setTimeout(() => {
            previewModalContent.classList.remove('opacity-0', '-translate-y-4');
        }, 10);
    }
    
    function hidePreviewModal() {
        previewModalContent.classList.add('opacity-0', '-translate-y-4');
        setTimeout(() => {
            previewModal.classList.add('hidden');
        }, 300);
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        if (validateForm()) {
            showPreviewModal();
        }
    }

    async function handleFinalSubmit() {
        finalSubmitBtn.disabled = true;
        finalSubmitBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-3"></i> 正在提交...';
        
        try {
            const response = await fetch('/api/submissions.mjs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ surveyId: surveyId, answers: collectedAnswers })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || '提交失败');

            const authoritativeSubmissionId = result.submissionId;
            if (!authoritativeSubmissionId) {
                throw new Error('提交成功，但未能获取到提交ID。');
            }
            
            sessionStorage.setItem(`survey_answers_${authoritativeSubmissionId}`, JSON.stringify(collectedAnswers));
            localStorage.removeItem(localStorageKey);
            window.location.href = `./submission-result.html?status=success&surveyId=${surveyId}&submissionId=${authoritativeSubmissionId}`;
        } catch (error) {
            hidePreviewModal();
            showToast(error.message, 'error');
        } finally {
            finalSubmitBtn.disabled = false;
            finalSubmitBtn.innerHTML = '确认并提交';
        }
    }
    
    function handleScrollButtons() {
        const atTop = window.scrollY < 200;
        const atBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200;
        scrollToTopBtn.classList.toggle('visible', !atTop);
        scrollToBottomBtn.classList.toggle('visible', !atBottom);
    }
    
    async function fetchAndRenderSurvey() {
        if (!surveyId) {
            surveyTitleElement.textContent = '错误：问卷ID缺失';
            loadingState.classList.add('hidden');
            return;
        }
        try {
            const response = await fetch(`/api/survey-details.mjs?id=${surveyId}`);
            if (!response.ok) throw new Error(response.status === 404 ? '问卷未找到。' : '加载问卷失败。');
            surveyData = await response.json();
            const surveyParts = surveyData.questions || [];
            allQuestions = surveyParts.flatMap(p => p.questions);

            if (allQuestions.length === 0) {
                surveyTitleElement.textContent = '此问卷暂无问题';
                loadingState.classList.add('hidden');
                return;
            }

            surveyTitleElement.textContent = surveyData.title || '无标题问卷';
            surveyDescriptionElement.textContent = surveyData.description || '';

            let fullSurveyHtml = '';
            surveyParts.forEach(part => {
                fullSurveyHtml += `<fieldset class="survey-section border-t border-white/10 pt-6"><legend class="text-xl font-semibold text-white mb-4 -mt-3 px-2">${escapeHtml(part.legend)}</legend><div class="space-y-6">`;
                part.questions.forEach(question => {
                    fullSurveyHtml += renderQuestion(question);
                });
                fullSurveyHtml += `</div></fieldset>`;
            });
            surveyContent.innerHTML = fullSurveyHtml;
            
            loadingState.classList.add('hidden');
            surveyForm.classList.remove('hidden');
            submitButton.classList.remove('hidden');
            
            attachEventListeners();
            loadProgress();

        } catch (error) {
            surveyTitleElement.textContent = '问卷加载失败';
            surveyDescriptionElement.textContent = error.message;
            loadingState.classList.add('hidden');
            showToast(error.message, 'error');
        }
    }

    surveyForm.addEventListener('submit', handleFormSubmit);
    closePreviewBtn.addEventListener('click', hidePreviewModal);
    editAnswersBtn.addEventListener('click', hidePreviewModal);
    finalSubmitBtn.addEventListener('click', handleFinalSubmit);
    scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    scrollToBottomBtn.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
    window.addEventListener('scroll', handleScrollButtons, { passive: true });
    
    handleScrollButtons();
    document.getElementById('current-year-footer').textContent = new Date().getFullYear();
    fetchAndRenderSurvey();
});