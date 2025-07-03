// public/search.js
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. 复用主页的移动菜单和页脚年份逻辑 ---
    const menuToggle = document.getElementById('menu-toggle');
    const menuIcon = document.getElementById('menu-icon');
    const mobileMenu = document.getElementById('mobile-menu');
    const currentYearEl = document.getElementById('current-year');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.classList.toggle('hidden');
            menuIcon.classList.toggle('fa-bars');
            menuIcon.classList.toggle('fa-times');
        });
    }
    
    if(currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    // --- 2. 定义网站的可搜索内容索引 (与之前相同) ---
    const searchIndex = [
        { id: 'home', title: '项目主页', description: '了解 SurveyKit 的核心理念和功能亮点。', url: './index.html', icon: 'fa-home', keywords: ['首页', '介绍', '亮点', 'readme', '欢迎'] },
        { id: 'tool-hub', title: '工具中心', description: '一站式访问所有核心工具，包括编辑器、预览器和校验器。', url: './hub/hub.html', icon: 'fa-wrench', keywords: ['工具', 'hub', '功能', '管理', 'toolchain'] },
        { id: 'editor', title: '可视化问卷编辑器', description: '通过图形界面创建、编辑和导出你的专属问卷。', url: './hub/custom-questions/index.html', icon: 'fa-edit', keywords: ['创建问卷', '编辑器', '自定义', '制作', 'json'] },
        { id: 'help-docs', title: '帮助文档', description: '查找关于如何使用、部署和定制 SurveyKit 的详细指南。', url: './docs/help.html', icon: 'fa-book', keywords: ['文档', '帮助', '教程', '指南', '部署', '定制', 'help'] },
        { id: 'ai-analysis', title: 'AI 人格分析', description: '了解如何使用由火山方舟大模型驱动的 AI 人格分析功能。', url: './mbti.html', icon: 'fa-android', keywords: ['ai', 'mbti', '人工智能', '分析', '报告', '火山方舟'] },
        { id: 'result-viewer', title: '答案预览与分享', description: '查看已提交的问卷答案，与朋友对比默契度，或导出结果。', url: './viewer.html', icon: 'fa-eye', keywords: ['结果', '查看答案', '分享', '对比', '默契度', '导出'] },
        { id: 'security', title: '安全实践', description: '了解 SurveyKit 在数据安全和隐私保护方面的措施。', url: './docs/help.html#%EF%B8%8F-安全性-security', icon: 'fa-shield', keywords: ['安全', '隐私', 'serverless', 'api', 'xss', 'security'] },
        { id: 'recover', title: '找回问卷链接', description: '如果丢失了专属结果链接，可以在这里通过邮箱找回。', url: './recover.html', icon: 'fa-key', keywords: ['找回', '恢复', '丢失链接', '邮箱', 'recover'] }
    ];

    // --- 3. 获取搜索页面专属的 DOM 元素 ---
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const resultsInfo = document.getElementById('resultsInfo');
    const resultsList = document.getElementById('resultsList');
    const noResultsContainer = document.getElementById('noResults');
    const noResultsQuery = document.getElementById('noResultsQuery');
    const cardTemplate = document.getElementById('resultCardTemplate');

    // --- 4. 核心搜索与渲染逻辑 (已更新以适配新模板) ---
    const performSearch = (query) => {
        const lowerCaseQuery = query.toLowerCase().trim();
        if (!lowerCaseQuery) {
            resultsInfo.textContent = '请输入关键词以开始探索 SurveyKit 的世界。';
            resultsList.innerHTML = '';
            noResultsContainer.classList.add('hidden');
            return;
        }

        const results = searchIndex.filter(item => {
            const fullText = `${item.title} ${item.description} ${item.keywords.join(' ')}`.toLowerCase();
            return fullText.includes(lowerCaseQuery);
        });

        displayResults(results, query);
    };

    const displayResults = (results, query) => {
        resultsList.innerHTML = ''; // 清空旧结果

        if (results.length > 0) {
            resultsInfo.textContent = `为您找到 ${results.length} 条关于 "${query}" 的结果：`;
            noResultsContainer.classList.add('hidden');

            results.forEach((item, index) => {
                const card = cardTemplate.content.cloneNode(true).querySelector('a');
                
                card.href = item.url;
                card.querySelector('.fa').classList.add(item.icon);
                card.querySelector('h3').textContent = item.title;
                card.querySelector('p').textContent = item.description;
                
                // 为卡片添加入场动画
                card.classList.add('card-enter-animation');
                card.style.animationDelay = `${index * 0.07}s`;

                resultsList.appendChild(card);
            });
        } else {
            resultsInfo.textContent = '';
            noResultsQuery.textContent = query;
            noResultsContainer.classList.remove('hidden');
        }
    };

    // --- 5. 事件绑定与初始化 ---
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value;
        const url = new URL(window.location);
        url.searchParams.set('q', query);
        history.pushState({}, '', url);
        performSearch(query);
    });
    
    const initialUrlParams = new URLSearchParams(window.location.search);
    const initialQuery = initialUrlParams.get('q');

    if (initialQuery) {
        searchInput.value = initialQuery;
        performSearch(initialQuery);
    } else {
        resultsInfo.textContent = '准备就绪，等你探索。';
    }
});