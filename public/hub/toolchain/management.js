document.addEventListener("DOMContentLoaded", () => {
  function checkAuth() {
    const token = localStorage.getItem("surveyKitToken");
    if (!token) {
      window.location.href = `../login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      return null;
    }
    return token;
  }

  const token = checkAuth();
  if (!token) return;

  function initApp() {
    document.body.classList.add("aurora-background");
    initMobileMenu();
    initHeaderScrollEffect();
    initScrollAnimations();
    initScrollToTopButton();
    updateFooterYear();
    initManagementPage();
  }

  function initManagementPage() {
    const listContainer = document.getElementById("survey-list-container");
    const noSurveysMessage = document.getElementById("no-surveys-message");
    const uploadSurveyBtn = document.getElementById("upload-survey-btn");
    const fileInput = document.getElementById("file-input-hidden");
    const deleteModal = document.getElementById("delete-modal");

    // NEW: Import Survey Modal elements
    const importSurveyModal = document.getElementById("import-survey-modal");
    const importFileNameSpan = document.getElementById("import-file-name");
    const importSurveyTitleInput = document.getElementById(
      "import-survey-title-input"
    );
    const cancelImportBtn = document.getElementById("cancel-import-btn");
    const confirmImportBtn = document.getElementById("confirm-import-btn");

    // NEW: Toast Container
    const toastContainer = document.getElementById("toast-container");

    let surveyToDeleteId = null;
    let surveysCache = [];
    let currentImportFile = null; // 用于存储当前待导入的文件对象
    let currentFileContent = null; // 用于存储当前待导入文件的内容

    function createSurveyCard(survey) {
      const card = document.createElement("div");
      card.className = "survey-card";
      card.dataset.surveyId = survey.id;
      card.dataset.surveyTitle = escapeHtml(survey.title);
      const creationDate = new Date(survey.createdAt).toLocaleDateString(
        "zh-CN",
        { year: "numeric", month: "long", day: "numeric" }
      );

      card.innerHTML = `
                <div class="survey-header">
                    <div class="survey-info">
                        <h4>${escapeHtml(survey.title)}</h4>
                        <p>ID: ${survey.id}</p>
                    </div>
                    <div class="survey-stats">
                        <div class="stat-item">
                            <div class="count">${survey.submissionCount || 0}</div>
                            <div class="label">份回答</div>
                        </div>
                    </div>
                </div>
                <p class="text-xs text-slate-500">创建于: ${creationDate}</p>
                <div class="survey-actions">
                    <button class="action-btn distribute-btn"><i class="fa fa-share-alt"></i> 分享</button>
                    <a href="./results.html?id=${survey.id}" class="action-btn"><i class="fa fa-bar-chart"></i> 查看结果</a>
                    <button class="action-btn download-btn"><i class="fa fa-download"></i> 下载问卷</button>
                    <button class="action-btn delete-btn delete"><i class="fa fa-trash-o"></i> 删除</button>
                </div>
            `;
      return card;
    }

    function renderSurveyList(surveys) {
      surveysCache = surveys;
      const loadingState = listContainer.querySelector(".loading-state");
      if (loadingState) loadingState.remove();

      if (!surveys || surveys.length === 0) {
        noSurveysMessage.classList.remove("hidden");
        listContainer.innerHTML = "";
        listContainer.appendChild(noSurveysMessage);
        return;
      }
      noSurveysMessage.classList.add("hidden");
      surveys.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      listContainer.innerHTML = "";

      surveys.forEach((survey) => {
        const card = createSurveyCard(survey);
        listContainer.appendChild(card);
      });
      attachActionListeners();
    }

    function attachActionListeners() {
      document
        .querySelectorAll(".distribute-btn")
        .forEach((button) =>
          button.addEventListener("click", handleShareClick)
        );
      document
        .querySelectorAll(".delete-btn")
        .forEach((button) =>
          button.addEventListener("click", handleDeleteClick)
        );
      document
        .querySelectorAll(".download-btn")
        .forEach((button) =>
          button.addEventListener("click", handleDownloadClick)
        );
    }

    async function handleDownloadClick(event) {
      const button = event.currentTarget;
      const card = button.closest(".survey-card");
      const surveyId = card.dataset.surveyId;
      const surveyTitle = card.dataset.surveyTitle;

      const originalContent = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 下载中...';

      try {
        const response = await fetch(`/api/survey-details.mjs?id=${surveyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`获取问卷详情失败 (状态: ${response.status})`);
        }

        const surveyDetails = await response.json();

        const questionsData = surveyDetails.questions;
        if (!questionsData || !Array.isArray(questionsData)) {
          throw new Error("问卷数据格式不正确或无问题内容。");
        }

        const filename = `${surveyTitle.replace(/[\/\\?%*:|"<>]/g, "-") || "survey"}.json`;
        const jsonString = JSON.stringify(questionsData, null, 2);
        const blob = new Blob([jsonString], {
          type: "application/json;charset=utf-8",
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        showToast("问卷下载成功！", "success");
      } catch (error) {
        console.error("下载问卷失败:", error);
        showToast(`下载失败: ${error.message}`, "error");
      } finally {
        button.disabled = false;
        button.innerHTML = originalContent;
      }
    }

    function handleShareClick(event) {
      const card = event.target.closest(".survey-card");
      const surveyId = card.dataset.surveyId;
      const surveyTitle = card.dataset.surveyTitle;

      const sharePageUrl = `./share.html?id=${surveyId}&title=${encodeURIComponent(surveyTitle)}`;
      window.open(sharePageUrl, "_blank");
    }

    function handleDeleteClick(event) {
      surveyToDeleteId = event.target.closest(".survey-card").dataset.surveyId;
      const surveyTitle =
        event.target.closest(".survey-card").dataset.surveyTitle;
      document.getElementById("delete-survey-title").textContent =
        `“${surveyTitle}”`;
      deleteModal.hidden = false;
    }

    async function confirmDelete() {
      if (!surveyToDeleteId) return;
      try {
        const response = await fetch("/api/surveys.mjs", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ surveyId: surveyToDeleteId }),
        });
        if (!response.ok)
          throw new Error((await response.json()).message || "删除失败");

        const cardToDelete = document.querySelector(
          `.survey-card[data-survey-id="${surveyToDeleteId}"]`
        );
        if (cardToDelete) {
          cardToDelete.style.transition = "opacity 0.3s, transform 0.3s";
          cardToDelete.style.opacity = "0";
          cardToDelete.style.transform = "scale(0.95)";
          setTimeout(() => {
            cardToDelete.remove();
            surveysCache = surveysCache.filter(
              (s) => s.id !== surveyToDeleteId
            );
            if (surveysCache.length === 0) {
              noSurveysMessage.classList.remove("hidden");
            }
            showToast("问卷删除成功！", "success");
          }, 300);
        }
      } catch (error) {
        alert(`删除失败: ${error.message}`); // For delete, keep alert for critical action
        showToast(`删除失败: ${error.message}`, "error");
      } finally {
        deleteModal.hidden = true;
        surveyToDeleteId = null;
      }
    }

    // NEW: Unified Modal Setup
    function setupModals() {
      // Delete Modal
      deleteModal
        .querySelector(".modal-cancel-btn")
        .addEventListener("click", () => (deleteModal.hidden = true));
      deleteModal.addEventListener("click", (e) => {
        if (e.target === deleteModal) deleteModal.hidden = true;
      });
      document
        .getElementById("confirm-delete-btn")
        .addEventListener("click", confirmDelete);

      // Import Survey Modal
      cancelImportBtn.addEventListener(
        "click",
        () => (importSurveyModal.hidden = true)
      );
      importSurveyModal.addEventListener("click", (e) => {
        if (e.target === importSurveyModal) importSurveyModal.hidden = true;
      });
      confirmImportBtn.addEventListener("click", handleConfirmImport); // 确认导入按钮点击事件
    }

    async function fetchAndRenderSurveys() {
      try {
        const response = await fetch("/api/surveys.mjs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          localStorage.removeItem("surveyKitToken");
          checkAuth();
          return;
        }
        if (!response.ok) throw new Error("无法获取问卷列表");
        const surveys = await response.json();
        renderSurveyList(surveys);
      } catch (error) {
        const loadingState = listContainer.querySelector(".loading-state");
        if (loadingState)
          loadingState.textContent = `加载失败: ${error.message}`;
        showToast(`加载问卷列表失败: ${error.message}`, "error");
      }
    }

    // MODIFIED: handleFileUpload now opens the modal
    function handleFileUpload(file) {
      currentImportFile = file;
      const reader = new FileReader();
      reader.onload = (event) => {
        currentFileContent = event.target.result;
        // 预填充标题，去除 .json 后缀
        importSurveyTitleInput.value = file.name.replace(/\.json$/i, "");
        importFileNameSpan.textContent = file.name; // 显示文件名
        importSurveyModal.hidden = false; // 显示导入模态框
        importSurveyTitleInput.focus(); // 自动聚焦标题输入框
      };
      reader.readAsText(file);
    }

    // NEW: handleConfirmImport triggered by modal's confirm button
    async function handleConfirmImport() {
      const title = importSurveyTitleInput.value.trim();
      if (title === "") {
        showToast("问卷标题不能为空！", "warning");
        importSurveyTitleInput.focus();
        return;
      }

      if (!currentImportFile || !currentFileContent) {
        showToast("没有可导入的文件内容。", "error");
        importSurveyModal.hidden = true;
        return;
      }

      importSurveyModal.hidden = true; // 隐藏模态框
      uploadSurveyBtn.disabled = true;
      uploadSurveyBtn.innerHTML =
        '<i class="fa fa-spinner fa-spin mr-3"></i>正在上传...';
      showToast("正在导入问卷...", "info"); // 即时反馈

      try {
        const response = await fetch("/api/upload-survey.mjs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title,
            questionsJSON: currentFileContent,
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "上传失败");

        await fetchAndRenderSurveys(); // 重新渲染列表
        showToast("问卷导入成功！", "success");

        // 成功导入后，给新卡片一个高亮效果
        setTimeout(() => {
          const newCard = listContainer.querySelector(
            `[data-survey-id="${result.survey.id}"]`
          );
          if (newCard) {
            newCard.style.transition = "box-shadow 0.5s ease-out";
            newCard.style.boxShadow =
              "0 0 0 2px #a5b4fc, 0 10px 30px rgba(0,0,0,0.2)";
            setTimeout(() => {
              newCard.style.boxShadow = "";
            }, 2500);
          }
        }, 100);
      } catch (error) {
        console.error("导入问卷失败:", error);
        showToast(`导入失败: ${error.message}`, "error");
      } finally {
        uploadSurveyBtn.disabled = false;
        uploadSurveyBtn.innerHTML =
          '<i class="fa fa-upload mr-3"></i> 导入问卷';
        fileInput.value = ""; // 清空文件输入，以便下次可以再次选择相同文件
        currentImportFile = null;
        currentFileContent = null;
      }
    }

    function showToast(message, type = "info", duration = 3000) {
      const toast = document.createElement("div");
      toast.className = `toast-message toast-${type} opacity-0 translate-x-full transition-all duration-300 ease-out`;
      toast.textContent = message;

      toastContainer.appendChild(toast);

      // 强制浏览器重绘以应用初始状态
      void toast.offsetWidth;

      // 显示动画
      toast.classList.remove("opacity-0", "translate-x-full");
      toast.classList.add("opacity-100", "translate-x-0");

      setTimeout(() => {
        // 隐藏动画
        toast.classList.remove("opacity-100", "translate-x-0");
        toast.classList.add("opacity-0", "translate-x-full");
        setTimeout(() => toast.remove(), 300); // 动画结束后移除元素
      }, duration);
    }

    uploadSurveyBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) handleFileUpload(e.target.files[0]);
    });

    function escapeHtml(str) {
      if (!str) return "";
      return str.replace(/[&<>"']/g, function (match) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&apos;",
        }[match];
      });
    }

    setupModals();
    fetchAndRenderSurveys();
  }

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
