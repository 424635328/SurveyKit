/**
 * SurveyKit - hub.js (Optimized Version)
 *
 * This script initializes all interactive elements on the hub page.
 * It's structured into modular functions for better readability and maintenance.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Main initialization function
  function initApp() {
    initMobileMenu();
    initHeaderScrollEffect();
    initFadeInAnimations();
    initSmoothScrolling();
    initScrollToTopButton(); // 新增：滚动到顶部按钮初始化
  }

  /**
   * Initializes the mobile menu toggle functionality.
   */
  function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const icon = menuToggle?.querySelector('i');

    if (!menuToggle || !mobileMenu || !icon) {
      console.warn('Mobile menu elements not found. Skipping initialization.');
      return;
    }

    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-times');
    });
  }

  /**
   * Optimizes the header style change on scroll.
   * Uses a single class toggle for better performance and separation of concerns.
   */
  function initHeaderScrollEffect() {
    const header = document.querySelector('header');
    if (!header) return;

    const SCROLL_THRESHOLD = 50; // 滚动超过此距离触发效果
    
    // 立即检查初始滚动位置
    let isScrolled = window.scrollY > SCROLL_THRESHOLD;
    header.classList.toggle('header-scrolled', isScrolled);

    window.addEventListener('scroll', () => {
      const shouldBeScrolled = window.scrollY > SCROLL_THRESHOLD;
      if (shouldBeScrolled !== isScrolled) { // 只有状态变化时才操作DOM，提高性能
        isScrolled = shouldBeScrolled;
        header.classList.toggle('header-scrolled', isScrolled);
      }
    }, { passive: true }); // 使用 passive listener for better scroll performance
  }

  /**
   * Initializes the fade-in-on-view animations using IntersectionObserver.
   * Elements with `data-animate="fade-in"` will fade in sequentially when they enter the viewport,
   * and can re-animate if they scroll out and back into view.
   */
  function initFadeInAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate="fade-in"]');

    if (animatedElements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 元素进入视口时，添加 'is-visible' 类
          entry.target.classList.add('is-visible');
        } else {
          // 元素离开视口时，移除 'is-visible' 类，使其回到初始的透明状态
          // 这样下次进入视口时可以再次触发动画
          entry.target.classList.remove('is-visible');
        }
      });
    }, {
      threshold: 0.1, // 元素10%进入视口时触发
      rootMargin: '0px 0px -50px 0px' // 使动画在元素实际进入视口50px之前就开始
    });

    const delayIncrement = 0.1; // 每个元素之间的动画延迟增加 0.1 秒
    let currentDelay = 0;

    animatedElements.forEach((element) => {
      // 设置 CSS 自定义属性 --animation-delay，用于控制动画开始时间
      element.style.setProperty('--animation-delay', `${currentDelay}s`);
      currentDelay += delayIncrement;

      // 优化：对于页面初次加载时已经在视口内的元素，直接触发其动画
      // 不再使用精确的 getBoundingClientRect，而是依靠 IntersectionObserver 的初始状态
      // Intersection Observer 首次检查时就会处理这些元素
      observer.observe(element);
    });
  }
  
  /**
   * Initializes smooth scrolling for all anchor links pointing to the same page.
   */
  function initSmoothScrolling() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
          const href = this.getAttribute('href');
          if (href.length > 1) { // 确保不是一个单纯的 '#'
            e.preventDefault();
            const targetElement = document.querySelector(href);
            if (targetElement) {
              targetElement.scrollIntoView({
                behavior: 'smooth'
              });
            }
          }
        });
    });
  }

  /**
   * Initializes the scroll-to-top button functionality.
   */
  function initScrollToTopButton() {
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (!scrollToTopBtn) return;

    const SCROLL_VISIBLE_THRESHOLD = 300; // 滚动超过此距离显示按钮

    window.addEventListener('scroll', () => {
      if (window.scrollY > SCROLL_VISIBLE_THRESHOLD) {
        scrollToTopBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
        scrollToTopBtn.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
      } else {
        scrollToTopBtn.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
        scrollToTopBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
      }
    }, { passive: true });

    scrollToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    // 页面加载时检查一次，如果已经在指定滚动位置以下，就显示按钮
    if (window.scrollY > SCROLL_VISIBLE_THRESHOLD) {
      scrollToTopBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
      scrollToTopBtn.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
    }
  }

  // Run the application
  initApp();
});