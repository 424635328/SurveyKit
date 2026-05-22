// public/survey.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("surveyForm");
  const progressBarElement = document.getElementById("scrollProgress");
  const completionCounter = document.getElementById("completionCounter");
  const submitButton = document.getElementById("submitButton");
  const confirmModal = document.getElementById("confirmModal");
  const confirmButton = document.getElementById("confirmButton");
  const cancelButton = document.getElementById("cancelButton");
  const loadingMessage = form.querySelector(".loading-message");
  const modalMessage = document.getElementById("modalMessage");
  const jumpGridContainer = document.querySelector(".jump-grid-container");
  const jumpGridElement = document.getElementById("jumpGrid");
  const jumpGridToggleButton = document.querySelector(".jump-grid-toggle");
  
  const exportButtonContainer = document.querySelector(".export-button-container");
  const exportButton = document.getElementById("exportButton");
  const exportOptions = document.getElementById("exportOptions");

  const imageExportModal = document.getElementById('imageExportModal');
  const confirmExportImageBtn = document.getElementById('confirmExportImageBtn');
  const cancelExportImageBtn = document.getElementById('cancelExportImageBtn');

  let emailInput;
  let emailError;

  const formId = "deep-survey-draft";
  let totalQuestions = 0;
  let gridCells = [];
  let currentQuestionNumber = 0;
  let originalSections = []; 

  if (!form || !submitButton) {
    console.error("核心组件缺失：找不到问卷表单或提交按钮。");
    if (loadingMessage) {
      loadingMessage.textContent = "页面加载错误：问卷核心组件缺失。";
      loadingMessage.style.color = "red";
    }
    return;
  }

  const textAnimator = {
    animate: (element, text, delay = 35) => {
      return new Promise((resolve) => {
        if (!element || typeof text !== "string") return resolve();
        if (
          element.dataset.animated === "true" ||
          element.textContent.length > 0
        ) {
          element.textContent = text;
          element.style.opacity = "1";
          element.style.whiteSpace = "pre-wrap";
          return resolve();
        }
        element.textContent = "";
        element.style.opacity = "1";
        element.style.whiteSpace = "pre";
        let i = 0;
        const interval = setInterval(() => {
          if (i < text.length) {
            element.textContent += text.charAt(i++);
          } else {
            clearInterval(interval);
            element.style.whiteSpace = "pre-wrap";
            element.dataset.animated = "true";
            resolve();
          }
        }, delay);
      });
    },
  };

  const surveyRenderer = {
    createEmailCaptureBlock: () => {
      const container = document.createElement("div");
      container.className = "email-capture-block";

      const label = document.createElement("label");
      label.htmlFor = "q_email";
      label.className = "email-label";
      label.innerHTML = "接收您的专属档案链接 📬";

      const description = document.createElement("p");
      description.className = "email-description";
      description.textContent =
        "请填写您的邮箱，这将是我们确定这份问卷归属的唯一方式。";

      const input = document.createElement("input");
      input.type = "email";
      input.id = "q_email";
      input.name = "q_email";
      input.placeholder = "your-email@example.com";
      input.required = true;

      const errorP = document.createElement("p");
      errorP.id = "emailError";
      errorP.className = "error-message";

      container.appendChild(label);
      container.appendChild(description);
      container.appendChild(input);
      container.appendChild(errorP);

      return container;
    },
    render: (sections) => {
      form.innerHTML = "";
      form.appendChild(loadingMessage);

      const formContent = document.createDocumentFragment();
      let questionCount = 0;
      sections.forEach((section) => {
        const fieldset = document.createElement("fieldset");
        const legend = document.createElement("legend");
        legend.textContent = section.legend || "";
        fieldset.appendChild(legend);

        section.questions.forEach((q) => {
          questionCount++;
          const cleanText = q.text
            ? q.text.replace(/^\s*\d+\.\s*/, "").trim()
            : "";
          const questionBlock = document.createElement("div");
          questionBlock.className = "question-block";
          questionBlock.dataset.questionNumber = questionCount;

          const label = document.createElement("label");
          label.htmlFor = q.id;
          const questionNumberSpan = document.createElement("span");
          questionNumberSpan.className = "question-number";
          questionNumberSpan.textContent = `${questionCount}. `;
          label.appendChild(questionNumberSpan);
          const questionTextSpan = document.createElement("span");
          questionTextSpan.className = "question-text";
          questionTextSpan.dataset.originalText = cleanText;
          label.appendChild(questionTextSpan);
          questionBlock.appendChild(label);

          let inputContainer;
          switch (q.type) {
            case "radio":
              inputContainer = surveyRenderer.createRadioGroup(q);
              break;
            case "select":
              inputContainer = surveyRenderer.createSelectGroup(q);
              break;
            case "color":
              inputContainer = surveyRenderer.createColorPicker(q);
              break;
            case "range":
              inputContainer = surveyRenderer.createRangeSlider(q);
              break;
            case "textarea":
              inputContainer = document.createElement("textarea");
              inputContainer.id = q.id;
              inputContainer.name = q.id;
              inputContainer.rows = q.rows || 2;
              break;
            default:
              inputContainer = document.createElement("input");
              inputContainer.type = "text";
              inputContainer.id = q.id;
              inputContainer.name = q.id;
              if (q.inputmode) inputContainer.inputMode = q.inputmode;
              break;
          }
          if (inputContainer) questionBlock.appendChild(inputContainer);
          fieldset.appendChild(questionBlock);
        });
        formContent.appendChild(fieldset);
      });

      const emailBlock = surveyRenderer.createEmailCaptureBlock();
      formContent.appendChild(emailBlock);

      form.appendChild(formContent);

      totalQuestions = questionCount;
      if (loadingMessage) loadingMessage.style.display = "none";
    },
    createRadioGroup: (q) => {
      const container = document.createElement("div");
      container.className = `radio-group ${q.className || ""}`.trim();
      q.options.forEach((opt) => {
        const value = typeof opt === "object" ? opt.value : opt;
        const labelText = typeof opt === "object" ? opt.label : opt;
        const id = `${q.id}_${String(value).replace(/\s+/g, "-")}`;
        const radioInput = document.createElement("input");
        radioInput.type = "radio";
        radioInput.id = id;
        radioInput.name = q.id;
        radioInput.value = value;
        container.appendChild(radioInput);
        const radioLabel = document.createElement("label");
        radioLabel.className = "radio-label";
        radioLabel.htmlFor = id;
        radioLabel.textContent = labelText;
        container.appendChild(radioLabel);
      });
      if (q.hasOther)
        container.appendChild(surveyRenderer.createOtherOption(q.id, "radio"));
      return container;
    },
    createSelectGroup: (q) => {
      const container = document.createElement("div");
      const select = document.createElement("select");
      select.id = q.id;
      select.name = q.id;
      const placeholderOption = document.createElement("option");
      placeholderOption.value = "";
      placeholderOption.disabled = true;
      placeholderOption.selected = true;
      placeholderOption.textContent = q.placeholder || "请选择";
      select.appendChild(placeholderOption);
      q.options.forEach((opt) => {
        const option = document.createElement("option");
        option.value = typeof opt === "object" ? opt.value : opt;
        option.textContent = typeof opt === "object" ? opt.label : opt;
        select.appendChild(option);
      });
      if (q.hasOther) {
        const otherOption = document.createElement("option");
        otherOption.value = "other";
        otherOption.textContent = "其他...";
        select.appendChild(otherOption);
      }
      container.appendChild(select);
      if (q.hasOther)
        container.appendChild(surveyRenderer.createOtherOption(q.id, "text"));
      return container;
    },
    createColorPicker: (q) => {
      const container = document.createElement("div");
      container.className = "color-picker-wrapper";
      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.id = q.id;
      colorInput.name = q.id;
      colorInput.value = q.defaultValue || "#a7c5eb";
      container.appendChild(colorInput);
      const colorSpan = document.createElement("span");
      colorSpan.textContent = "(点击色块选择)";
      container.appendChild(colorSpan);
      return container;
    },
    createRangeSlider: (q) => {
      const container = document.createElement("div");
      const rangeGroup = document.createElement("div");
      rangeGroup.className = "range-group";
      const leftSpan = document.createElement("span");
      leftSpan.textContent = q.rangeLeft || "安静独处";
      rangeGroup.appendChild(leftSpan);
      const rangeInput = document.createElement("input");
      rangeInput.type = "range";
      rangeInput.id = q.id;
      rangeInput.name = q.id;
      rangeInput.min = q.min || 0;
      rangeInput.max = q.max || 100;
      rangeInput.value = q.defaultValue || 50;
      rangeGroup.appendChild(rangeInput);
      const rightSpan = document.createElement("span");
      rightSpan.textContent = q.rangeRight || "随时派对";
      rangeGroup.appendChild(rightSpan);
      container.appendChild(rangeGroup);
      const rangeValueDisplay = document.createElement("div");
      rangeValueDisplay.id = `rangeValue_${q.id}`;
      rangeValueDisplay.className = "range-value-display";
      rangeValueDisplay.textContent = `当前状态: ${q.defaultValue || 50}%`;
      container.appendChild(rangeValueDisplay);
      return container;
    },
    createOtherOption: (questionId, type) => {
      const otherDiv = document.createElement("div");
      if (type === "radio") {
        otherDiv.className = "other-option";
        const otherId = `${questionId}_other_radio`;
        const otherRadio = document.createElement("input");
        otherRadio.type = "radio";
        otherRadio.id = otherId;
        otherRadio.name = questionId;
        otherRadio.value = "other";
        otherDiv.appendChild(otherRadio);
        const otherLabel = document.createElement("label");
        otherLabel.className = "radio-label";
        otherLabel.htmlFor = otherId;
        otherLabel.textContent = "其他...";
        otherDiv.appendChild(otherLabel);
      }
      const otherTextInput = document.createElement("input");
      otherTextInput.type = "text";
      otherTextInput.name = `${questionId}_other`;
      otherTextInput.className = "other-text-input";
      otherTextInput.placeholder = "请填写你的答案";
      otherDiv.appendChild(otherTextInput);
      return otherDiv;
    },
  };

  const progressManager = {
    save: () => {
      const formData = new FormData(form);
      const data = {};
      for (const [key, value] of formData.entries()) {
        const trimmedValue = typeof value === "string" ? value.trim() : value;
        if (key.endsWith("_other")) {
          const mainKey = key.replace(/_other$/, "");
          if (formData.get(mainKey) === "other" && trimmedValue) {
            data[key] = trimmedValue;
          }
        } else {
          data[key] = trimmedValue;
        }
      }
      localStorage.setItem(formId, JSON.stringify(data));
    },
    load: () => {
      const savedData = localStorage.getItem(formId);
      if (!savedData) return;
      try {
        const data = JSON.parse(savedData);
        for (const key in data) {
          const element = form.elements[key];
          if (!element) continue;
          if (element.length && element[0]?.type === "radio") {
            const targetRadio = document.querySelector(
              `input[name="${key}"][value="${data[key]}"]`
            );
            if (targetRadio) {
              targetRadio.checked = true;
              targetRadio.dispatchEvent(new Event("change", { bubbles: true }));
            }
          } else if (element.tagName === "SELECT") {
            element.value = data[key];
            element.dispatchEvent(new Event("change", { bubbles: true }));
          } else {
            element.value = data[key];
            if (element.type === "range") uiUpdater.updateRangeValue(element);
          }
        }
        uiUpdater.updateCompletion();
        jumpGrid.updateStatus();
      } catch (e) {
        console.error("加载草稿失败:", e);
        localStorage.removeItem(formId);
      }
    },
  };

  const uiUpdater = {
    updateScrollProgress: () => {
      if (!progressBarElement) return;
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      progressBarElement.value =
        scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100;
    },
    getFilledCount: () => {
      const formData = new FormData(form);
      const answered = new Set();
      document
        .querySelectorAll(".question-block label[for]")
        .forEach((label) => {
          const qId = label.getAttribute("for");
          if (!qId) return;
          let val = formData.get(qId);
          if (val === "other") {
            if (String(formData.get(`${qId}_other`)).trim()) answered.add(qId);
          } else if (val && String(val).trim()) {
            answered.add(qId);
          }
        });
      return answered.size;
    },
    updateCompletion: () => {
      if (completionCounter)
        completionCounter.textContent = `已完成 ${uiUpdater.getFilledCount()} / ${totalQuestions} 题`;
      jumpGrid.updateStatus();
    },
    updateRangeValue: (rangeInput) => {
      const display = document.getElementById(`rangeValue_${rangeInput.id}`);
      if (display) display.textContent = `当前状态: ${rangeInput.value}%`;
    },
  };

  const jumpGrid = {
    init: () => {
      if (!jumpGridElement) return;
      jumpGridElement.innerHTML = "";
      gridCells = [];
      for (let i = 1; i <= 100; i++) {
        const cell = document.createElement("div");
        cell.className = "grid-cell";
        cell.textContent = i;
        cell.dataset.questionNumber = i;
        cell.addEventListener("click", () => jumpGrid.scrollTo(i));
        jumpGridElement.appendChild(cell);
        gridCells.push(cell);
      }
      if (jumpGridToggleButton && jumpGridContainer) {
        jumpGridToggleButton.addEventListener("click", () =>
          jumpGridContainer.classList.toggle("collapsed")
        );
      }
    },
    scrollTo: (qNum) => {
      const target = document.querySelector(
        `.question-block[data-question-number="${qNum}"]`
      );
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        document
          .querySelectorAll(".question-block.highlight-temp")
          .forEach((el) => el.classList.remove("highlight-temp"));
        target.classList.add("highlight-temp");
        setTimeout(() => target.classList.remove("highlight-temp"), 1500);
        jumpGrid.updateStatus(qNum);
      }
    },
    updateStatus: (highlightNum = null) => {
      if (gridCells.length === 0) return;
      const formData = new FormData(form);
      gridCells.forEach((cell) => {
        const qNum = parseInt(cell.dataset.questionNumber, 10);
        cell.className = "grid-cell";
        if (qNum > totalQuestions) {
          cell.classList.add("inactive");
        } else {
          const qId = document
            .querySelector(
              `.question-block[data-question-number="${qNum}"] label`
            )
            ?.getAttribute("for");
          let isFilled = false;
          if (qId) {
            let val = formData.get(qId);
            if (val === "other") {
              if (String(formData.get(`${qId}_other`)).trim()) isFilled = true;
            } else if (val && String(val).trim()) {
              isFilled = true;
            }
          }
          if (isFilled) cell.classList.add("filled");
          if (
            highlightNum
              ? qNum === highlightNum
              : qNum === currentQuestionNumber
          ) {
            cell.classList.add("current");
          }
        }
      });
    },
  };

  const submissionHandler = {
    validateEmail: () => {
      if (!emailInput || !emailError) {
        console.error("邮箱验证失败：找不到输入框元素。");
        return false;
      }

      const emailValue = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      emailInput.classList.remove("input-error");
      emailError.style.display = "none";
      emailError.textContent = "";

      if (!emailValue) {
        emailError.textContent = "请填写您的邮箱地址。";
        emailError.style.display = "block";
        emailInput.classList.add("input-error");
        emailInput.focus();
        emailInput.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
      }

      if (!emailRegex.test(emailValue)) {
        emailError.textContent = "请输入一个有效的邮箱地址。";
        emailError.style.display = "block";
        emailInput.classList.add("input-error");
        emailInput.focus();
        emailInput.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
      }

      return true;
    },
    perform: async () => {
      if (confirmModal) confirmModal.classList.remove("show");
      const formData = new FormData(form);
      const cleanedData = {};
      for (const [key, value] of formData.entries()) {
        const trimmedValue = typeof value === "string" ? value.trim() : value;
        if (key.endsWith("_other")) {
          const mainKey = key.replace(/_other$/, "");
          if (formData.get(mainKey) === "other" && trimmedValue)
            cleanedData[mainKey] = trimmedValue;
        } else if (!cleanedData.hasOwnProperty(key)) {
          cleanedData[key] = trimmedValue;
        }
      }
      submitButton.textContent = "正在传送中...";
      submitButton.disabled = true;
      try {
        const response = await fetch("/api/save.mjs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanedData),
        });
        const result = await response.json();
        if (response.ok && result.id && result.token) {
          localStorage.removeItem(formId);
          window.location.href = `/result.html?status=success&id=${result.id}&token=${result.token}`;
        } else {
          throw new Error(result.message || "提交失败，服务器返回错误。");
        }
      } catch (error) {
        console.error("提交错误:", error);
        submitButton.textContent = "封存我的答案";
        submitButton.disabled = false;
        alert(`提交失败：${error.message}`);
      }
    },
    initiate: (e) => {
      e.preventDefault();

      if (!submissionHandler.validateEmail()) {
        return;
      }

      const filledCount = uiUpdater.getFilledCount();
      if (filledCount === totalQuestions || totalQuestions === 0) {
        submissionHandler.perform();
      } else {
        if (modalMessage)
          modalMessage.textContent = `你已回答 ${filledCount} / ${totalQuestions} 题，确定要现在封存这份档案吗？`;
        if (confirmModal) confirmModal.classList.add("show");
      }
    },
    initModal: () => {
      if (!confirmModal) return;
      confirmButton?.addEventListener("click", submissionHandler.perform);
      cancelButton?.addEventListener("click", () =>
        confirmModal.classList.remove("show")
      );
      confirmModal.addEventListener("click", (e) => {
        if (e.target === confirmModal) confirmModal.classList.remove("show");
      });
    },
  };

  const historyLookupModule = {
    init: () => {
      const inputEl = document.getElementById("historyLookupInput");
      const lookupBtn = document.getElementById("lookupBtn");
      const clearBtn = document.getElementById("clearLookupBtn");
      const messageEl = document.querySelector("[data-lookup-message]");

      if (!inputEl || !lookupBtn || !messageEl || !clearBtn) return;

      const parseInput = (input) => {
        const cleanedInput = input.trim();
        if (!cleanedInput) return { id: null, token: null, error: null };

        let id = null,
          token = null;

        try {
          const url = new URL(cleanedInput);
          id = url.searchParams.get("id");
          token = url.searchParams.get("token");
        } catch (e) {
          if (cleanedInput.includes("&")) {
            const params = new URLSearchParams(cleanedInput.replace(/&/g, "&"));
            id = params.get("id");
            token = params.get("token");
          } else if (cleanedInput.toLowerCase().startsWith("survey_")) {
            id = cleanedInput;
          }
        }

        if (id && id.toLowerCase().startsWith("survey_")) {
          return { id, token, error: null };
        }
        return {
          id: null,
          token: null,
          error: "无法识别的格式。请输入有效链接或ID。",
        };
      };

      const updateUI = () => {
        const inputValue = inputEl.value;
        const { id, token, error } = parseInput(inputValue);

        clearBtn.classList.toggle("hidden", !inputValue);

        if (error && inputValue) {
          messageEl.textContent = error;
          messageEl.className = "lookup-message error";
          lookupBtn.disabled = true;
        } else if (id && token) {
          messageEl.textContent = "格式正确，将前往完整结果页。";
          messageEl.className = "lookup-message success";
          lookupBtn.disabled = false;
        } else if (id) {
          messageEl.textContent = "仅识别到ID，将前往公开预览页。";
          messageEl.className = "lookup-message";
          lookupBtn.disabled = false;
        } else {
          messageEl.innerHTML = " ";
          messageEl.className = "lookup-message";
          lookupBtn.disabled = true;
        }
      };

      const performLookup = () => {
        if (lookupBtn.disabled) return;
        const { id, token } = parseInput(inputEl.value);
        if (id && token) {
          window.open(
            `/result.html?status=success&id=${id}&token=${token}`,
            "_blank"
          );
        } else if (id) {
          window.open(`/viewer.html?id=${id}`, "_blank");
        }
      };

      inputEl.addEventListener("input", updateUI);
      lookupBtn.addEventListener("click", performLookup);
      inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          performLookup();
        }
      });
      clearBtn.addEventListener("click", () => {
        inputEl.value = "";
        updateUI();
        inputEl.focus();
      });
    },
  };

        function escapeHtml(str) {
            if (!str) return '';
            return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
        }

    const exportManager = {
        getAnsweredSurveyData: (forDisplay = false) => {
            const formData = new FormData(form);
            const answeredData = JSON.parse(JSON.stringify(originalSections));

            const finalData = answeredData.map(section => {
                const answeredQuestions = section.questions.map(q => {
                    const element = form.elements[q.id];
                    let rawValue = formData.get(q.id)?.trim();
                    let displayValue = null;

                    if (rawValue === undefined || rawValue === null || rawValue === '') return null;

                    if (rawValue === 'other') {
                        const otherValue = formData.get(`${q.id}_other`)?.trim();
                        if (!otherValue) return null;
                        rawValue = otherValue;
                        displayValue = otherValue;
                    }

                    if (forDisplay && !displayValue) {
                        if (element?.type === 'radio') {
                            const checkedRadio = form.querySelector(`input[name="${q.id}"]:checked`);
                            if(checkedRadio) {
                               displayValue = form.querySelector(`label[for="${checkedRadio.id}"]`)?.textContent.trim() || rawValue;
                            } else {
                               displayValue = rawValue;
                            }
                        } else if (element?.tagName === 'SELECT') {
                            displayValue = element.options[element.selectedIndex]?.text || rawValue;
                        } else {
                            displayValue = rawValue;
                        }
                    }

                    q.answer = forDisplay ? displayValue : rawValue;
                    q.rawValue = rawValue;
                    return q;

                }).filter(q => q !== null);

                section.questions = answeredQuestions;
                return section;

            }).filter(section => section.questions.length > 0);

            return finalData;
        },

        downloadFile: (filename, blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        exportAsJson: () => {
            const data = exportManager.getAnsweredSurveyData(false);
            const content = JSON.stringify(data, null, 2);
            const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
            exportManager.downloadFile('深度问卷草稿.json', blob);
        },

        exportAsTxt: () => {
            const answeredData = exportManager.getAnsweredSurveyData(true);
            const surveyTitle = document.querySelector('.section-title').textContent;
            const now = new Date();
            const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
            
            let content = `份卷: ${surveyTitle}\n`;
            content += `导出时间: ${timestamp}\n`;
            const emailValue = emailInput.value.trim();
            if (emailValue) {
                content += `档案关联邮箱: ${emailValue}\n`;
            }
            content += `========================================\n`;

            if (answeredData.length === 0) {
                content += "\n您尚未回答任何问题。\n";
            } else {
                const answeredQuestionMap = new Map();
                answeredData.forEach(section => {
                    section.questions.forEach(q => {
                        answeredQuestionMap.set(q.id, { answer: q.answer, rawValue: q.rawValue });
                    });
                });

                originalSections.forEach(section => {
                    const answeredQuestionsInSection = section.questions.filter(q => answeredQuestionMap.has(q.id));
                    if (answeredQuestionsInSection.length === 0) return;

                    content += `\n[ ${section.legend} ]\n`;
                    
                    answeredQuestionsInSection.forEach(q => {
                        const { answer, rawValue } = answeredQuestionMap.get(q.id);
                        content += `\n--------------------\n`;
                        content += `${q.text}\n`;
                        content += `--------------------\n`;

                        if (q.type === 'radio' || q.type === 'select') {
                            q.options.forEach(opt => {
                                const isSelected = opt.value === rawValue;
                                content += `${isSelected ? '[X]' : '[ ]'} ${opt.label}\n`;
                            });
                            if (q.hasOther) {
                                const isOtherSelected = !q.options.some(opt => opt.value === rawValue);
                                content += `${isOtherSelected ? '[X]' : '[ ]'} 其他...\n`;
                            }
                        }
                        
                        content += `▶ 您的答案: ${answer}\n`;
                    });
                });
            }

            content += `\n========================================\n`;
            content += `由 SurveyKit 生成`;

            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            exportManager.downloadFile('深度问卷草稿.txt', blob);
        },

        performImageExport: async () => {
            if (typeof html2canvas === 'undefined') {
                throw new Error('无法导出图片：所需组件 html2canvas 未能成功加载。请检查您的网络连接或浏览器插件。');
            }
            const surveyContainer = document.querySelector('.survey-container');
            document.body.classList.add('is-exporting');
            window.scrollTo(0, 0); 
            
            try {
                // 短暂延迟确保滚动和样式生效
                await new Promise(resolve => setTimeout(resolve, 200)); 
                const canvas = await html2canvas(surveyContainer, {
                    scale: 1.5,
                    useCORS: true,
                    backgroundColor: '#f8fafc'
                });
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                exportManager.downloadFile('深度问卷草稿.png', blob);
            } catch (err) {
                console.error("图片导出失败:", err);
                // 抛出错误，让调用者处理UI提示
                throw new Error("抱歉，导出图片时发生错误。详情请查看浏览器控制台。");
            } finally {
                document.body.classList.remove('is-exporting');
            }
        },

        exportAsHtml: async () => {
            const data = exportManager.getAnsweredSurveyData(true);
            const surveyTitle = document.querySelector('.section-title').textContent;
            const now = new Date();
            const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
            const emailValue = emailInput.value.trim();

            let questionsHtml = '';
            if (data.length === 0) {
                questionsHtml = '<p style="text-align:center; color:#64748b; padding: 40px 0;">您尚未回答任何问题。</p>';
            } else {
                data.forEach(section => {
                    questionsHtml += `<div class="section-block">`;
                    questionsHtml += `<h2 class="section-legend">${escapeHtml(section.legend)}</h2>`;
                    section.questions.forEach(q => {
                        const safeAnswer = escapeHtml(String(q.answer ?? ''));
                        questionsHtml += `
                            <div class="question-item">
                                <p class="question-text">${escapeHtml(String(q.text ?? ''))}</p>
                                <div class="answer-block">
                                    <p class="answer-value">${safeAnswer}</p>
                                </div>
                            </div>
                        `;
                    });
                    questionsHtml += `</div>`;
                });
            }

            const safeTitle = escapeHtml(surveyTitle);
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
                    <title>问卷草稿 - ${safeTitle}</title>
                    <style>
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body { font-family: "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 40px 20px; font-size: 16px; line-height: 1.6; }
                        .report-container { max-width: 800px; margin: 0 auto; background-color: #fff; border-radius: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); padding: 40px 50px; }
                        h1 { font-weight: 700; font-size: 2rem; margin-bottom: 0.5rem; background-image: linear-gradient(120deg, #6366f1, #8b5cf6); background-clip: text; -webkit-background-clip: text; color: transparent; text-align: center; }
                        .meta-info { text-align: center; color: #64748b; margin-bottom: 30px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; font-size: 0.9rem; }
                        .section-block { margin-bottom: 30px; }
                        .section-legend { font-size: 1.4rem; font-weight: 500; color: #4f46e5; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eef2ff; }
                        .question-item { margin-bottom: 20px; }
                        .question-text { font-weight: 500; color: #334155; margin-bottom: 8px; }
                        .answer-block { background-color: #f8fafc; padding: 12px 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
                        .answer-value { color: #1e293b; white-space: pre-wrap; word-wrap: break-word; }
                        .footer { text-align: center; margin-top: 40px; font-size: 0.9rem; color: #94a3b8; }
                        @media (max-width: 768px) { .report-container { padding: 25px 20px; } h1 {font-size: 1.8rem;} .section-legend {font-size: 1.2rem;} }
                    </style>
                </head>
                <body>
                    <div class="report-container">
                        <h1>${safeTitle}</h1>
                        <div class="meta-info">
                            <p>导出时间: ${timestamp}</p>
                            ${emailValue ? `<p>关联邮箱: ${emailValue}</p>` : ''}
                        </div>
                        ${questionsHtml}
                        <p class="footer">由 SurveyKit 生成</p>
                    </div>
                </body>
                </html>
            `;
            const blob = new Blob([htmlContent.trim()], { type: 'text/html;charset=utf-8' });
            exportManager.downloadFile('深度问卷草稿.html', blob);
        },
        
        // **已修改**：init 函数现在将图片导出与其他导出分开了
        init: () => {
             if (!exportButtonContainer || !exportOptions) return;

             exportButton.addEventListener('click', (e) => {
                 e.stopPropagation();
                 exportButtonContainer.classList.toggle('active');
             });

             document.addEventListener('click', () => {
                 exportButtonContainer.classList.remove('active');
             });

             exportOptions.addEventListener('click', e => e.stopPropagation());

             // 通用导出处理器（不包括图片）
             const setupExportHandler = (id, handler) => {
                const link = document.getElementById(id);
                if (link) {
                    link.addEventListener('click', async (e) => {
                        e.preventDefault();
                        exportButtonContainer.classList.remove('active');

                        const originalText = exportButton.innerHTML;
                        exportButton.innerHTML = `正在生成... <i class="fas fa-spinner fa-spin icon-right"></i>`;
                        exportButton.disabled = true;
                        exportButton.classList.add('is-loading');

                        try {
                            // 短暂延迟让UI更新
                            await new Promise(resolve => setTimeout(resolve, 50));
                            await handler();
                        } catch (error) {
                            console.error(`导出 ${id} 失败:`, error);
                            alert(`导出失败: ${error.message}`);
                        } finally {
                           exportButton.innerHTML = originalText;
                           exportButton.disabled = false;
                           exportButton.classList.remove('is-loading');
                        }
                    });
                }
             };

             // 为 TXT, JSON, HTML 设置常规处理器
             setupExportHandler('exportTxt', exportManager.exportAsTxt);
             setupExportHandler('exportJson', exportManager.exportAsJson);
             setupExportHandler('exportHtml', exportManager.exportAsHtml);
             
             const exportImageLink = document.getElementById('exportImage');
             if (exportImageLink) {
                exportImageLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    exportButtonContainer.classList.remove('active'); // 关闭导出菜单
                    if (imageExportModal) {
                        imageExportModal.style.display = 'flex'; // 显示提示模态框
                    } else {
                        console.error('图片导出模态框未找到，将直接导出。');
                        // 这是一个备用方案，如果模态框HTML缺失，则直接触发导出
                        confirmExportImageBtn.click();
                    }
                });
             }
        }
    };


  const effectsAndObservers = {
    init: () => {
      const questionTextElements = document.querySelectorAll(
        ".question-block .question-text"
      );
      const questionBlocks = document.querySelectorAll(".question-block");
      const fieldsets = document.querySelectorAll("fieldset");

      if (!("IntersectionObserver" in window)) {
        fieldsets.forEach((el) => el.classList.add("is-visible"));
        questionTextElements.forEach((textEl) => {
          const originalText = textEl.dataset.originalText;
          if (originalText) {
            textEl.textContent = originalText;
            textEl.style.opacity = "1";
          }
        });
        return;
      }

      const fieldsetObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      fieldsets.forEach((el) => fieldsetObserver.observe(el));

      const textObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const el = entry.target;
            const text = el.dataset.originalText;
            if (text) {
              if (entry.isIntersecting && el.dataset.animated !== "true") {
                textAnimator.animate(el, text);
              } else if (
                !entry.isIntersecting &&
                el.dataset.animated === "true"
              ) {
                el.textContent = "";
                el.style.opacity = "0";
                el.dataset.animated = "false";
              }
            }
          });
        },
        { threshold: [0, 1] }
      );
      questionTextElements.forEach((el) => textObserver.observe(el));

      const currentQuestionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              const qNum = parseInt(entry.target.dataset.questionNumber, 10);
              if (qNum !== currentQuestionNumber) {
                currentQuestionNumber = qNum;
                jumpGrid.updateStatus();
              }
            }
          });
        },
        { root: null, rootMargin: "0px 0px -50% 0px", threshold: 0.5 }
      );
      questionBlocks.forEach((block) => currentQuestionObserver.observe(block));
    },
  };

const initializeApp = async () => {
  try {
    if (loadingMessage) loadingMessage.style.display = "block";

    let sections;

    // 检查 sessionStorage 中是否有由 loader.js 注入的动态问卷数据
    const dynamicSurveyDataJSON = sessionStorage.getItem('dynamicSurveyData');

    if (dynamicSurveyDataJSON) {
        console.log("检测到动态问卷数据，正在使用...");
        sections = JSON.parse(dynamicSurveyDataJSON);
        sessionStorage.removeItem('dynamicSurveyData');
    } else {
        console.log("未检测到动态数据，加载本地默认问卷 questions.json");
        const response = await fetch("/questions.json");
        if (!response.ok) throw new Error("问卷配置文件(questions.json)加载失败");
        sections = await response.json();
    }

    originalSections = JSON.parse(JSON.stringify(sections));

    surveyRenderer.render(sections);

      emailInput = document.getElementById("q_email");
      emailError = document.getElementById("emailError");

      if (!emailInput || !emailError) {
        throw new Error("初始化失败：无法找到动态创建的邮箱输入框。");
      }

      jumpGrid.init();

      form.addEventListener("input", (event) => {
        progressManager.save();
        uiUpdater.updateCompletion();
        if (event.target.type === "range")
          uiUpdater.updateRangeValue(event.target);
      });
      form.addEventListener("change", (e) => {
        const el = e.target;
        const otherInput = form.querySelector(
          `input[type="text"][name="${el.name}_other"]`
        );
        if (otherInput) {
          otherInput.classList.toggle("show", el.value === "other");
          if (el.value === "other") otherInput.focus();
          else otherInput.value = "";
        }
      });
      form.addEventListener("focusin", (e) => {
        const rect = e.target.getBoundingClientRect();
        if (rect.bottom > window.innerHeight - 80 || rect.top < 80) {
          setTimeout(
            () =>
              e.target.scrollIntoView({ behavior: "smooth", block: "center" }),
            300
          );
        }
      });
      form.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.target.tagName !== "TEXTAREA")
          e.preventDefault();
      });

      emailInput.addEventListener("input", () => {
        if (emailInput.classList.contains("input-error")) {
          emailInput.classList.remove("input-error");
          emailError.style.display = "none";
          emailError.textContent = "";
        }
      });

      submitButton.addEventListener("click", submissionHandler.initiate);
      submissionHandler.initModal();
      historyLookupModule.init();
      exportManager.init();

      if (imageExportModal) {
        // 点击“取消”按钮
        cancelExportImageBtn.addEventListener('click', () => {
            imageExportModal.style.display = 'none';
        });

        // 点击模态框背景关闭
        imageExportModal.addEventListener('click', (e) => {
            if (e.target === imageExportModal) {
                imageExportModal.style.display = 'none';
            }
        });

        // 点击“开始导出”按钮
        confirmExportImageBtn.addEventListener('click', async () => {
            imageExportModal.style.display = 'none'; // 先关闭模态框
            
            // 手动触发主导出按钮的加载状态
            const originalText = exportButton.innerHTML;
            exportButton.innerHTML = `正在生成... <i class="fas fa-spinner fa-spin icon-right"></i>`;
            exportButton.disabled = true;
            exportButton.classList.add('is-loading');

            try {
                // 等待真正的图片导出函数完成
                await exportManager.performImageExport();
            } catch (error) {
                console.error('图片导出流程失败:', error);
                alert(error.message); // 向用户显示错误
            } finally {
                // 无论成功或失败，都恢复主导出按钮的状态
                exportButton.innerHTML = originalText;
                exportButton.disabled = false;
                exportButton.classList.remove('is-loading');
            }
        });
      }


      window.addEventListener("scroll", uiUpdater.updateScrollProgress);
      uiUpdater.updateScrollProgress();

      progressManager.load();
      effectsAndObservers.init();
    } catch (error) {
      console.error("初始化应用失败:", error);
      if (loadingMessage) {
        loadingMessage.textContent = `加载问卷失败：${error.message}`;
        loadingMessage.style.color = "red";
      }
    }
  };

  initializeApp();
});