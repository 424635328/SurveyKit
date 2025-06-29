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
  }

  /**
   * Initializes the mobile menu toggle functionality.
   */
  function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const icon = menuToggle?.querySelector('i'); // Use optional chaining for safety

    // Guard clause: If elements don't exist, do nothing.
    if (!menuToggle || !mobileMenu || !icon) {
      console.warn('Mobile menu elements not found. Skipping initialization.');
      return;
    }

    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      // More concise icon toggling
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

    // Define a class in CSS called `header-scrolled` that contains the styles.
    // e.g., header.header-scrolled { padding-top: 0.5rem; padding-bottom: 0.5rem; box-shadow: ...; }
    const SCROLL_THRESHOLD = 50;
    
    // A more performant approach that only changes the class when the state actually changes.
    let isScrolled = window.scrollY > SCROLL_THRESHOLD;
    header.classList.toggle('header-scrolled', isScrolled);

    window.addEventListener('scroll', () => {
      const shouldBeScrolled = window.scrollY > SCROLL_THRESHOLD;
      if (shouldBeScrolled !== isScrolled) {
        isScrolled = shouldBeScrolled;
        header.classList.toggle('header-scrolled', isScrolled);
      }
    }, { passive: true }); // Use passive listener for better scroll performance
  }

  /**
   * Initializes the fade-in-on-view animations using IntersectionObserver.
   * Recommends using a dedicated data-attribute for selecting elements.
   */
  function initFadeInAnimations() {
    // It's better practice to use a data-attribute like `data-animate`
    // instead of a long, brittle CSS selector.
    // e.g., <div class="card-hover" data-animate="fade-in">
    const animatedElements = document.querySelectorAll('[data-animate="fade-in"]');
    if (animatedElements.length === 0) return;

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target); // Stop observing once animated
        }
      });
    }, { 
      threshold: 0.1, // Element is considered visible when 10% is in view
      rootMargin: '0px 0px -50px 0px' // Start animation a bit sooner
    });

    animatedElements.forEach(element => {
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
          // Ensure it's not just a standalone '#'
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

  // Run the application
  initApp();
});