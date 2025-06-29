// Client-side mbti.js - Focuses on DOM manipulation and fetching

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Element Getters ---
  // Ensure all elements expected by the script are selected
  const dropZone = document.getElementById("drop-zone");
  const uploadBtn = document.getElementById("uploadBtn");
  const fileUploadInput = document.getElementById("file-upload-input");
  const surveyIdInput = document.getElementById("surveyIdInput");
  const analyzeByIdBtn = document.getElementById("analyzeByIdBtn");

  const resultSection = document.getElementById("result-section"); // Parent container for results/loading/messages
  const loadingSpinner = document.getElementById("loading-spinner"); // Loading spinner div
  const loadingTextEl = document.getElementById("loading-text");     // Loading text paragraph

  const statusMessageEl = document.getElementById("status-message"); // This should now exist in HTML
  const reportContent = document.getElementById("report-content"); // Report content container

  const mbtiTypeEl = document.getElementById("mbti-type");             // MBTI badge div
  const mbtiTypeNameEl = document.getElementById("mbti-type-name");   // MBTI type name heading
  const mbtiTaglineEl = document.getElementById("mbti-tagline");     // MBTI tagline paragraph
  const mbtiReportEl = document.getElementById("mbti-analysis-report"); // Analysis report content div

  // Basic check for critical elements (Optional but recommended)
  const criticalElements = [
      dropZone, uploadBtn, fileUploadInput, surveyIdInput, analyzeByIdBtn,
      resultSection, loadingSpinner, loadingTextEl, statusMessageEl, reportContent,
      mbtiTypeEl, mbtiTypeNameEl, mbtiTaglineEl, mbtiReportEl
  ];
  if (criticalElements.some(el => el === null)) {
      console.error("Error: One or more critical DOM elements were not found. Script cannot initialize.");
      // Optionally display a user-friendly error message on the page body
      // For example: document.body.innerHTML = '<div style="color: red; text-align: center; margin-top: 50px;">页面加载失败: 缺少必要的元素。</div>';
      return; // Stop script execution
  }


  // --- URL Parameters ---
  const params = new URLSearchParams(window.location.search);
  const initialSurveyId = params.get("id");
  const initialSurveyToken = params.get("token"); // URLSearchParams.get() returns null if not found


  // --- UI Manager Module ---
  const uiManager = (() => {
    let currentTypingTimeout = null;

    // Types text into an element with a typewriter effect
    const typeText = (element, text, speed = 30) => {
      if (!element) return Promise.resolve(); // Resolve immediately if element is null
      if (currentTypingTimeout) clearTimeout(currentTypingTimeout);
      element.textContent = ""; // Clear existing text instantly when starting
      let i = 0;
      return new Promise((resolve) => {
        if (text === null || text === undefined) { // Handle null/undefined text gracefully
             element.textContent = ""; // Ensure empty text
             resolve();
             return;
        }
        const type = () => {
          if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            currentTypingTimeout = setTimeout(type, speed);
          } else {
            currentTypingTimeout = null; // Clear timeout ID once typing is finished
            resolve();
          }
        };
        type(); // Start the typing animation
      });
    };

    // Manages the loading state UI
    const setLoading = (isLoading) => {
      // Ensure resultSection is visible when loading or displaying anything
      resultSection.style.display = "block"; // Always ensure result area is visible

      if (isLoading) {
        loadingSpinner.style.display = "block";
        reportContent.style.display = "none"; // Hide report
        statusMessageEl.style.display = "none"; // Hide status message

        // Disable inputs while loading
        analyzeByIdBtn.disabled = true;
        uploadBtn.disabled = true;
        surveyIdInput.disabled = true;
        dropZone.classList.add("disabled-drop-zone");
      } else {
        loadingSpinner.style.display = "none";
        // Re-enable inputs when not loading (unless report/error is shown)
        analyzeByIdBtn.disabled = false;
        uploadBtn.disabled = false;
        surveyIdInput.disabled = false;
        dropZone.classList.remove("disabled-drop-zone");
      }
    };

    // Displays the analysis report
    const displayReport = async (result) => {
      // Ensure necessary elements were found during initialization
      if (!mbtiTypeEl || !mbtiTypeNameEl || !mbtiTaglineEl || !mbtiReportEl) {
          console.error("displayReport: Report elements not found.");
          return;
      }

      setLoading(false); // Hide loading spinner

      // Populate report header
      mbtiTypeEl.textContent = result.mbti_type || "N/A"; // Add fallback for missing type
      mbtiTypeNameEl.textContent = result.type_name || "未知类型"; // Add fallback
      mbtiTaglineEl.textContent = result.tagline || "一份独特的分析报告。"; // Add fallback

      // Show report area, hide others
      reportContent.style.display = "block";
      statusMessageEl.style.display = "none";

      // Type out the analysis paragraphs
      mbtiReportEl.innerHTML = ""; // Clear previous content
      if (result.analysis_report && Array.isArray(result.analysis_report)) {
        for (const paragraphText of result.analysis_report) {
          const p = document.createElement("p");
          mbtiReportEl.appendChild(p);
          await typeText(p, paragraphText); // Use await to type paragraph by paragraph
        }
      } else {
           // Handle case where analysis_report is not an array or is missing
           console.warn("Analysis report data is not in expected array format or is missing.");
           const p = document.createElement("p");
           mbtiReportEl.appendChild(p);
           await typeText(p, result.analysis_report || "未能生成详细的分析报告。"); // Type raw string or fallback message
      }
    };

    // Displays general status/info/error messages
    const displayMessage = (message, type = 'info') => {
      if (currentTypingTimeout) clearTimeout(currentTypingTimeout); // Stop any ongoing typing
      // Ensure necessary elements were found during initialization
      if (!statusMessageEl || !resultSection || !loadingSpinner || !reportContent) {
           console.error("displayMessage: Message or related elements not found.");
           return;
      }

      setLoading(false); // Hide loading spinner if it was showing

      // Show message area, hide others
      resultSection.style.display = "block"; // Ensure parent is visible
      loadingSpinner.style.display = "none"; // Hide loading spinner
      reportContent.style.display = "none"; // Hide report content

      // Set message text and style classes
      statusMessageEl.textContent = message;
      statusMessageEl.className = 'status-message'; // Reset classes first
      if (type === 'error') {
        statusMessageEl.classList.add('message-error');
      } else if (type === 'success') {
        statusMessageEl.classList.add('message-success');
      } else { // Default to info
        statusMessageEl.classList.add('message-info');
      }
      statusMessageEl.style.display = "block"; // Make the message visible
    };

    return { setLoading, displayReport, displayMessage, typeText };
  })();


  // --- File Processing Module ---
  const fileProcessor = (() => {

    // Parses a plain text file assuming a specific Q/A format
    const parseTxt = (text, questionMap) => {
      const lines = text.split("\n");
      const parsedAnswers = {};
      let currentQuestionId = null;

      // Create a map from a question text prefix to its ID
      // This is fragile - relies on the first N chars being unique identifiers
      const prefixToIdMap = new Map();
      for (const id in questionMap) {
          // Ensure questionMap[id] is a string before taking substring
          const qText = String(questionMap[id] || "").trim();
          if (qText.length > 0) {
              // Use a reasonable prefix length, adjust if questions have similar beginnings
              const prefix = qText.substring(0, Math.min(qText.length, 40));
              prefixToIdMap.set(prefix, id);
          }
      }
      console.log("TXT Parser: Prefix to ID Map:", prefixToIdMap);


      for (let i = 0; i < lines.length; i++) {
        const trimmedLine = lines[i].trim();
        if (!trimmedLine) continue; // Skip empty lines

        // Check if this line starts a question (using the prefix map)
        let matchedId = null;
        for (const [prefix, id] of prefixToIdMap.entries()) {
             if (trimmedLine.startsWith(prefix)) {
                  matchedId = id;
                  break;
             }
        }

        if (matchedId) {
            currentQuestionId = matchedId;
             // Now look for the answer marker "->" on the *next* line
             if (i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                if (nextLine.startsWith("->")) {
                  const answer = nextLine.substring(2).trim();
                   // Only add if ID is set (which it should be here) and answer is not empty
                  if (currentQuestionId && answer !== "") { // Prevent saving empty answers unless intended
                    parsedAnswers[currentQuestionId] = answer;
                  }
                   // Don't reset currentQuestionId here, as the answer is associated with it.
                   // It will be implicitly reset when a new question prefix is found or loop ends.
                }
             }
         }
         // If a line doesn't match a known prefix, it's ignored unless it's an answer line following a question
      }
      console.log("TXT Parser: Parsed Answers:", parsedAnswers);
      return parsedAnswers;
    };

    // Parses a JSON file
    const parseJson = (text) => {
      const data = JSON.parse(text);
      const answers = {};

      // Case 1: File is an array of sections/questions (like a survey definition with answers?)
      if (Array.isArray(data)) {
        data.forEach((section) => {
          if (section.questions && Array.isArray(section.questions)) {
            section.questions.forEach((question) => {
               // Assuming 'answer' property exists in each question object if it's a completed survey export
              if (question.id && question.answer !== undefined) {
                answers[question.id] = question.answer;
              }
            });
          }
        });
      // Case 2: File is an object representing a single submission (e.g., from your backend KV store)
      } else if (typeof data === 'object' && data !== null) {
          // Check if it's a wrapped data structure like { data: "{...}", token: "..." }
          let finalData = data;
          if (typeof data.data === 'string') {
              try {
                  finalData = JSON.parse(data.data);
              } catch (e) {
                  console.error("JSON Parser: Failed to parse nested 'data' string:", e);
                  // Continue trying to parse the top-level object
              }
          }

          // Assume keys starting with 'q' are question IDs, or keys matching known questionMap IDs
          for (const key in finalData) {
              if (Object.prototype.hasOwnProperty.call(finalData, key)) {
                  // Check if key looks like a question ID convention ('q' followed by number/string)
                  // Or if it matches a known key in the questionMap
                  if (key.startsWith('q') || (window.questionMap && window.questionMap.hasOwnProperty(key))) {
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

    // Parses Excel (.xlsx, .xls) and CSV files using SheetJS
    const parseSheet = (data) => {
      const workbook = XLSX.read(data, { type: "array" }); // Use type "array" for ArrayBuffer
      const sheetName = workbook.SheetNames[0]; // Get the first sheet
      const worksheet = workbook.Sheets[sheetName];

      // Convert the sheet to an array of JSON objects (assuming header row)
      const jsonFromSheet = XLSX.utils.sheet_to_json(worksheet);
      console.log("SheetJS: sheet_to_json output:", jsonFromSheet);

      const answers = {};
      if (Array.isArray(jsonFromSheet)) {
           // Attempt to find ID and Answer columns flexibly
           let idKey = null; // Key name for the ID column
           let answerKey = null; // Key name for the Answer column

           // Find potential ID/Answer column names (case-insensitive, handle variations)
           if (jsonFromSheet.length > 0) {
               const firstRowKeys = Object.keys(jsonFromSheet[0]);
               idKey = firstRowKeys.find(key => String(key).trim().toLowerCase() === 'id' || String(key).trim().toLowerCase().includes('qid'));
               answerKey = firstRowKeys.find(key => String(key).trim().toLowerCase() === 'answer' || String(key).trim().toLowerCase().includes('回答') || String(key).trim().toLowerCase().includes('答案') || String(key).trim().toLowerCase().includes('value'));
           }


           if (idKey && answerKey) {
                // Assuming each row after header is an answer entry
                jsonFromSheet.forEach(row => {
                    // Ensure keys exist in the row object before accessing
                    const id = row.hasOwnProperty(idKey) ? row[idKey] : undefined;
                    const answer = row.hasOwnProperty(answerKey) ? row[answerKey] : undefined;

                    // Only add if ID exists and answer is not undefined/null (or is empty string - that's a valid answer)
                    if (id && answer !== undefined && answer !== null) {
                        answers[String(id).trim()] = answer; // Convert ID to string, trim whitespace
                    }
                });
           } else {
               // Fallback: If no standard 'ID' and 'Answer' columns found,
               // try assuming first column is ID, second is Answer from array-of-arrays conversion
               console.warn("SheetJS: Standard 'ID' and 'Answer' columns not found. Attempting array-of-arrays parse.");
                const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Get array of arrays
                if (Array.isArray(rawData) && rawData.length > 1) {
                    for (let i = 1; i < rawData.length; i++) { // Start from second row (assuming header)
                        const row = rawData[i];
                        if (Array.isArray(row) && row.length >= 2 && row[0] && row[1] !== undefined && row[1] !== null) {
                             answers[String(row[0]).trim()] = row[1];
                        }
                    }
                } else {
                     // Data not in expected format, or empty
                     console.error("SheetJS: Raw data not in expected [ [headers], [id, answer], ... ] format or is empty.");
                     throw new Error("无法识别的电子表格/CSV文件格式或内容为空。");
                }
           }

      } else {
          // sheet_to_json might return something else for very unusual sheets
          console.error("SheetJS: sheet_to_json did not return an array.");
          throw new Error("无法解析电子表格/CSV文件内容。");
      }

      console.log("SheetJS Parser: Parsed Answers:", answers);
      return answers;
    };


    // Formats the parsed answers object into a string for the AI prompt
    const formatAnswers = (answers, questionMap) => {
      if (typeof answers !== 'object' || answers === null) {
           console.error("formatAnswers: Invalid input 'answers'. Expected object, got:", answers);
           return "无法格式化问卷答案。"; // Return error message if input is bad
      }
      // questionMap might be empty if loading failed, handle gracefully
      if (typeof questionMap !== 'object' || questionMap === null) {
          console.warn("formatAnswers: questionMap is not available or invalid. Formatting using only found answers.");
          // Fallback: Format using only the keys/values found in the answers object
           return Object.entries(answers)
             .map(([qId, answer]) => `- ${qId}: ${answer}`) // Use qId as fallback for question text
             .join("\n");
      }

      // Ensure we have all question IDs from the map, even if unanswered
      const formattedLines = [];
      for (const qId in questionMap) {
          if (Object.prototype.hasOwnProperty.call(questionMap, qId)) {
              const qText = questionMap[qId];
              // Get answer, default to "未回答" if ID is missing in 'answers' or value is null/undefined
              const answer = answers.hasOwnProperty(qId) && answers[qId] !== undefined && answers[qId] !== null ? answers[qId] : "未回答";
              formattedLines.push(`- ${qText}: ${answer}`);
          }
      }
      // Optionally, include any answers found in the file that weren't in questionMap (might indicate error or extra data)
      // This could also clutter the prompt if the file has unrelated data, so perhaps omit.
      /*
      for (const qId in answers) {
           if (Object.prototype.hasOwnProperty.call(answers, qId) && !questionMap.hasOwnProperty(qId)) {
               console.warn(`Found answer for unknown question ID "${qId}"`);
               formattedLines.push(`- ${qId} (未知问题): ${answers[qId]}`);
           }
      }
      */

      return formattedLines.join("\n");
    };


    // Main function to process a file
    const processFile = async (file, questionMap) => {
      const extension = file.name.split(".").pop().toLowerCase();
      let answers;

      // Read file content based on extension
      let fileContent;
       try {
           // Use FileReader for text/json, ArrayBuffer for sheet types
           fileContent = await new Promise((resolve, reject) => {
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
       } catch (error) {
           // Already logged in the promise, just re-throw or handle
           throw error;
       }


      // Parse content based on extension
      try {
          if (extension === "txt") {
              // For TXT parsing, we need the question map to identify questions
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


      // Format parsed answers using the question map
       // This step is crucial even if parsing was successful, to structure the data for AI
      const formattedText = formatAnswers(answers, questionMap);

      // Basic check for valid content after formatting
       // Ensure the formatted text is not just empty or full of "未回答"
       const answerLines = formattedText.split('\n').filter(line => line.includes(':') && !line.endsWith(': 未回答'));
       if (answerLines.length < 1) { // Require at least 1 meaningful answer line
            console.warn(`Fewer than 1 answer line found or formatted. Count: ${answerLines.length}`);
            const totalQuestions = Object.keys(questionMap).length;
            const answersFound = Object.keys(answers).length;

            if (answersFound === 0 && totalQuestions > 0) {
                 throw new Error("未能从文件中提取到任何答案，请检查文件内容和格式。");
            } else if (answersFound > 0 && answerLines.length === 0) {
                 // This case means answers were parsed, but none matched the formatting logic (e.g., all mapped to "未回答")
                 throw new Error("已读取文件，但未提取到有效答案数据（所有答案均为空或 '未回答'）。");
            }
             // Allow analysis even with few answers, but maybe add a warning message
             // uiManager.displayMessage(`警告: 文件中只找到少量 (${answersFound} 个) 有效答案，分析结果可能不够准确。`, 'info'); // Moved warning to analyze caller if needed
       }


      return formattedText;
    };

    return { processFile };
  })();


  // --- Main Application Logic Module ---
  const app = (() => {
    let currentLoadingInterval = null; // Interval ID for loading text animation

    // Handles sending the analysis request to the backend API
    const analyze = async (payload) => {
      uiManager.setLoading(true);
      // Clear previous interval if any is still running
      if (currentLoadingInterval) clearInterval(currentLoadingInterval);

      // Loading status messages for typing animation
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

      // Start the loading text animation
      await uiManager.typeText(loadingTextEl, "正在准备分析环境..."); // Initial message
      currentLoadingInterval = setInterval(updateLoadingText, 5000); // Cycle through messages every 5 seconds

      try {
        // Send the analysis request to your API endpoint
        const response = await fetch("/api/analyze-mbti", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // Parse the response
        const result = await response.json();

        // Check if the request was successful (status code 2xx)
        if (!response.ok) {
           // If not OK, the backend should have returned an error message in the JSON
           throw new Error(result.message || `分析请求失败，状态码: ${response.status}`);
        }

        // Check if the successful response has the expected structure
        if (!result || typeof result !== 'object' || !result.mbti_type || !Array.isArray(result.analysis_report)) {
            console.error("API returned unexpected data format:", result);
            throw new Error("AI 返回的数据格式不正确，请联系管理员。");
        }

        // Stop the loading text animation and type final message
        clearInterval(currentLoadingInterval);
        currentLoadingInterval = null; // Clear the ID
        await uiManager.typeText(loadingTextEl, "报告已生成！正在展示...");
        await new Promise((r) => setTimeout(r, 1000)); // Pause briefly

        uiManager.displayReport(result); // Display the successful report

      } catch (error) {
        // Handle errors during fetch or processing
        console.error("Analysis process failed:", error);
        // Stop loading text animation
        if (currentLoadingInterval) clearInterval(currentLoadingInterval);
         currentLoadingInterval = null;
        // Display the error message to the user
        uiManager.displayMessage(error.message || "分析过程中发生未知错误。", 'error');
      } finally {
        // setLoading(false); // No longer needed here as displayReport/displayMessage handle hiding loading
      }
    };

    // Handles the file upload process
    const handleFile = async (file) => {
      if (!file) return;

      uiManager.setLoading(true);
      await uiManager.typeText(loadingTextEl, `正在读取并解析文件: ${file.name}...`);

      try {
        // Process the uploaded file to get formatted answers
        // Ensure questionMap is loaded before processing file that needs it (like TXT)
         if (Object.keys(window.questionMap).length === 0) {
              // This check is now also in processFile, but could be done earlier
              console.warn("Question map not loaded before file processing.");
              // Depending on severity, you might throw here or rely on processFile's error
         }

        const answersText = await fileProcessor.processFile(
          file,
          window.questionMap // Pass the loaded question map
        );

        // After successful file processing and formatting, trigger analysis
        await analyze({ answersText: answersText });

      } catch (error) {
        // Handle errors during file processing
        console.error("File handling failed:", error);
        // Stop loading text animation if it was started
        if (currentLoadingInterval) clearInterval(currentLoadingInterval);
        currentLoadingInterval = null;
        uiManager.displayMessage(error.message || "文件处理失败，请重试。", 'error');
        uiManager.setLoading(false); // Ensure loading state is turned off
      }
    };

    // Handles analysis based on Survey ID input
    const handleIdInput = () => {
      const surveyId = surveyIdInput.value.trim();

      if (!surveyId) {
        uiManager.displayMessage("请输入你的问卷ID。", 'error');
        return;
      }

      const payload = { surveyId: surveyId };

      // FIX: Only add token to payload if it exists (is not null or undefined)
      // Zod's .optional() accepts undefined, but not null.
      if (initialSurveyToken) {
          payload.token = initialSurveyToken;
      }

      // Trigger analysis with the constructed payload
      analyze(payload);
    };

    // Sets up all DOM event listeners
    const setupEventListeners = () => {
      if (uploadBtn) uploadBtn.addEventListener("click", () => fileUploadInput.click());
      if (fileUploadInput) fileUploadInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

      // Drop zone events
      if (dropZone) {
        dropZone.addEventListener("dragover", (e) => {
          e.preventDefault(); // Prevent default to allow drop
          dropZone.classList.add("is-active");
        });
        dropZone.addEventListener("dragleave", () =>
          dropZone.classList.remove("is-active")
        );
        dropZone.addEventListener("drop", (e) => {
          e.preventDefault(); // Prevent default file open
          dropZone.classList.remove("is-active");
          if (e.dataTransfer.files.length > 0) {
             handleFile(e.dataTransfer.files[0]);
          }
        });
      }

      // ID input and button events
      if (analyzeByIdBtn) analyzeByIdBtn.addEventListener("click", handleIdInput);
      if (surveyIdInput) {
        surveyIdInput.addEventListener("keyup", (e) => {
          if (e.key === "Enter") {
              e.preventDefault(); // Prevent form submission if input is inside a form
              handleIdInput();
          }
        });
      }

       console.log("Event listeners set up.");
    };

    // Initializes the application
    const init = async () => {
      try {
        // Fetch the question map (assuming questions.json exists at root or correct path)
        uiManager.displayMessage("正在加载问卷配置...", 'info');
        const res = await fetch("/questions.json");
         if (!res.ok) {
             throw new Error(`无法加载问卷配置: ${res.status}`);
         }
        const sections = await res.json();

        // Populate the global questionMap object
        window.questionMap = {};
        if (Array.isArray(sections)) {
             sections
               .flatMap((s) => s.questions || []) // Handle sections without questions
               .forEach((q) => {
                   if (q && q.id && q.text) { // Ensure question object is valid and has id/text
                        window.questionMap[q.id] = q.text;
                   } else {
                        console.warn("Skipping invalid question object:", q);
                   }
               });
        } else {
            console.error("questions.json did not return an array of sections.");
             // Continue without questionMap, but inform the user
             uiManager.displayMessage("警告: 问卷配置格式不正确，某些功能可能受限。", 'warning');
        }

        // Check if questionMap is empty after loading
         if (Object.keys(window.questionMap).length === 0) {
              console.error("Question map is empty after processing questions.json.");
               uiManager.displayMessage("警告: 未加载到任何问卷问题配置，文件上传解析可能不准确。", 'warning');
         }


        setupEventListeners(); // Setup event listeners after successful config load

        // Handle initial state based on URL parameters
        if (initialSurveyId) {
             surveyIdInput.value = initialSurveyId; // Pre-fill the ID input
             if (initialSurveyToken) {
               // If both ID and Token are present, automatically start analysis
               uiManager.displayMessage("检测到问卷ID和密钥，正在自动分析...", 'info');
               // Add a small delay before starting analysis for better UX
               await new Promise(r => setTimeout(r, 1500));
               analyze({ surveyId: initialSurveyId, token: initialSurveyToken }); // Both are present, send both
             } else {
               // If only ID is present, inform the user to proceed manually
               uiManager.displayMessage(
                 `问卷ID "${initialSurveyId}" 已自动填充，请点击按钮或输入密钥开始分析。`, 'info'
               );
               // Do NOT auto-analyze here, user needs to click or provide token if required by backend
             }
        } else {
            // If no ID in URL, display default prompt message
            uiManager.displayMessage("请上传问卷文件或输入问卷ID开始分析。", 'info');
        }


      } catch (e) {
        // Handle errors during initialization (e.g., failed to load questions.json)
        console.error("Initialization failed:", e);
        uiManager.displayMessage(`初始化失败: ${e.message || "无法加载必要资源"}。功能受限。`, 'error');
      }
    };

    // Return the init function to start the app
    return { init };
  })();

  // Start the application initialization process
  app.init();

  console.log("MBTI analysis script loaded.");
});