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
    };

    let sections = [];
    let surveyData = {};
    let currentSurveyId = null;
    let isLoading = false;
    let animationObserver;
    let currentSurveyToken = null; // 新增：保存当前问卷的令牌

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
        XPSX.writeFile(workbook, `问卷结果-${currentSurveyId}.${format}`);
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
          if (!answerText) {
            answerP.classList.add('no-answer');
          }
          answerP.textContent = answerText || "未回答"; 
          item.appendChild(answerP);
          
          sectionDiv.appendChild(item);
        });
        
        allElements.resultsContainer.appendChild(sectionDiv);
      });
      initAnimationObserver();
    };

    const fetchAndRenderSurvey = async (surveyId, surveyToken) => { // 接收 token
      if (isLoading) return;
      isLoading = true;
      currentSurveyId = surveyId;
      currentSurveyToken = surveyToken; // 保存令牌
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
          fetch(`./api/get-survey?id=${surveyId}${surveyToken ? `&token=${surveyToken}` : ''}`), // 拼接 token
        ]);
        if (!questionsRes.ok)
          throw new Error("无法加载问卷结构 (questions.json)。");
        sections = await questionsRes.json();
        if (!surveyRes.ok) {
          let errorData;
          try {
             errorData = await surveyRes.json();
          } catch(e) {
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
        if (surveyToken) url.searchParams.set("token", surveyToken); // 将 token 添加到 URL
        window.history.pushState({ id: surveyId, token: surveyToken }, "", url); // 保存 token 到 state
      } catch (error) {
        console.error("获取问卷结果失败:", error);
        renderError(`加载失败: ${error.message}`);
        setTimeout(() => switchView("input"), 3000);
      } finally {
        isLoading = false;
        if (allElements.submitIdBtn) {
          allElements.submitIdBtn.disabled = false;
          allElements.submitIdBtn.innerHTML = '<i class="fa fa-search"></i> 查看结果';
        }
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
          const surveyId = allElements.surveyIdInput.value.trim();
          if (surveyId) {
            // 在输入表单提交时，无法获取 token，所以只传 ID
            fetchAndRenderSurvey(surveyId, null); 
          }
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
      const initialSurveyToken = params.get("token"); // 获取 URL 中的 token
      if (initialSurveyId) {
        fetchAndRenderSurvey(initialSurveyId, initialSurveyToken); // 传递 token
      } else {
        switchView("input");
      }
    };

    return { init };
  })();

  resultsRenderer.init();
});