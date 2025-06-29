// public/viewer.js - Final, Corrected, and Enhanced Version with Structured Exports

document.addEventListener("DOMContentLoaded", () => {
  const resultsRenderer = (() => {
    // --- 1. 元素获取 ---
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
    };

    // --- 2. 全局变量 ---
    let sections = [];
    let surveyData = {};
    let currentSurveyId = null;
    let isLoading = false;
    let animationObserver;

    // --- 3. 辅助函数 ---
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

    // ========================================================================
    // =======================  XSS 漏洞修复点 #1  ============================
    // ========================================================================
    const renderError = (message) => {
      if (allElements.resultsContainer) {
        // 先清空容器
        allElements.resultsContainer.textContent = ''; 
        // 创建一个 p 元素来安全地显示错误信息
        const errorP = document.createElement('p');
        errorP.className = 'error-message';
        // 使用 textContent 来防止 XSS
        errorP.textContent = message; 
        allElements.resultsContainer.appendChild(errorP);
      }
    };
    // ========================================================================

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
    };

    // --- 4. 导出逻辑 ---
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
            // q.text 和 q.answer 是用户生成内容，但这里是构建纯文本文件，不是HTML，所以是安全的。
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

    // --- 5. 核心渲染与数据获取 ---
    // ========================================================================
    // =======================  XSS 漏洞修复点 #2 & #3 ==========================
    // ========================================================================
    const renderResults = (data) => {
      surveyData = data;
      // 使用 textContent 清空，更安全
      allElements.resultsContainer.textContent = ""; 
      
      sections.forEach((section) => {
        // --- 创建分区容器 ---
        const sectionDiv = document.createElement("div");
        sectionDiv.className = "result-section animated-line";
        
        // --- 安全地创建和填充分区标题 (修复点 #2) ---
        const titleH2 = document.createElement('h2');
        titleH2.className = 'section-title';
        // section.legend 可能来自用户创建的 questions.json，所以用 textContent
        titleH2.textContent = section.legend; 
        sectionDiv.appendChild(titleH2);

        section.questions.forEach((q) => {
          const answerText = data[q.id];

          // --- 安全地创建和填充问答项 (修复点 #3) ---
          // 1. 创建容器 div.result-item
          const item = document.createElement("div");
          item.className = "result-item animated-line";

          // 2. 创建并填充问题 p.question
          const questionP = document.createElement('p');
          questionP.className = 'question';
          // q.text 来自 questions.json，同样用 textContent 防护
          questionP.textContent = q.text; 
          item.appendChild(questionP);

          // 3. 创建并填充答案 p.answer
          const answerP = document.createElement('p');
          answerP.className = 'answer';
          if (!answerText) {
            answerP.classList.add('no-answer');
          }
          // answerText 是用户在问卷中的输入，必须用 textContent
          answerP.textContent = answerText || "未回答"; 
          item.appendChild(answerP);
          
          // 4. 将安全的问答项添加到分区容器中
          sectionDiv.appendChild(item);
        });
        
        // 5. 将安全的分区容器添加到主结果容器中
        allElements.resultsContainer.appendChild(sectionDiv);
      });
      initAnimationObserver();
    };
    // ========================================================================


    const fetchAndRenderSurvey = async (surveyId) => {
      if (isLoading) return;
      isLoading = true;
      currentSurveyId = surveyId;
      switchView("results");
      
      // 安全地显示加载提示
      const loadingP = document.createElement('p');
      loadingP.className = 'loading-placeholder';
      loadingP.textContent = '正在加载数据...';
      allElements.resultsContainer.textContent = '';
      allElements.resultsContainer.appendChild(loadingP);

      if (allElements.currentIdDisplaySpan)
        allElements.currentIdDisplaySpan.textContent = surveyId;
      if (allElements.submitIdBtn) {
        allElements.submitIdBtn.disabled = true;
        // 这里使用 innerHTML 是安全的，因为内容是开发者定义的，不包含用户变量
        allElements.submitIdBtn.innerHTML =
          '<i class="fa fa-spinner fa-spin"></i> 正在查询...';
      }
      try {
        const [questionsRes, surveyRes] = await Promise.all([
          fetch("./questions.json"),
          fetch(`./api/get-survey?id=${surveyId}`),
        ]);
        if (!questionsRes.ok)
          throw new Error("无法加载问卷结构 (questions.json)。");
        sections = await questionsRes.json();
        if (!surveyRes.ok) {
          let errorData;
          try {
             // 尝试解析JSON格式的错误信息
             errorData = await surveyRes.json();
          } catch(e) {
             // 如果后端返回非JSON错误（如 502 Bad Gateway），则使用状态文本
             errorData = { message: surveyRes.statusText || `服务器返回状态 ${surveyRes.status}` };
          }
          throw new Error(
            errorData.message || `无法获取ID为 ${surveyId} 的数据。`
          );
        }
        const data = await surveyRes.json();
        renderResults(data);
        const url = new URL(window.location);
        url.searchParams.set("id", surveyId);
        window.history.pushState({ id: surveyId }, "", url);
      } catch (error) {
        console.error("获取问卷结果失败:", error);
        renderError(`加载失败: ${error.message}`);
        setTimeout(() => switchView("input"), 3000);
      } finally {
        isLoading = false;
        if (allElements.submitIdBtn) {
          allElements.submitIdBtn.disabled = false;
          // 这里使用 innerHTML 同样是安全的
          allElements.submitIdBtn.innerHTML =
            '<i class="fa fa-search"></i> 查看结果';
        }
      }
    };

    const init = () => {
      // ... (事件监听部分代码无需修改) ...
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
          const surveyId = allElements.surveyIdInput.value.trim();
          if (surveyId) fetchAndRenderSurvey(surveyId);
        });
      }

      if (allElements.searchNewBtn) {
        allElements.searchNewBtn.addEventListener("click", () => {
          switchView("input");
          window.history.pushState({}, "", window.location.pathname);
        });
      }

      const params = new URLSearchParams(window.location.search);
      const initialSurveyId = params.get("id");
      if (initialSurveyId) {
        fetchAndRenderSurvey(initialSurveyId);
      } else {
        switchView("input");
      }
    };

    return { init };
  })();

  resultsRenderer.init();
});