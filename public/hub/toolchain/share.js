document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const surveyId = params.get("id");
  const surveyTitle = params.get("title");

  const pageSurveyTitleElement = document.getElementById("survey-title");
  if (pageSurveyTitleElement) {
    pageSurveyTitleElement.textContent = surveyTitle
      ? `“${surveyTitle}”`
      : "您的问卷";
  }

  const linkInput = document.getElementById("share-link-input");
  const copyButton = document.getElementById("copy-link-btn"); // 获取复制按钮的引用
  const qrcodeDiv = document.getElementById("qrcode");

  // 构造分享链接
  const shareLink = `${window.location.origin}/hub/answer/answer.html?id=${surveyId}`;

  if (linkInput) {
    linkInput.value = shareLink;
  }

  // 生成二维码
  if (qrcodeDiv && surveyId) {
    new QRCode(qrcodeDiv, {
      text: shareLink,
      width: 160,
      height: 160,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });
  } else if (!surveyId) {
    if (qrcodeDiv)
      qrcodeDiv.innerHTML =
        '<p class="text-red-500 text-center text-sm mt-4">无法生成二维码：缺少问卷ID。</p>';
  }

  // 复制链接功能
  if (copyButton) {
    // 确保按钮存在才添加事件监听
    copyButton.addEventListener("click", (e) => {
      if (linkInput) {
        linkInput.select(); // 选中输入框中的文本

        navigator.clipboard
          .writeText(linkInput.value)
          .then(() => {
            const originalIconHtml = copyButton.innerHTML; // 直接从DOM获取原始HTML
            copyButton.innerHTML = '<i class="fa fa-check"></i> 已复制!'; // 显示成功提示

            setTimeout(() => {
              // 在设置回HTML前，再次检查元素是否还在DOM中，以防万一
              if (document.body.contains(copyButton)) {
                copyButton.innerHTML = originalIconHtml;
              }
            }, 1500);
          })
          .catch((err) => {
            console.error("复制到剪贴板失败:", err);
            alert("复制链接失败，请手动复制。");
          });
      }
    });
  } else {
    console.warn("Share page: 'copy-link-btn' element not found.");
  }

  const currentYearFooter = document.getElementById("current-year-footer");
  if (currentYearFooter) {
    currentYearFooter.textContent = new Date().getFullYear();
  }

  document
    .querySelectorAll("[data-animate]")
    .forEach((el) => el.classList.add("is-visible"));

  // 移动端菜单切换逻辑 (从您原有代码中提取)
  const menuToggle = document.getElementById("menu-toggle");
  // 使用更健壮的选择器或确保 mobile-menu 有一个ID
  const mobileMenu = document.getElementById("mobile-menu");
  if (menuToggle && mobileMenu) {
    const icon = menuToggle.querySelector("i");
    menuToggle.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
      if (icon) {
        icon.classList.toggle("fa-bars");
        icon.classList.toggle("fa-times");
      }
    });
  }
});
