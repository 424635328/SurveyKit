// public/hub/hub.js
document.addEventListener('DOMContentLoaded', () => {

  function initThoughtOfDay() {
    const el = document.getElementById('thought-of-day');
    if (!el) return;
    const quotes = [
      { text: '提出好问题，比给出好答案更重要。', author: '法郎士' },
      { text: '认识你自己。', author: '苏格拉底' },
      { text: '我们听到的一切都是一个观点，不是事实。我们看到的一切都是一个视角，不是真相。', author: '马可·奥勒留' },
      { text: '思考是灵魂与自己的对话。', author: '柏拉图' },
      { text: '生命的全部意义在于探索未知。', author: '左拉' },
      { text: '答案就在你心中，问题只是帮你找到它。', author: '鲁米' },
      { text: '好奇心是学习永恒的火焰。', author: '爱默生' },
      { text: '有时候，问题比答案本身更复杂，但这正是乐趣所在。', author: '道格拉斯·亚当斯' },
      { text: '每一个人都是一个月亮，都有一个不愿示人的黑暗面。', author: '马克·吐温' },
      { text: '你最大的敌人，往往是你最不了解的自己。', author: '荣格' },
    ];
    const idx = new Date().getDate() % quotes.length;
    const q = quotes[idx];
    el.innerHTML = `<p class="text-sm text-indigo-400 italic">"${q.text}"</p><p class="text-xs text-slate-400 mt-1">— ${q.author}</p>`;
    requestAnimationFrame(() => { el.classList.remove('opacity-0'); });
  }

  function initApp() {
    document.body.classList.add('aurora-background');
    initMobileMenu();
    initHeaderScrollEffect();
    initScrollAnimations();
    initScrollToTopButton();
    initThoughtOfDay();
    updateFooterYear();
  }

  function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const icon = menuToggle?.querySelector('i');

    if (!menuToggle || !mobileMenu || !icon) {
      return;
    }

    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-times');
    });
  }

  function initHeaderScrollEffect() {
    const header = document.querySelector('header');
    if (!header) return;

    const SCROLL_THRESHOLD = 50;

    const toggleHeaderScrolledClass = () => {
      header.classList.toggle('header-scrolled', window.scrollY > SCROLL_THRESHOLD);
    };

    toggleHeaderScrolledClass();
    window.addEventListener('scroll', toggleHeaderScrolledClass, { passive: true });
  }

  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate="reveal-up"]');
    if (animatedElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const target = entry.target;
        if (entry.isIntersecting) {
          target.classList.add('is-visible');
        } else {
          target.classList.remove('is-visible');
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    const delayIncrement = 0.05;
    let currentDelay = 0;

    animatedElements.forEach((element) => {
      element.style.setProperty('--animation-delay', `${currentDelay}s`);
      const textElements = element.querySelectorAll('[data-reveal-text]');
      textElements.forEach((el, index) => {
        el.style.setProperty('--text-reveal-delay', `${index * 0.1 + 0.2}s`);
      });

      currentDelay += delayIncrement;
      observer.observe(element);
    });
  }

  function initScrollToTopButton() {
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (!scrollToTopBtn) return;

    const SCROLL_VISIBLE_THRESHOLD = 300;

    const toggleButtonVisibility = () => {
      if (window.scrollY > SCROLL_VISIBLE_THRESHOLD) {
        scrollToTopBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
        scrollToTopBtn.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
      } else {
        scrollToTopBtn.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
        scrollToTopBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
      }
    };

    window.addEventListener('scroll', toggleButtonVisibility, { passive: true });
    scrollToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    toggleButtonVisibility();
  }

  function updateFooterYear() {
    const currentYearFooter = document.getElementById('current-year-footer');
    if (currentYearFooter) {
      currentYearFooter.textContent = new Date().getFullYear();
    }
  }

  initApp();
});