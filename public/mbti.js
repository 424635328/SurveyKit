document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("drop-zone");
  const uploadBtn = document.getElementById("uploadBtn");
  const fileUploadInput = document.getElementById("file-upload-input");
  const surveyIdInput = document.getElementById("surveyIdInput");
  const analyzeByIdBtn = document.getElementById("analyzeByIdBtn");
  const resultSection = document.getElementById("result-section");
  const loadingSpinner = document.getElementById("loading-spinner");
  const reportContent = document.getElementById("report-content");
  const errorMessage = document.getElementById("error-message");
  const mbtiTypeEl = document.getElementById("mbti-type");
  const mbtiTypeNameEl = document.getElementById("mbti-type-name");
  const mbtiTaglineEl = document.getElementById("mbti-tagline");
  const mbtiReportEl = document.getElementById("mbti-analysis-report");
  const loadingTextEl = document.getElementById("loading-text");

  const params = new URLSearchParams(window.location.search);
  const initialSurveyId = params.get("id");
  const initialSurveyToken = params.get("token"); // 获取 URL 中的 token

  const uiManager = (() => {
    let currentTypingTimeout = null;
    const typeText = (element, text, speed = 30) => {
      if (!element) return Promise.resolve();
      if (currentTypingTimeout) clearTimeout(currentTypingTimeout);
      element.textContent = "";
      let i = 0;
      return new Promise((resolve) => {
        const type = () => {
          if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            currentTypingTimeout = setTimeout(type, speed);
          } else {
            currentTypingTimeout = null;
            resolve();
          }
        };
        type();
      });
    };

    const setLoading = (isLoading) => {
      if (isLoading) {
        resultSection.style.display = "block";
        loadingSpinner.style.display = "block";
        reportContent.style.display = "none";
        errorMessage.style.display = "none";
        analyzeByIdBtn.disabled = true;
        uploadBtn.disabled = true;
        surveyIdInput.disabled = true;
        dropZone.classList.add("disabled-drop-zone");
      } else {
        loadingSpinner.style.display = "none";
        analyzeByIdBtn.disabled = false;
        uploadBtn.disabled = false;
        surveyIdInput.disabled = false;
        dropZone.classList.remove("disabled-drop-zone");
      }
    };

    const displayReport = async (result) => {
      if (!mbtiTypeEl || !mbtiTypeNameEl || !mbtiTaglineEl || !mbtiReportEl)
        return;
      mbtiTypeEl.textContent = result.mbti_type || "N/A";
      mbtiTypeNameEl.textContent = result.type_name || "";
      mbtiTaglineEl.textContent = result.tagline || "一份独特的分析报告。";
      reportContent.style.display = "block";
      errorMessage.style.display = "none";
      mbtiReportEl.textContent = ""; // 清空，确保XSS安全
      if (result.analysis_report && Array.isArray(result.analysis_report)) {
        for (const paragraphText of result.analysis_report) {
          const p = document.createElement("p");
          mbtiReportEl.appendChild(p);
          await typeText(p, paragraphText);
        }
      }
    };

    const displayError = (message) => {
      if (currentTypingTimeout) clearTimeout(currentTypingTimeout);
      if (!errorMessage || !resultSection) return;
      resultSection.style.display = "block";
      loadingSpinner.style.display = "none";
      reportContent.style.display = "none";
      errorMessage.textContent = message;
      errorMessage.style.display = "block";
    };

    return { setLoading, displayReport, displayError, typeText };
  })();

  const fileProcessor = (() => {
    const parseTxt = (text, questionMap) => {
      const lines = text.split("\n");
      const parsedAnswers = {};
      let currentQuestionId = null;
      const prefixToIdMap = new Map();
      for (const id in questionMap) {
        const prefix = questionMap[id].substring(0, 20);
        prefixToIdMap.set(prefix, id);
      }

      for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();
        const linePrefix = trimmedLine.substring(0, 20);
        if (prefixToIdMap.has(linePrefix)) {
          currentQuestionId = prefixToIdMap.get(linePrefix);
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (nextLine.startsWith("->")) {
              const answer = nextLine.substring(2).trim();
              if (currentQuestionId) {
                parsedAnswers[currentQuestionId] = answer;
              }
              currentQuestionId = null;
            }
          }
        }
      }
      return parsedAnswers;
    };

    const parseJson = (text) => {
      const data = JSON.parse(text);
      const answers = {};
      if (Array.isArray(data)) {
        data.forEach((section) => {
          if (section.questions && Array.isArray(section.questions)) {
            section.questions.forEach((question) => {
              if (question.id && question.answer) {
                answers[question.id] = question.answer;
              }
            });
          }
        });
      }
      return answers;
    };

    const parseSheet = (data) => {
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const headers = jsonData[0].map((h) => h.trim());
      const idIndex = headers.indexOf("ID");
      const answerIndex = headers.indexOf("Answer");

      if (idIndex === -1 || answerIndex === -1) {
        throw new Error("CSV/Excel文件必须包含 'ID' 和 'Answer' 列。");
      }

      const answers = {};
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const id = row[idIndex];
        const answer = row[answerIndex];
        if (id && answer !== undefined) {
          answers[id] = answer;
        }
      }
      return answers;
    };

    const formatAnswers = (answers, questionMap) => {
      const allAnswers = { ...questionMap };
      for (const qId in allAnswers) {
        allAnswers[qId] = answers[qId] || "未回答";
      }

      return Object.entries(questionMap)
        .map(([qId, qText]) => `- ${qText}: ${allAnswers[qId]}`)
        .join("\n");
    };

    const processFile = async (file, questionMap) => {
      const extension = file.name.split(".").pop().toLowerCase();
      let answers;

      if (extension === "txt") {
        const text = await file.text();
        answers = parseTxt(text, questionMap);
      } else if (extension === "json") {
        const text = await file.text();
        answers = parseJson(text);
      } else if (["xlsx", "xls", "csv"].includes(extension)) {
        const data = await file.arrayBuffer();
        answers = parseSheet(data);
      } else {
        throw new Error(`不支持的文件类型: .${extension}`);
      }
      return formatAnswers(answers, questionMap);
    };

    return { processFile };
  })();

  const app = (() => {
    let currentLoadingInterval = null;

    const analyze = async (payload) => {
      uiManager.setLoading(true);
      if (currentLoadingInterval) clearInterval(currentLoadingInterval);

      const statusMessages = [
        "AI分析引擎启动中...",
        "正在深度阅读你的答案...",
        "进行复杂的人格模型推理...",
        "分析报告撰写中...",
        "最后润色中...",
      ];
      let msgIndex = 0;
      const updateLoadingText = () =>
        uiManager.typeText(
          loadingTextEl,
          statusMessages[(msgIndex = (msgIndex + 1) % statusMessages.length)]
        );
      await uiManager.typeText(loadingTextEl, "正在准备分析环境...");
      currentLoadingInterval = setInterval(updateLoadingText, 5000);

      try {
        const response = await fetch("/api/analyze-mbti", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "分析请求失败。");

        clearInterval(currentLoadingInterval);
        await uiManager.typeText(loadingTextEl, "报告已生成！正在展示...");
        await new Promise((r) => setTimeout(r, 1000));

        await uiManager.displayReport(result);
      } catch (error) {
        uiManager.displayError(error.message);
      } finally {
        clearInterval(currentLoadingInterval);
        uiManager.setLoading(false);
      }
    };

    const handleFile = async (file) => {
      if (!file) return;
      uiManager.setLoading(true);
      await uiManager.typeText(loadingTextEl, `正在解析 ${file.name}...`);
      try {
        const answersText = await fileProcessor.processFile(
          file,
          window.questionMap
        );
        if (
          !answersText ||
          !answersText.split("\n").some((line) => !line.endsWith(": 未回答"))
        ) {
          throw new Error("未能在文件中提取到有效答案，请检查文件内容和格式。");
        }
        await analyze({ answersText });
      } catch (error) {
        uiManager.displayError(error.message);
        uiManager.setLoading(false);
      }
    };

    const handleIdInput = () => {
      const surveyId = surveyIdInput.value.trim();
      if (!surveyId) {
        uiManager.displayError("请输入你的问卷ID。");
        return;
      }
      // 将从 URL 获取的 token 传递给 analyze 函数
      analyze({ surveyId, token: initialSurveyToken }); 
    };

    const setupEventListeners = () => {
      uploadBtn.addEventListener("click", () => fileUploadInput.click());
      fileUploadInput.addEventListener("change", (e) =>
        handleFile(e.target.files[0])
      );
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("is-active");
      });
      dropZone.addEventListener("dragleave", () =>
        dropZone.classList.remove("is-active")
      );
      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("is-active");
        handleFile(e.dataTransfer.files[0]);
      });
      analyzeByIdBtn.addEventListener("click", handleIdInput);
      surveyIdInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") handleIdInput();
      });
    };

    const init = async () => {
      try {
        const res = await fetch("/questions.json");
        const sections = await res.json();
        window.questionMap = {};
        sections
          .flatMap((s) => s.questions)
          .forEach((q) => (window.questionMap[q.id] = q.text));

        setupEventListeners();
        if (initialSurveyId) {
          surveyIdInput.value = initialSurveyId;
          uiManager.displayError(
            `问卷ID "${initialSurveyId}" 已自动填充，请点击按钮开始分析。`
          );
        }
      } catch (e) {
        uiManager.displayError("无法加载问卷配置，功能受限。");
      }
    };
    return { init };
  })();

  app.init();
});