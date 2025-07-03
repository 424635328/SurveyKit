document.addEventListener("DOMContentLoaded", () => {
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

  const wrapTextForAnimation = (element) => {
    if (!element || !element.dataset.text || element.childElementCount > 0) return;
    const text = element.dataset.text;
    const words = text.match(/[\w']+|[\u4e00-\u9fa5]|\S/g) || [];
    element.innerHTML = words
      .map(
        (word, index) =>
          `<span class="animated-char" style="--i:${index};">${word}</span>`
      )
      .join(" ");
  };

  const resetSectionAnimation = (section) => {
    const textElements = section.querySelectorAll("[data-text].start-animation");
    textElements.forEach((el) => {
      el.classList.remove("start-animation");
      el.innerHTML = "";
    });
    const fadeElements = section.querySelectorAll(".fade-in-element.is-visible");
    fadeElements.forEach((el) => {
      el.classList.remove("is-visible");
    });
  };

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

  const initPageAnimations = () => {
    if (!("IntersectionObserver" in window)) {
      console.warn("IntersectionObserver not supported. Fallback to showing all content.");
      fallbackNoAnimation();
      return;
    }
    try {
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

  const searchModal = document.getElementById("search-modal");
  const searchModalPanel = document.getElementById("search-modal-panel");
  const searchBackdrop = document.getElementById("search-backdrop");
  const searchToggleButton = document.getElementById("search-toggle-button");
  const searchToggleMobile = document.getElementById("search-toggle-mobile");
  const searchInput = document.getElementById("search-input");
  const searchResultsList = document.getElementById("search-results-list");
  const searchPlaceholder = document.getElementById("search-placeholder");
  let activeIndex = -1;

  const searchIndex = [
    { category: "主要功能", title: "可视化问卷编辑器", description: "通过图形界面创建、编辑和导出你的专属问卷。", url: './hub/custom-questions/index.html', icon: 'fa-edit' },
    { category: "主要功能", title: "AI 人格分析", description: "了解如何使用由火山方舟大模型驱动的 AI 人格分析功能。", url: './mbti.html', icon: 'fa-android' },
    { category: "主要功能", title: "答案预览与分享", description: '查看已提交的问卷答案，与朋友对比默契度，或导出结果。', url: './viewer.html', icon: 'fa-eye' },
    { category: "导航", title: "工具中心", description: '一站式访问所有核心工具，包括编辑器、预览器和校验器。', url: './hub/hub.html', icon: 'fa-wrench' },
    { category: "导航", title: "帮助文档", description: '查找关于如何使用、部署和定制 SurveyKit 的详细指南。', url: './docs/help.html', icon: 'fa-book' },
    { category: "导航", title: "项目主页", description: '了解 SurveyKit 的核心理念和功能亮点。', url: './index.html', icon: 'fa-home' },
    { category: "其他", title: "找回问卷链接", description: '如果丢失了专属结果链接，可以在这里通过邮箱找回。', url: './recover.html', icon: 'fa-key' },
    { category: "其他", title: "安全实践", description: '了解 SurveyKit 在数据安全和隐私保护方面的措施。', url: './docs/help.html#%EF%B8%8F-安全性-security', icon: 'fa-shield' },
  ];

  const openSearchModal = () => {
    document.body.classList.add('search-open');
    searchModal.classList.remove('hidden');
    requestAnimationFrame(() => {
        searchModal.classList.remove('opacity-0');
        searchModalPanel.classList.remove('scale-95', 'opacity-0');
    });
    setTimeout(() => searchInput.focus(), 50);
  };

  const closeSearchModal = () => {
    searchModal.classList.add('opacity-0');
    searchModalPanel.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        document.body.classList.remove('search-open');
        searchModal.classList.add('hidden');
        searchInput.value = '';
        renderResults([]);
    }, 200);
  };
  
  const renderResults = (results) => {
    searchResultsList.innerHTML = '';
    activeIndex = -1;

    if (results.length === 0) {
        searchResultsList.appendChild(searchPlaceholder);
        const query = searchInput.value.trim();
        if (query) {
            searchPlaceholder.innerHTML = `
                <div class="p-10 text-center text-slate-400">
                    <i class="fa fa-search-minus fa-2x mb-3"></i>
                    <p class="font-medium text-slate-500">找不到结果</p>
                    <p class="text-sm">没有与 "<strong class="text-slate-600">${query}</strong>" 相关的结果</p>
                </div>`;
        } else {
            searchPlaceholder.innerHTML = `
                <div class="p-10 text-center text-slate-400">
                    <i class="fa fa-compass fa-2x mb-3"></i>
                    <p class="font-medium text-slate-500">开始探索 SurveyKit</p>
                    <p class="text-sm">输入关键词查找您需要的功能</p>
                </div>`;
        }
    } else {
        const groupedResults = results.reduce((acc, item) => {
            (acc[item.category] = acc[item.category] || []).push(item);
            return acc;
        }, {});

        for (const category in groupedResults) {
            const groupWrapper = document.createElement('div');
            groupWrapper.innerHTML = `
                <h3 class="px-4 pt-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">${category}</h3>
            `;
            groupedResults[category].forEach(item => {
                const resultEl = document.createElement('a');
                resultEl.href = item.url;
                resultEl.className = 'search-result-item flex items-center p-3 mx-2 my-1 rounded-lg hover:bg-slate-100 cursor-pointer';
                resultEl.innerHTML = `
                    <div class="result-item-icon flex-shrink-0 w-8 h-8 flex items-center justify-center text-slate-500 mr-3">
                        <i class="fa ${item.icon} text-lg"></i>
                    </div>
                    <div>
                        <p class="font-medium text-slate-800">${item.title}</p>
                        <p class="result-item-desc text-sm text-slate-500">${item.description}</p>
                    </div>
                    <div class="ml-auto text-slate-400"><i class="fa fa-level-up fa-rotate-90"></i></div>
                `;
                groupWrapper.appendChild(resultEl);
            });
            searchResultsList.appendChild(groupWrapper);
        }
    }
  };

  const updateActiveItem = () => {
    const items = searchResultsList.querySelectorAll('.search-result-item');
    items.forEach((item, index) => {
      if (index === activeIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });
  };

  [searchToggleButton, searchToggleMobile].forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openSearchModal();
      if(mobileMenu && !mobileMenu.classList.contains('hidden')) {
          menuToggle.click();
      }
    });
  });

  searchBackdrop.addEventListener('click', closeSearchModal);

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    const results = query 
        ? searchIndex.filter(item => 
            `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(query)
          )
        : [];
    renderResults(results);
  });
  
  searchInput.addEventListener('keydown', (e) => {
    const items = searchResultsList.querySelectorAll('.search-result-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length > 0) activeIndex = (activeIndex + 1) % items.length;
      updateActiveItem();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length > 0) activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateActiveItem();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const activeItem = items[activeIndex];
      if (activeItem) activeItem.click();
    }
  });

  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearchModal();
    }
    if (e.key === 'Escape' && !searchModal.classList.contains('hidden')) {
      closeSearchModal();
    }
  });

  renderResults([]);
});