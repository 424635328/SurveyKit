document.addEventListener('DOMContentLoaded', () => {

  function initApp() {
    document.body.classList.add('aurora-background');
    initMobileMenu();
    initHeaderScrollEffect();
    initScrollAnimations();
    initScrollToTopButton();
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
          // 如果希望动画只播放一次，请注释掉下面的 else 块
          target.classList.remove('is-visible');
        }
      });
    }, {
      threshold: 0.1, // 元素进入视口10%时触发
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