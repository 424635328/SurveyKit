// public/hub/answer/answer.js
document.addEventListener('DOMContentLoaded', () => {
    function initMobileMenu() {
        const menuToggle = document.getElementById('menu-toggle'), mobileMenu = document.getElementById('mobile-menu'), icon = menuToggle?.querySelector('i');
        if (!menuToggle || !mobileMenu || !icon) return;
        menuToggle.addEventListener('click', () => { mobileMenu.classList.toggle('hidden'); icon.classList.toggle('fa-bars'); icon.classList.toggle('fa-times'); });
    }
    function initHeaderScrollEffect() {
        const header = document.querySelector('header');
        if (!header) return;
        const SCROLL_THRESHOLD = 50;
        const toggleHeaderScrolledClass = () => { header.classList.toggle('header-scrolled', window.scrollY > SCROLL_THRESHOLD); };
        toggleHeaderScrolledClass(); window.addEventListener('scroll', toggleHeaderScrolledClass, { passive: true });
    }
    function initScrollToTopButton() {
        const scrollToTopBtn = document.getElementById('scrollToTopBtn');
        if (!scrollToTopBtn) return;
        const SCROLL_VISIBLE_THRESHOLD = 300;
        const toggleButtonVisibility = () => {
            if (window.scrollY > SCROLL_VISIBLE_THRESHOLD) { scrollToTopBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4'); scrollToTopBtn.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0'); } else { scrollToTopBtn.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0'); scrollToTopBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4'); }
        };
        window.addEventListener('scroll', toggleButtonVisibility, { passive: true }); scrollToTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); }); toggleButtonVisibility();
    }
    function updateFooterYear() {
        const currentYearFooter = document.getElementById('current-year-footer');
        if (currentYearFooter) { currentYearFooter.textContent = new Date().getFullYear(); }
    }

    const toastContainer = document.getElementById('toast-container');
    function showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type} opacity-0 translate-x-full transition-all duration-300 ease-out`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);

        void toast.offsetWidth; // Trigger reflow
        toast.classList.remove('opacity-0', 'translate-x-full');
        toast.classList.add('opacity-100', 'translate-x-0');

        setTimeout(() => {
            toast.classList.remove('opacity-100', 'translate-x-0');
            toast.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    const params = new URLSearchParams(window.location.search);
    const surveyId = params.get('id');
    const surveyTitleElement = document.getElementById('survey-title');
    const surveyDescriptionElement = document.getElementById('survey-description');
    const loadingState = document.getElementById('loading-state');
    const surveyForm = document.getElementById('survey-form'); 
    const submitButton = document.getElementById('submit-survey-btn'); 
    
    let currentSurveyData = null; 

    function renderQuestion(question) {
        let questionHtml = `
            <div class="question-block p-4 border border-slate-700/50 rounded-lg bg-white/5 space-y-2">
                <p class="font-medium text-slate-200 mb-3">${escapeHtml(question.text)} ${question.required ? '<span class="text-red-400">*</span>' : ''}</p>
        `;

        if (question.type === 'radio') {
            question.options.forEach(option => {
                const optionId = `q_${question.id}_${option.value.replace(/\W/g, '_')}`; // Safe ID
                questionHtml += `
                    <div class="flex items-center">
                        <input type="radio" id="${optionId}" name="${question.id}" value="${escapeHtml(option.value)}" class="form-radio text-indigo-500 focus:ring-indigo-500 h-4 w-4 bg-slate-700 border-slate-600 cursor-pointer">
                        <label for="${optionId}" class="ml-2 text-slate-300">${escapeHtml(option.label)}</label>
                    </div>
                `;
            });
            if (question.hasOther) {
                const otherOptionId = `q_${question.id}_other_radio`;
                const otherInputId = `q_${question.id}_other_text`;
                questionHtml += `
                    <div class="flex items-center">
                        <input type="radio" id="${otherOptionId}" name="${question.id}" value="_other_" class="form-radio text-indigo-500 focus:ring-indigo-500 h-4 w-4 bg-slate-700 border-slate-600 cursor-pointer">
                        <label for="${otherOptionId}" class="ml-2 text-slate-300">其他 (请说明)</label>
                    </div>
                    <input type="text" id="${otherInputId}" name="${question.id}_other" class="hidden w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 mt-2" placeholder="请输入其他选项内容">
                `;
            }
        } else if (question.type === 'text') {
            questionHtml += `
                <input type="text" id="${question.id}" name="${question.id}" class="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="${escapeHtml(question.placeholder || '请输入您的回答')}" ${question.required ? 'required' : ''}>
            `;
        }
        questionHtml += `</div>`;
        return questionHtml;
    }

    function attachOtherOptionListeners() {
        document.querySelectorAll('#survey-form input[type="radio"][value="_other_"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const otherInputId = `${e.target.name}_other_text`;
                const otherInput = document.getElementById(otherInputId);
                if (otherInput) {
                    if (e.target.checked) {
                        otherInput.classList.remove('hidden');
                        otherInput.setAttribute('required', 'true');
                        otherInput.focus();
                    } else {
                        otherInput.classList.add('hidden');
                        otherInput.removeAttribute('required');
                        otherInput.value = ''; 
                    }
                }
            });
        });

        document.querySelectorAll('#survey-form input[type="radio"]:not([value="_other_"])').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const otherInputId = `${e.target.name}_other_text`;
                const otherInput = document.getElementById(otherInputId);
                if (otherInput) {
                    if (e.target.checked) {
                        const otherRadio = document.getElementById(`${e.target.name}_other_radio`);
                        if(otherRadio) otherRadio.checked = false;
                        otherInput.classList.add('hidden');
                        otherInput.removeAttribute('required');
                        otherInput.value = '';
                    }
                }
            });
        });
    }

    function collectAnswers() {
        const answers = {};
        let isValid = true; 

        currentSurveyData.forEach(part => {
            part.questions.forEach(question => {
                const inputElement = surveyForm.querySelector(`[name="${question.id}"]`);
                if (!inputElement && question.type !== 'radio') return; 

                if (question.type === 'radio') {
                    const selectedRadio = surveyForm.querySelector(`input[name="${question.id}"]:checked`);
                    if (question.required && !selectedRadio) {
                        showToast(`请回答问题：${question.text}`, 'warning');
                        isValid = false;
                        return;
                    }
                    if (selectedRadio) {
                        if (selectedRadio.value === '_other_') {
                            const otherTextInput = document.getElementById(`${question.id}_other_text`);
                            if (otherTextInput) {
                                if (question.required && otherTextInput.value.trim() === '') {
                                    showToast(`请填写“其他”选项内容：${question.text}`, 'warning');
                                    isValid = false;
                                    otherTextInput.focus();
                                    return;
                                }
                                answers[question.id] = otherTextInput.value.trim();
                                answers[`${question.id}_other`] = otherTextInput.value.trim(); 
                            }
                        } else {
                            answers[question.id] = selectedRadio.value;
                            answers[`${question.id}_other`] = ''; 
                        }
                    } else {
                         answers[question.id] = ''; 
                         answers[`${question.id}_other`] = '';
                    }
                } else if (question.type === 'text') {
                    const value = inputElement.value.trim();
                    if (question.required && value === '') {
                        showToast(`请填写问题：${question.text}`, 'warning');
                        isValid = false;
                        inputElement.focus();
                        return;
                    }
                    answers[question.id] = value;
                }
            });
        });

        return isValid ? answers : null;
    }

    async function fetchSurveyData() {
        if (!surveyId) {
            surveyTitleElement.textContent = '错误：问卷ID缺失！';
            surveyDescriptionElement.textContent = '请确保您通过有效的分享链接访问。';
            loadingState.classList.add('hidden');
            return;
        }

        try {
            const response = await fetch(`/api/survey-details.mjs?id=${surveyId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('问卷未找到或已删除。');
                }
                throw new Error('无法加载问卷。');
            }
            const data = await response.json();
            currentSurveyData = data.questions; 
            
            surveyTitleElement.textContent = data.title || '无标题问卷';
            surveyDescriptionElement.textContent = data.description || ''; 

            renderSurveyForm(currentSurveyData);

        } catch (error) {
            console.error('Error fetching survey:', error);
            surveyTitleElement.textContent = '问卷加载失败';
            surveyDescriptionElement.textContent = error.message || '请检查网络连接或稍后再试。';
            loadingState.classList.add('hidden');
            surveyForm.classList.add('hidden');
            showToast(`加载失败: ${error.message}`, 'error');
        }
    }

    function renderSurveyForm(parts) {
        if (!parts || parts.length === 0) {
            surveyTitleElement.textContent = '此问卷暂无问题。';
            surveyDescriptionElement.textContent = '';
            loadingState.classList.add('hidden');
            surveyForm.classList.add('hidden');
            return;
        }

        let formContentHtml = '';
        parts.forEach(part => {
            if (part.legend) {
                formContentHtml += `<fieldset class="survey-section p-6 border border-slate-700/50 rounded-xl bg-white/5">
                                        <legend class="text-lg font-semibold text-white mb-4 px-2">${escapeHtml(part.legend)}</legend>`;
            } else {
                formContentHtml += `<fieldset class="survey-section p-6 border border-slate-700/50 rounded-xl bg-white/5">`;
            }
            
            if (part.questions && Array.isArray(part.questions)) {
                part.questions.forEach(question => {
                    formContentHtml += renderQuestion(question);
                });
            }
            formContentHtml += `</fieldset>`;
        });

        const submitBtnPlaceholder = surveyForm.querySelector('#submit-survey-btn');
        surveyForm.innerHTML = formContentHtml; 
        surveyForm.appendChild(submitBtnPlaceholder); // Re-append submit button

        loadingState.classList.add('hidden');
        surveyForm.classList.remove('hidden');
        attachOtherOptionListeners(); 
    }

    async function handleSubmit(event) {
        event.preventDefault();
        
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fa fa-spinner fa-spin mr-3"></i> 提交中...';
        showToast('正在提交问卷...', 'info');

        const answers = collectAnswers();
        if (!answers) { 
            submitButton.disabled = false;
            submitButton.innerHTML = '提交问卷';
            return;
        }

        try {
            const response = await fetch('/api/submissions.mjs', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ surveyId: surveyId, answers: answers })
            });

            const result = await response.json(); 

            if (!response.ok) {
                throw new Error(result.message || '提交失败');
            }

            const redirectUrl = `./submission-result.html?status=success&surveyId=${surveyId}&submissionId=${result.submissionId || ''}&message=${encodeURIComponent(result.message || '问卷提交成功！')}`;
            window.location.href = redirectUrl;

        } catch (error) {
            console.error('Submission error:', error);
            const redirectUrl = `./submission-result.html?status=error&message=${encodeURIComponent(error.message || '提交过程中发生未知错误。')}`;
            window.location.href = redirectUrl;
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '提交问卷';
        }
    }

    surveyForm.addEventListener('submit', handleSubmit);
    function escapeHtml(str) {
        if (typeof str !== 'string') return str; 
        return str.replace(/[&<>"']/g, function(match) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[match];
        });
    }

    initMobileMenu();
    initHeaderScrollEffect();
    initScrollToTopButton();
    updateFooterYear();

    fetchSurveyData();
});