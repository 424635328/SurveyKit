document.addEventListener("DOMContentLoaded", () => {
  function initApp() {
    document.body.classList.add("aurora-background");
    initMobileMenu();
    initHeaderScrollEffect();
    initScrollAnimations();
    initScrollToTopButton();
    updateFooterYear();
    initCustomizer();
  }

  function mixColors(color1, color2, weight) {
    const d2h = (d) => d.toString(16);
    const h2d = (h) => parseInt(h, 16);

    let c1 = color1.slice(1);
    let c2 = color2.slice(1);
    if (c1.length === 3)
      c1 = c1
        .split("")
        .map((c) => c + c)
        .join("");
    if (c2.length === 3)
      c2 = c2
        .split("")
        .map((c) => c + c)
        .join("");

    const w = weight * 2 - 1;
    const w1 = (w / 1 + 1) / 2;
    const w2 = 1 - w1;

    const rgb = [
      Math.round(h2d(c1.slice(0, 2)) * w1 + h2d(c2.slice(0, 2)) * w2),
      Math.round(h2d(c1.slice(2, 4)) * w1 + h2d(c2.slice(4, 6)) * w2),
      Math.round(h2d(c1.slice(4, 6)) * w1 + h2d(c2.slice(0, 2)) * w2),
    ].map((c) => Math.max(0, Math.min(255, c)));

    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }
  function hexToRgba(hex, alpha = 1) {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      c = hex.substring(1).split("");
      if (c.length == 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = "0x" + c.join("");
      return (
        "rgba(" +
        [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",") +
        "," +
        alpha +
        ")"
      );
    }
    throw new Error("Bad Hex");
  }

  function initCustomizer() {
    const controls = {
      primaryColor: document.getElementById("primary-color-input"),
      primaryColorText: document.getElementById("primary-color-text"),
      bgColor: document.getElementById("background-color-input"),
      bgColorText: document.getElementById("background-color-text"),
      cardColor: document.getElementById("card-color-input"),
      cardColorText: document.getElementById("card-color-text"),
      textColor: document.getElementById("text-color-input"),
      textColorText: document.getElementById("text-color-text"),
      fontSelect: document.getElementById("font-select"),
    };

    const actions = {
      exportBtn: document.getElementById("export-btn"),
      resetBtn: document.getElementById("reset-btn"),
      exportContainer: document.getElementById("export-container"),
      exportTextarea: document.getElementById("export-textarea"),
      copyCssBtn: document.getElementById("copy-css-btn"),
    };

    const previewArea = document.getElementById("preview-area");

    const defaultTheme = {
      "--primary-color": "#6d28d9",
      "--bg-color": "#111827",
      "--card-color": "#1f2937",
      "--text-color": "#e5e7eb",
      "--font-family": "'Noto Sans SC', sans-serif",
    };

    let currentTheme = { ...defaultTheme };

    function applyTheme(theme) {
      for (const [key, value] of Object.entries(theme)) {
        previewArea.style.setProperty(key, value);
      }
    }

    function updateDerivedColors(theme) {
      try {
        theme["--text-color-secondary"] = hexToRgba(theme["--text-color"], 0.7);
        theme["--primary-color-light-10"] = hexToRgba(
          theme["--primary-color"],
          0.1
        );
        theme["--primary-color-light-15"] = hexToRgba(
          theme["--primary-color"],
          0.15
        );
        theme["--primary-color-light-20"] = hexToRgba(
          theme["--primary-color"],
          0.2
        );
        theme["--primary-color-light-30"] = hexToRgba(
          theme["--primary-color"],
          0.3
        );
        theme["--primary-color-dark-80"] = mixColors(
          theme["--primary-color"],
          "#000000",
          0.8
        );
      } catch (e) {
        console.warn("Could not parse color for fallback, using defaults.", e);
      }
    }

    function updateControls(theme) {
      controls.primaryColor.value = theme["--primary-color"];
      controls.primaryColorText.value = theme["--primary-color"];
      controls.bgColor.value = theme["--bg-color"];
      controls.bgColorText.value = theme["--bg-color"];
      controls.cardColor.value = theme["--card-color"];
      controls.cardColorText.value = theme["--card-color"];
      controls.textColor.value = theme["--text-color"];
      controls.textColorText.value = theme["--text-color"];
      controls.fontSelect.value = theme["--font-family"];
    }

    function handleInputChange() {
      currentTheme["--primary-color"] = controls.primaryColor.value;
      currentTheme["--bg-color"] = controls.bgColor.value;
      currentTheme["--card-color"] = controls.cardColor.value;
      currentTheme["--text-color"] = controls.textColor.value;
      currentTheme["--font-family"] = controls.fontSelect.value;

      updateDerivedColors(currentTheme);
      updateControls(currentTheme);
      applyTheme(currentTheme);
    }

    Object.values(controls).forEach((control) => {
      if (control.type === "text") {
        control.addEventListener("input", (e) => {
          const correspondingPicker = document.getElementById(
            e.target.id.replace("-text", "-input")
          );
          if (correspondingPicker) correspondingPicker.value = e.target.value;
          handleInputChange();
        });
      } else {
        control.addEventListener("input", handleInputChange);
      }
    });

    actions.resetBtn.addEventListener("click", () => {
      currentTheme = { ...defaultTheme };
      updateDerivedColors(currentTheme);
      updateControls(currentTheme);
      applyTheme(currentTheme);
      actions.exportContainer.classList.add("hidden");
    });

    actions.exportBtn.addEventListener("click", () => {
      const cssText = `
:root {
  --font-family: ${currentTheme["--font-family"]};
  --primary-color: ${currentTheme["--primary-color"]};
  --bg-color: ${currentTheme["--bg-color"]};
  --card-bg-color: ${currentTheme["--card-color"]};
  --text-color: ${currentTheme["--text-color"]};
  --text-color-secondary: ${currentTheme["--text-color-secondary"]};
  --input-bg-color: ${hexToRgba(currentTheme["--card-color"], 0.1)};
  --border-color: ${hexToRgba(currentTheme["--text-color"], 0.2)};

  /* Fallback variables for color-mix */
  --primary-color-light-10: ${currentTheme["--primary-color-light-10"]};
  --primary-color-light-15: ${currentTheme["--primary-color-light-15"]};
  --primary-color-light-20: ${currentTheme["--primary-color-light-20"]};
  --primary-color-dark-80: ${currentTheme["--primary-color-dark-80"]};
}
            `
        .trim()
        .replace(/^ +/gm, "");

      actions.exportTextarea.value = cssText;
      actions.exportContainer.classList.remove("hidden");
    });

    actions.copyCssBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(actions.exportTextarea.value).then(() => {
        const originalText = actions.copyCssBtn.innerHTML;
        actions.copyCssBtn.innerHTML =
          '<i class="fa fa-check mr-2"></i>已复制!';
        setTimeout(() => {
          actions.copyCssBtn.innerHTML = originalText;
        }, 2000);
      });
    });

    updateDerivedColors(currentTheme);
    updateControls(currentTheme);
    applyTheme(currentTheme);
  }

  function initMobileMenu() {
    const menuToggle = document.getElementById("menu-toggle"),
      mobileMenu = document.getElementById("mobile-menu"),
      icon = menuToggle?.querySelector("i");
    if (!menuToggle || !mobileMenu || !icon) return;
    menuToggle.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
      icon.classList.toggle("fa-bars");
      icon.classList.toggle("fa-times");
    });
  }
  function initHeaderScrollEffect() {
    const header = document.querySelector("header");
    if (!header) return;
    const SCROLL_THRESHOLD = 50;
    const toggleHeaderScrolledClass = () => {
      header.classList.toggle(
        "header-scrolled",
        window.scrollY > SCROLL_THRESHOLD
      );
    };
    toggleHeaderScrolledClass();
    window.addEventListener("scroll", toggleHeaderScrolledClass, {
      passive: true,
    });
  }
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(
      '[data-animate="reveal-up"]'
    );
    if (animatedElements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    animatedElements.forEach((element) => observer.observe(element));
  }
  function initScrollToTopButton() {
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    if (!scrollToTopBtn) return;
    const SCROLL_VISIBLE_THRESHOLD = 300;
    const toggleButtonVisibility = () => {
      if (window.scrollY > SCROLL_VISIBLE_THRESHOLD) {
        scrollToTopBtn.classList.remove(
          "opacity-0",
          "pointer-events-none",
          "translate-y-4"
        );
        scrollToTopBtn.classList.add(
          "opacity-100",
          "pointer-events-auto",
          "translate-y-0"
        );
      } else {
        scrollToTopBtn.classList.remove(
          "opacity-100",
          "pointer-events-auto",
          "translate-y-0"
        );
        scrollToTopBtn.classList.add(
          "opacity-0",
          "pointer-events-none",
          "translate-y-4"
        );
      }
    };
    window.addEventListener("scroll", toggleButtonVisibility, {
      passive: true,
    });
    scrollToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    toggleButtonVisibility();
  }
  function updateFooterYear() {
    const currentYearFooter = document.getElementById("current-year-footer");
    if (currentYearFooter) {
      currentYearFooter.textContent = new Date().getFullYear();
    }
  }

  initApp();
});
