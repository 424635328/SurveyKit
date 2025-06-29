// public/survey.js

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
  
  const jumpGridContainer = document.querySelector('.jump-grid-container');
  const jumpGridElement = document.getElementById('jumpGrid');
  const jumpGridToggleButton = document.querySelector('.jump-grid-toggle');

  const formId = "deep-survey-draft";
  let totalQuestions = 0;
  let gridCells = [];
  let currentQuestionNumber = 0;

  if (!form || !submitButton) {
    console.error("Survey form or submit button not found!");
    if (loadingMessage) {
      loadingMessage.textContent = "页面加载错误：问卷表单或提交按钮缺失。";
      loadingMessage.style.color = 'red';
    }
    return;
  }

  /**
   * 逐字打印文本到元素
   * @param {HTMLElement} element - 要打印文本的DOM元素
   * @param {string} text - 要打印的完整文本
   * @param {number} delay - 每个字符之间的延迟（毫秒）
   * @returns {Promise<void>} - 在文本打印完成后解析
   */
  const animateText = (element, text, delay = 35) => {
    return new Promise(resolve => {
        if (!element || typeof text !== 'string') {
            resolve();
            return;
        }
        
        if (element.dataset.animated === 'true' || element.textContent.length > 0) {
            element.textContent = text;
            element.style.opacity = '1';
            element.style.whiteSpace = 'pre-wrap';
            element.style.width = 'auto';
            resolve();
            return;
        }

        element.textContent = '';
        element.style.opacity = '1';
        element.style.width = 'auto'; // 文本可以正常流式布局
        element.style.whiteSpace = 'pre'; // 暂时设置为 pre，实现逐字不换行效果
        element.style.overflow = 'hidden';

        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(interval);
                element.style.whiteSpace = 'pre-wrap'; // 恢复正常换行
                element.style.width = 'auto';
                element.dataset.animated = 'true';
                resolve();
            }
        }, delay);
    });
  };

  /**
   * 渲染问卷结构到页面
   * @param {Array} sections - 问卷的分区数据
   */
  const renderSurvey = (sections) => {
    let formContentHTML = "";
    let questionCount = 0;

    sections.forEach((section) => {
      formContentHTML += `<fieldset><legend>${section.legend}</legend>`;
      section.questions.forEach((q) => {
        questionCount++;
        // 移除问题文本开头的数字和点，以防止重复显示题号
        const cleanText = q.text.replace(/^\s*\d+\.\s*/, '').trim(); // <--- 关键改动在这里
        formContentHTML += `<div class="question-block" data-question-number="${questionCount}">
                                <label for="${q.id}">
                                    <span class="question-number">${questionCount}. </span>
                                    <span class="question-text" data-original-text="${cleanText}"></span>
                                </label>`;
        switch (q.type) {
          case "radio":
            formContentHTML += `<div class="radio-group ${q.className || ""}">`;
            q.options.forEach(
              (opt) =>
                (formContentHTML += `<input type="radio" id="${
                  q.id
                }_${(typeof opt === 'object' ? opt.value : opt).replace(/\s+/g, "-")}" name="${q.id}" value="${
                  typeof opt === 'object' ? opt.value : opt
                }"><label class="radio-label" for="${q.id}_${(typeof opt === 'object' ? opt.value : opt).replace(
                  /\s+/g,
                  "-"
                )}">${typeof opt === 'object' ? opt.label : opt}</label>`)
            );
            if (q.hasOther)
              formContentHTML += `<div class="other-option"><input type="radio" id="${q.id}_other" name="${q.id}" value="other"><label class="radio-label" for="${q.id}_other">其他...</label><input type="text" name="${q.id}_other" class="other-text-input" placeholder="请填写你的答案"></div>`;
            formContentHTML += `</div>`;
            break;
          case "select":
            formContentHTML += `<select id="${q.id}" name="${
              q.id
            }"><option value="" disabled selected>${
              q.placeholder || "请选择"
            }</option>`;
            q.options.forEach(
              (opt) => (formContentHTML += `<option value="${typeof opt === 'object' ? opt.value : opt}">${typeof opt === 'object' ? opt.label : opt}</option>`)
            );
            if (q.hasOther)
              formContentHTML += `<option value="other">其他...</option>`;
            formContentHTML += `</select>`;
            if (q.hasOther)
              formContentHTML += `<input type="text" name="${q.id}_other" class="other-text-input" placeholder="请填写你的答案">`;
            break;
          case "color":
            formContentHTML += `<div class="color-picker-wrapper"><input type="color" id="${
              q.id
            }" name="${q.id}" value="${
              q.defaultValue || "#a7c5eb"
            }"><span>(点击色块选择)</span></div>`;
            break;
          case "range":
            formContentHTML += `<div class="range-group"><span>${q.rangeLeft || '安静独处'}</span><input type="range" id="${
              q.id
            }" name="${q.id}" min="${q.min || 0}" max="${
              q.max || 100
            }" value="${
              q.defaultValue || 50
            }"><span>${q.rangeRight || '随时派对'}</span></div><div id="rangeValue_${
              q.id
            }" class="range-value-display">当前状态: ${
              q.defaultValue || 50
            }%</div>`;
            break;
          case "textarea":
            formContentHTML += `<textarea id="${q.id}" name="${q.id}" rows="${
              q.rows || 2
            }"></textarea>`;
            break;
          default:
            formContentHTML += `<input type="text" id="${q.id}" name="${
              q.id
            }" inputmode="${q.inputmode || "text"}">`;
            break;
        }
        formContentHTML += `</div>`;
      });
      formContentHTML += `</fieldset>`;
    });
    form.innerHTML = formContentHTML;

    totalQuestions = questionCount;

    if (loadingMessage) {
        loadingMessage.style.display = 'none';
    }
  };

  /**
   * 保存问卷填写进度到 localStorage
   */
  const saveProgress = () => {
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
        const trimmedValue = typeof value === 'string' ? value.trim() : value;
        if (key.endsWith('_other')) {
            const mainKey = key.replace(/_other$/, '');
            if (formData.get(mainKey) === 'other' && trimmedValue !== '') {
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

  /**
   * 从 localStorage 加载问卷填写进度
   * 对于已加载草稿的题目，直接显示完整文本，不进行动画
   */
  const loadProgress = () => {
    const savedData = localStorage.getItem(formId);
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        for (const key in data) {
          const element = form.elements[key];
          if (element) {
            if (element.length && element[0]?.type === "radio") {
              const targetRadio = document.querySelector(`input[name="${key}"][value="${data[key]}"]`);
              if (targetRadio) {
                targetRadio.checked = true;
                targetRadio.dispatchEvent(new Event("change", { bubbles: true }));
              }
              if (data[key] === "other" && data[`${key}_other`]) {
                const otherTextInput = form.querySelector(`input[name="${key}_other"]`);
                if (otherTextInput) {
                  otherTextInput.value = data[`${key}_other`];
                  otherTextInput.classList.add("show");
                }
              }
            } else if (element.tagName === "SELECT") {
              element.value = data[key];
              element.dispatchEvent(new Event("change", { bubbles: true }));
              if (data[key] === "other" && data[`${key}_other`]) {
                const otherTextInput = form.querySelector(`input[name="${key}_other"]`);
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
            // 对于加载进来的题目，如果它们有值，直接显示完整文本，并标记为已动画
            const questionTextEl = document.querySelector(`.question-block label[for="${key}"] .question-text`);
            if (questionTextEl && questionTextEl.dataset.originalText && data[key]) {
                questionTextEl.textContent = questionTextEl.dataset.originalText;
                questionTextEl.style.opacity = '1';
                questionTextEl.dataset.animated = 'true'; // 标记为已动画，不再重新动画
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

  /**
   * 更新滚动进度条
   */
  const updateScrollProgress = () => {
    if (!progressBarElement) return;
    
    const totalHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    const scrollableDistance = totalHeight - viewportHeight;
    const scrolled = window.scrollY;

    if (scrollableDistance <= 0) {
        progressBarElement.value = 100;
    } else {
        progressBarElement.value = (scrolled / scrollableDistance) * 100;
    }
  };

  /**
   * 计算已完成的题目数量
   */
  const getFilledCount = () => {
    if (!form) return 0;
    const formData = new FormData(form);
    const answeredQuestions = new Set();
    
    document.querySelectorAll('.question-block label').forEach(label => {
        const questionId = label.getAttribute('for');
        if (!questionId) return;

        let value = formData.get(questionId);

        if (value === 'other') {
            const otherValue = formData.get(`${questionId}_other`);
            if (otherValue && String(otherValue).trim() !== '') {
                answeredQuestions.add(questionId);
            }
        } else if (value && String(value).trim() !== '') {
            answeredQuestions.add(questionId);
        }
    });
    return answeredQuestions.size;
  };

  /**
   * 更新完成度计数器
   */
  const updateCompletionProgress = () => {
    if (!completionCounter) return;
    completionCounter.textContent = `已完成 ${getFilledCount()} / ${totalQuestions} 题`;
    updateJumpGridStatus();
  };

  /**
   * 处理输入框焦点，确保在移动端键盘弹出时输入框可见
   */
  const handleInputFocus = (event) => {
    const target = event.target;
    if (
      (target.tagName === "INPUT" && (target.type === "text" || target.type === "number")) ||
      target.tagName === "TEXTAREA"
    ) {
      const rect = target.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const buffer = 80;

      if (rect.bottom > viewportHeight - buffer || rect.top < buffer) {
        setTimeout(
          () => target.scrollIntoView({ behavior: "smooth", block: "center" }),
          300
        );
      }
    }
  };

  /**
   * 处理“其他”选项的动态显示和隐藏
   */
  const handleOtherOption = (event) => {
    const target = event.target;
    if (
      target.name &&
      (target.tagName === "SELECT" || target.type === "radio")
    ) {
      const name = target.name;
      const otherInput = form.querySelector(`input[type="text"][name="${name}_other"]`);
      
      if (otherInput) {
        if (target.value === "other") {
          otherInput.classList.add("show");
          otherInput.focus();
        } else {
          otherInput.classList.remove("show");
          otherInput.value = '';
        }
      }
    }
  };

  /**
   * 执行问卷提交操作
   */
  const performSubmit = async () => {
    if (confirmModal) confirmModal.classList.remove("show");

    const formData = new FormData(form);
    const cleanedData = {};

    for (const [key, value] of formData.entries()) {
        const trimmedValue = typeof value === 'string' ? value.trim() : value;
        if (key.endsWith('_other')) {
            const mainKey = key.replace(/_other$/, '');
            if (formData.get(mainKey) === 'other' && trimmedValue !== '') {
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
      if (response.ok && result.id) {
        localStorage.removeItem(formId);
        window.location.href = `/result.html?status=success&id=${result.id}`;
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

  /**
   * 处理表单提交事件（由提交按钮点击触发）
   */
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

  /**
   * 触发问卷分区（fieldset）的淡入动画
   */
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

  /**
   * 初始化跳题网格
   */
  const initJumpGrid = () => {
    if (!jumpGridElement) return;

    jumpGridElement.innerHTML = ''; // 清空可能存在的旧内容
    gridCells = []; // 重置存储的单元格引用
    for (let i = 1; i <= 100; i++) { // 固定生成100个单元格
        const cell = document.createElement('div');
        cell.classList.add('grid-cell');
        cell.textContent = i;
        cell.dataset.questionNumber = i; // 存储题号
        
        cell.addEventListener('click', () => {
            scrollToQuestion(i);
        });
        
        jumpGridElement.appendChild(cell);
        gridCells.push(cell);
    }

    // 绑定折叠/展开按钮
    if (jumpGridToggleButton && jumpGridContainer) {
        jumpGridToggleButton.addEventListener('click', () => {
            jumpGridContainer.classList.toggle('collapsed');
        });
    }
  };

  /**
   * 滚动到指定题目
   */
  const scrollToQuestion = (questionNumber) => {
    const targetQuestionBlock = document.querySelector(`.question-block[data-question-number="${questionNumber}"]`);
    if (targetQuestionBlock) {
        targetQuestionBlock.scrollIntoView({ behavior: "smooth", block: "center" });
        // 移除所有高亮
        document.querySelectorAll('.question-block.highlight-temp').forEach(el => el.classList.remove('highlight-temp'));
        // 添加新的高亮
        targetQuestionBlock.classList.add('highlight-temp');
        setTimeout(() => {
            targetQuestionBlock.classList.remove('highlight-temp');
        }, 1500); // 1.5秒后移除高亮

        // 更新当前题目高亮状态到网格
        updateJumpGridStatus(questionNumber);

    } else {
        alert(`未找到题号为 ${questionNumber} 的问题。`);
    }
  };

  /**
   * 更新跳题网格的完成状态和当前题目状态
   */
  const updateJumpGridStatus = (highlightQuestionNum = null) => {
    if (gridCells.length === 0) return;

    const formData = new FormData(form);

    gridCells.forEach(cell => {
        const qNum = parseInt(cell.dataset.questionNumber, 10);
        const questionBlock = document.querySelector(`.question-block[data-question-number="${qNum}"]`);
        
        // 重置所有状态类
        cell.classList.remove('filled', 'current', 'inactive');

        if (qNum > totalQuestions) {
            cell.classList.add('inactive'); // 未激活状态（超出总题数）
        } else {
            // 判断是否已填写
            const questionId = questionBlock ? questionBlock.querySelector('label')?.getAttribute('for') : null;
            let isFilled = false;
            if (questionId) {
                let value = formData.get(questionId);
                if (value === 'other') {
                    const otherValue = formData.get(`${questionId}_other`);
                    if (otherValue && String(otherValue).trim() !== '') {
                        isFilled = true;
                    }
                } else if (value && String(value).trim() !== '') {
                    isFilled = true;
                }
            }
            if (isFilled) {
                cell.classList.add('filled');
            }

            // 判断是否是当前题目
            // 如果提供了 highlightQuestionNum，以它为准；否则，以 IntersectionObserver 的 currentQuestionNumber 为准
            const isActiveQuestion = highlightQuestionNum ? (qNum === highlightQuestionNum) : (qNum === currentQuestionNumber);
            if (isActiveQuestion) {
                cell.classList.add('current');
            }
        }
    });
  };

  /**
   * 设置每个问题的文本逐字动画，当问题进入视口时触发，离开视口时重置
   */
  const setupQuestionTextAnimations = () => {
    const questionTextElements = document.querySelectorAll('.question-block .question-text');
    if ("IntersectionObserver" in window) {
        const textObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const questionTextEl = entry.target;
                const originalText = questionTextEl.getAttribute('data-original-text');

                if (entry.isIntersecting) {
                    if (originalText && questionTextEl.dataset.animated !== 'true') {
                        animateText(questionTextEl, originalText);
                    }
                } else {
                    if (questionTextEl.dataset.animated === 'true' && originalText) {
                        questionTextEl.textContent = ''; // 清空文本
                        questionTextEl.style.opacity = '0'; // 设为透明
                        questionTextEl.dataset.animated = 'false'; // 重置动画状态
                        questionTextEl.style.whiteSpace = 'pre-wrap'; // 确保重置后仍然正常换行
                        questionTextEl.style.width = 'auto';
                    }
                }
            });
        }, { threshold: [0, 1] }); // 当元素完全进入 (1) 或完全离开 (0) 视口时触发

        questionTextElements.forEach(el => textObserver.observe(el));
    } else {
        // 不支持 IntersectionObserver 的浏览器，直接显示所有文本
        questionTextElements.forEach(textEl => {
            const originalText = textEl.getAttribute('data-original-text');
            if (originalText) {
                textEl.textContent = originalText;
                textEl.style.opacity = '1';
                textEl.style.whiteSpace = 'pre-wrap';
            }
        });
    }
  };

  /**
   * 监听问题块的可见性，更新当前题目高亮
   */
  const setupCurrentQuestionObserver = () => {
    const questionBlocks = document.querySelectorAll('.question-block');
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const questionNumber = parseInt(entry.target.dataset.questionNumber, 10);
          if (entry.isIntersecting) {
            if (entry.intersectionRatio >= 0.5) { // 至少一半可见才算当前题
                if (questionNumber !== currentQuestionNumber) {
                    currentQuestionNumber = questionNumber;
                    updateJumpGridStatus(); // 更新网格的当前题目状态
                }
            }
          }
        });
      }, {
        root: null, // 视口为根
        rootMargin: '0px 0px -50% 0px', // 在视口中间触发
        threshold: 0.5 // 50%可见时触发
      });
      questionBlocks.forEach(block => observer.observe(block));
    }
  };

  /**
   * 处理历史档案查找功能
   */
  const handleHistoryLookup = () => {
    if (!historyIdInput) return;
    const id = historyIdInput.value.trim();
    if (id) {
      window.open(`/viewer.html?id=${id}`, "_blank");
    } else {
      alert("请输入一个有效的问卷ID。");
      historyIdInput.focus();
    }
  };

  /**
   * 更新范围滑块的显示值
   */
  const handleRangeUpdate = (rangeInput) => {
    const displayId = `rangeValue_${rangeInput.id}`;
    const displayElement = document.getElementById(displayId);
    if (displayElement) {
      displayElement.textContent = `当前状态: ${rangeInput.value}%`;
    }
  };

  /**
   * 初始化问卷页面
   */
  const initializeApp = async () => {
    try {
      if (loadingMessage) {
        loadingMessage.style.display = 'block';
      }

      const response = await fetch("/questions.json");
      if (!response.ok) throw new Error("问卷配置文件(questions.json)加载失败");
      const sections = await response.json();
      renderSurvey(sections); // 渲染问卷问题

      initJumpGrid(); // 初始化跳题网格

      form.addEventListener("input", (event) => {
        saveProgress();
        updateCompletionProgress(); // 这会同时更新跳题网格的完成状态
        if (event.target.type === "range") {
          handleRangeUpdate(event.target);
        }
      });

      form.addEventListener("change", handleOtherOption);
      form.addEventListener("focusin", handleInputFocus);
      submitButton.addEventListener("click", handleFormSubmit);
      form.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
              e.preventDefault();
          }
      });
      window.addEventListener("scroll", updateScrollProgress);
      updateScrollProgress(); // 页面加载完成后立即调用一次更新，防止在没有滚动前进度条不显示

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
      
      loadProgress(); // 加载草稿，这会更新完成计数器和跳题网格状态
      updateCompletionProgress(); // 再次更新确保正确
      animateFieldsets(); // 触发 fieldset 淡入动画
      setupQuestionTextAnimations(); // 设置问题文本的逐字动画观察者
      setupCurrentQuestionObserver(); // 设置当前题目高亮观察者

    } catch (error) {
      console.error(error);
      if (loadingMessage) {
          loadingMessage.textContent = `加载问卷失败：${error.message}`;
          loadingMessage.style.color = 'red';
      } else {
          form.innerHTML = `<p class="loading-message" style="color: red;">加载问卷失败：${error.message}</p>`;
      }
      // 如果动画失败，确保所有文本都可见
      document.querySelectorAll('.question-text').forEach(textEl => {
        const originalText = textEl.getAttribute('data-original-text');
        if (originalText) {
          textEl.textContent = originalText;
          textEl.style.opacity = '1';
          textEl.style.whiteSpace = 'pre-wrap';
          textEl.dataset.animated = 'true'; // 强制标记为已动画，避免再次触发
        }
      });
    }
  };

  initializeApp();
});