// home.js - (最终整合版)

document.addEventListener("DOMContentLoaded", () => {
  // --- 移动端导航菜单控制 ---
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const menuIcon = document.getElementById("menu-icon");

  if (menuToggle && mobileMenu && menuIcon) {
    menuToggle.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
      const isExpanded = !mobileMenu.classList.contains("hidden");
      menuToggle.setAttribute("aria-expanded", String(isExpanded));
      if (isExpanded) {
        menuIcon.classList.remove("fa-bars");
        menuIcon.classList.add("fa-times");
      } else {
        menuIcon.classList.remove("fa-times");
        menuIcon.classList.add("fa-bars");
      }
    });
  }

  // --- 向下滚动提示的控制 ---
  const scrollIndicator = document.getElementById("scroll-down-indicator");
  if (scrollIndicator) {
    window.addEventListener(
      "scroll",
      () => {
        if (window.scrollY > 50) {
          scrollIndicator.classList.add("hidden");
        } else {
          scrollIndicator.classList.remove("hidden");
        }
      },
      { passive: true }
    );
  }

  // --- 页面入场动画系统 ---

  /**
   * 为文本中的每个词（或字）包裹一个 <span>，用于动画。
   */
  const wrapTextForAnimation = (element) => {
    if (!element || !element.dataset.text || element.childElementCount > 0)
      return;
    const text = element.dataset.text;
    const words = text.match(/[\w']+|[\u4e00-\u9fa5]|\S/g) || [];
    element.innerHTML = words
      .map(
        (word, index) =>
          `<span class="animated-char" style="--i:${index};">${word}</span>`
      )
      .join(" ");
  };

  /**
   * 重置一个区块的动画状态。
   */
  const resetSectionAnimation = (section) => {
    const textElements = section.querySelectorAll(
      "[data-text].start-animation"
    );
    textElements.forEach((el) => {
      el.classList.remove("start-animation");
      el.innerHTML = "";
    });

    const fadeElements = section.querySelectorAll(
      ".fade-in-element.is-visible"
    );
    fadeElements.forEach((el) => {
      el.classList.remove("is-visible");
    });
  };

  /**
   * 触发一个区块内的所有动画。
   */
  const animateSection = (section) => {
    const textElements = section.querySelectorAll("[data-text]");
    const fadeElements = section.querySelectorAll(".fade-in-element");

    textElements.forEach(wrapTextForAnimation);

    setTimeout(() => {
      textElements.forEach((el) => el.classList.add("start-animation"));
    }, 100);

    setTimeout(() => {
      fadeElements.forEach((el) => el.classList.add("is-visible"));
    }, 300);
  };

  /**
   * 协调整个页面的动画流程。
   */
  const initPageAnimations = () => {
    if (!("IntersectionObserver" in window)) {
      console.warn(
        "IntersectionObserver not supported. Fallback to showing all content."
      );
      fallbackNoAnimation();
      return;
    }

    try {
      console.log("Initializing repeatable page animations...");

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const section = entry.target;
            if (entry.isIntersecting) {
              animateSection(section);
            } else {
              resetSectionAnimation(section);
            }
          });
        },
        { threshold: 0.2 }
      );

      document.querySelectorAll(".animated-section").forEach((section) => {
        observer.observe(section);
      });
    } catch (error) {
      console.error("Home page animation failed to initialize:", error);
      fallbackNoAnimation();
    }
  };

  /**
   * 动画失败或浏览器不支持时的回退逻辑
   */
  const fallbackNoAnimation = () => {
    document.querySelectorAll("[data-text]").forEach((el) => {
      el.textContent = el.dataset.text;
      el.style.visibility = "visible";
    });
    document.querySelectorAll(".fade-in-element").forEach((el) => {
      el.classList.add("is-visible");
    });
  };

  window.addEventListener("load", initPageAnimations);
});
