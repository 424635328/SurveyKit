// viewer.js

document.addEventListener("DOMContentLoaded", () => {
  const resultsRenderer = (() => {
    const allElements = {
      searchNewBtn: document.getElementById("search-new-btn"),
      exportContainer: document.getElementById("export-container"),
      exportMenu: document.getElementById("export-menu"),
      idInputView: document.getElementById("id-input-view"),
      resultsView: document.getElementById("results-view"),
      idInputForm: document.getElementById("id-input-form"),
      surveyIdInput: document.getElementById("survey-id-input"),
      submitIdBtn: document.getElementById("submit-id-btn"),
      resultsContainer: document.getElementById("results-container"),
      exportBtn: document.getElementById("exportBtn"),
      currentIdDisplaySpan: document.querySelector("#current-id-display span"),
      notification: document.getElementById("notification"),
      notificationIcon: document.getElementById("notification-icon"),
      notificationText: document.getElementById("notification-text"),
      // 新增：滚动按钮的引用
      scrollToTopBtn: document.getElementById("scrollToTopBtn"),
      scrollToBottomBtn: document.getElementById("scrollToBottomBtn"),
    };

    let sections = [];
    let surveyData = {};
    let currentSurveyId = null;
    let isLoading = false;
    let animationObserver;
    let currentSurveyToken = null;

    const showNotification = (message, type = "success") => {
      if (!allElements.notification) return;
      allElements.notificationText.textContent = message;
      allElements.notificationIcon.className =
        type === "error"
          ? "fa fa-exclamation-circle error"
          : "fa fa-check-circle success";
      allElements.notification.className = "notification-toast show";
      setTimeout(() => {
        allElements.notification.className = "notification-toast";
      }, 3000);
    };

    const downloadFile = (filename, blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    };

    const renderError = (message) => {
      if (allElements.resultsContainer) {
        allElements.resultsContainer.textContent = ''; 
        const errorP = document.createElement('p');
        errorP.className = 'error-message';
        errorP.textContent = message; 
        allElements.resultsContainer.appendChild(errorP);
      }
    };

    const initAnimationObserver = () => {
      if (animationObserver) animationObserver.disconnect();
      const animatedElements = document.querySelectorAll(".animated-line");
      if (!animatedElements.length) return;
      animationObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            entry.target.classList.toggle("is-visible", entry.isIntersecting);
          });
        },
        { threshold: 0.1 }
      );
      animatedElements.forEach((el) => animationObserver.observe(el));
    };

    const switchView = (viewName) => {
      if (!allElements.idInputView || !allElements.resultsView) return;
      allElements.idInputView.classList.toggle("hidden", viewName !== "input");
      allElements.resultsView.classList.toggle(
        "hidden",
        viewName !== "results"
      );

      if (viewName === "input" && allElements.surveyIdInput) {
        allElements.surveyIdInput.value = "";
        allElements.surveyIdInput.focus();
      }

      initAnimationObserver();
      // 切换视图时，也更新滚动按钮状态
      updateScrollButtonsVisibility(); // 新增
    };

    const prepareStructuredExportData = () => {
      if (!sections.length || !Object.keys(surveyData).length) return [];
      const structuredData = JSON.parse(JSON.stringify(sections));
      structuredData.forEach((section) => {
        if (section.questions && Array.isArray(section.questions)) {
          section.questions.forEach((question) => {
            question.answer = surveyData[question.id] || "未回答";
          });
        }
      });
      return structuredData;
    };

    const exportActions = {
      json: () => {
        const exportData = prepareStructuredExportData();
        if (!exportData.length)
          return showNotification("没有数据可导出", "error");
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: "application/json;charset=utf-8",
        });
        downloadFile(`问卷结果-${currentSurveyId}.json`, blob);
        showNotification("JSON 文件已导出");
      },
      txt: () => {
        const exportData = prepareStructuredExportData();
        if (!exportData.length)
          return showNotification("没有数据可导出", "error");
        let txtContent = `问卷结果详情 - ID: ${currentSurveyId}\n\n`;
        exportData.forEach((section) => {
          txtContent += `========================================\n`;
          txtContent += `[${section.legend}]\n`;
          txtContent += `========================================\n\n`;
          section.questions.forEach((q) => {
            txtContent += `${q.text}\n  -> ${q.answer}\n\n`;
          });
        });
        const blob = new Blob([txtContent], {
          type: "text/plain;charset=utf-8",
        });
        downloadFile(`问卷结果-${currentSurveyId}.txt`, blob);
        showNotification("TXT 文件已导出");
      },
      excel: () => exportToExcelOrCsv("xlsx"),
      csv: () => exportToExcelOrCsv("csv"),
    };

    const exportToExcelOrCsv = (format) => {
      const structuredData = prepareStructuredExportData();
      if (!structuredData.length)
        return showNotification("没有数据可导出", "error");
      const flatData = structuredData.flatMap((section) =>
        section.questions.map((q) => ({
          Section: section.legend,
          ID: q.id,
          Question: q.text,
          Answer: q.answer,
        }))
      );
      try {
        if (typeof XLSX === "undefined") {
          return showNotification("错误：导出库 (xlsx.js) 未加载。", "error");
        }
        const worksheet = XLSX.utils.json_to_sheet(flatData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "问卷结果");
        XLSX.writeFile(workbook, `问卷结果-${currentSurveyId}.${format}`);
        showNotification(`${format.toUpperCase()} 文件已导出`);
      } catch (error) {
        console.error(`导出 ${format} 失败:`, error);
        showNotification(`导出 ${format} 失败`, "error");
      }
    };

    const renderResults = (data) => {
      surveyData = data;
      allElements.resultsContainer.textContent = ""; 
      
      sections.forEach((section) => {
        const sectionDiv = document.createElement("div");
        sectionDiv.className = "result-section animated-line"; // 添加 animated-line 类
        
        const titleH2 = document.createElement('h2');
        titleH2.className = 'section-title';
        titleH2.textContent = section.legend; 
        sectionDiv.appendChild(titleH2);

        section.questions.forEach((q) => {
          const answerText = data[q.id];

          const item = document.createElement("div");
          item.className = "result-item animated-line"; // 添加 animated-line 类

          const questionP = document.createElement('p');
          questionP.className = 'question';
          questionP.textContent = q.text; 
          item.appendChild(questionP);

          const answerP = document.createElement('p');
          answerP.className = 'answer';
          if (!answerText) {
            answerP.classList.add('no-answer');
          }
          answerP.textContent = answerText || "未回答"; 
          item.appendChild(answerP);
          
          sectionDiv.appendChild(item);
        });
        
        allElements.resultsContainer.appendChild(sectionDiv);
      });
      initAnimationObserver(); // 重新初始化动画观察器以包含新渲染的元素
      updateScrollButtonsVisibility(); // 渲染结果后更新按钮可见性
    };

    const fetchAndRenderSurvey = async (surveyId, surveyToken) => {
      if (isLoading) return;
      isLoading = true;
      currentSurveyId = surveyId;
      currentSurveyToken = surveyToken;
      switchView("results");
      
      const loadingP = document.createElement('p');
      loadingP.className = 'loading-placeholder';
      loadingP.textContent = '正在加载数据...';
      allElements.resultsContainer.textContent = '';
      allElements.resultsContainer.appendChild(loadingP);

      if (allElements.currentIdDisplaySpan)
        allElements.currentIdDisplaySpan.textContent = surveyId;
      if (allElements.submitIdBtn) {
        allElements.submitIdBtn.disabled = true;
        allElements.submitIdBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 正在查询...';
      }
      try {
        const [questionsRes, surveyRes] = await Promise.all([
          fetch("./questions.json"),
          fetch(`./api/get-survey?id=${surveyId}${surveyToken ? `&token=${surveyToken}` : ''}`),
        ]);
        if (!questionsRes.ok)
          throw new Error("无法加载问卷结构 (questions.json)。");
        sections = await questionsRes.json();
        
        if (!surveyRes.ok) {
          let specificMessage;
          if (surveyRes.status === 401 || surveyRes.status === 403) {
            specificMessage = "访问被拒绝。该问卷可能需要专属链接才能访问，请尝试粘贴完整的链接地址。";
          } else {
             try {
               const errorData = await surveyRes.json();
               specificMessage = errorData.message || `服务器返回状态 ${surveyRes.status}`;
            } catch(e) {
               specificMessage = surveyRes.statusText || `服务器返回状态 ${surveyRes.status}`;
            }
          }
          throw new Error(specificMessage);
        }

        const data = await surveyRes.json();
        renderResults(data);
        const url = new URL(window.location);
        url.searchParams.set("id", surveyId);
        if (surveyToken) url.searchParams.set("token", surveyToken);
        window.history.pushState({ id: surveyId, token: surveyToken }, "", url);
      } catch (error) {
        console.error("获取问卷结果失败:", error);
        renderError(`加载失败: ${error.message}`);
        setTimeout(() => switchView("input"), 3500); // 延长错误提示显示时间
      } finally {
        isLoading = false;
        if (allElements.submitIdBtn) {
          allElements.submitIdBtn.disabled = false;
          allElements.submitIdBtn.innerHTML = '<i class="fa fa-search"></i> 查看结果';
        }
        updateScrollButtonsVisibility(); // 确保加载完成后更新按钮状态
      }
    };

    // 新增函数：更新滚动按钮的可见性
    const updateScrollButtonsVisibility = () => {
      const { scrollToTopBtn, scrollToBottomBtn } = allElements;
      if (!scrollToTopBtn || !scrollToBottomBtn) return;

      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      const SCROLL_THRESHOLD = 200; // 滚动超过此距离显示/隐藏按钮

      // 判断页面是否可滚动（内容高度大于视口高度）
      const isScrollable = documentHeight > viewportHeight + 50; // 额外50px容错

      if (!isScrollable) {
        // 如果页面不可滚动，隐藏两个按钮
        scrollToTopBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
        scrollToBottomBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
        return;
      }

      // 控制滚动到顶部按钮的可见性
      if (scrollY > SCROLL_THRESHOLD) {
        scrollToTopBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
        scrollToTopBtn.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
      } else {
        scrollToTopBtn.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
        scrollToTopBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
      }

      // 控制滚动到底部按钮的可见性
      // 当当前滚动位置 + 视口高度 < 文档总高度 - 阈值时，说明未到底部
      if ((scrollY + viewportHeight) < (documentHeight - SCROLL_THRESHOLD)) {
        scrollToBottomBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
        scrollToBottomBtn.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
      } else {
        scrollToBottomBtn.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
        scrollToBottomBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
      }
    };


    const init = () => {
      if (allElements.exportBtn) {
        allElements.exportBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const container = allElements.exportContainer;
          if (container) {
            container.classList.toggle("open");
            if (container.classList.contains("open")) {
              const menuItems = allElements.exportMenu.querySelectorAll("a");
              menuItems.forEach((item, index) => {
                item.style.setProperty("--i-delay", `${index * 60}ms`);
              });
            }
          }
        });
      }

      if (allElements.exportMenu) {
        allElements.exportMenu.addEventListener("click", (e) => {
          e.stopPropagation();
          const target = e.target.closest("a");
          if (!target) return;
          e.preventDefault();
          const format = target.dataset.format;
          if (exportActions[format]) {
            exportActions[format]();
          }
          if (allElements.exportContainer) {
            allElements.exportContainer.classList.remove("open");
          }
        });
      }

      if (allElements.idInputForm) {
        allElements.idInputForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const inputVal = allElements.surveyIdInput.value.trim();
          if (inputVal) {
            let idToFetch = inputVal;
            let tokenToFetch = null;

            try {
                const url = new URL(inputVal);
                if (url.origin === window.location.origin && (url.pathname.includes('/viewer.html') || url.pathname.includes('/result.html'))) {
                    idToFetch = url.searchParams.get('id');
                    tokenToFetch = url.searchParams.get('token');
                }
            } catch (error) {
                // Not a valid URL, treat as just an ID
            }
            
            if (idToFetch) {
                fetchAndRenderSurvey(idToFetch, tokenToFetch);
            } else {
                renderError("无法从输入中提取有效ID。请确保输入的是正确的问卷ID或专属链接。");
            }
          }
        });
      }

      if (allElements.searchNewBtn) {
        allElements.searchNewBtn.addEventListener("click", () => {
          switchView("input");
          window.history.pushState({}, "", window.location.pathname);
        });
      }

      // 新增：滚动按钮的事件监听
      if (allElements.scrollToTopBtn) {
        allElements.scrollToTopBtn.addEventListener('click', () => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        });
      }
      if (allElements.scrollToBottomBtn) {
        allElements.scrollToBottomBtn.addEventListener('click', () => {
          window.scrollTo({
            top: document.documentElement.scrollHeight, // 滚动到文档底部
            behavior: 'smooth'
          });
        });
      }
      // 监听页面滚动，更新按钮可见性
      window.addEventListener('scroll', updateScrollButtonsVisibility, { passive: true });


      const params = new URLSearchParams(window.location.search);
      const initialSurveyId = params.get("id");
      const initialSurveyToken = params.get("token");
      if (initialSurveyId) {
        fetchAndRenderSurvey(initialSurveyId, initialSurveyToken);
      } else {
        switchView("input");
      }
      // 首次加载和初始化时，检查并设置按钮状态
      updateScrollButtonsVisibility(); // 确保加载完成后更新按钮状态
    };

    return { init };
  })();

  resultsRenderer.init();
});