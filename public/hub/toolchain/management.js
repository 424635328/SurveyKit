document.addEventListener('DOMContentLoaded', () => {
    
    function checkAuth() {
        const token = localStorage.getItem('surveyKitToken');
        if (!token) {
            window.location.href = `../login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
            return null;
        }
        return token;
    }

    const token = checkAuth();
    if (!token) return;

    function initApp() {
        document.body.classList.add('aurora-background');
        initMobileMenu();
        initHeaderScrollEffect();
        initScrollAnimations();
        initScrollToTopButton();
        updateFooterYear();
        initManagementPage();
    }

    function initManagementPage() {
        const listContainer = document.getElementById('survey-list-container');
        const noSurveysMessage = document.getElementById('no-surveys-message');
        const uploadSurveyBtn = document.getElementById('upload-survey-btn');
        const fileInput = document.getElementById('file-input-hidden');
        const shareModal = document.getElementById('share-modal');
        const deleteModal = document.getElementById('delete-modal');
        let surveyToDeleteId = null;
        let surveysCache = [];

        function createSurveyCard(survey) {
            const card = document.createElement('div');
            card.className = 'survey-card';
            card.dataset.surveyId = survey.id;
            card.dataset.surveyTitle = survey.title;
            const creationDate = new Date(survey.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
            
            // **核心修改点：更新了所有按钮的链接和功能**
            card.innerHTML = `
                <div class="survey-header">
                    <div class="survey-info">
                        <h4>${escapeHtml(survey.title)}</h4>
                        <p>ID: ${survey.id}</p>
                    </div>
                    <div class="survey-stats">
                        <div class="stat-item">
                            <div class="count">${survey.submissionCount || 0}</div>
                            <div class="label">份回答</div>
                        </div>
                    </div>
                </div>
                <p class="text-xs text-slate-500">创建于: ${creationDate}</p>
                <div class="survey-actions">
                    <button class="action-btn share-btn"><i class="fa fa-share-alt"></i> 分享</button>
                    <a href="./results.html?id=${survey.id}" class="action-btn"><i class="fa fa-bar-chart"></i> 查看结果</a>
                    <button class="action-btn delete-btn delete"><i class="fa fa-trash-o"></i> 删除</button>
                </div>
            `;
            return card;
        }

        function renderSurveyList(surveys) {
            surveysCache = surveys;
            const loadingState = listContainer.querySelector('.loading-state');
            if(loadingState) loadingState.remove();

            if (!surveys || surveys.length === 0) {
                noSurveysMessage.classList.remove('hidden');
                listContainer.innerHTML = '';
                listContainer.appendChild(noSurveysMessage);
                return;
            }
            noSurveysMessage.classList.add('hidden');
            surveys.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            listContainer.innerHTML = '';

            surveys.forEach(survey => {
                const card = createSurveyCard(survey);
                listContainer.appendChild(card);
            });
            attachActionListeners();
        }

        function attachActionListeners() {
            document.querySelectorAll('.share-btn').forEach(button => button.addEventListener('click', handleShareClick));
            document.querySelectorAll('.delete-btn').forEach(button => button.addEventListener('click', handleDeleteClick));
        }
        
        function handleShareClick(event) {
            const card = event.target.closest('.survey-card');
            const surveyId = card.dataset.surveyId;
            const surveyTitle = card.dataset.surveyTitle;
            const shareUrl = `./share.html?id=${surveyId}&title=${encodeURIComponent(surveyTitle)}`;
            window.open(shareUrl, '_blank');
        }
        
        function handleDeleteClick(event) {
            surveyToDeleteId = event.target.closest('.survey-card').dataset.surveyId;
            const surveyTitle = event.target.closest('.survey-card').querySelector('h4').textContent;
            document.getElementById('delete-survey-title').textContent = `“${surveyTitle}”`;
            deleteModal.hidden = false;
        }

        async function confirmDelete() {
            if(!surveyToDeleteId) return;
            try {
                const response = await fetch('/api/surveys.mjs', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ surveyId: surveyToDeleteId })
                });
                if (!response.ok) throw new Error((await response.json()).message || '删除失败');
                
                const cardToDelete = document.querySelector(`.survey-card[data-survey-id="${surveyToDeleteId}"]`);
                if (cardToDelete) {
                    cardToDelete.style.transition = 'opacity 0.3s, transform 0.3s';
                    cardToDelete.style.opacity = '0';
                    cardToDelete.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                       cardToDelete.remove();
                       surveysCache = surveysCache.filter(s => s.id !== surveyToDeleteId);
                       if (surveysCache.length === 0) noSurveysMessage.classList.remove('hidden');
                    }, 300);
                }
            } catch (error) { alert(`删除失败: ${error.message}`);
            } finally { deleteModal.hidden = true; surveyToDeleteId = null; }
        }

        function setupModals() {
            shareModal.querySelector('.modal-close-btn').addEventListener('click', () => shareModal.hidden = true);
            shareModal.addEventListener('click', (e) => { if (e.target === shareModal) shareModal.hidden = true; });
            document.getElementById('copy-link-btn').addEventListener('click', (e) => {
                navigator.clipboard.writeText(document.getElementById('share-link-input').value);
                const btn = e.currentTarget;
                const originalIcon = btn.innerHTML;
                btn.innerHTML = '<i class="fa fa-check"></i>';
                setTimeout(() => { btn.innerHTML = originalIcon; }, 1500);
            });
            deleteModal.querySelector('.modal-cancel-btn').addEventListener('click', () => deleteModal.hidden = true);
            deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) deleteModal.hidden = true; });
            document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
        }

        async function fetchAndRenderSurveys() {
            try {
                const response = await fetch('/api/surveys.mjs', { headers: { 'Authorization': `Bearer ${token}` } });
                if (response.status === 401) { localStorage.removeItem('surveyKitToken'); checkAuth(); return; }
                if (!response.ok) throw new Error('无法获取问卷列表');
                const surveys = await response.json();
                renderSurveyList(surveys);
            } catch(error) {
                const loadingState = listContainer.querySelector('.loading-state');
                if(loadingState) loadingState.textContent = `加载失败: ${error.message}`;
            }
        }

        function handleFileUpload(file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const title = prompt("请输入新问卷的标题:", file.name.replace('.json', ''));
                if (title === null || title.trim() === '') return alert('已取消导入。');
                
                uploadSurveyBtn.disabled = true;
                uploadSurveyBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-3"></i>正在上传...';

                try {
                    const response = await fetch('/api/upload-survey.mjs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ title: title.trim(), questionsJSON: event.target.result })
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message || '上传失败');
                    
                    noSurveysMessage.classList.add('hidden');
                    const newCard = createSurveyCard(result.survey);
                    newCard.style.opacity = '0';
                    newCard.style.transform = 'translateY(20px)';
                    listContainer.prepend(newCard);
                    setTimeout(() => {
                        newCard.style.transition = 'opacity 0.5s, transform 0.5s';
                        newCard.style.opacity = '1';
                        newCard.style.transform = 'translateY(0)';
                    }, 50);

                    attachActionListeners();
                    surveysCache.push(result.survey);

                } catch (error) {
                    alert(`上传失败: ${error.message}`);
                } finally {
                    uploadSurveyBtn.disabled = false;
                    uploadSurveyBtn.innerHTML = '<i class="fa fa-upload mr-3"></i> 导入问卷';
                    fileInput.value = '';
                }
            };
            reader.readAsText(file);
        }

        uploadSurveyBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleFileUpload(e.target.files[0]);
        });
        
        function escapeHtml(str) {
            return str.replace(/[&<>"']/g, function(match) {
                return { '&': '&', '<': '<', '>': '>', '"': '"', "'": '\'' }[match];
            });
        }

        setupModals();
        fetchAndRenderSurveys();
    }
    
    function initMobileMenu() { const menuToggle = document.getElementById('menu-toggle'), mobileMenu = document.getElementById('mobile-menu'), icon = menuToggle?.querySelector('i'); if (!menuToggle || !mobileMenu || !icon) return; menuToggle.addEventListener('click', () => { mobileMenu.classList.toggle('hidden'); icon.classList.toggle('fa-bars'); icon.classList.toggle('fa-times'); }); }
    function initHeaderScrollEffect() { const header = document.querySelector('header'); if (!header) return; const SCROLL_THRESHOLD = 50; const toggleHeaderScrolledClass = () => { header.classList.toggle('header-scrolled', window.scrollY > SCROLL_THRESHOLD); }; toggleHeaderScrolledClass(); window.addEventListener('scroll', toggleHeaderScrolledClass, { passive: true }); }
    function initScrollAnimations() { const animatedElements = document.querySelectorAll('[data-animate="reveal-up"]'); if (animatedElements.length === 0) return; const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); } else { entry.target.classList.remove('is-visible'); } }); }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }); animatedElements.forEach(element => observer.observe(element)); }
    function initScrollToTopButton() { const scrollToTopBtn = document.getElementById('scrollToTopBtn'); if (!scrollToTopBtn) return; const SCROLL_VISIBLE_THRESHOLD = 300; const toggleButtonVisibility = () => { if (window.scrollY > SCROLL_VISIBLE_THRESHOLD) { scrollToTopBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4'); scrollToTopBtn.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0'); } else { scrollToTopBtn.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0'); scrollToTopBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4'); } }; window.addEventListener('scroll', toggleButtonVisibility, { passive: true }); scrollToTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); }); toggleButtonVisibility(); }
    function updateFooterYear() { const currentYearFooter = document.getElementById('current-year-footer'); if (currentYearFooter) { currentYearFooter.textContent = new Date().getFullYear(); } }

    initApp();
});// 管理端脚本