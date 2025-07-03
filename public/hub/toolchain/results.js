// public/hub/toolchain/results.js
document.addEventListener("DOMContentLoaded", () => {
  // 检查认证 token
  const token = localStorage.getItem("surveyKitToken");
  if (!token) {
    window.location.href = `../login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const surveyId = params.get("id");

  // 获取 DOM 元素
  const loadingState = document.getElementById("loading-state");
  const errorState = document.getElementById("error-state");
  const resultsContent = document.getElementById("results-content");
  const surveyTitleEl = document.getElementById("survey-title");
  const submissionCountEl = document.getElementById("submission-count");
  const tableEl = document.getElementById("results-table");
  const downloadCsvBtn = document.getElementById("download-csv-btn");
  const downloadJsonBtn = document.getElementById("download-json-btn");

  let fullResultsData = null; // 用于存储问卷结构和提交数据的完整对象

  // 通用 UI 辅助函数 (保持不变)
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
  function updateFooterYear() {
    const currentYearFooter = document.getElementById("current-year-footer");
    if (currentYearFooter) {
      currentYearFooter.textContent = new Date().getFullYear();
    }
  }

  /**
   * 获取问卷结果数据。
   * @returns {Promise<void>}
   */
  async function fetchResults() {
    if (!surveyId) {
      showError("URL中缺少问卷ID。");
      return;
    }

    try {
      // Promise.all 并行获取问卷结构和回答
      const [structureRes, resultsRes] = await Promise.all([
        fetch(`/api/survey-details.mjs?id=${surveyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/get-results.mjs?id=${surveyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!structureRes.ok) {
        if (structureRes.status === 401) {
          localStorage.removeItem("surveyKitToken");
          window.location.href = `../login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          return;
        }
        throw new Error("无法获取问卷结构信息。");
      }
      if (!resultsRes.ok) {
        if (resultsRes.status === 401) {
          localStorage.removeItem("surveyKitToken");
          window.location.href = `../login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          return;
        }
        throw new Error("无法获取问卷回答数据。");
      }

      const surveyStructure = await structureRes.json();
      const resultsData = await resultsRes.json();

      if (!surveyStructure || !surveyStructure.questions) {
        throw new Error("问卷结构信息不完整或无问题内容。");
      }
      if (!resultsData || !Array.isArray(resultsData.submissions)) {
        throw new Error("提交结果数据格式不正确。");
      }

      fullResultsData = {
        structure: surveyStructure,
        submissions: resultsData.submissions,
      };
      renderResults(fullResultsData);
      loadingState.classList.add("hidden");
      resultsContent.classList.remove("hidden");
    } catch (error) {
      showError(error.message);
    }
  }

  /**
   * 渲染问卷结果到表格。
   * @param {object} data - 包含问卷结构和提交的数据。
   */
  function renderResults(data) {
    surveyTitleEl.textContent = `“${escapeHtml(data.structure.title)}”`;
    submissionCountEl.textContent = data.submissions.length;

    tableEl.innerHTML = ""; // 清空表格内容

    if (data.submissions.length === 0) {
      tableEl.innerHTML = `
                <tbody>
                    <tr>
                        <td colspan="100%" class="text-center p-8 text-slate-400">
                            <i class="fa fa-frown-o text-4xl mb-4 block"></i>
                            <p class="text-lg mb-2">暂无任何回答数据。</p>
                            <p>请分享问卷链接，邀请大家填写吧！</p>
                        </td>
                    </tr>
                </tbody>
            `;
      downloadCsvBtn.disabled = true;
      downloadJsonBtn.disabled = true;
      return;
    }

    // --- 优化表格列顺序和内容显示 ---
    // 1. 获取所有问题，并按照问卷中定义的原始顺序存储
    const orderedQuestions = data.structure.questions.flatMap(
      (part) => part.questions
    );

    // 2. 构建表头
    const thead = document.createElement("thead");
    let headerRowHtml = "<tr>";
    // 添加提交时间列
    headerRowHtml += `<th class="whitespace-nowrap">提交时间</th>`;

    const questionIdToInfoMap = new Map(); // 用于快速查找问题信息
    orderedQuestions.forEach((q) => {
      headerRowHtml += `<th class="whitespace-nowrap">${escapeHtml(q.text)}</th>`;
      questionIdToInfoMap.set(q.id, { type: q.type, hasOther: q.hasOther });
      // 如果是“其他”选项，再添加一个额外的列
      if (q.type === "radio" && q.hasOther) {
        headerRowHtml += `<th class="whitespace-nowrap">${escapeHtml(q.text)} (其他)</th>`;
      }
    });
    headerRowHtml += "</tr>";
    thead.innerHTML = headerRowHtml;
    tableEl.appendChild(thead);

    // 3. 填充表格体
    const tbody = document.createElement("tbody");
    data.submissions.forEach((submission) => {
      const row = document.createElement("tr");
      let rowCellsHtml = "";

      // 添加提交时间
      const submittedAt = new Date(submission.submittedAt).toLocaleString(
        "zh-CN",
        {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }
      );
      rowCellsHtml += `<td>${escapeHtml(submittedAt)}</td>`;

      orderedQuestions.forEach((q) => {
        const answerValue = submission.answers[q.id];
        let displayValue = "";

        if (q.type === "radio" && q.hasOther) {
          const otherTextValue = submission.answers[`${q.id}_other`];
          if (answerValue === "_other_") {
            displayValue = `其他: ${otherTextValue ? escapeHtml(otherTextValue) : "(未填写)"}`;
            rowCellsHtml += `<td>${escapeHtml(displayValue)}</td>`; // 主列显示实际回答
            rowCellsHtml += `<td>${otherTextValue ? escapeHtml(otherTextValue) : ""}</td>`; // "其他"补充列
          } else {
            displayValue = escapeHtml(answerValue || "");
            rowCellsHtml += `<td>${displayValue}</td>`; // 主列显示实际回答
            rowCellsHtml += `<td></td>`; // "其他"补充列为空
          }
        } else {
          displayValue = escapeHtml(answerValue || "");
          rowCellsHtml += `<td>${displayValue}</td>`;
        }
      });
      row.innerHTML = rowCellsHtml;
      tbody.appendChild(row);
    });
    tableEl.appendChild(tbody);

    // 确保按钮可用
    downloadCsvBtn.disabled = false;
    downloadJsonBtn.disabled = false;
  }

  /**
   * 导出结果为 CSV 文件。
   */
  function downloadCSV() {
    if (!fullResultsData || fullResultsData.submissions.length === 0) {
      alert("没有数据可导出。");
      return;
    }

    const orderedQuestions = fullResultsData.structure.questions.flatMap(
      (part) => part.questions
    );

    // 构建 CSV 头部
    let csvHeaders = ["提交时间"]; // 第一列是提交时间
    const exportQuestionIds = []; // 存储用于数据导出的问题ID和辅助ID

    orderedQuestions.forEach((q) => {
      csvHeaders.push(`"${q.text.replace(/"/g, '""')}"`); // 主问题文本
      exportQuestionIds.push(q.id); // 对应的主问题ID

      if (q.type === "radio" && q.hasOther) {
        csvHeaders.push(`"${q.text.replace(/"/g, '""')} (其他)"`); // 额外添加“其他”列
        exportQuestionIds.push(`${q.id}_other`); // 对应“其他”文本的ID
      }
    });

    let csvContent = "\ufeff"; // BOM for proper UTF-8 encoding in Excel
    csvContent += csvHeaders.join(",") + "\r\n";

    // 构建 CSV 数据行
    fullResultsData.submissions.forEach((submission) => {
      const row = [];
      // 添加提交时间
      const submittedAt = new Date(submission.submittedAt).toLocaleString(
        "zh-CN"
      );
      row.push(`"${String(submittedAt).replace(/"/g, '""')}"`);

      exportQuestionIds.forEach((key) => {
        const value = submission.answers[key] || "";
        row.push(`"${String(value).replace(/"/g, '""')}"`);
      });
      csvContent += row.join(",") + "\r\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const filename = `${fullResultsData.structure.title || "问卷结果"}_results.csv`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  /**
   * 导出结果为 JSON 文件。
   */
  function downloadJSON() {
    if (!fullResultsData || fullResultsData.submissions.length === 0) {
      alert("没有数据可导出。");
      return;
    }
    // 直接导出获取到的 fullResultsData，其中已经包含了 structure 和 submissions
    const jsonString = JSON.stringify(fullResultsData, null, 2);
    const blob = new Blob([jsonString], {
      type: "application/json;charset=utf-8;",
    });
    const filename = `${fullResultsData.structure.title || "问卷结果"}_results.json`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  /**
   * 显示错误消息。
   * @param {string} message - 要显示的错误文本。
   */
  function showError(message) {
    loadingState.classList.add("hidden");
    errorState.classList.remove("hidden");
    errorState.innerHTML = `
            <i class="fa fa-exclamation-triangle text-red-500 text-4xl mb-4 block"></i>
            <p class="text-lg mb-2">加载失败：</p>
            <p>${escapeHtml(message)}</p>
            <p class="text-sm mt-4 text-slate-400">请检查网络连接，或确认问卷ID是否正确且您有权限查看。</p>
        `;
    surveyTitleEl.textContent = "加载失败";
    downloadCsvBtn.disabled = true;
    downloadJsonBtn.disabled = true;
  }

  /**
   * 对 HTML 字符串进行转义，防止 XSS。
   * @param {string} str - 要转义的字符串。
   * @returns {string} 转义后的字符串。
   */
  function escapeHtml(str) {
    if (typeof str !== "string" && str !== null && str !== undefined)
      return String(str);
    if (str === null || str === undefined) return ""; // Handle null/undefined explicitly
    return str.replace(/[&<>"']/g, (match) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[match];
    });
  }

  // 事件监听器
  downloadCsvBtn.addEventListener("click", downloadCSV);
  downloadJsonBtn.addEventListener("click", downloadJSON);

  // 初始化通用 UI 组件和动画
  initMobileMenu();
  initHeaderScrollEffect();
  initScrollAnimations();
  updateFooterYear();

  // 开始获取并渲染结果
  fetchResults();
});
