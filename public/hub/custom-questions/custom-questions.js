// public/hub/custom-questions/custom-questions.js
document.addEventListener("DOMContentLoaded", () => {
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

  let isPreviewMode = false;
  let sectionCounter = 0;
  let questionCounter = 0;

  function debounce(func, delay = 300) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  const generateId = (prefix) => `${prefix}_${Date.now()}_${++questionCounter}`;

  function init() {
    bindEventListeners();
    if (sectionsContainer.children.length === 0) {
      addNewSection(false);
    }
    renderPreview();
  }

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

  function createButton(classes, label, iconClass) {
    const button = document.createElement("button");
    button.className = classes;
    button.setAttribute("aria-label", label);
    const icon = document.createElement("i");
    icon.className = iconClass;
    icon.setAttribute("aria-hidden", "true");
    button.appendChild(icon);
    return button;
  }

  function createInput(label, classes, value, placeholder) {
    const div = document.createElement("div");
    const labelEl = document.createElement("label");
    labelEl.className = "block text-xs font-medium text-gray-500 mb-1";
    labelEl.textContent = label;
    div.appendChild(labelEl);
    const inputEl = document.createElement("input");
    inputEl.type = "text";
    inputEl.className = classes;
    inputEl.value = value;
    if (placeholder) inputEl.placeholder = placeholder;
    div.appendChild(inputEl);
    return div;
  }

  function createSelect(label, classes, options, selectedValue) {
    const div = document.createElement("div");
    const labelEl = document.createElement("label");
    labelEl.className = "block text-xs font-medium text-gray-500 mb-1";
    labelEl.textContent = label;
    div.appendChild(labelEl);
    const selectEl = document.createElement("select");
    selectEl.className = classes;
    options.forEach((opt) => {
      const optionEl = document.createElement("option");
      optionEl.value = opt.value;
      optionEl.textContent = opt.label;
      if (opt.value === selectedValue) optionEl.selected = true;
      selectEl.appendChild(optionEl);
    });
    div.appendChild(selectEl);
    return div;
  }

  function getSectionHtml(title) {
    const sectionDiv = document.createElement("div");
    sectionDiv.className =
      "section-card bg-white p-6 rounded-xl shadow-md fade-in";
    const headerDiv = document.createElement("div");
    headerDiv.className =
      "section-header flex justify-between items-center mb-4 pb-3 border-b border-gray-200";
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.className =
      "section-title text-xl font-bold w-full border-none focus:ring-0 p-1";
    titleInput.value = title;
    headerDiv.appendChild(titleInput);
    const buttonsDiv = document.createElement("div");
    buttonsDiv.className = "flex gap-1";
    buttonsDiv.appendChild(
      createButton(
        "section-up-btn p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30",
        "Move section up",
        "fa fa-chevron-up"
      )
    );
    buttonsDiv.appendChild(
      createButton(
        "section-down-btn p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30",
        "Move section down",
        "fa fa-chevron-down"
      )
    );
    buttonsDiv.appendChild(
      createButton(
        "delete-section-btn p-2 text-gray-400 hover:text-red-500",
        "Delete section",
        "fa fa-trash"
      )
    );
    headerDiv.appendChild(buttonsDiv);
    sectionDiv.appendChild(headerDiv);
    const questionsContainer = document.createElement("div");
    questionsContainer.className = "questions-container space-y-4";
    sectionDiv.appendChild(questionsContainer);
    const addQuestionBtn = document.createElement("button");
    addQuestionBtn.className =
      "add-question-btn w-full mt-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2";
    addQuestionBtn.innerHTML =
      '<i class="fa fa-plus-circle" aria-hidden="true"></i> 添加问题';
    sectionDiv.appendChild(addQuestionBtn);
    return sectionDiv;
  }

  function getQuestionHtml(q) {
    const questionCard = document.createElement("div");
    questionCard.className =
      "question-card border border-gray-200 rounded-lg p-4 relative fade-in";
    const buttonsDiv = document.createElement("div");
    buttonsDiv.className = "absolute top-2 right-2 flex gap-1";
    buttonsDiv.appendChild(
      createButton(
        "question-up-btn p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30",
        "Move question up",
        "fa fa-chevron-up"
      )
    );
    buttonsDiv.appendChild(
      createButton(
        "question-down-btn p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30",
        "Move question down",
        "fa fa-chevron-down"
      )
    );
    buttonsDiv.appendChild(
      createButton(
        "delete-question-btn p-1.5 text-gray-400 hover:text-red-500",
        "Delete question",
        "fa fa-trash"
      )
    );
    questionCard.appendChild(buttonsDiv);
    const contentDiv = document.createElement("div");
    contentDiv.className = "space-y-3";
    const gridDiv = document.createElement("div");
    gridDiv.className = "grid grid-cols-1 md:grid-cols-2 gap-3";
    gridDiv.appendChild(
      createInput(
        "问题文本",
        "question-text w-full form-input",
        q.text,
        "请输入问题文本"
      )
    );
    gridDiv.appendChild(
      createInput("问题 ID", "question-id w-full form-input", q.id, "")
    );
    contentDiv.appendChild(gridDiv);
    const questionTypes = [
      { value: "text", label: "文本输入" },
      { value: "textarea", label: "多行文本" },
      { value: "radio", label: "单选题" },
      { value: "select", label: "下拉选择" },
      { value: "color", label: "颜色选择" },
      { value: "range", label: "范围滑块" },
    ];
    contentDiv.appendChild(
      createSelect(
        "问题类型",
        "question-type w-full form-select",
        questionTypes,
        q.type
      )
    );
    const isChoice = q.type === "radio" || q.type === "select";
    const isRange = q.type === "range";
    const optionsContainer = document.createElement("div");
    optionsContainer.className = `options-container ${
      isChoice ? "" : "hidden"
    }`;
    const optionsLabel = document.createElement("label");
    optionsLabel.className = "block text-xs font-medium text-gray-500 mb-1";
    optionsLabel.textContent = "选项设置";
    optionsContainer.appendChild(optionsLabel);
    const optionItems = document.createElement("div");
    optionItems.className = "option-items space-y-2 mb-2";
    (q.options || []).forEach((optData) =>
      optionItems.appendChild(getOptionHtml(optData))
    );
    optionsContainer.appendChild(optionItems);
    const addOptionBtn = document.createElement("button");
    addOptionBtn.className =
      "add-option-btn text-sm text-primary hover:underline";
    addOptionBtn.textContent = "+ 添加选项";
    optionsContainer.appendChild(addOptionBtn);
    contentDiv.appendChild(optionsContainer);
    const otherContainer = document.createElement("div");
    otherContainer.className = `other-option-container ${
      isChoice ? "" : "hidden"
    }`;
    otherContainer.innerHTML = `<label class="flex items-center"><input type="checkbox" class="has-other-option form-checkbox" ${
      q.hasOther ? "checked" : ""
    }><span class="ml-2 text-sm text-gray-700">允许"其他"选项</span></label>`;
    contentDiv.appendChild(otherContainer);
    const rangeContainer = document.createElement("div");
    rangeContainer.className = `range-options-container ${
      isRange ? "" : "hidden"
    }`;
    const rangeGrid = document.createElement("div");
    rangeGrid.className = "grid grid-cols-2 gap-4";
    rangeGrid.appendChild(
      createInput(
        "左侧文本",
        "range-left w-full form-input",
        q.rangeLeft || "低",
        ""
      )
    );
    rangeGrid.appendChild(
      createInput(
        "右侧文本",
        "range-right w-full form-input",
        q.rangeRight || "高",
        ""
      )
    );
    rangeContainer.appendChild(rangeGrid);
    contentDiv.appendChild(rangeContainer);
    questionCard.appendChild(contentDiv);
    return questionCard;
  }

  function getOptionHtml(opt) {
    const optionItem = document.createElement("div");
    optionItem.className = "option-item flex items-start gap-2";
    const labelDiv = document.createElement("div");
    labelDiv.className = "flex-grow";
    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.className = "option-label w-full form-input";
    labelInput.placeholder = "显示文本 (Label)";
    labelInput.value = opt.label;
    labelDiv.appendChild(labelInput);
    optionItem.appendChild(labelDiv);
    const valueDiv = document.createElement("div");
    valueDiv.className = "flex-grow";
    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.className = "option-value w-full form-input";
    valueInput.placeholder = "数据值 (Value)";
    valueInput.value = opt.value;
    valueDiv.appendChild(valueInput);
    optionItem.appendChild(valueDiv);
    optionItem.appendChild(
      createButton(
        "delete-option-btn p-2 text-gray-400 hover:text-red-500 mt-1",
        "Delete option",
        "fa fa-times"
      )
    );
    return optionItem;
  }

  function addNewSection(notify = true) {
    const newSection = getSectionHtml(`新分区 ${++sectionCounter}`);
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
    const newQuestion = getQuestionHtml({
      id: generateId("q"),
      text: "",
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
    const newOptionElement = getOptionHtml(newOptionData);
    optionItems.appendChild(newOptionElement);
    newOptionElement.classList.add("fade-in");
    renderPreview();
    const newLabelInput = newOptionElement.querySelector(".option-label");
    if (newLabelInput) newLabelInput.focus();
  }

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
    sectionsContainer.textContent = "";
    sectionCounter = 0;
    surveyData.forEach((sectionData) => {
      const newSection = getSectionHtml(
        sectionData.legend || `新分区 ${++sectionCounter}`
      );
      const questionsContainer = newSection.querySelector(
        ".questions-container"
      );
      questionsContainer.textContent = "";
      (sectionData.questions || []).forEach((qData) => {
        const newQuestion = getQuestionHtml(qData);
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

  function renderPreview() {
    previewContent.textContent = "";
    const surveyData = buildDataFromDom();
    if (surveyData.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "text-center py-12 text-gray-500";
      emptyDiv.innerHTML = `<i class="fa fa-file-text-o text-4xl mb-3" aria-hidden="true"></i><p>问卷为空，请在左侧添加内容</p>`;
      previewContent.appendChild(emptyDiv);
      return;
    }

    surveyData.forEach((section) => {
      const sectionDiv = document.createElement("div");
      sectionDiv.className = "mb-8";
      const titleH3 = document.createElement("h3");
      titleH3.className = "text-xl font-semibold border-b pb-2 mb-4";
      titleH3.textContent = section.legend;
      sectionDiv.appendChild(titleH3);

      section.questions.forEach((q, index) => {
        const qDiv = document.createElement("div");
        qDiv.className = "preview-question mb-6";
        const qTextP = document.createElement("p");
        qTextP.className = "font-medium mb-2";
        qTextP.textContent = `${index + 1}. ${q.text || "(无问题文本)"}`;
        qDiv.appendChild(qTextP);
        let control;
        switch (q.type) {
          case "text":
            control = document.createElement("input");
            control.type = "text";
            control.className = "w-full form-input";
            break;
          case "textarea":
            control = document.createElement("textarea");
            control.className = "w-full form-textarea";
            control.rows = 3;
            break;
          case "radio":
            control = document.createElement("div");
            (q.options || []).forEach((opt, i) => {
              const radioDiv = document.createElement("div");
              radioDiv.className = "flex items-center mb-1";
              const input = document.createElement("input");
              input.type = "radio";
              input.name = q.id;
              input.id = `${q.id}-${i}`;
              input.value = opt.value;
              radioDiv.appendChild(input);
              const label = document.createElement("label");
              label.htmlFor = `${q.id}-${i}`;
              label.className = "ml-2 cursor-pointer";
              label.textContent = opt.label || "(无选项文本)";
              radioDiv.appendChild(label);
              control.appendChild(radioDiv);
            });
            if (q.hasOther) {
              const otherDiv = document.createElement("div");
              otherDiv.className =
                "preview-other-option flex items-center mb-1";
              otherDiv.innerHTML = `<input type="radio" name="${q.id}" id="${q.id}-other" value="__other"><label for="${q.id}-other" class="ml-2 cursor-pointer">其他</label><input type="text" class="preview-other-input ml-2 form-input hidden" placeholder="请说明">`;
              control.appendChild(otherDiv);
            }
            break;
          case "select":
            control = document.createElement("select");
            control.className = "w-full form-select";
            const defaultOpt = document.createElement("option");
            defaultOpt.textContent = "请选择...";
            control.appendChild(defaultOpt);
            (q.options || []).forEach((opt) => {
              const option = document.createElement("option");
              option.value = opt.value;
              option.textContent = opt.label || "(无选项文本)";
              control.appendChild(option);
            });
            if (q.hasOther) {
              const otherOpt = document.createElement("option");
              otherOpt.value = "__other";
              otherOpt.textContent = "其他";
              control.appendChild(otherOpt);
            }
            break;
          case "range":
            control = document.createElement("div");
            control.className = "flex items-center gap-4";
            const leftSpan = document.createElement("span");
            leftSpan.className = "text-sm";
            leftSpan.textContent = q.rangeLeft;
            control.appendChild(leftSpan);
            const rangeInput = document.createElement("input");
            rangeInput.type = "range";
            rangeInput.className = "w-full";
            control.appendChild(rangeInput);
            const rightSpan = document.createElement("span");
            rightSpan.className = "text-sm";
            rightSpan.textContent = q.rangeRight;
            control.appendChild(rightSpan);
            break;
          case "color":
            control = document.createElement("input");
            control.type = "color";
            control.value = "#e5e7eb";
            break;
        }
        if (control) qDiv.appendChild(control);
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
