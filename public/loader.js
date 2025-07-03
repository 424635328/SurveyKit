// /public/loader.js

(async function() {
    // --- 1. 初始化和元素获取 ---
    const params = new URLSearchParams(window.location.search);
    const surveyId = params.get('sid');

    const loadingMessageElement = document.querySelector('.loading-message');
    const surveyContainer = document.querySelector('.survey-main-content-wrapper');
    const header = document.querySelector('.survey-header-top');

    const FETCH_TIMEOUT = 10000; // 设置10秒的请求超时

    // --- 2. 核心功能函数 ---

    /**
     * 更新加载状态的UI显示
     * @param {string} message - 要显示的消息
     * @param {boolean} [isError=false] - 是否为错误消息
     */
    function updateStatusUI(message, isError = false) {
        if (!loadingMessageElement) return;
        loadingMessageElement.textContent = message;
        loadingMessageElement.style.color = isError ? '#ef4444' : '#64748b'; // Red for error, gray for info
        loadingMessageElement.style.display = 'block';
    }

    /**
     * 显示致命错误，并清理页面UI
     * @param {string} message - 最终显示的错误信息
     */
    function displayFatalError(message) {
        updateStatusUI(`加载失败: ${message}`, true);
        // 隐藏主问卷区域和顶部进度条，避免显示一个破碎的页面
        if (surveyContainer) surveyContainer.style.display = 'none';
        if (header) header.style.display = 'none';
        
        // 可以在这里添加一个返回首页的链接，提升用户体验
        const homeLink = document.createElement('a');
        homeLink.href = '/';
        homeLink.textContent = '返回项目首页';
        homeLink.style.display = 'block';
        homeLink.style.textAlign = 'center';
        homeLink.style.marginTop = '20px';
        loadingMessageElement.parentNode.appendChild(homeLink);
    }
    
    /**
     * 动态创建并加载主 survey.js 脚本
     */
    function loadSurveyScript() {
        const script = document.createElement('script');
        script.src = 'survey.js';
        script.type = 'module'; // 保持和之前一致，如果 survey.js 是模块
        script.onerror = () => {
            displayFatalError('核心脚本(survey.js)加载失败，请检查网络或联系管理员。');
        };
        document.body.appendChild(script);
    }

    // --- 3. 主逻辑执行 ---

    if (surveyId) {
        // --- 新模式：加载动态问卷 ---
        updateStatusUI(`正在加载问卷 (ID: ${surveyId})...`);

        try {
            // 设置请求超时
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

            const response = await fetch(`/api/get-public-survey.mjs?sid=${surveyId}`, {
                signal: controller.signal
            });

            // 清除超时计时器
            clearTimeout(timeoutId);

            // 处理HTTP错误
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`找不到ID为 "${surveyId}" 的问卷。`);
                }
                const errorData = await response.json().catch(() => null);
                const serverMessage = errorData ? errorData.message : response.statusText;
                throw new Error(`服务器返回错误 ${response.status}: ${serverMessage}`);
            }

            // 处理数据格式错误
            const data = await response.json();
            if (!data || !data.questions || !data.title) {
                throw new Error('从服务器获取的问卷数据格式不正确。');
            }

            // 将获取到的数据存储到 sessionStorage，供 survey.js 读取
            sessionStorage.setItem('dynamicSurveyData', JSON.stringify(data.questions));
            
            // 更新页面标题和问卷标题
            document.title = `${data.title} - SurveyKit`;
            const surveyTitleElement = document.querySelector('.section-title');
            if (surveyTitleElement) surveyTitleElement.textContent = data.title;
            const surveySubtitleElement = document.querySelector('.section-subtitle');
            if (surveySubtitleElement && data.subtitle) surveySubtitleElement.textContent = data.subtitle;

            // 所有数据准备就绪，加载主脚本进行渲染
            loadSurveyScript();

        } catch (error) {
            console.error('加载动态问卷时发生严重错误:', error);
            let errorMessage = error.message;
            if (error.name === 'AbortError') {
                errorMessage = `请求超时（超过 ${FETCH_TIMEOUT / 1000} 秒），请检查您的网络连接。`;
            }
            displayFatalError(errorMessage);
        }

    } else {
        // --- 旧模式：加载本地默认问卷 ---
        loadSurveyScript();
    }
})();