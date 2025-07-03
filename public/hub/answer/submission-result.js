// public/hub/answer/submission-result.js
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

    // 获取DOM元素
    const statusIcon = document.getElementById('status-icon');
    const statusTitle = document.getElementById('status-title');
    const statusMessage = document.getElementById('status-message');
    const backToHomeBtn = document.getElementById('back-to-home-btn');

    // 从URL获取参数 (虽然 surveyId 和 submissionId 仍可获取，但页面不再使用它们)
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status'); // 'success' or 'error'
    const message = params.get('message'); // 错误消息或自定义成功消息

    function renderResultPage() {
        if (status === 'success') {
            statusIcon.innerHTML = '<i class="fa fa-check-circle text-green-400 text-6xl"></i>';
            statusTitle.textContent = '问卷提交成功！';
            statusMessage.textContent = message || '感谢您的参与，您的回答已成功保存。';
            
        } else {
            statusIcon.innerHTML = '<i class="fa fa-times-circle text-red-400 text-6xl"></i>';
            statusTitle.textContent = '问卷提交失败！';
            statusMessage.textContent = message || '抱歉，提交过程中发生错误。请稍后再试。';
        }

        backToHomeBtn.onclick = () => {
            window.location.href = '../../index.html';
        };
    }

    // 初始化通用UI
    initMobileMenu();
    initHeaderScrollEffect();
    initScrollToTopButton();
    updateFooterYear();

    // 渲染结果页面
    renderResultPage();
});