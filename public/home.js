document.addEventListener("DOMContentLoaded", () => {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  function initBaseInteractions() {
    const menuToggle = document.getElementById("menu-toggle");
    const mobileMenu = document.getElementById("mobile-menu");
    const menuIcon = document.getElementById("menu-icon");

    if (menuToggle && mobileMenu && menuIcon) {
      menuToggle.addEventListener("click", () => {
        const isExpanded = mobileMenu.classList.toggle("hidden");
        menuToggle.setAttribute("aria-expanded", String(!isExpanded));
        menuIcon.classList.toggle("fa-bars", isExpanded);
        menuIcon.classList.toggle("fa-times", !isExpanded);
      });
    }

    const header = document.querySelector("header");
    if (header) {
      const SCROLL_THRESHOLD = 20;
      const handleHeaderScroll = () => {
        header.classList.toggle("header-scrolled", window.scrollY > SCROLL_THRESHOLD);
      };
      window.addEventListener("scroll", handleHeaderScroll, { passive: true });
      handleHeaderScroll();
    }

    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    if (scrollToTopBtn) {
      const SCROLL_VISIBLE_THRESHOLD = 300;
      const toggleButtonVisibility = () => {
        scrollToTopBtn.classList.toggle("opacity-0", window.scrollY <= SCROLL_VISIBLE_THRESHOLD);
        scrollToTopBtn.classList.toggle("pointer-events-none", window.scrollY <= SCROLL_VISIBLE_THRESHOLD);
        scrollToTopBtn.classList.toggle("translate-y-4", window.scrollY <= SCROLL_VISIBLE_THRESHOLD);
      };
      window.addEventListener("scroll", toggleButtonVisibility, { passive: true });
      scrollToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
      toggleButtonVisibility();
    }

    const footerYear = document.getElementById("footer-year");
    if (footerYear) {
      footerYear.textContent = new Date().getFullYear();
    }
  }

  function initAdvancedVisuals() {
    if (isReducedMotion) return;

    const canvas = document.getElementById('constellation-canvas');
    if (canvas && !isTouchDevice) {
        const ctx = canvas.getContext('2d');
        let dots = [];
        let numDots = Math.floor(window.innerWidth / 30);
        let animationFrameId;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            numDots = Math.floor(window.innerWidth / 30);
            dots = [];
            for (let i = 0; i < numDots; i++) {
                dots.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    radius: Math.random() * 1.5 + 1
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            dots.forEach(dot => {
                dot.x += dot.vx;
                dot.y += dot.vy;
                if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
                if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.beginPath();
            for (let i = 0; i < numDots; i++) {
                for (let j = i + 1; j < numDots; j++) {
                    const d = Math.sqrt(Math.pow(dots[i].x - dots[j].x, 2) + Math.pow(dots[i].y - dots[j].y, 2));
                    if (d < 120) {
                        ctx.moveTo(dots[i].x, dots[i].y);
                        ctx.lineTo(dots[j].x, dots[j].y);
                    }
                }
            }
            ctx.lineWidth = 0.3;
            ctx.strokeStyle = 'rgba(167, 139, 250, 0.2)';
            ctx.stroke();

            animationFrameId = requestAnimationFrame(draw);
        };
        
        window.addEventListener('resize', () => {
            cancelAnimationFrame(animationFrameId);
            resizeCanvas();
            draw();
        });
        resizeCanvas();
        draw();
    }

    if (!isTouchDevice) {
        const tiltCards = document.querySelectorAll('.tilt-card');
        tiltCards.forEach(card => {
            const tiltIntensity = 10;
            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const { width, height } = rect;
                const rotateX = tiltIntensity * ((y / height) - 0.5) * -1;
                const rotateY = tiltIntensity * ((x / width) - 0.5);
                requestAnimationFrame(() => {
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
                });
            });
            card.addEventListener('mouseleave', () => {
                requestAnimationFrame(() => {
                    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                });
            });
        });
    }

    const workflowPath = document.getElementById('workflow-path-progress');
    const workflowSection = document.getElementById('workflow-section');
    if(workflowPath && workflowSection) {
        const pathLength = workflowPath.getTotalLength();
        workflowPath.style.strokeDasharray = pathLength;
        workflowPath.style.strokeDashoffset = pathLength;
        const handleWorkflowScroll = () => {
             const rect = workflowSection.getBoundingClientRect();
             const scrollPercent = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height * 0.5)));
             const drawLength = pathLength * scrollPercent;
             workflowPath.style.strokeDashoffset = pathLength - drawLength;
        }
        window.addEventListener('scroll', handleWorkflowScroll);
    }
  }

  function initTypewriterEffect() {
    if (isTouchDevice || isReducedMotion) return;

    const testimonialCards = document.querySelectorAll('.testimonial-card');

    testimonialCards.forEach(card => {
        const textElement = card.querySelector('.typewriter-target');
        if (!textElement) return;

        const fullText = textElement.getAttribute('data-text');
        let typewriterTimeout;
        textElement.innerHTML = fullText;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    clearTimeout(typewriterTimeout);
                    textElement.innerHTML = '';
                    textElement.classList.add('is-typing');
                    
                    let i = 0;
                    function typeCharacter() {
                        if (i < fullText.length) {
                            textElement.innerHTML += fullText.charAt(i);
                            i++;
                            typewriterTimeout = setTimeout(typeCharacter, 25);
                        } else {
                            textElement.classList.remove('is-typing');
                        }
                    }
                    typeCharacter();
                } else {
                    clearTimeout(typewriterTimeout);
                    textElement.innerHTML = fullText;
                    textElement.classList.remove('is-typing');
                }
            });
        }, { threshold: 0.6 });

        observer.observe(card);
    });
  }
  
  function initPageAnimations() {
    const wrapText = (el) => {
      if (!el || !el.dataset.text || el.childElementCount > 0) return;
      const words = el.dataset.text.match(/[\w']+|[\u4e00-\u9fa5]|\S/g) || [];
      el.innerHTML = words.map((word, i) => `<span class="animated-char" style="--i:${i};">${word}</span>`).join(" ");
    };
    
    const animateSection = (section) => {
      section.querySelectorAll("[data-text]").forEach(wrapText);
      setTimeout(() => section.querySelectorAll("[data-text]").forEach(el => el.classList.add("start-animation")), 100);
      section.querySelectorAll("[class*='reveal-']").forEach(el => el.classList.add("is-visible"));
    };
    
    const resetSection = (section) => {
        section.querySelectorAll("[data-text]").forEach(el => {
            el.classList.remove("start-animation");
            el.innerHTML = "";
        });
        section.querySelectorAll("[class*='reveal-']").forEach(el => el.classList.remove("is-visible"));
    };

    if ('IntersectionObserver' in window && !isReducedMotion) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateSection(entry.target);
          } else {
            resetSection(entry.target);
          }
        });
      }, { threshold: 0.1 });
      document.querySelectorAll('.animated-section').forEach(section => observer.observe(section));
    } else {
      document.querySelectorAll("[data-text]").forEach(el => el.textContent = el.dataset.text);
      document.querySelectorAll("[class*='reveal-'], [data-text]").forEach(el => el.classList.add("is-visible"));
    }
  }
  
  function initSearch() {
    const searchModal = document.getElementById("search-modal");
    if (!searchModal) return;
    const searchModalPanel = document.getElementById("search-modal-panel");
    const searchBackdrop = document.getElementById("search-backdrop");
    const searchToggleButton = document.getElementById("search-toggle-button");
    const searchToggleMobile = document.getElementById("search-toggle-mobile");
    const searchInput = document.getElementById("search-input");
    const searchResultsList = document.getElementById("search-results-list");
    const searchPlaceholder = document.getElementById("search-placeholder");
    let activeIndex = -1;

    const searchIndex = [
        { category: "主要功能", title: "可视化问卷编辑器", description: "通过图形界面创建、编辑和导出你的专属问卷。", url: './hub/custom-questions/custom-questions.html', icon: 'fa-edit' },
        { category: "主要功能", title: "AI 人格分析", description: "了解如何使用由火山方舟大模型驱动的 AI 人格分析功能。", url: './mbti.html', icon: 'fa-android' },
        { category: "导航", title: "工具中心", description: '一站式访问所有核心工具，包括编辑器、预览器和校验器。', url: './hub/hub.html', icon: 'fa-wrench' },
        { category: "导航", title: "帮助文档", description: '查找关于如何使用、部署和定制 SurveyKit 的详细指南。', url: './docs/help.html', icon: 'fa-book' },
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
        if (results.length === 0 && searchInput.value.trim()) {
            searchPlaceholder.querySelector('p.font-medium').textContent = '找不到结果';
            searchPlaceholder.querySelector('p.text-sm').innerHTML = `没有与 "<strong class="text-slate-300">${searchInput.value.trim()}</strong>" 相关的结果`;
            searchPlaceholder.querySelector('i').className = 'fa fa-search-minus fa-2x mb-3';
            if(searchPlaceholder.parentNode !== searchResultsList) {
                searchResultsList.appendChild(searchPlaceholder);
            }
        } else if (results.length === 0){
            searchPlaceholder.querySelector('p.font-medium').textContent = '开始探索 SurveyKit';
            searchPlaceholder.querySelector('p.text-sm').innerHTML = '输入关键词查找您需要的功能';
            searchPlaceholder.querySelector('i').className = 'fa fa-compass fa-2x mb-3';
             if(searchPlaceholder.parentNode !== searchResultsList) {
                searchResultsList.appendChild(searchPlaceholder);
            }
        }
        else {
            if(searchResultsList.contains(searchPlaceholder)){
                searchResultsList.removeChild(searchPlaceholder);
            }
            const groupedResults = results.reduce((acc, item) => {
                (acc[item.category] = acc[item.category] || []).push(item);
                return acc;
            }, {});
            for (const category in groupedResults) {
                const groupWrapper = document.createElement('div');
                groupWrapper.innerHTML = `<h3 class="px-4 pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">${category}</h3>`;
                groupedResults[category].forEach(item => {
                    const resultEl = document.createElement('a');
                    resultEl.href = item.url;
                    resultEl.className = 'search-result-item flex items-center p-3 mx-2 my-1 rounded-lg hover:bg-slate-700 cursor-pointer';
                    resultEl.innerHTML = `
                        <div class="result-item-icon flex-shrink-0 w-8 h-8 flex items-center justify-center text-slate-400 mr-3"><i class="fa ${item.icon} text-lg"></i></div>
                        <div><p class="font-medium text-slate-200">${item.title}</p><p class="result-item-desc text-sm text-slate-400">${item.description}</p></div>
                        <div class="ml-auto text-slate-500"><i class="fa fa-level-up fa-rotate-90"></i></div>`;
                    groupWrapper.appendChild(resultEl);
                });
                searchResultsList.appendChild(groupWrapper);
            }
        }
    };
    
    const updateActiveItem = () => {
        const items = searchResultsList.querySelectorAll('.search-result-item');
        items.forEach((item, index) => item.classList.toggle('active', index === activeIndex));
        if (activeIndex > -1) items[activeIndex].scrollIntoView({ block: 'nearest' });
    };

    [searchToggleButton, searchToggleMobile].forEach(btn => btn?.addEventListener('click', e => {
        e.preventDefault();
        openSearchModal();
        document.getElementById('mobile-menu')?.classList.add('hidden');
        document.getElementById('menu-icon')?.classList.replace('fa-times', 'fa-bars');
    }));

    searchBackdrop.addEventListener('click', closeSearchModal);
    searchInput.addEventListener('input', () => renderResults(searchInput.value.toLowerCase().trim() ? searchIndex.filter(item => `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(searchInput.value.toLowerCase().trim())) : []));
    searchInput.addEventListener('keydown', e => {
        const items = searchResultsList.querySelectorAll('.search-result-item');
        if (items.length === 0) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = (activeIndex + 1) % items.length; updateActiveItem(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = (activeIndex - 1 + items.length) % items.length; updateActiveItem(); }
        else if (e.key === 'Enter' && activeIndex > -1) { e.preventDefault(); items[activeIndex]?.click(); }
    });

    window.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearchModal(); }
        if (e.key === 'Escape' && !searchModal.classList.contains('hidden')) closeSearchModal();
    });
    
    renderResults([]);
  }

  initBaseInteractions();
  initAdvancedVisuals();
  initTypewriterEffect();
  initPageAnimations();
  initSearch();
});