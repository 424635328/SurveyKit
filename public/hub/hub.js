// public/hub/hub.js
document.addEventListener('DOMContentLoaded', () => {
  function initApp() {
    initMobileMenu();
    initHeaderScrollEffect();
    initFadeInAnimations();
    initSmoothScrolling();
    initScrollToTopButton();
  }

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

  function initHeaderScrollEffect() {
    const header = document.querySelector('header');
    if (!header) return;

    const SCROLL_THRESHOLD = 50; 
    let isScrolled = window.scrollY > SCROLL_THRESHOLD;
    header.classList.toggle('header-scrolled', isScrolled);

    window.addEventListener('scroll', () => {
      const shouldBeScrolled = window.scrollY > SCROLL_THRESHOLD;
      if (shouldBeScrolled !== isScrolled) { 
        isScrolled = shouldBeScrolled;
        header.classList.toggle('header-scrolled', isScrolled);
      }
    }, { passive: true });
  }


  function initFadeInAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate="fade-in"]');

    if (animatedElements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          
          entry.target.classList.add('is-visible');
        } else {
         
          entry.target.classList.remove('is-visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    const delayIncrement = 0.1; 
    let currentDelay = 0;

    animatedElements.forEach((element) => {
      element.style.setProperty('--animation-delay', `${currentDelay}s`);
      currentDelay += delayIncrement;

      observer.observe(element);
    });
  }
  
  function initSmoothScrolling() {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
          const href = this.getAttribute('href');
          if (href.length > 1) { 
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

  function initScrollToTopButton() {
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (!scrollToTopBtn) return;

    const SCROLL_VISIBLE_THRESHOLD = 300; 

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

    if (window.scrollY > SCROLL_VISIBLE_THRESHOLD) {
      scrollToTopBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
      scrollToTopBtn.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
    }
  }

  initApp();
});