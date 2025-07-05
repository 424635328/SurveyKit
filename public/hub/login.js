document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('auth-form');
            const usernameInput = document.getElementById('username');
            const usernameStatus = document.getElementById('username-status');
            const usernameHint = document.getElementById('username-hint');
            const passwordHint = document.getElementById('password-hint');
            const submitBtn = document.getElementById('submit-btn');
            const errorMessage = document.getElementById('error-message');
            
            let debounceTimer;
            let isUserRegistered = null;

            async function checkUsername() {
                const username = usernameInput.value.trim();
                usernameStatus.classList.remove('show', 'fa-check', 'fa-times', 'text-green-500', 'text-red-500');
                usernameHint.textContent = '';
                passwordHint.classList.remove('show');
                submitBtn.textContent = '登录 / 注册';
                isUserRegistered = null;

                if (username.length < 3) return;

                usernameStatus.classList.add('show', 'fa-spinner', 'fa-spin');

                try {
                    const response = await fetch(`/api/auth.mjs?username=${encodeURIComponent(username)}`);
                    const result = await response.json();
                    
                    usernameStatus.classList.remove('fa-spinner', 'fa-spin');
                    if (result.exists) {
                        isUserRegistered = true;
                        usernameStatus.classList.add('fa-check', 'text-green-500');
                        usernameHint.textContent = '用户名已存在，请输入密码登录。';
                        passwordHint.textContent = '请输入密码登录';
                        submitBtn.textContent = '登录';
                    } else {
                        isUserRegistered = false;
                        usernameStatus.classList.add('fa-check', 'text-green-500');
                        usernameHint.textContent = '用户名可用！';
                        passwordHint.textContent = '请输入密码完成注册';
                        submitBtn.textContent = '注册';
                    }
                    passwordHint.classList.add('show');
                } catch (error) {
                    isUserRegistered = null;
                    usernameStatus.classList.add('fa-times', 'text-red-500');
                    usernameHint.textContent = '无法验证用户名';
                }
            }

            usernameInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(checkUsername, 500);
            });

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
                errorMessage.classList.remove('show');

                const username = form.username.value;
                const password = form.password.value;

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
                    errorMessage.textContent = error.message;
                    errorMessage.classList.add('show');
                    submitBtn.disabled = false;
                    submitBtn.textContent = isUserRegistered ? '登录' : (isUserRegistered === false ? '注册' : '登录 / 注册');
                }
            });
        });