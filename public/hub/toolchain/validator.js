document.addEventListener("DOMContentLoaded", () => {
  function initApp() {
    document.body.classList.add("aurora-background");
    initMobileMenu();
    initHeaderScrollEffect();
    initScrollAnimations();
    initScrollToTopButton();
    updateFooterYear();

    waitForLibrary("JSON5", initValidator);
  }

  function waitForLibrary(libraryName, callback) {
    let attempts = 0;
    const maxAttempts = 30;
    const interval = 100;
    const check = () => {
      if (window[libraryName]) {
        callback();
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(check, interval);
        } else {
          const container = document.getElementById("auto-fix-container");
          const label = document.getElementById("auto-fix-label");
          const toggle = document.getElementById("auto-fix-toggle");
          if (container) container.classList.add("disabled");
          if (label) label.textContent = "修正库加载失败";
          if (toggle) toggle.checked = false;
          const resultMessage = document.getElementById("result-message");
          if (resultMessage) {
            resultMessage.classList.remove("hidden");
            resultMessage.classList.add("message-error");
            resultMessage.innerHTML = `<i class="fa fa-exclamation-triangle mr-3"></i> <strong>智能修正功能不可用。</strong><br>核心库加载失败，请检查网络或浏览器插件。您仍可进行基础的JSON格式校验。`;
          }
        }
      }
    };
    check();
  }

  function heuristicFixer(text) {
    const lines = text.split("\n");
    const fixes = [];
    let fixedLines = [...lines];

    // 预处理：移除行首行尾的空白字符
    fixedLines = fixedLines.map((line) => line.trim());

    // --- 修复阶段 1: 智能添加逗号和冒号 ---
    let state = "start"; // 'start', 'in-object', 'in-array'
    const contextStack = [];

    for (let i = 0; i < fixedLines.length; i++) {
      let line = fixedLines[i];

      // 获取上一行的有效内容（非空、非注释）
      let prevLine = "";
      for (let j = i - 1; j >= 0; j--) {
        if (fixedLines[j].trim() && !fixedLines[j].trim().startsWith("//")) {
          prevLine = fixedLines[j].trim();
          break;
        }
      }

      if (prevLine) {
        // 1. 智能添加逗号
        const endsWithValue = /[}\]"']$|true$|false$|null$|\d$/.test(prevLine);
        const startsWithKeyOrValue = /^['"{\[]/.test(line);

        if (endsWithValue && startsWithKeyOrValue && !prevLine.endsWith(",")) {
          fixedLines[i - 1] += ",";
          fixes.push(`在第 ${i} 行末尾自动添加了缺失的逗号`);
        }

        // 2. 智能添加冒号 (实验性)
        // 如果上一行是 "key" 这种形式，当前行是 "value" 这种形式
        const endsWithKey = /"$/.test(prevLine) && !prevLine.endsWith('",');
        const startsWithValue = /^"/.test(line);
        if (endsWithKey && startsWithValue) {
          fixedLines[i - 1] += ":";
          fixes.push(`在第 ${i} 行末尾自动添加了缺失的冒号`);
        }
      }
    }

    let processedText = fixedLines.join("\n");

    // --- 修复阶段 2: 闭合括号/引号 ---
    const charStack = [];
    let inString = false;
    let quoteType = "";

    for (let i = 0; i < processedText.length; i++) {
      const char = processedText[i];
      const prevChar = i > 0 ? processedText[i - 1] : null;

      if (inString) {
        if (char === quoteType && prevChar !== "\\") {
          inString = false;
          quoteType = "";
        }
      } else {
        if (char === '"' || char === "'") {
          inString = true;
          quoteType = char;
        } else if (char === "{" || char === "[") {
          charStack.push(char);
        } else if (char === "}") {
          if (charStack.length > 0 && charStack[charStack.length - 1] === "{") {
            charStack.pop();
          }
        } else if (char === "]") {
          if (charStack.length > 0 && charStack[charStack.length - 1] === "[") {
            charStack.pop();
          }
        }
      }
    }

    if (inString) {
      processedText += quoteType;
      fixes.push(`在末尾自动闭合了未关闭的引号 (${quoteType})`);
    }

    if (charStack.length > 0) {
      let closingChars = "";
      while (charStack.length > 0) {
        const openChar = charStack.pop();
        closingChars += openChar === "{" ? "}" : "]";
      }
      processedText += closingChars;
      fixes.push(
        `自动闭合了 ${closingChars.length} 个缺失的括号: <code>${closingChars}</code>`
      );
    }

    return { fixedText: processedText, fixes };
  }

  function initValidator() {
    const jsonInput = document.getElementById("json-input");
    const validateBtn = document.getElementById("validate-btn");
    const clearBtn = document.getElementById("clear-btn");
    const copyBtn = document.getElementById("copy-btn");
    const resultMessage = document.getElementById("result-message");
    const autoFixToggle = document.getElementById("auto-fix-toggle");

    const showMessage = (type, message) => {
      resultMessage.classList.remove(
        "hidden",
        "message-success",
        "message-warning",
        "message-error"
      );
      let icon = "";
      let canCopy = false;
      switch (type) {
        case "success":
          resultMessage.classList.add("message-success");
          icon = "fa-check-circle";
          canCopy = true;
          break;
        case "warning":
          resultMessage.classList.add("message-warning");
          icon = "fa-magic";
          canCopy = true;
          break;
        case "error":
          resultMessage.classList.add("message-error");
          icon = "fa-exclamation-triangle";
          break;
      }
      resultMessage.innerHTML = `<i class="fa ${icon} mr-3"></i> ${message}`;
      copyBtn.classList.toggle("hidden", !canCopy);
    };

    const hideMessage = () => {
      if (!resultMessage.textContent.includes("核心库加载失败")) {
        resultMessage.classList.add("hidden");
      }
      copyBtn.classList.add("hidden");
    };

    validateBtn.addEventListener("click", () => {
      const inputText = jsonInput.value;
      if (!inputText.trim()) {
        showMessage("error", "输入内容不能为空。");
        return;
      }

      let textToParse = inputText;
      let heuristicFixesApplied = [];
      let parsedObject;

      // 多轮修复循环
      for (let i = 0; i < 2; i++) {
        // 最多尝试2轮
        if (autoFixToggle.checked && window.JSON5) {
          const result = heuristicFixer(textToParse);
          if (result.fixes.length > 0) {
            textToParse = result.fixedText;
            // 合并修复记录，避免重复
            result.fixes.forEach((fix) => {
              if (!heuristicFixesApplied.includes(fix)) {
                heuristicFixesApplied.push(fix);
              }
            });
          }
        }

        try {
          parsedObject = JSON5.parse(textToParse);
          // 如果成功解析，就跳出循环
          break;
        } catch (e) {
          // 如果解析失败，在最后一轮循环中报告错误
          if (i === 1) {
            let helpfulHint = "";
            if (e.message.includes("Unexpected token")) {
              helpfulHint =
                "<strong>提示：</strong>请检查是否存在无法自动修复的冒号 <strong>:</strong> 或引号不匹配问题。";
            }
            showMessage(
              "error",
              `多次尝试修正后，仍存在无法处理的错误。<br><small class="opacity-75">错误信息: ${e.message}</small><br><br>${helpfulHint}`
            );
            return;
          }
        }
      }

      if (parsedObject) {
        let message = "JSON 格式正确，已成功格式化！";
        let messageType = "success";

        if (heuristicFixesApplied.length > 0) {
          message = `已通过算法修正并格式化！<br><small class="opacity-75"><ul>${heuristicFixesApplied.map((f) => `<li>${f}</li>`).join("")}</ul></small>`;
          messageType = "warning";
        } else if (
          inputText.trim() !== JSON.stringify(parsedObject, null, 2).trim()
        ) {
          message = "输入内容包含语法糖，已修正并格式化！";
          messageType = "warning";
        }

        showMessage(messageType, message);
        const formattedJson = JSON.stringify(parsedObject, null, 2);
        jsonInput.value = formattedJson;
      }
    });

    clearBtn.addEventListener("click", () => {
      jsonInput.value = "";
      hideMessage();
      jsonInput.focus();
    });
    copyBtn.addEventListener("click", () => {
      navigator.clipboard
        .writeText(jsonInput.value)
        .then(() => {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = '<i class="fa fa-check mr-2"></i>已复制!';
          setTimeout(() => {
            copyBtn.innerHTML = originalText;
          }, 2000);
        })
        .catch((err) => {
          showMessage("error", "复制失败，请手动复制。");
        });
    });
    jsonInput.addEventListener("input", hideMessage);
  }

  // --- 以下是通用UI函数，保持不变 ---
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
  function initScrollToTopButton() {
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    if (!scrollToTopBtn) return;
    const SCROLL_VISIBLE_THRESHOLD = 300;
    const toggleButtonVisibility = () => {
      if (window.scrollY > SCROLL_VISIBLE_THRESHOLD) {
        scrollToTopBtn.classList.remove(
          "opacity-0",
          "pointer-events-none",
          "translate-y-4"
        );
        scrollToTopBtn.classList.add(
          "opacity-100",
          "pointer-events-auto",
          "translate-y-0"
        );
      } else {
        scrollToTopBtn.classList.remove(
          "opacity-100",
          "pointer-events-auto",
          "translate-y-0"
        );
        scrollToTopBtn.classList.add(
          "opacity-0",
          "pointer-events-none",
          "translate-y-4"
        );
      }
    };
    window.addEventListener("scroll", toggleButtonVisibility, {
      passive: true,
    });
    scrollToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    toggleButtonVisibility();
  }
  function updateFooterYear() {
    const currentYearFooter = document.getElementById("current-year-footer");
    if (currentYearFooter) {
      currentYearFooter.textContent = new Date().getFullYear();
    }
  }

  initApp();
});
