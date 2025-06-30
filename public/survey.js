document.addEventListener("DOMContentLoaded", () => {
  // DOM 元素选择器
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

  // 全局状态变量
  const formId = "deep-survey-draft";
  let totalQuestions = 0;
  let gridCells = [];
  let currentQuestionNumber = 0;

  // 确保核心元素存在
  if (!form || !submitButton) {
    console.error("核心组件缺失：找不到问卷表单或提交按钮。");
    if (loadingMessage) {
      loadingMessage.textContent = "页面加载错误：问卷核心组件缺失。";
      loadingMessage.style.color = "red";
    }
    return;
  }

  /**
   * 模块化功能：文本打字机动画
   */
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

  /**
   * 模块化功能：问卷渲染
   */
  const surveyRenderer = {
    render: (sections) => {
      form.textContent = "";
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
        form.appendChild(fieldset);
      });
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

  /**
   * 模块化功能：进度保存与加载
   */
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

  /**
   * 模块化功能：UI 更新
   */
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

  /**
   * 模块化功能：题号导航格
   */
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
        cell.className = "grid-cell"; // Reset classes
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

  /**
   * 模块化功能：提交逻辑与弹窗
   */
  const submissionHandler = {
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
        window.location.href = `/result.html?status=error&message=${encodeURIComponent(error.message)}`;
      }
    },
    initiate: (e) => {
      e.preventDefault();
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

  /**
   * 模块化功能：历史档案查找 (已优化)
   */
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
          messageEl.innerHTML = " "; // 使用不间断空格占位
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

  /**
   * 模块化功能：页面动效与交互观察器
   */
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

  /**
   * 主初始化函数
   */
  const initializeApp = async () => {
    try {
      if (loadingMessage) loadingMessage.style.display = "block";
      const response = await fetch("/questions.json");
      if (!response.ok) throw new Error("问卷配置文件(questions.json)加载失败");
      const sections = await response.json();

      surveyRenderer.render(sections);
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

      submitButton.addEventListener("click", submissionHandler.initiate);
      submissionHandler.initModal();
      historyLookupModule.init();

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
