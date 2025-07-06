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
        
        if (type === 'loading') {
            iconElement.classList.add('fa-spinner', 'fa-spin', 'show');
        } else if (type === 'success') {
            iconElement.classList.add('fa-check', 'text-green-500', 'show');
        } else if (type === 'error') {
            iconElement.classList.add('fa-times', 'text-red-500', 'show');
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
            confirmPasswordInput.setAttribute('required', 'true');
        } else {
            confirmPasswordGroup.classList.remove('show');
            confirmPasswordGroup.classList.add('hidden');
            confirmPasswordInput.removeAttribute('required');
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
            suggestions.push('长度至少6位');
        }
        if (password.length >= 10) {
            score += 1;
        }

        if (/[A-Z]/.test(password)) {
            score += 1;
        } else {
            suggestions.push('大写字母');
        }
        if (/[a-z]/.test(password)) {
            score += 1;
        } else {
            suggestions.push('小写字母');
        }
        if (/\d/.test(password)) {
            score += 1;
        } else {
            suggestions.push('数字');
        }
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            score += 1;
        } else {
            suggestions.push('特殊字符');
        }

        let strength = '';
        let barWidth = 0;
        let barColorClass = '';

        if (password.length === 0) {
            strength = '';
            barWidth = 0;
            hideHint(passwordStrength);
        } else {
            if (score < 3) {
                strength = '弱';
                barWidth = 33;
                barColorClass = 'strength-weak';
            } else if (score < 5) {
                strength = '中';
                barWidth = 66;
                barColorClass = 'strength-medium';
            } else {
                strength = '强';
                barWidth = 100;
                barColorClass = 'strength-strong';
            }
            passwordStrength.style.opacity = '1';
            passwordStrength.style.transform = 'translateY(0)';
        }

        passwordStrength.classList.remove('strength-weak', 'strength-medium', 'strength-strong');
        if (barColorClass) {
            passwordStrength.classList.add(barColorClass);
        }

        passwordStrengthBar.style.width = `${barWidth}%`;
        passwordStrengthText.textContent = `强度：${strength}`;
        
        if (strength === '强') {
            passwordSuggestionsText.textContent = '密码强度极佳！';
        } else {
            passwordSuggestionsText.textContent = suggestions.length > 0 ? `建议：请添加${suggestions.join('、')}。` : '';
        }
        
        const isStrongEnough = score >= 2; 
        return isStrongEnough;
    }

    function validateUsernameFormat(username) {
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
        return true;
    }

    async function checkUsernameExistence() {
        const username = usernameInput.value.trim();
        clearErrorMessage();

        if (!validateUsernameFormat(username)) {
            isUserRegistered = null;
            updateSubmitButtonText();
            showConfirmPasswordGroup(false);
            return;
        }
        
        setHint(usernameHint, '验证中...', false);
        setStatusIcon(usernameStatus, 'loading');

        try {
            const response = await fetch(`/api/auth.mjs?username=${encodeURIComponent(username)}`);
            const result = await response.json();

            if (response.ok) {
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
            } else {
                throw new Error(result.message || `服务器错误: ${response.status}`);
            }
        } catch (error) {
            isUserRegistered = null;
            setStatusIcon(usernameStatus, 'error');
            setHint(usernameHint, `无法验证用户名：${error.message}，请稍后再试。`, true);
            showConfirmPasswordGroup(false);
        } finally {
            updateSubmitButtonText();
            validatePasswordInput();
        }
    }

    function validatePasswordInput() {
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        let isStrengthValid = evaluatePasswordStrength(password);

        let isConfirmMatch = true;
        if (isUserRegistered === false) { 
            if (password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword) {
                setHint(confirmPasswordHint, '两次输入的密码不一致。', true);
                isConfirmMatch = false;
            } else if (password.length > 0 && confirmPassword.length === 0) { 
                setHint(confirmPasswordHint, '请再次输入密码进行确认。', true);
                isConfirmMatch = false;
            } else {
                hideHint(confirmPasswordHint);
            }
        } else {
            hideHint(confirmPasswordHint);
        }
        
        return isStrengthValid && isConfirmMatch;
    }

    usernameInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        clearErrorMessage();
        const username = usernameInput.value.trim();

        if (validateUsernameFormat(username)) {
            debounceTimer = setTimeout(checkUsernameExistence, 500);
        } else {
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

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (!validateUsernameFormat(username)) {
            setHint(errorMessage, '用户名格式不正确，请检查。', true);
            return;
        }
        
        if (isUserRegistered === null) {
            setHint(errorMessage, '请等待用户名验证完成再提交。', true);
            checkUsernameExistence(); 
            return;
        }

        const isPasswordStrengthValid = evaluatePasswordStrength(password);
        if (!isPasswordStrengthValid) {
            setHint(errorMessage, passwordSuggestionsText.textContent || '密码强度不足，请加强密码。', true);
            return;
        }

        let passwordsMatch = true;
        if (isUserRegistered === false) { 
             if (password.length === 0 || confirmPassword.length === 0 || password !== confirmPassword) {
                passwordsMatch = false;
            }
        }

        if (!passwordsMatch) { 
            setHint(errorMessage, '两次输入的密码不一致，请检查。', true);
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
                throw new Error(result.message || '操作失败，请重试');
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