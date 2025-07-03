// /public/loader.js
(async function() {
    const params = new URLSearchParams(window.location.search);
    const surveyId = params.get('sid');

    const loadingMessageElement = document.querySelector('.loading-message');

    function loadOriginalScript() {
        const script = document.createElement('script');
        script.src = 'survey.js';
        script.type = 'module';
        document.body.appendChild(script);
    }
    
    function showLoadingError(message) {
        if(loadingMessageElement) {
            loadingMessageElement.textContent = `加载问卷失败：${message}`;
            loadingMessageElement.style.color = 'red';
            loadingMessageElement.style.display = 'block';
        }
    }

    if (surveyId) {
        // --- 新模式：加载动态问卷 ---
        if(loadingMessageElement) {
            loadingMessageElement.textContent = `正在加载问卷 (ID: ${surveyId})...`;
        }
        
        try {
            const response = await fetch(`/api/get-public-survey.mjs?sid=${surveyId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '无法获取问卷数据');
            }

            // 将获取到的数据存储到 sessionStorage，供 survey.js 读取
            sessionStorage.setItem('dynamicSurveyData', JSON.stringify(data.questions));
            
            // 更新页面标题和问卷标题
            document.title = `${data.title} - SurveyKit`;
            const surveyTitleElement = document.querySelector('.section-title');
            if(surveyTitleElement) surveyTitleElement.textContent = data.title;
            
            // 现在可以加载原始的 survey.js
            loadOriginalScript();

        } catch (error) {
            console.error('Failed to load dynamic survey:', error);
            showLoadingError(error.message);
        }

    } else {
        // --- 旧模式：加载本地默认问卷 ---
        loadOriginalScript();
    }
})();