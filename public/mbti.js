// public/mbti.js

/* global XLSX */ 

document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("drop-zone");
  const uploadBtn = document.getElementById("uploadBtn");
  const fileUploadInput = document.getElementById("file-upload-input");
  const surveyIdInput = document.getElementById("surveyIdInput");
  const analyzeByIdBtn = document.getElementById("analyzeByIdBtn");

  const resultSection = document.getElementById("result-section"); 
  const loadingSpinner = document.getElementById("loading-spinner");
  const loadingTextEl = document.getElementById("loading-text");

  const statusMessageEl = document.getElementById("status-message");
  const reportContent = document.getElementById("report-content");

  const mbtiTypeEl = document.getElementById("mbti-type");             
  const mbtiTypeNameEl = document.getElementById("mbti-type-name");  
  const mbtiTaglineEl = document.getElementById("mbti-tagline");   
  const mbtiReportEl = document.getElementById("mbti-analysis-report");

  const criticalElements = [
      dropZone, uploadBtn, fileUploadInput, surveyIdInput, analyzeByIdBtn,
      resultSection, loadingSpinner, loadingTextEl, statusMessageEl, reportContent,
      mbtiTypeEl, mbtiTypeNameEl, mbtiTaglineEl, mbtiReportEl
  ];
  if (criticalElements.some(el => el === null)) {
      console.error("Error: One or more critical DOM elements were not found. Script cannot initialize.");
      return; 
  }


  const params = new URLSearchParams(window.location.search);
  const initialSurveyId = params.get("id");
  const initialSurveyToken = params.get("token");


  const uiManager = (() => {
    let currentTypingTimeout = null;

    const typeText = (element, text, speed = 30) => {
      if (!element) return Promise.resolve();
      if (currentTypingTimeout) clearTimeout(currentTypingTimeout);
      element.textContent = "";
      let i = 0;
      return new Promise((resolve) => {
        if (text === null || text === undefined) { 
             element.textContent = "";
             resolve();
             return;
        }
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
      resultSection.style.display = "block";

      if (isLoading) {
        loadingSpinner.style.display = "block";
        reportContent.style.display = "none";
        statusMessageEl.style.display = "none"; 

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
      if (!mbtiTypeEl || !mbtiTypeNameEl || !mbtiTaglineEl || !mbtiReportEl) {
          console.error("displayReport: Report elements not found.");
          return;
      }

      setLoading(false);

      mbtiTypeEl.textContent = result.mbti_type || "N/A"; 
      mbtiTypeNameEl.textContent = result.type_name || "未知类型"; 
      mbtiTaglineEl.textContent = result.tagline || "一份独特的分析报告。";

      reportContent.style.display = "block";
      statusMessageEl.style.display = "none";

      mbtiReportEl.innerHTML = "";
      if (result.analysis_report && Array.isArray(result.analysis_report)) {
        for (const paragraphText of result.analysis_report) {
          const p = document.createElement("p");
          mbtiReportEl.appendChild(p);
          await typeText(p, paragraphText);
        }
      } else {
           console.warn("Analysis report data is not in expected array format or is missing.");
           const p = document.createElement("p");
           mbtiReportEl.appendChild(p);
           await typeText(p, result.analysis_report || "未能生成详细的分析报告。"); 
      }
    };

    const displayMessage = (message, type = 'info') => {
      if (currentTypingTimeout) clearTimeout(currentTypingTimeout);
      if (!statusMessageEl || !resultSection || !loadingSpinner || !reportContent) {
           console.error("displayMessage: Message or related elements not found.");
           return;
      }

      setLoading(false);

      resultSection.style.display = "block";
      loadingSpinner.style.display = "none";
      reportContent.style.display = "none";

      statusMessageEl.textContent = message;
      statusMessageEl.className = 'status-message';
      if (type === 'error') {
        statusMessageEl.classList.add('message-error');
      } else if (type === 'success') {
        statusMessageEl.classList.add('message-success');
      } else {
        statusMessageEl.classList.add('message-info');
      }
      statusMessageEl.style.display = "block"; 
    };

    return { setLoading, displayReport, displayMessage, typeText };
  })();


  const fileProcessor = (() => {

    const parseTxt = (text, questionMap) => {
      const lines = text.split("\n");
      const parsedAnswers = {};
      let currentQuestionId = null;

      const prefixToIdMap = new Map();
      for (const id in questionMap) {
          if (Object.hasOwn(questionMap, id)) { 
              const qText = String(questionMap[id] || "").trim();
              if (qText.length > 0) {
                  const prefix = qText.substring(0, Math.min(qText.length, 40));
                  prefixToIdMap.set(prefix, id);
              }
          }
      }
      console.log("TXT Parser: Prefix to ID Map:", prefixToIdMap);


      for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();
        if (!trimmedLine) continue;

        let matchedId = null;
        for (const [prefix, id] of prefixToIdMap.entries()) {
             if (trimmedLine.startsWith(prefix)) {
                  matchedId = id;
                  break;
             }
        }

        if (matchedId) {
            currentQuestionId = matchedId;
             if (i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                if (nextLine.startsWith("->")) {
                  const answer = nextLine.substring(2).trim();
                  if (currentQuestionId && answer !== "") {
                    parsedAnswers[currentQuestionId] = answer;
                  }
                }
             }
         }
      }
      console.log("TXT Parser: Parsed Answers:", parsedAnswers);
      return parsedAnswers;
    };

    const parseJson = (text) => {
      const data = JSON.parse(text);
      const answers = {};

      if (Array.isArray(data)) {
        data.forEach((section) => {
          if (section.questions && Array.isArray(section.questions)) {
            section.questions.forEach((question) => {
              if (question.id && question.answer !== undefined) {
                answers[question.id] = question.answer;
              }
            });
          }
        });
      } else if (typeof data === 'object' && data !== null) {
          let finalData = data;
          if (typeof data.data === 'string') {
              try {
                  finalData = JSON.parse(data.data);
              } catch (e) {
                  console.error("JSON Parser: Failed to parse nested 'data' string:", e);
              }
          }

          for (const key in finalData) {
              if (Object.hasOwn(finalData, key)) {
                  if (key.startsWith('q') || (window.questionMap && Object.hasOwn(window.questionMap, key))) {
                       answers[key] = finalData[key];
                   }
              }
          }
      } else {
          throw new Error("JSON 文件格式不正确。");
      }
      console.log("JSON Parser: Parsed Answers:", answers);
      return answers;
    };

    const parseSheet = (data) => {
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0]; 
      const worksheet = workbook.Sheets[sheetName];

      const jsonFromSheet = XLSX.utils.sheet_to_json(worksheet);
      console.log("SheetJS: sheet_to_json output:", jsonFromSheet);

      const answers = {};
      if (Array.isArray(jsonFromSheet)) {
           let idKey = null; 
           let answerKey = null;

           if (jsonFromSheet.length > 0) {
               const firstRowKeys = Object.keys(jsonFromSheet[0]);
               idKey = firstRowKeys.find(key => String(key).trim().toLowerCase() === 'id' || String(key).trim().toLowerCase().includes('qid'));
               answerKey = firstRowKeys.find(key => String(key).trim().toLowerCase() === 'answer' || String(key).trim().toLowerCase().includes('回答') || String(key).trim().toLowerCase().includes('答案') || String(key).trim().toLowerCase().includes('value'));
           }


           if (idKey && answerKey) {
                jsonFromSheet.forEach(row => {
                    const id = Object.hasOwn(row, idKey) ? row[idKey] : undefined;
                    const answer = Object.hasOwn(row, answerKey) ? row[answerKey] : undefined;

                    if (id && answer !== undefined && answer !== null) {
                        answers[String(id).trim()] = answer;
                    }
                });
           } else {
               console.warn("SheetJS: Standard 'ID' and 'Answer' columns not found. Attempting array-of-arrays parse.");
                const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); 
                if (Array.isArray(rawData) && rawData.length > 1) {
                    for (let i = 1; i < rawData.length; i++) { 
                        const row = rawData[i];
                        if (Array.isArray(row) && row.length >= 2 && row[0] && row[1] !== undefined && row[1] !== null) {
                             answers[String(row[0]).trim()] = row[1];
                        }
                    }
                } else {
                     console.error("SheetJS: Raw data not in expected [ [headers], [id, answer], ... ] format or is empty.");
                     throw new Error("无法识别的电子表格/CSV文件格式或内容为空。");
                }
           }

      } else {
          console.error("SheetJS: sheet_to_json did not return an array.");
          throw new Error("无法解析电子表格/CSV文件内容。");
      }

      console.log("SheetJS Parser: Parsed Answers:", answers);
      return answers;
    };


    const formatAnswers = (answers, questionMap) => {
      if (typeof answers !== 'object' || answers === null) {
           console.error("formatAnswers: Invalid input 'answers'. Expected object, got:", answers);
           return "无法格式化问卷答案。";
      }
      if (typeof questionMap !== 'object' || questionMap === null) {
          console.warn("formatAnswers: questionMap is not available or invalid. Formatting using only found answers.");
           return Object.entries(answers)
             .map(([qId, answer]) => `- ${qId}: ${answer}`)
             .join("\n");
      }

      const formattedLines = [];
      for (const qId in questionMap) {
          if (Object.hasOwn(questionMap, qId)) {
              const qText = questionMap[qId];
              const answer = Object.hasOwn(answers, qId) && answers[qId] !== undefined && answers[qId] !== null ? answers[qId] : "未回答";
              formattedLines.push(`- ${qText}: ${answer}`);
          }
      }

      return formattedLines.join("\n");
    };


    const processFile = async (file, questionMap) => {
      const extension = file.name.split(".").pop().toLowerCase();
      let answers;

      const fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = (error) => {
              console.error("FileReader error:", error);
              reject(new Error(`文件读取失败: ${error.message}`));
          };

          if (["xlsx", "xls", "csv"].includes(extension)) {
              reader.readAsArrayBuffer(file);
          } else { // json, txt, etc.
              reader.readAsText(file);
          }
      });


      try {
          if (extension === "txt") {
              if (Object.keys(questionMap).length === 0) {
                   throw new Error("无法解析 .txt 文件：未加载问卷配置。");
              }
            answers = parseTxt(fileContent, questionMap);
          } else if (extension === "json") {
            answers = parseJson(fileContent);
          } else if (["xlsx", "xls", "csv"].includes(extension)) {
            answers = parseSheet(fileContent);
          } else {
            throw new Error(`不支持的文件类型: .${extension}`);
          }
      } catch (error) {
          console.error("Error parsing file content:", error);
          throw new Error(`解析文件内容失败: ${error.message}`);
      }


      const formattedText = formatAnswers(answers, questionMap);

       const answerLines = formattedText.split('\n').filter(line => line.includes(':') && !line.endsWith(': 未回答'));
       if (answerLines.length < 1) { 
            console.warn(`Fewer than 1 answer line found or formatted. Count: ${answerLines.length}`);
            const totalQuestions = Object.keys(questionMap).length;
            const answersFound = Object.keys(answers).length;

            if (answersFound === 0 && totalQuestions > 0) {
                 throw new Error("未能从文件中提取到任何答案，请检查文件内容和格式。");
            } else if (answersFound > 0 && answerLines.length === 0) {
                 throw new Error("已读取文件，但未提取到有效答案数据（所有答案均为空或 '未回答'）。");
            }
       }


      return formattedText;
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

        if (!response.ok) {
           throw new Error(result.message || `分析请求失败，状态码: ${response.status}`);
        }

        if (!result || typeof result !== 'object' || !result.mbti_type || !Array.isArray(result.analysis_report)) {
            console.error("API returned unexpected data format:", result);
            throw new Error("AI 返回的数据格式不正确，请联系管理员。");
        }

        clearInterval(currentLoadingInterval);
        currentLoadingInterval = null;
        await uiManager.typeText(loadingTextEl, "报告已生成！正在展示...");
        await new Promise((r) => setTimeout(r, 1000));

        uiManager.displayReport(result);

      } catch (error) {
        console.error("Analysis process failed:", error);
        if (currentLoadingInterval) clearInterval(currentLoadingInterval);
         currentLoadingInterval = null;
        uiManager.displayMessage(error.message || "分析过程中发生未知错误。", 'error');
      }
    };

    const handleFile = async (file) => {
      if (!file) return;

      uiManager.setLoading(true);
      await uiManager.typeText(loadingTextEl, `正在读取并解析文件: ${file.name}...`);

      try {
         if (Object.keys(window.questionMap).length === 0) {
              console.warn("Question map not loaded before file processing.");
         }

        const answersText = await fileProcessor.processFile(
          file,
          window.questionMap 
        );

        await analyze({ answersText: answersText });

      } catch (error) {
        console.error("File handling failed:", error);
        if (currentLoadingInterval) clearInterval(currentLoadingInterval);
        currentLoadingInterval = null;
        uiManager.displayMessage(error.message || "文件处理失败，请重试。", 'error');
        uiManager.setLoading(false);
      }
    };

    const handleIdInput = () => {
      const idValue = surveyIdInput.value.trim();

      if (!idValue) {
        uiManager.displayMessage("请输入你的问卷ID或提交ID。", 'error');
        return;
      }

      let payload = {};

      if (idValue.startsWith('sub_')) {
          payload = { submissionId: idValue };
      } else if (idValue.startsWith('survey_')) {
          payload = { surveyId: idValue };
      } else {
          uiManager.displayMessage("ID格式无效。请输入以 'sub_' 或 'survey_' 开头的ID。", 'error');
          return;
      }

      if (initialSurveyToken) {
          payload.token = initialSurveyToken;
      }

      analyze(payload);
    };

    const setupEventListeners = () => {
      if (uploadBtn) uploadBtn.addEventListener("click", () => fileUploadInput.click());
      if (fileUploadInput) fileUploadInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

      if (dropZone) {
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
          if (e.dataTransfer.files.length > 0) {
             handleFile(e.dataTransfer.files[0]);
          }
        });
      }

      if (analyzeByIdBtn) analyzeByIdBtn.addEventListener("click", handleIdInput);
      if (surveyIdInput) {
        surveyIdInput.addEventListener("keyup", (e) => {
          if (e.key === "Enter") {
              e.preventDefault(); 
              handleIdInput();
          }
        });
      }

       console.log("Event listeners set up.");
    };

    const init = async () => {
      try {
        uiManager.displayMessage("正在加载问卷配置...", 'info');
        const res = await fetch("/questions.json");
         if (!res.ok) {
             throw new Error(`无法加载问卷配置: ${res.status}`);
         }
        const sections = await res.json();

        window.questionMap = {};
        if (Array.isArray(sections)) {
             sections
               .flatMap((s) => s.questions || [])
               .forEach((q) => {
                   if (q && q.id && q.text) {
                        window.questionMap[q.id] = q.text;
                   } else {
                        console.warn("Skipping invalid question object:", q);
                   }
               });
        } else {
            console.error("questions.json did not return an array of sections.");
             uiManager.displayMessage("警告: 问卷配置格式不正确，某些功能可能受限。", 'warning');
        }

         if (Object.keys(window.questionMap).length === 0) {
              console.error("Question map is empty after processing questions.json.");
               uiManager.displayMessage("警告: 未加载到任何问卷问题配置，文件上传解析可能不准确。", 'warning');
         }


        setupEventListeners();

        if (initialSurveyId) {
             surveyIdInput.value = initialSurveyId;
             if (initialSurveyToken) {
               uiManager.displayMessage("检测到问卷ID和密钥，正在自动分析...", 'info');
               await new Promise(r => setTimeout(r, 1500));
               analyze({ surveyId: initialSurveyId, token: initialSurveyToken }); 
             } else {
               uiManager.displayMessage(
                 `问卷ID "${initialSurveyId}" 已自动填充，请点击按钮或输入密钥开始分析。`, 'info'
               );
             }
        } else {
            uiManager.displayMessage("请上传问卷文件或输入问卷ID开始分析。", 'info');
        }


      } catch (e) {
        console.error("Initialization failed:", e);
        uiManager.displayMessage(`初始化失败: ${e.message || "无法加载必要资源"}。功能受限。`, 'error');
      }
    };

    return { init };
  })();

  app.init();

  console.log("MBTI analysis script loaded.");
});