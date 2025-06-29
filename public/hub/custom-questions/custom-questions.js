document.addEventListener("DOMContentLoaded", () => {
  // --- DOM 元素 ---
  const sectionsContainer = document.getElementById("sections-container");
  const addSectionBtn = document.getElementById("add-section-btn");
  const importBtn = document.getElementById("import-btn");
  const importDropdown = document.getElementById("import-dropdown");
  const exportBtn = document.getElementById("export-btn");
  const exportDropdown = document.getElementById("export-dropdown");
  const fileInput = document.getElementById("file-input");
  const previewToggle = document.getElementById("preview-toggle");
  const editorSection = document.getElementById("editor-section");
  const previewSection = document.getElementById("preview-section");
  const previewContent = document.getElementById("preview-content");
  const notification = document.getElementById("notification");
  const notificationIcon = document.getElementById("notification-icon");
  const notificationText = document.getElementById("notification-text");
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  // --- 状态变量 ---
  let isPreviewMode = false;
  let sectionCounter = 0;
  let questionCounter = 0; // ENHANCEMENT: Robust ID generation

  // --- 工具函数 ---

  // ENHANCEMENT: Debounce function to prevent excessive re-rendering on input
  function debounce(func, delay = 300) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // ENHANCEMENT: Robust, session-unique ID generator
  const generateId = (prefix) => `${prefix}_${Date.now()}_${++questionCounter}`;

  // --- 初始化 ---
  function init() {
    bindEventListeners();
    if (sectionsContainer.children.length === 0) {
      addNewSection(false); // Don't show notification on initial load
    }
    renderPreview();
  }

  // --- 事件绑定 ---
  function bindEventListeners() {
    menuToggle.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
      menuToggle.querySelector("i").classList.toggle("fa-bars");
      menuToggle.querySelector("i").classList.toggle("fa-times");
    });

    addSectionBtn.addEventListener("click", () => addNewSection());

    setupDropdown(importBtn, importDropdown);
    setupDropdown(exportBtn, exportDropdown);

    importDropdown.addEventListener("click", handleImportRequest);
    fileInput.addEventListener("change", handleFileImport);

    exportDropdown.addEventListener("click", handleExportRequest);

    previewToggle.addEventListener("click", togglePreviewMode);

    sectionsContainer.addEventListener("click", handleEditorClick);

    // ENHANCEMENT: Use the debounced render function for performance
    const debouncedRender = debounce(() => renderPreview());
    sectionsContainer.addEventListener("input", (e) => {
      validateInput(e.target);
      debouncedRender();
    });

    sectionsContainer.addEventListener("change", (e) => {
      if (e.target.matches(".question-type")) {
        toggleQuestionOptions(e.target);
      }
      renderPreview();
    });

    previewContent.addEventListener("change", handlePreviewInteraction);
  }

  function setupDropdown(button, dropdown) {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      closeAllDropdowns(dropdown);
      dropdown.classList.toggle("hidden");
      dropdown.classList.toggle("opacity-0");
      dropdown.classList.toggle("scale-95");
    });
    // ENHANCEMENT: Prevent dropdown from closing when clicking inside it
    dropdown.addEventListener("click", (event) => event.stopPropagation());
    document.addEventListener("click", () => closeAllDropdowns());
  }

  function closeAllDropdowns(except = null) {
    [importDropdown, exportDropdown].forEach((d) => {
      if (d !== except) {
        d.classList.add("hidden", "opacity-0", "scale-95");
      }
    });
  }

  function handleEditorClick(e) {
    const target = e.target.closest("button");
    if (!target) return;

    const actionMap = {
      "add-question-btn": (t) => addNewQuestion(t.closest(".section-card")),
      "question-up-btn": (t) => moveElementUp(t.closest(".question-card")),
      "question-down-btn": (t) => moveElementDown(t.closest(".question-card")),
      "add-option-btn": (t) => addNewOption(t.closest(".options-container")),
      "section-up-btn": (t) => moveElementUp(t.closest(".section-card")),
      "section-down-btn": (t) => moveElementDown(t.closest(".section-card")),
      "delete-option-btn": (t) =>
        deleteElement(t.closest(".option-item"), "选项", {
          min: 1,
          parentSelector: ".option-items",
        }),
      "delete-question-btn": (t) =>
        deleteElement(t.closest(".question-card"), "问题"),
      "delete-section-btn": (t) =>
        deleteElement(t.closest(".section-card"), "分区", { min: 1 }),
    };

    for (const className in actionMap) {
      if (target.matches(`.${className}`)) {
        actionMap[className](target);
        break;
      }
    }
  }

  function handlePreviewInteraction(e) {
    if (e.target.matches('input[type="radio"]')) {
      const radio = e.target;
      const otherOptionContainer = radio
        .closest(".preview-question")
        .querySelector(".preview-other-option");

      if (otherOptionContainer) {
        const otherInput = otherOptionContainer.querySelector(
          ".preview-other-input"
        );
        if (radio.value === "__other") {
          otherInput.classList.remove("hidden");
          otherInput.focus();
        } else {
          otherInput.classList.add("hidden");
          otherInput.value = "";
        }
      }
    }
  }

  // ENHANCEMENT: Add simple validation feedback
  function validateInput(input) {
    if (input.matches(".question-text, .option-label")) {
      input.classList.toggle("border-red-500", !input.value.trim());
    }
  }

  function toggleQuestionOptions(selectElement) {
    const questionCard = selectElement.closest(".question-card");
    const optionsContainer = questionCard.querySelector(".options-container");
    const otherOptionContainer = questionCard.querySelector(
      ".other-option-container"
    );
    const rangeOptionsContainer = questionCard.querySelector(
      ".range-options-container"
    );
    const selectedType = selectElement.value;

    const isChoice = selectedType === "radio" || selectedType === "select";
    const isRange = selectedType === "range";

    optionsContainer.classList.toggle("hidden", !isChoice);
    otherOptionContainer.classList.toggle("hidden", !isChoice);
    rangeOptionsContainer.classList.toggle("hidden", !isRange);
  }

  function addNewSection(notify = true) {
    const newSection = document.createElement("div");
    newSection.className =
      "section-card bg-white p-6 rounded-xl shadow-md fade-in";
    newSection.innerHTML = getSectionHtml(`新分区 ${++sectionCounter}`);
    sectionsContainer.appendChild(newSection);
    updateMoveButtons(sectionsContainer, ".section-card");
    renderPreview();
    if (notify) showNotification("分区已添加");
    newSection.querySelector(".section-title").focus();
  }

  function addNewQuestion(sectionCard) {
    const questionsContainer = sectionCard.querySelector(
      ".questions-container"
    );
    const newQuestion = document.createElement("div");
    newQuestion.className =
      "question-card border border-gray-200 rounded-lg p-4 relative fade-in";
    newQuestion.innerHTML = getQuestionHtml({
      id: generateId("q"),
      text: "", // Start with empty text for user to fill
      type: "text",
      options: [{ label: "选项1", value: "1" }],
    });
    questionsContainer.appendChild(newQuestion);
    updateMoveButtons(questionsContainer, ".question-card");
    renderPreview();
    showNotification("问题已添加");
    newQuestion.querySelector(".question-text").focus();
  }

  function addNewOption(optionsContainer) {
    const optionItems = optionsContainer.querySelector(".option-items");
    const newOptionData = { label: "", value: generateId("opt") };

    // ENHANCEMENT: Use insertAdjacentHTML for cleaner DOM insertion
    optionItems.insertAdjacentHTML("beforeend", getOptionHtml(newOptionData));
    const newOptionElement = optionItems.lastElementChild;
    newOptionElement.classList.add("fade-in");

    renderPreview();
    const newLabelInput = newOptionElement.querySelector(".option-label");
    if (newLabelInput) {
      newLabelInput.focus();
    }
  }

  // ENHANCEMENT: A generic, robust delete function with animations and focus management
  function deleteElement(element, name, options = {}) {
    const { min = 0, parentSelector } = options;
    const parent = parentSelector
      ? element.closest(parentSelector)
      : element.parentElement;

    if (min > 0 && parent.children.length <= min) {
      showNotification(`至少保留 ${min} 个${name}`, "error");
      return;
    }

    const nextFocusTarget =
      element.nextElementSibling || element.previousElementSibling || parent;

    element.style.transition = "opacity 0.3s, transform 0.3s, max-height 0.3s";
    element.style.maxHeight = `${element.offsetHeight}px`;
    element.classList.add("opacity-0", "transform", "-translate-x-4");
    setTimeout(() => {
      element.style.maxHeight = "0px";
      element.style.padding = "0";
      element.style.margin = "0";
    }, 0);

    setTimeout(() => {
      element.remove();
      const containerSelector =
        parent.id === "sections-container" ? ".section-card" : ".question-card";
      updateMoveButtons(parent, containerSelector);
      renderPreview();
      showNotification(`${name}已删除`);
      if (nextFocusTarget) nextFocusTarget.focus();
    }, 300);
  }

  function moveElementUp(element) {
    if (element.previousElementSibling) {
      const parent = element.parentElement;
      parent.insertBefore(element, element.previousElementSibling);
      updateMoveButtons(
        parent,
        element.matches(".question-card") ? ".question-card" : ".section-card"
      );
      renderPreview();
    }
  }

  function moveElementDown(element) {
    if (element.nextElementSibling) {
      const parent = element.parentElement;
      parent.insertBefore(element.nextElementSibling, element);
      updateMoveButtons(
        parent,
        element.matches(".question-card") ? ".question-card" : ".section-card"
      );
      renderPreview();
    }
  }

  function updateMoveButtons(container, selector) {
    const items = container.querySelectorAll(selector);
    items.forEach((item, index) => {
      const upBtn = item.querySelector(
        selector.includes("question") ? ".question-up-btn" : ".section-up-btn"
      );
      const downBtn = item.querySelector(
        selector.includes("question")
          ? ".question-down-btn"
          : ".section-down-btn"
      );
      if (upBtn) upBtn.disabled = index === 0;
      if (downBtn) downBtn.disabled = index === items.length - 1;
    });
  }

  // --- HTML 模板 ---
  function getSectionHtml(title) {
    return `
            <div class="section-header flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                <input type="text" class="section-title text-xl font-bold w-full border-none focus:ring-0 p-1" value="${title}">
                <div class="flex gap-1">
                    <button class="section-up-btn p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move section up"><i class="fa fa-chevron-up" aria-hidden="true"></i></button>
                    <button class="section-down-btn p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move section down"><i class="fa fa-chevron-down" aria-hidden="true"></i></button>
                    <button class="delete-section-btn p-2 text-gray-400 hover:text-red-500" aria-label="Delete section"><i class="fa fa-trash" aria-hidden="true"></i></button>
                </div>
            </div>
            <div class="questions-container space-y-4"></div>
            <button class="add-question-btn w-full mt-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
                <i class="fa fa-plus-circle" aria-hidden="true"></i> 添加问题
            </button>`;
  }
  function getQuestionHtml(q) {
    const isChoice = q.type === "radio" || q.type === "select";
    const isRange = q.type === "range";
    return `
            <div class="absolute top-2 right-2 flex gap-1">
                <button class="question-up-btn p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move question up"><i class="fa fa-chevron-up" aria-hidden="true"></i></button>
                <button class="question-down-btn p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Move question down"><i class="fa fa-chevron-down" aria-hidden="true"></i></button>
                <button class="delete-question-btn p-1.5 text-gray-400 hover:text-red-500" aria-label="Delete question"><i class="fa fa-trash" aria-hidden="true"></i></button>
            </div>
            <div class="space-y-3">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><label class="block text-xs font-medium text-gray-500 mb-1">问题文本</label><input type="text" class="question-text w-full form-input" value="${
                      q.text
                    }" placeholder="请输入问题文本"></div>
                    <div><label class="block text-xs font-medium text-gray-500 mb-1">问题 ID</label><input type="text" class="question-id w-full form-input" value="${
                      q.id
                    }"></div>
                </div>
                <div><label class="block text-xs font-medium text-gray-500 mb-1">问题类型</label>
                    <select class="question-type w-full form-select">
                        <option value="text" ${
                          q.type === "text" ? "selected" : ""
                        }>文本输入</option>
                        <option value="textarea" ${
                          q.type === "textarea" ? "selected" : ""
                        }>多行文本</option>
                        <option value="radio" ${
                          q.type === "radio" ? "selected" : ""
                        }>单选题</option>
                        <option value="select" ${
                          q.type === "select" ? "selected" : ""
                        }>下拉选择</option>
                        <option value="color" ${
                          q.type === "color" ? "selected" : ""
                        }>颜色选择</option>
                        <option value="range" ${
                          q.type === "range" ? "selected" : ""
                        }>范围滑块</option>
                    </select>
                </div>
                <div class="options-container ${isChoice ? "" : "hidden"}">
                    <label class="block text-xs font-medium text-gray-500 mb-1">选项设置</label>
                    <div class="option-items space-y-2 mb-2">${(q.options || [])
                      .map(getOptionHtml)
                      .join("")}</div>
                    <button class="add-option-btn text-sm text-primary hover:underline">+ 添加选项</button>
                </div>
                <div class="other-option-container ${isChoice ? "" : "hidden"}">
                    <label class="flex items-center"><input type="checkbox" class="has-other-option form-checkbox" ${
                      q.hasOther ? "checked" : ""
                    }><span class="ml-2 text-sm text-gray-700">允许"其他"选项</span></label>
                </div>
                <div class="range-options-container ${isRange ? "" : "hidden"}">
                     <div class="grid grid-cols-2 gap-4">
                        <div><label class="block text-xs font-medium text-gray-500 mb-1">左侧文本</label><input type="text" class="range-left w-full form-input" value="${
                          q.rangeLeft || "低"
                        }"></div>
                        <div><label class="block text-xs font-medium text-gray-500 mb-1">右侧文本</label><input type="text" class="range-right w-full form-input" value="${
                          q.rangeRight || "高"
                        }"></div>
                    </div>
                </div>
            </div>`;
  }
  function getOptionHtml(opt) {
    return `
            <div class="option-item flex items-start gap-2">
                <div class="flex-grow"><input type="text" class="option-label w-full form-input" placeholder="显示文本 (Label)" value="${opt.label}"></div>
                <div class="flex-grow"><input type="text" class="option-value w-full form-input" placeholder="数据值 (Value)" value="${opt.value}"></div>
                <button class="delete-option-btn p-2 text-gray-400 hover:text-red-500 mt-1" aria-label="Delete option"><i class="fa fa-times" aria-hidden="true"></i></button>
            </div>`;
  }

  // --- 导入/导出 ---
  function handleImportRequest(e) {
    e.preventDefault();
    const format = e.target.dataset.format;
    if (!format) return;
    fileInput.accept =
      { json: ".json", excel: ".xlsx,.xls", csv: ".csv", txt: ".txt" }[
        format
      ] || "*";
    fileInput.click();
  }
  function handleExportRequest(e) {
    e.preventDefault();
    const format = e.target.dataset.format;
    if (!format) return;
    const surveyData = buildDataFromDom();
    if (surveyData.length === 0) {
      showNotification("没有可导出的数据", "error");
      return;
    }
    const exportActions = {
      json: () => exportToJson(surveyData),
      excel: () => exportToExcelOrCsv(surveyData, "xlsx"),
      csv: () => exportToExcelOrCsv(surveyData, "csv"),
      txt: () => exportToTxt(surveyData),
    };
    if (exportActions[format]) exportActions[format]();
  }
  function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const extension = file.name.split(".").pop().toLowerCase();
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let surveyData;
        const result = event.target.result;
        if (extension === "json") surveyData = JSON.parse(result);
        else if (["xlsx", "xls", "csv"].includes(extension))
          surveyData = parseExcelOrCsv(result);
        else if (extension === "txt") surveyData = parseTxt(result);
        else throw new Error("不支持的文件格式");
        if (!Array.isArray(surveyData) || surveyData.length === 0)
          throw new Error("文件内容为空或格式不正确");
        buildDomFromData(surveyData);
        showNotification(`成功导入 ${file.name}`);
      } catch (error) {
        showNotification(`导入失败: ${error.message}`, "error");
        console.error("Import error:", error);
      } finally {
        fileInput.value = "";
      }
    };
    if (["xlsx", "xls", "csv"].includes(extension))
      reader.readAsArrayBuffer(file);
    else reader.readAsText(file, "UTF-8");
  }

  function buildDataFromDom() {
    const sections = [];
    document.querySelectorAll(".section-card").forEach((sectionEl) => {
      const questions = [];
      sectionEl.querySelectorAll(".question-card").forEach((qEl) => {
        const text = qEl.querySelector(".question-text").value.trim();
        // ENHANCEMENT: Skip empty questions
        if (!text) return;

        const type = qEl.querySelector(".question-type").value;
        const questionData = {
          id: qEl.querySelector(".question-id").value,
          text: text,
          type: type,
        };
        if (type === "radio" || type === "select") {
          questionData.options = [];
          qEl.querySelectorAll(".option-item").forEach((optEl) => {
            const label = optEl.querySelector(".option-label").value.trim();
            const value = optEl.querySelector(".option-value").value.trim();
            if (label && value) questionData.options.push({ label, value });
          });
          questionData.hasOther =
            qEl.querySelector(".has-other-option").checked;
        } else if (type === "range") {
          questionData.rangeLeft = qEl.querySelector(".range-left").value;
          questionData.rangeRight = qEl.querySelector(".range-right").value;
        }
        questions.push(questionData);
      });

      const legend = sectionEl.querySelector(".section-title").value.trim();
      if (legend && questions.length > 0) {
        sections.push({ legend, questions });
      }
    });
    return sections;
  }
  function buildDomFromData(surveyData) {
    sectionsContainer.innerHTML = "";
    sectionCounter = 0;
    surveyData.forEach((sectionData) => {
      const newSection = document.createElement("div");
      newSection.className = "section-card bg-white p-6 rounded-xl shadow-md";
      newSection.innerHTML = getSectionHtml(
        sectionData.legend || `新分区 ${++sectionCounter}`
      );
      const questionsContainer = newSection.querySelector(
        ".questions-container"
      );
      (sectionData.questions || []).forEach((qData) => {
        const newQuestion = document.createElement("div");
        newQuestion.className =
          "question-card border border-gray-200 rounded-lg p-4 relative";
        newQuestion.innerHTML = getQuestionHtml(qData);
        questionsContainer.appendChild(newQuestion);
      });
      sectionsContainer.appendChild(newSection);
      updateMoveButtons(questionsContainer, ".question-card");
    });
    updateMoveButtons(sectionsContainer, ".section-card");
    renderPreview();
  }
  function exportToJson(data) {
    downloadFile(
      "questions.json",
      JSON.stringify(data, null, 2),
      "application/json"
    );
  }
  function exportToExcelOrCsv(data, format) {
    const flatData = data.flatMap((section) =>
      section.questions.map((q) => ({
        Section: section.legend,
        ID: q.id,
        Question: q.text,
        Type: q.type,
        Options: (q.options || [])
          .map((opt) => `${opt.label}|${opt.value}`)
          .join(";"),
        HasOther: q.hasOther ? "TRUE" : "FALSE",
        RangeLeft: q.rangeLeft || "",
        RangeRight: q.rangeRight || "",
      }))
    );
    const worksheet = XLSX.utils.json_to_sheet(flatData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
    XLSX.writeFile(workbook, `questions.${format}`);
    showNotification(`已导出为 ${format.toUpperCase()} 文件`);
  }

  // ENHANCEMENT: More robust TXT parser
  function parseTxt(text) {
    const sections = [];
    let currentSection = null;
    let currentQuestion = null;

    text.split("\n").forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("# 分区:")) {
        const legend = trimmedLine.substring(6).trim();
        if (legend) {
          currentSection = { legend, questions: [] };
          sections.push(currentSection);
          currentQuestion = null;
        }
      } else if (currentSection && trimmedLine.startsWith("## id:")) {
        const id = trimmedLine.substring(6).trim();
        if (id) {
          currentQuestion = { id, options: [] };
          currentSection.questions.push(currentQuestion);
        }
      } else if (currentQuestion && trimmedLine.startsWith("- (")) {
        const match = trimmedLine.match(/-\s\((.*?)\)\s(.*)/);
        if (match && match[1] && match[2]) {
          currentQuestion.type = match[1].trim();
          currentQuestion.text = match[2].trim();
        }
      } else if (currentQuestion && trimmedLine.startsWith("*")) {
        if (trimmedLine === "* (other)") {
          currentQuestion.hasOther = true;
        } else {
          const match = trimmedLine.match(/\*\s(.*?)\s\[value:\s(.*?)\]/);
          if (match && match[1] && match[2])
            currentQuestion.options.push({
              label: match[1].trim(),
              value: match[2].trim(),
            });
        }
      }
    });
    return sections;
  }
  function exportToTxt(data) {
    let content = "";
    data.forEach((section) => {
      content += `# 分区: ${section.legend}\n\n`;
      section.questions.forEach((q) => {
        content += `## id: ${q.id}\n- (${q.type}) ${q.text}\n`;
        if (q.options)
          q.options.forEach((opt) => {
            content += `  * ${opt.label} [value: ${opt.value}]\n`;
          });
        if (q.hasOther) content += `  * (other)\n`;
        if (q.type === "range")
          content += `  - 左: ${q.rangeLeft}\n  - 右: ${q.rangeRight}\n`;
        content += "\n";
      });
    });
    downloadFile("questions.txt", content, "text/plain");
  }

  // --- 预览与通知 ---
  function renderPreview() {
    previewContent.innerHTML = "";
    const surveyData = buildDataFromDom();
    if (surveyData.length === 0) {
      previewContent.innerHTML = `<div class="text-center py-12 text-gray-500"><i class="fa fa-file-text-o text-4xl mb-3" aria-hidden="true"></i><p>问卷为空，请在左侧添加内容</p></div>`;
      return;
    }
    surveyData.forEach((section) => {
      const sectionDiv = document.createElement("div");
      sectionDiv.className = "mb-8";
      sectionDiv.innerHTML = `<h3 class="text-xl font-semibold border-b pb-2 mb-4">${section.legend}</h3>`;
      section.questions.forEach((q, index) => {
        const qDiv = document.createElement("div");
        qDiv.className = "preview-question mb-6";
        let content = `<p class="font-medium mb-2">${index + 1}. ${
          q.text || "(无问题文本)"
        }</p>`;
        switch (q.type) {
          case "text":
            content += `<input type="text" class="w-full form-input">`;
            break;
          case "textarea":
            content += `<textarea class="w-full form-textarea" rows="3"></textarea>`;
            break;
          case "radio":
            content += (q.options || [])
              .map(
                (opt, i) =>
                  `<div class="flex items-center mb-1"><input type="radio" name="${
                    q.id
                  }" id="${q.id}-${i}" value="${opt.value}"><label for="${
                    q.id
                  }-${i}" class="ml-2 cursor-pointer">${
                    opt.label || "(无选项文本)"
                  }</label></div>`
              )
              .join("");
            if (q.hasOther)
              content += `<div class="preview-other-option flex items-center mb-1"><input type="radio" name="${q.id}" id="${q.id}-other" value="__other"><label for="${q.id}-other" class="ml-2 cursor-pointer">其他</label><input type="text" class="preview-other-input ml-2 form-input hidden" placeholder="请说明"></div>`;
            break;
          case "select":
            content += `<select class="w-full form-select"><option>请选择...</option>${(
              q.options || []
            )
              .map(
                (opt) =>
                  `<option value="${opt.value}">${
                    opt.label || "(无选项文本)"
                  }</option>`
              )
              .join("")}${
              q.hasOther ? '<option value="__other">其他</option>' : ""
            }</select>`;
            break;
          case "range":
            content += `<div class="flex items-center gap-4"><span class="text-sm">${q.rangeLeft}</span><input type="range" class="w-full"><span class="text-sm">${q.rangeRight}</span></div>`;
            break;
          case "color":
            content += `<input type="color" value="#e5e7eb">`;
            break;
        }
        qDiv.innerHTML = content;
        sectionDiv.appendChild(qDiv);
      });
      previewContent.appendChild(sectionDiv);
    });
  }
  function togglePreviewMode() {
    isPreviewMode = !isPreviewMode;
    const mainGrid = document.querySelector("main .grid");
    if (isPreviewMode) {
      editorSection.classList.add("hidden");
      mainGrid.classList.remove("lg:grid-cols-2");
      mainGrid.classList.add("grid-cols-1");
      previewToggle.innerHTML =
        '<i class="fa fa-edit text-gray-600" aria-hidden="true"></i> 返回编辑';
    } else {
      editorSection.classList.remove("hidden");
      mainGrid.classList.add("lg:grid-cols-2");
      mainGrid.classList.remove("grid-cols-1");
      previewToggle.innerHTML =
        '<i class="fa fa-eye text-gray-600" aria-hidden="true"></i> 预览';
    }
    showNotification(`已切换到${isPreviewMode ? "预览" : "编辑"}模式`);
  }
  function showNotification(message, type = "success") {
    notificationText.textContent = message;
    const isError = type === "error";
    notificationIcon.className = isError
      ? "fa fa-exclamation-circle text-red-500"
      : "fa fa-check-circle text-green-500";
    notification.classList.remove("bg-gray-900", "bg-red-100");
    notification.classList.add(
      isError ? "bg-red-100 text-red-800" : "bg-gray-900 text-white"
    );
    // ENHANCEMENT: Accessibility for screen readers
    notification.setAttribute("role", isError ? "alert" : "status");

    notification.classList.remove("translate-y-24", "opacity-0");
    notification.classList.add("translate-y-0", "opacity-100");
    setTimeout(() => {
      notification.classList.remove("translate-y-0", "opacity-100");
      notification.classList.add("translate-y-24", "opacity-0");
    }, 3000);
  }
  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification(`${filename} 已导出`);
  }

  init();
});
