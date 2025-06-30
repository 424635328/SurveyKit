// viewer.js - 最终优化版

document.addEventListener("DOMContentLoaded", () => {
  const resultsRenderer = (() => {
    // 缓存所有需要操作的DOM元素
    const allElements = {
      searchNewBtn: document.getElementById("search-new-btn"),
      exportContainer: document.getElementById("export-container"),
      exportMenu: document.getElementById("export-menu"),
      idInputView: document.getElementById("id-input-view"),
      resultsView: document.getElementById("results-view"),
      idInputForm: document.getElementById("id-input-form"),
      surveyIdInput: document.getElementById("survey-id-input"),
      submitIdBtn: document.getElementById("submit-id-btn"),
      inputFeedbackContainer: document.getElementById("input-feedback-container"),
      inputFeedback: document.getElementById("input-feedback"),
      resultsContainer: document.getElementById("results-container"),
      exportBtn: document.getElementById("exportBtn"),
      currentIdDisplaySpan: document.querySelector("#current-id-display span"),
      notification: document.getElementById("notification"),
      notificationIcon: document.getElementById("notification-icon"),
      notificationText: document.getElementById("notification-text"),
      scrollToTopBtn: document.getElementById("scrollToTopBtn"),
      scrollToBottomBtn: document.getElementById("scrollToBottomBtn"),
    };

    // 模块状态变量
    let sections = [];
    let surveyData = {};
    let currentSurveyId = null;
    let isLoading = false;
    let animationObserver;
    let currentSurveyToken = null;

    /**
     * 显示一个短暂的通知消息 (toast)
     * @param {string} message - 要显示的消息
     * @param {string} [type='success'] - 消息类型 ('success' 或 'error')
     */
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

    /**
     * 触发文件下载
     * @param {string} filename - 下载的文件名
     * @param {Blob} blob - 包含文件内容的Blob对象
     */
    const downloadFile = (filename, blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    };

    /**
     * 在结果区域显示错误消息
     * @param {string} message - 错误消息文本
     */
    const renderError = (message) => {
      if (allElements.resultsContainer) {
        allElements.resultsContainer.textContent = ''; 
        const errorP = document.createElement('p');
        errorP.className = 'error-message';
        errorP.textContent = message; 
        allElements.resultsContainer.appendChild(errorP);
      }
    };

    /**
     * 初始化 IntersectionObserver 来实现元素的入场动画
     */
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

    /**
     * 切换视图 (输入视图 vs. 结果视图)
     * @param {string} viewName - 'input' 或 'results'
     */
    const switchView = (viewName) => {
      if (!allElements.idInputView || !allElements.resultsView) return;
      allElements.idInputView.classList.toggle("hidden", viewName !== "input");
      allElements.resultsView.classList.toggle("hidden", viewName !== "results");

      if (viewName === "input" && allElements.surveyIdInput) {
        allElements.surveyIdInput.value = "";
        analyzeAndDisplayInputFeedback(); // 清空时也更新反馈
        allElements.surveyIdInput.focus();
      }

      initAnimationObserver();
      updateScrollButtonsVisibility();
    };

    /**
     * 实时分析输入框内容并显示相应的反馈信息。
     * 优化点：通过检查路径名（pathname）来识别链接，使其在开发和生产环境中都可靠。
     */
    const analyzeAndDisplayInputFeedback = () => {
        const value = allElements.surveyIdInput.value.trim();
        const { inputFeedbackContainer, inputFeedback } = allElements;

        if (!value) {
            inputFeedbackContainer.classList.remove('visible');
            return;
        }

        let feedback = { message: '', type: '' };

        try {
            const url = new URL(value);

            // 检查路径是否包含 '/viewer.html'，这是识别问卷链接的关键
            if (url.pathname.includes('/viewer.html')) {
                const hasId = url.searchParams.has('id');
                const hasToken = url.searchParams.has('token');

                if (hasId && hasToken) {
                    feedback = { message: '✓ 链接完整，可直接查看', type: 'success' };
                } else if (hasId && !hasToken) {
                    feedback = { message: '检测到ID，但缺少密钥(token)，部分问卷可能需要', type: 'info' };
                } else if (!hasId && hasToken) {
                    feedback = { message: '警告：链接中检测到密钥(token)，但缺少问卷ID', type: 'warning' };
                } else {
                    feedback = { message: '警告：链接中未发现ID或密钥', type: 'warning' };
                }
            } else {
                // 如果是合法的URL，但不是问卷查看链接（例如 https://google.com）
                feedback = { message: '这似乎不是一个有效的问卷链接，请输入ID或正确的链接', type: 'warning' };
            }
        } catch (error) {
            // 如果无法解析为URL，则假定它是一个纯ID
            feedback = { message: '已识别为ID。如果需要密钥，请粘贴完整链接', type: 'info' };
        }
        
        inputFeedback.textContent = feedback.message;
        inputFeedback.className = `feedback-text feedback-${feedback.type}`;
        inputFeedbackContainer.classList.add('visible');
    };

    /**
     * 准备用于导出的结构化数据
     * @returns {Array} - 包含问卷结构和答案的数组
     */
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

    /**
     * 包含所有导出操作的对象
     */
    const exportActions = {
      json: () => {
        const exportData = prepareStructuredExportData();
        if (!exportData.length) return showNotification("没有数据可导出", "error");
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json;charset=utf-8" });
        downloadFile(`问卷结果-${currentSurveyId}.json`, blob);
        showNotification("JSON 文件已导出");
      },
      txt: () => {
        const exportData = prepareStructuredExportData();
        if (!exportData.length) return showNotification("没有数据可导出", "error");
        let txtContent = `问卷结果详情 - ID: ${currentSurveyId}\n\n`;
        exportData.forEach((section) => {
          txtContent += `========================================\n[${section.legend}]\n========================================\n\n`;
          section.questions.forEach((q) => { txtContent += `${q.text}\n  -> ${q.answer}\n\n`; });
        });
        const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
        downloadFile(`问卷结果-${currentSurveyId}.txt`, blob);
        showNotification("TXT 文件已导出");
      },
      excel: () => exportToExcelOrCsv("xlsx"),
      csv: () => exportToExcelOrCsv("csv"),
    };

    /**
     * 将数据导出为 Excel 或 CSV 文件
     * @param {string} format - 'xlsx' 或 'csv'
     */
    const exportToExcelOrCsv = (format) => {
      const structuredData = prepareStructuredExportData();
      if (!structuredData.length) return showNotification("没有数据可导出", "error");
      const flatData = structuredData.flatMap((section) =>
        section.questions.map((q) => ({ Section: section.legend, ID: q.id, Question: q.text, Answer: q.answer }))
      );
      try {
        if (typeof XLSX === "undefined") return showNotification("错误：导出库 (xlsx.js) 未加载。", "error");
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

    /**
     * 渲染问卷结果到页面
     * @param {object} data - 从API获取的问卷答案数据
     */
    const renderResults = (data) => {
      surveyData = data;
      allElements.resultsContainer.textContent = ""; 
      
      sections.forEach((section) => {
        const sectionDiv = document.createElement("div");
        sectionDiv.className = "result-section animated-line";
        const titleH2 = document.createElement('h2');
        titleH2.className = 'section-title';
        titleH2.textContent = section.legend; 
        sectionDiv.appendChild(titleH2);
        section.questions.forEach((q) => {
          const answerText = data[q.id];
          const item = document.createElement("div");
          item.className = "result-item animated-line";
          const questionP = document.createElement('p');
          questionP.className = 'question';
          questionP.textContent = q.text; 
          item.appendChild(questionP);
          const answerP = document.createElement('p');
          answerP.className = 'answer';
          if (!answerText) answerP.classList.add('no-answer');
          answerP.textContent = answerText || "未回答"; 
          item.appendChild(answerP);
          sectionDiv.appendChild(item);
        });
        allElements.resultsContainer.appendChild(sectionDiv);
      });
      initAnimationObserver();
      updateScrollButtonsVisibility();
    };

    /**
     * 获取并渲染问卷数据
     * @param {string} surveyId - 问卷ID
     * @param {string|null} surveyToken - 问卷密钥 (token)
     */
    const fetchAndRenderSurvey = async (surveyId, surveyToken) => {
      if (isLoading) return;
      isLoading = true;
      currentSurveyId = surveyId;
      currentSurveyToken = surveyToken;
      switchView("results");
      
      allElements.resultsContainer.innerHTML = '<p class="loading-placeholder">正在加载数据...</p>';
      if (allElements.currentIdDisplaySpan) allElements.currentIdDisplaySpan.textContent = surveyId;
      if (allElements.submitIdBtn) {
        allElements.submitIdBtn.disabled = true;
        allElements.submitIdBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 正在查询...';
      }

      try {
        const [questionsRes, surveyRes] = await Promise.all([
          fetch("./questions.json"),
          fetch(`./api/get-survey?id=${surveyId}${surveyToken ? `&token=${surveyToken}` : ''}`),
        ]);
        if (!questionsRes.ok) throw new Error("无法加载问卷结构 (questions.json)。");
        sections = await questionsRes.json();
        
        if (!surveyRes.ok) {
          let specificMessage;
          if (surveyRes.status === 401 || surveyRes.status === 403) {
            specificMessage = surveyToken
              ? "访问被拒绝。提供的ID或密钥(token)无效，请检查链接是否正确。"
              : `访问被拒绝。此问卷 (ID: ${surveyId}) 可能需要密钥(token)，请尝试粘贴完整的专属链接。`;
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
        setTimeout(() => switchView("input"), 3500);
      } finally {
        isLoading = false;
        if (allElements.submitIdBtn) {
          allElements.submitIdBtn.disabled = false;
          allElements.submitIdBtn.innerHTML = '<i class="fa fa-search"></i> 查看结果';
        }
        updateScrollButtonsVisibility();
      }
    };

    /**
     * 根据页面滚动位置更新“滚动到顶部/底部”按钮的可见性
     */
    const updateScrollButtonsVisibility = () => {
      const { scrollToTopBtn, scrollToBottomBtn } = allElements;
      if (!scrollToTopBtn || !scrollToBottomBtn) return;

      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const SCROLL_THRESHOLD = 200;
      const isScrollable = documentHeight > viewportHeight + 50;

      const toggleBtnVisibility = (btn, isVisible) => {
        btn.classList.toggle('opacity-0', !isVisible);
        btn.classList.toggle('pointer-events-none', !isVisible);
        btn.classList.toggle('translate-y-4', !isVisible);
      };

      if (!isScrollable) {
        toggleBtnVisibility(scrollToTopBtn, false);
        toggleBtnVisibility(scrollToBottomBtn, false);
        return;
      }

      toggleBtnVisibility(scrollToTopBtn, scrollY > SCROLL_THRESHOLD);
      toggleBtnVisibility(scrollToBottomBtn, (scrollY + viewportHeight) < (documentHeight - SCROLL_THRESHOLD));
    };


    /**
     * 初始化应用，绑定所有事件监听器
     */
    const init = () => {
      // 导出菜单的交互
      if (allElements.exportBtn) {
        allElements.exportBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          allElements.exportContainer.classList.toggle("open");
        });
      }
      if (allElements.exportMenu) {
        allElements.exportMenu.addEventListener("click", (e) => {
          e.stopPropagation();
          const target = e.target.closest("a");
          if (!target) return;
          e.preventDefault();
          if (exportActions[target.dataset.format]) {
            exportActions[target.dataset.format]();
          }
          allElements.exportContainer.classList.remove("open");
        });
      }

      // 实时输入监听
      if (allElements.surveyIdInput) {
          allElements.surveyIdInput.addEventListener('input', analyzeAndDisplayInputFeedback);
      }

      // 表单提交
      if (allElements.idInputForm) {
        allElements.idInputForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const inputVal = allElements.surveyIdInput.value.trim();
          if (!inputVal) return;

          let idToFetch = null, tokenToFetch = null;
          try {
              const url = new URL(inputVal);
              if (url.pathname.includes('/viewer.html')) {
                  idToFetch = url.searchParams.get('id');
                  tokenToFetch = url.searchParams.get('token');
              } else {
                  idToFetch = inputVal;
              }
          } catch (error) {
              idToFetch = inputVal;
          }
          
          if (idToFetch) {
              fetchAndRenderSurvey(idToFetch, tokenToFetch);
          } else {
              renderError("无法从您的输入中提取有效ID。请检查链接是否正确。");
              setTimeout(() => switchView("input"), 3500);
          }
        });
      }

      // “查询其他ID”按钮
      if (allElements.searchNewBtn) {
        allElements.searchNewBtn.addEventListener("click", () => {
          switchView("input");
          window.history.pushState({}, "", window.location.pathname);
        });
      }

      // 滚动按钮
      if (allElements.scrollToTopBtn) {
        allElements.scrollToTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
      }
      if (allElements.scrollToBottomBtn) {
        allElements.scrollToBottomBtn.addEventListener('click', () => { window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }); });
      }
      
      // 页面滚动监听
      window.addEventListener('scroll', updateScrollButtonsVisibility, { passive: true });

      // 页面加载时检查URL参数
      const params = new URLSearchParams(window.location.search);
      const initialSurveyId = params.get("id");
      const initialSurveyToken = params.get("token");
      if (initialSurveyId) {
        fetchAndRenderSurvey(initialSurveyId, initialSurveyToken);
      } else {
        switchView("input");
      }
      
      updateScrollButtonsVisibility();
    };

    return { init };
  })();

  resultsRenderer.init();
});