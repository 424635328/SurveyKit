document.addEventListener("DOMContentLoaded", () => {
    // 渐变色类数组
    const gradientClasses = ['gradient-1', 'gradient-2', 'gradient-3', 'gradient-4', 'gradient-5'];

    // 主内容区淡入效果（页面加载时一次性触发）
    const mainContent = document.querySelector('main');
    if (mainContent) {
        setTimeout(() => {
            mainContent.classList.add('is-loaded');
        }, 100);
    }

    // 重新构建打字机文本内容并触发其动画
    const triggerTypewriterEffect = (element, charDelay) => {
        const text = element.getAttribute('data-text');
        if (!text) return;

        element.innerHTML = ''; // 清空内容以重新打字

        const characters = Array.from(text);
        characters.forEach((char, charIndex) => {
            setTimeout(() => {
                const span = document.createElement('span');
                span.className = 'typewriter-char';
                span.textContent = char;
                
                if (char.trim() !== '') {
                     const randomGradient = gradientClasses[Math.floor(Math.random() * gradientClasses.length)];
                     if (element.classList.contains('section-heading') || 
                         element.classList.contains('category-title') ||
                         element.classList.contains('pili-card-subtitle')) {
                        span.classList.add('gradient-text', randomGradient);
                     }
                }
                element.appendChild(span);

                // 强制触发 reflow 来重新播放动画
                void span.offsetWidth; // 这一行是关键，确保动画能重复播放
                span.style.animation = `char-reveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards`;

            }, charIndex * charDelay);
        });
    };

    // 设置 Intersection Observer 观察所有需要重复动画的元素
    const observerOptions = {
        root: null, // 观察整个视口
        rootMargin: '0px',
        threshold: 0.1 // 当元素10%可见时触发
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const element = entry.target;

            // 处理打字机文本元素
            if (element.classList.contains('section-heading') || 
                element.classList.contains('section-subheading') ||
                element.classList.contains('category-title') ||
                element.classList.contains('pili-card-subtitle')) {
                
                if (entry.isIntersecting) {
                    element.classList.add('is-visible');
                    // 根据元素类型设置不同的打字速度
                    let charDelay = 40; // 默认
                    if (element.classList.contains('section-subheading')) charDelay = 15;
                    else if (element.classList.contains('pili-card-subtitle')) charDelay = 30;
                    else if (element.classList.contains('category-title')) charDelay = 50;
                    
                    triggerTypewriterEffect(element, charDelay);
                } else {
                    element.classList.remove('is-visible');
                    element.innerHTML = ''; // 离开视口时清空内容，以便下次重新打字
                }
            } 
            // 处理 Pili Card 元素
            else if (element.classList.contains('pili-card')) {
                if (entry.isIntersecting) {
                    // 计算卡片在其父级 grid 中的索引，以实现错开延迟
                    const cardIndexInGrid = Array.from(element.parentNode.children).indexOf(element);
                    const delay = cardIndexInGrid * 120; // 错开延迟120ms
                    setTimeout(() => {
                        element.classList.add('is-visible');
                    }, delay);
                } else {
                    element.classList.remove('is-visible'); // 离开视口时移除类，使其回到初始隐藏状态
                }
            }
        });
    }, observerOptions);

    // 观察所有需要动画的元素
    document.querySelectorAll('.section-heading, .section-subheading, .category-title, .pili-card-subtitle, .pili-card').forEach(element => {
        observer.observe(element);
    });

    // 更新页脚年份
    const footerYear = document.getElementById('footer-year');
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }

    // 搜索按钮和移动菜单的交互逻辑 (保持不变)
    const searchToggleButton = document.getElementById('search-toggle-button');
    const searchToggleMobile = document.getElementById('search-toggle-mobile');
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');

    const handleSearchClick = (event) => {
        event.preventDefault();
        alert('搜索功能开发中...');
    };

    if (searchToggleButton) {
        searchToggleButton.addEventListener('click', handleSearchClick);
    }
    if (searchToggleMobile) {
        searchToggleMobile.addEventListener('click', handleSearchClick);
    }

    if (menuToggle && mobileMenu && menuIcon) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.classList.toggle('hidden');
            if (!isExpanded) {
                menuIcon.classList.remove('fa-bars');
                menuIcon.classList.add('fa-times');
            } else {
                menuIcon.classList.remove('fa-times');
                menuIcon.classList.add('fa-bars');
            }
        });
    }
});