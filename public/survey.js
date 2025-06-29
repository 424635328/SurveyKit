document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("surveyForm");
  const progressBarElement = document.getElementById("scrollProgress");
  const completionCounter = document.getElementById("completionCounter");
  const submitButton = document.getElementById("submitButton");
  const confirmModal = document.getElementById("confirmModal");
  const confirmButton = document.getElementById("confirmButton");
  const cancelButton = document.getElementById("cancelButton");
  const historyIdInput = document.getElementById("historyIdInput");
  const lookupBtn = document.getElementById("lookupBtn");
  const loadingMessage = form.querySelector(".loading-message");
  const modalMessage = document.getElementById("modalMessage");

  const jumpGridContainer = document.querySelector(".jump-grid-container");
  const jumpGridElement = document.getElementById("jumpGrid");
  const jumpGridToggleButton = document.querySelector(".jump-grid-toggle");

  const formId = "deep-survey-draft";
  let totalQuestions = 0;
  let gridCells = [];
  let currentQuestionNumber = 0;

  if (!form || !submitButton) {
    console.error("Survey form or submit button not found!");
    if (loadingMessage) {
      loadingMessage.textContent = "页面加载错误：问卷表单或提交按钮缺失。";
      loadingMessage.style.color = "red";
    }
    return;
  }

  const animateText = (element, text, delay = 35) => {
    return new Promise((resolve) => {
      if (!element || typeof text !== "string") {
        resolve();
        return;
      }
      if (
        element.dataset.animated === "true" ||
        element.textContent.length > 0
      ) {
        element.textContent = text;
        element.style.opacity = "1";
        element.style.whiteSpace = "pre-wrap";
        element.style.width = "auto";
        resolve();
        return;
      }
      element.textContent = "";
      element.style.opacity = "1";
      element.style.width = "auto";
      element.style.whiteSpace = "pre";
      element.style.overflow = "hidden";
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
        } else {
          clearInterval(interval);
          element.style.whiteSpace = "pre-wrap";
          element.style.width = "auto";
          element.dataset.animated = "true";
          resolve();
        }
      }, delay);
    });
  };

  const renderSurvey = (sections) => {
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
            inputContainer = document.createElement("div");
            inputContainer.className = `radio-group ${q.className || ""}`.trim();
            q.options.forEach((opt) => {
              const value = typeof opt === "object" ? opt.value : opt;
              const labelText = typeof opt === "object" ? opt.label : opt;
              const id = `${q.id}_${String(value).replace(/\s+/g, "-")}`;
              const radioInput = document.createElement("input");
              radioInput.type = "radio";
              radioInput.id = id;
              radioInput.name = q.id;
              radioInput.value = value;
              inputContainer.appendChild(radioInput);
              const radioLabel = document.createElement("label");
              radioLabel.className = "radio-label";
              radioLabel.htmlFor = id;
              radioLabel.textContent = labelText;
              inputContainer.appendChild(radioLabel);
            });
            if (q.hasOther) {
              const otherDiv = document.createElement("div");
              otherDiv.className = "other-option";
              const otherId = `${q.id}_other`;
              const otherRadio = document.createElement("input");
              otherRadio.type = "radio";
              otherRadio.id = otherId;
              otherRadio.name = q.id;
              otherRadio.value = "other";
              otherDiv.appendChild(otherRadio);
              const otherLabel = document.createElement("label");
              otherLabel.className = "radio-label";
              otherLabel.htmlFor = otherId;
              otherLabel.textContent = "其他...";
              otherDiv.appendChild(otherLabel);
              const otherTextInput = document.createElement("input");
              otherTextInput.type = "text";
              otherTextInput.name = `${q.id}_other`;
              otherTextInput.className = "other-text-input";
              otherTextInput.placeholder = "请填写你的答案";
              otherDiv.appendChild(otherTextInput);
              inputContainer.appendChild(otherDiv);
            }
            break;
          case "select":
            inputContainer = document.createElement("div");
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
            inputContainer.appendChild(select);
            if (q.hasOther) {
              const otherTextInput = document.createElement("input");
              otherTextInput.type = "text";
              otherTextInput.name = `${q.id}_other`;
              otherTextInput.className = "other-text-input";
              otherTextInput.placeholder = "请填写你的答案";
              inputContainer.appendChild(otherTextInput);
            }
            break;
          case "color":
            inputContainer = document.createElement("div");
            inputContainer.className = "color-picker-wrapper";
            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.id = q.id;
            colorInput.name = q.id;
            colorInput.value = q.defaultValue || "#a7c5eb";
            inputContainer.appendChild(colorInput);
            const colorSpan = document.createElement("span");
            colorSpan.textContent = "(点击色块选择)";
            inputContainer.appendChild(colorSpan);
            break;
          case "range":
            inputContainer = document.createElement("div");
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
            inputContainer.appendChild(rangeGroup);
            const rangeValueDisplay = document.createElement("div");
            rangeValueDisplay.id = `rangeValue_${q.id}`;
            rangeValueDisplay.className = "range-value-display";
            rangeValueDisplay.textContent = `当前状态: ${q.defaultValue || 50}%`;
            inputContainer.appendChild(rangeValueDisplay);
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
            if (q.inputmode) {
              inputContainer.inputMode = q.inputmode;
            }
            break;
        }

        if (inputContainer) {
          questionBlock.appendChild(inputContainer);
        }

        fieldset.appendChild(questionBlock);
      });

      form.appendChild(fieldset);
    });

    totalQuestions = questionCount;

    if (loadingMessage) {
      loadingMessage.style.display = "none";
    }
  };

  const saveProgress = () => {
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
      const trimmedValue = typeof value === "string" ? value.trim() : value;
      if (key.endsWith("_other")) {
        const mainKey = key.replace(/_other$/, "");
        if (formData.get(mainKey) === "other" && trimmedValue !== "") {
          data[key] = trimmedValue;
        } else {
          continue;
        }
      } else {
        data[key] = trimmedValue;
      }
    }
    localStorage.setItem(formId, JSON.stringify(data));
  };

  const loadProgress = () => {
    const savedData = localStorage.getItem(formId);
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        for (const key in data) {
          const element = form.elements[key];
          if (element) {
            if (element.length && element[0]?.type === "radio") {
              const targetRadio = document.querySelector(
                `input[name="${key}"][value="${data[key]}"]`
              );
              if (targetRadio) {
                targetRadio.checked = true;
                targetRadio.dispatchEvent(
                  new Event("change", { bubbles: true })
                );
              }
              if (data[key] === "other" && data[`${key}_other`]) {
                const otherTextInput = form.querySelector(
                  `input[name="${key}_other"]`
                );
                if (otherTextInput) {
                  otherTextInput.value = data[`${key}_other`];
                  otherTextInput.classList.add("show");
                }
              }
            } else if (element.tagName === "SELECT") {
              element.value = data[key];
              element.dispatchEvent(new Event("change", { bubbles: true }));
              if (data[key] === "other" && data[`${key}_other`]) {
                const otherTextInput = form.querySelector(
                  `input[name="${key}_other"]`
                );
                if (otherTextInput) {
                  otherTextInput.value = data[`${key}_other`];
                  otherTextInput.classList.add("show");
                }
              }
            } else {
              element.value = data[key];
              if (element.type === "range") {
                handleRangeUpdate(element);
              }
            }
            const questionTextEl = document.querySelector(
              `.question-block label[for="${key}"] .question-text`
            );
            if (
              questionTextEl &&
              questionTextEl.dataset.originalText &&
              data[key]
            ) {
              questionTextEl.textContent = questionTextEl.dataset.originalText;
              questionTextEl.style.opacity = "1";
              questionTextEl.dataset.animated = "true";
            }
          }
        }
        updateCompletionProgress();
        updateJumpGridStatus();
      } catch (e) {
        console.error("加载草稿失败:", e);
        localStorage.removeItem(formId);
      }
    }
  };

  const updateScrollProgress = () => {
    if (!progressBarElement) return;
    const totalHeight = document.documentElement.scrollHeight,
      viewportHeight = window.innerHeight,
      scrollableDistance = totalHeight - viewportHeight,
      scrolled = window.scrollY;
    if (scrollableDistance <= 0) {
      progressBarElement.value = 100;
    } else {
      progressBarElement.value = (scrolled / scrollableDistance) * 100;
    }
  };

  const getFilledCount = () => {
    if (!form) return 0;
    const formData = new FormData(form);
    const answeredQuestions = new Set();
    document.querySelectorAll(".question-block label").forEach((label) => {
      const questionId = label.getAttribute("for");
      if (!questionId) return;
      let value = formData.get(questionId);
      if (value === "other") {
        const otherValue = formData.get(`${questionId}_other`);
        if (otherValue && String(otherValue).trim() !== "") {
          answeredQuestions.add(questionId);
        }
      } else if (value && String(value).trim() !== "") {
        answeredQuestions.add(questionId);
      }
    });
    return answeredQuestions.size;
  };

  const updateCompletionProgress = () => {
    if (!completionCounter) return;
    completionCounter.textContent = `已完成 ${getFilledCount()} / ${totalQuestions} 题`;
    updateJumpGridStatus();
  };

  const handleInputFocus = (event) => {
    const target = event.target;
    if (
      (target.tagName === "INPUT" &&
        (target.type === "text" || target.type === "number")) ||
      target.tagName === "TEXTAREA"
    ) {
      const rect = target.getBoundingClientRect(),
        viewportHeight =
          window.innerHeight || document.documentElement.clientHeight,
        buffer = 80;
      if (rect.bottom > viewportHeight - buffer || rect.top < buffer) {
        setTimeout(
          () => target.scrollIntoView({ behavior: "smooth", block: "center" }),
          300
        );
      }
    }
  };

  const handleOtherOption = (event) => {
    const target = event.target;
    if (
      target.name &&
      (target.tagName === "SELECT" || target.type === "radio")
    ) {
      const name = target.name;
      const otherInput = form.querySelector(
        `input[type="text"][name="${name}_other"]`
      );
      if (otherInput) {
        if (target.value === "other") {
          otherInput.classList.add("show");
          otherInput.focus();
        } else {
          otherInput.classList.remove("show");
          otherInput.value = "";
        }
      }
    }
  };

  const performSubmit = async () => {
    if (confirmModal) confirmModal.classList.remove("show");
    const formData = new FormData(form),
      cleanedData = {};
    for (const [key, value] of formData.entries()) {
      const trimmedValue = typeof value === "string" ? value.trim() : value;
      if (key.endsWith("_other")) {
        const mainKey = key.replace(/_other$/, "");
        if (formData.get(mainKey) === "other" && trimmedValue !== "") {
          cleanedData[mainKey] = trimmedValue;
        } else {
          continue;
        }
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
      window.location.href = `/result.html?status=error&message=${encodeURIComponent(
        error.message
      )}`;
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const filledCount = getFilledCount();
    if (filledCount === totalQuestions || totalQuestions === 0) {
      performSubmit();
    } else {
      if (modalMessage)
        modalMessage.textContent = `你已回答 ${filledCount} / ${totalQuestions} 题，确定要现在封存这份档案吗？`;
      if (confirmModal) confirmModal.classList.add("show");
    }
  };

  const animateFieldsets = () => {
    const fieldsets = document.querySelectorAll("fieldset");
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
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
      fieldsets.forEach((el) => observer.observe(el));
    } else {
      fieldsets.forEach((el) => el.classList.add("is-visible"));
    }
  };

  const initJumpGrid = () => {
    if (!jumpGridElement) return;
    jumpGridElement.innerHTML = "";
    gridCells = [];
    for (let i = 1; i <= 100; i++) {
      const cell = document.createElement("div");
      cell.classList.add("grid-cell");
      cell.textContent = i;
      cell.dataset.questionNumber = i;
      cell.addEventListener("click", () => {
        scrollToQuestion(i);
      });
      jumpGridElement.appendChild(cell);
      gridCells.push(cell);
    }
    if (jumpGridToggleButton && jumpGridContainer) {
      jumpGridToggleButton.addEventListener("click", () => {
        jumpGridContainer.classList.toggle("collapsed");
      });
    }
  };

  const scrollToQuestion = (questionNumber) => {
    const targetQuestionBlock = document.querySelector(
      `.question-block[data-question-number="${questionNumber}"]`
    );
    if (targetQuestionBlock) {
      targetQuestionBlock.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      document
        .querySelectorAll(".question-block.highlight-temp")
        .forEach((el) => el.classList.remove("highlight-temp"));
      targetQuestionBlock.classList.add("highlight-temp");
      setTimeout(() => {
        targetQuestionBlock.classList.remove("highlight-temp");
      }, 1500);
      updateJumpGridStatus(questionNumber);
    } else {
      alert(`未找到题号为 ${questionNumber} 的问题。`);
    }
  };

  const updateJumpGridStatus = (highlightQuestionNum = null) => {
    if (gridCells.length === 0) return;
    const formData = new FormData(form);
    gridCells.forEach((cell) => {
      const qNum = parseInt(cell.dataset.questionNumber, 10);
      const questionBlock = document.querySelector(
        `.question-block[data-question-number="${qNum}"]`
      );
      cell.classList.remove("filled", "current", "inactive");
      if (qNum > totalQuestions) {
        cell.classList.add("inactive");
      } else {
        const questionId = questionBlock
          ? questionBlock.querySelector("label")?.getAttribute("for")
          : null;
        let isFilled = false;
        if (questionId) {
          let value = formData.get(questionId);
          if (value === "other") {
            const otherValue = formData.get(`${questionId}_other`);
            if (otherValue && String(otherValue).trim() !== "") {
              isFilled = true;
            }
          } else if (value && String(value).trim() !== "") {
            isFilled = true;
          }
        }
        if (isFilled) {
          cell.classList.add("filled");
        }
        const isActiveQuestion = highlightQuestionNum
          ? qNum === highlightQuestionNum
          : qNum === currentQuestionNumber;
        if (isActiveQuestion) {
          cell.classList.add("current");
        }
      }
    });
  };

  const setupQuestionTextAnimations = () => {
    const questionTextElements = document.querySelectorAll(
      ".question-block .question-text"
    );
    if ("IntersectionObserver" in window) {
      const textObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const questionTextEl = entry.target;
            const originalText =
              questionTextEl.getAttribute("data-original-text");
            if (entry.isIntersecting) {
              if (originalText && questionTextEl.dataset.animated !== "true") {
                animateText(questionTextEl, originalText);
              }
            } else {
              if (questionTextEl.dataset.animated === "true" && originalText) {
                questionTextEl.textContent = "";
                questionTextEl.style.opacity = "0";
                questionTextEl.dataset.animated = "false";
                questionTextEl.style.whiteSpace = "pre-wrap";
                questionTextEl.style.width = "auto";
              }
            }
          });
        },
        { threshold: [0, 1] }
      );
      questionTextElements.forEach((el) => textObserver.observe(el));
    } else {
      questionTextElements.forEach((textEl) => {
        const originalText = textEl.getAttribute("data-original-text");
        if (originalText) {
          textEl.textContent = originalText;
          textEl.style.opacity = "1";
          textEl.style.whiteSpace = "pre-wrap";
        }
      });
    }
  };

  const setupCurrentQuestionObserver = () => {
    const questionBlocks = document.querySelectorAll(".question-block");
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const questionNumber = parseInt(
              entry.target.dataset.questionNumber,
              10
            );
            if (entry.isIntersecting) {
              if (entry.intersectionRatio >= 0.5) {
                if (questionNumber !== currentQuestionNumber) {
                  currentQuestionNumber = questionNumber;
                  updateJumpGridStatus();
                }
              }
            }
          });
        },
        { root: null, rootMargin: "0px 0px -50% 0px", threshold: 0.5 }
      );
      questionBlocks.forEach((block) => observer.observe(block));
    }
  };

  const handleHistoryLookup = () => {
    if (!historyIdInput) return;
    const inputVal = historyIdInput.value.trim();
    if (inputVal) {
        // 检查输入是否是一个完整的URL
        try {
            const url = new URL(inputVal);
            if (url.origin === window.location.origin && url.pathname.includes('/viewer.html')) {
                window.open(url.href, "_blank"); // 如果是本站的viewer链接，直接打开
            } else {
                // 如果是纯ID，或者不是本站的链接，或者不含viewer.html，就尝试拼接
                window.open(`/viewer.html?id=${inputVal}`, "_blank");
            }
        } catch (e) {
            // 如果不是一个有效的URL，就假设是ID
            window.open(`/viewer.html?id=${inputVal}`, "_blank");
        }
    } else {
      alert("请输入有效的问卷ID或完整链接。");
      historyIdInput.focus();
    }
  };

  const handleRangeUpdate = (rangeInput) => {
    const displayId = `rangeValue_${rangeInput.id}`;
    const displayElement = document.getElementById(displayId);
    if (displayElement) {
      displayElement.textContent = `当前状态: ${rangeInput.value}%`;
    }
  };

  const initializeApp = async () => {
    try {
      if (loadingMessage) {
        loadingMessage.style.display = "block";
      }
      const response = await fetch("/questions.json");
      if (!response.ok) throw new Error("问卷配置文件(questions.json)加载失败");
      const sections = await response.json();
      renderSurvey(sections);
      initJumpGrid();
      form.addEventListener("input", (event) => {
        saveProgress();
        updateCompletionProgress();
        if (event.target.type === "range") {
          handleRangeUpdate(event.target);
        }
      });
      form.addEventListener("change", handleOtherOption);
      form.addEventListener("focusin", handleInputFocus);
      submitButton.addEventListener("click", handleFormSubmit);
      form.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
          e.preventDefault();
        }
      });
      window.addEventListener("scroll", updateScrollProgress);
      updateScrollProgress();
      if (confirmButton) confirmButton.addEventListener("click", performSubmit);
      if (cancelButton)
        cancelButton.addEventListener("click", () =>
          confirmModal.classList.remove("show")
        );
      if (confirmModal)
        confirmModal.addEventListener("click", (e) => {
          if (e.target === confirmModal) confirmModal.classList.remove("show");
        });
      if (lookupBtn) lookupBtn.addEventListener("click", handleHistoryLookup);
      if (historyIdInput)
        historyIdInput.addEventListener("keyup", (event) => {
          if (event.key === "Enter") handleHistoryLookup();
        });
      loadProgress();
      updateCompletionProgress();
      animateFieldsets();
      setupQuestionTextAnimations();
      setupCurrentQuestionObserver();
    } catch (error) {
      console.error(error);
      if (loadingMessage) {
        loadingMessage.textContent = `加载问卷失败：${error.message}`;
        loadingMessage.style.color = "red";
      } else {
        form.innerHTML = `<p class="loading-message" style="color: red;">加载问卷失败：${error.message}</p>`;
      }
      document.querySelectorAll(".question-text").forEach((textEl) => {
        const originalText = textEl.getAttribute("data-original-text");
        if (originalText) {
          textEl.textContent = originalText;
          textEl.style.opacity = "1";
          textEl.style.whiteSpace = "pre-wrap";
          textEl.dataset.animated = "true";
        }
      });
    }
  };

  initializeApp();
});