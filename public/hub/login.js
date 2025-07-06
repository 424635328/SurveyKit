document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('auth-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const usernameStatus = document.getElementById('username-status');
    const usernameHint = document.getElementById('username-hint');
    const passwordStrength = document.getElementById('password-strength');
    const passwordStrengthBar = passwordStrength.querySelector('.bar');
    const passwordStrengthText = passwordStrength.querySelector('.strength-text');
    const passwordSuggestionsText = passwordStrength.querySelector('.suggestions-text');
    const confirmPasswordGroup = document.getElementById('confirm-password-group');
    const confirmPasswordHint = document.getElementById('confirm-password-hint');
    const submitBtn = document.getElementById('submit-btn');
    const errorMessage = document.getElementById('error-message');

    let debounceTimer;
    let isUserRegistered = null; 

    const token = localStorage.getItem('surveyKitToken');
    if (token) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || './toolchain/management.html';
        window.location.href = redirectUrl;
        return;
    }

    function setHint(element, message, isError = false) {
        element.textContent = message;
        element.classList.remove('text-red-400', 'text-slate-500');
        if (isError) {
            element.classList.add('text-red-400');
        } else {
            element.classList.add('text-slate-500');
        }
        element.classList.add('show');
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    }

    function hideHint(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(1rem)';
        setTimeout(() => element.textContent = '', 300);
    }

    function setStatusIcon(iconElement, type) {
        iconElement.classList.remove('fa-check', 'fa-times', 'fa-spinner', 'fa-spin', 'text-green-500', 'text-red-500');
        iconElement.classList.add('show');
        if (type === 'loading') {
            iconElement.classList.add('fa-spinner', 'fa-spin');
        } else if (type === 'success') {
            iconElement.classList.add('fa-check', 'text-green-500');
        } else if (type === 'error') {
            iconElement.classList.add('fa-times', 'text-red-500');
        } else {
            iconElement.classList.remove('show');
        }
    }

    function clearErrorMessage() {
        hideHint(errorMessage);
    }

    function updateSubmitButtonText() {
        if (isUserRegistered === true) {
            submitBtn.textContent = '登录';
        } else if (isUserRegistered === false) {
            submitBtn.textContent = '注册';
        } else {
            submitBtn.textContent = '登录 / 注册';
        }
    }

    function showConfirmPasswordGroup(show) {
        if (show) {
            confirmPasswordGroup.classList.add('show');
            confirmPasswordGroup.classList.remove('hidden');
        } else {
            confirmPasswordGroup.classList.remove('show');
            confirmPasswordGroup.classList.add('hidden');
            confirmPasswordInput.value = '';
            hideHint(confirmPasswordHint);
        }
    }

    function evaluatePasswordStrength(password) {
        let score = 0;
        let suggestions = [];

        if (password.length >= 6) {
            score += 1;
        } else {
            suggestions.push('密码长度至少6位。');
        }
        if (password.length >= 10) {
            score += 1;
        }

        if (/[A-Z]/.test(password)) {
            score += 1;
        } else {
            suggestions.push('包含大写字母。');
        }
        if (/[a-z]/.test(password)) {
            score += 1;
        } else {
            suggestions.push('包含小写字母。');
        }
        if (/\d/.test(password)) {
            score += 1;
        } else {
            suggestions.push('包含数字。');
        }
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            score += 1;
        } else {
            suggestions.push('包含特殊字符。');
        }

        let strength = '';
        let barWidth = 0;
        let barColorClass = '';

        if (password.length === 0) {
            strength = '';
            barWidth = 0;
            hideHint(passwordStrength);
        } else if (score < 3) {
            strength = '弱';
            barWidth = 33;
            barColorClass = 'strength-weak';
            passwordStrength.classList.add('show');
        } else if (score < 5) {
            strength = '中';
            barWidth = 66;
            barColorClass = 'strength-medium';
            passwordStrength.classList.add('show');
        } else {
            strength = '强';
            barWidth = 100;
            barColorClass = 'strength-strong';
            passwordStrength.classList.add('show');
        }

        passwordStrength.classList.remove('strength-weak', 'strength-medium', 'strength-strong');
        if (barColorClass) {
            passwordStrength.classList.add(barColorClass);
        }

        passwordStrengthBar.style.width = `${barWidth}%`;
        passwordStrengthText.textContent = `强度：${strength}`;
        passwordSuggestionsText.textContent = suggestions.length > 0 ? `建议：${suggestions.join(' ')}` : '';

        if (strength === '强') {
            passwordSuggestionsText.textContent = '密码强度极佳！';
        }
        return score >= 3;
    }

    function validateUsernameInput(username) {
        if (username.length === 0) {
            hideHint(usernameHint);
            setStatusIcon(usernameStatus, 'none');
            return false;
        }
        if (username.length < 3) {
            setHint(usernameHint, '用户名至少需要3个字符。', true);
            setStatusIcon(usernameStatus, 'error');
            return false;
        }
        if (username.length > 20) {
            setHint(usernameHint, '用户名不能超过20个字符。', true);
            setStatusIcon(usernameStatus, 'error');
            return false;
        }
        setHint(usernameHint, '验证中...', false);
        setStatusIcon(usernameStatus, 'loading');
        return true;
    }

    async function checkUsernameExistence() {
        const username = usernameInput.value.trim();
        clearErrorMessage();

        if (!validateUsernameInput(username)) {
            isUserRegistered = null;
            updateSubmitButtonText();
            showConfirmPasswordGroup(false);
            return;
        }

        try {
            const response = await fetch(`/api/auth.mjs?username=${encodeURIComponent(username)}`);
            const result = await response.json();

            if (result.exists) {
                isUserRegistered = true;
                setStatusIcon(usernameStatus, 'success');
                setHint(usernameHint, '用户名已存在，请登录。');
                showConfirmPasswordGroup(false);
            } else {
                isUserRegistered = false;
                setStatusIcon(usernameStatus, 'success');
                setHint(usernameHint, '用户名可用，请注册。');
                showConfirmPasswordGroup(true);
            }
        } catch (error) {
            isUserRegistered = null;
            setStatusIcon(usernameStatus, 'error');
            setHint(usernameHint, '无法验证用户名，请稍后再试。', true);
            showConfirmPasswordGroup(false);
        } finally {
            updateSubmitButtonText();
            validatePasswordInput();
        }
    }

    function validatePasswordInput() {
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        let isValid = evaluatePasswordStrength(password);

        if (isUserRegistered === false) {
            if (password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword) {
                setHint(confirmPasswordHint, '两次输入的密码不一致。', true);
                isValid = false;
            } else if (confirmPassword.length === 0 && password.length > 0) {
                setHint(confirmPasswordHint, '请再次输入密码进行确认。', true);
                isValid = false;
            } else {
                hideHint(confirmPasswordHint);
            }
        }
        return isValid;
    }

    usernameInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        clearErrorMessage();
        const username = usernameInput.value.trim();
        if (username.length >= 3 && username.length <= 20) {
            debounceTimer = setTimeout(checkUsernameExistence, 500);
        } else {
            validateUsernameInput(username);
            isUserRegistered = null;
            updateSubmitButtonText();
            showConfirmPasswordGroup(false);
            hideHint(passwordStrength);
        }
    });

    passwordInput.addEventListener('input', () => {
        clearErrorMessage();
        validatePasswordInput();
    });

    confirmPasswordInput.addEventListener('input', () => {
        clearErrorMessage();
        validatePasswordInput();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrorMessage();

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (!validateUsernameInput(username) || !validatePasswordInput(password)) {
            setHint(errorMessage, '请检查您的用户名和密码格式。', true);
            return;
        }

        if (isUserRegistered === false && password !== confirmPassword) {
            setHint(errorMessage, '注册时两次输入的密码不一致。', true);
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i>处理中...';

        try {
            const response = await fetch('/api/auth.mjs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '操作失败');
            }

            localStorage.setItem('surveyKitToken', result.token);

            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect') || './toolchain/management.html';
            window.location.href = redirectUrl;

        } catch (error) {
            setHint(errorMessage, error.message, true);
            submitBtn.disabled = false;
            updateSubmitButtonText();
        }
    });

    updateSubmitButtonText();
});