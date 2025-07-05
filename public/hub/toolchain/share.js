// File: public/hub/toolchain/share.js
document.addEventListener("DOMContentLoaded", () => {
    // --- 辅助函数 ---
    const escapeHTML = (str) => str.replace(/[&<>"']/g, (match) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[match]);

    // --- DOM 元素获取 ---
    const pageSurveyTitleElement = document.getElementById("survey-title");
    const copyArea = document.getElementById("copy-area");
    const linkInput = document.getElementById("share-link-input");
    const copyFeedback = document.getElementById("copy-feedback");
    const qrcodeDisplayDiv = document.getElementById("qrcode-display");
    const downloadQrBtn = document.getElementById("download-qr-btn");
    const socialShareContainer = document.getElementById("social-share-buttons");
    const qrExportContainer = document.getElementById("qr-export-container");
    const qrExportTitle = document.getElementById("qr-export-title");
    const qrExportCodeDiv = document.getElementById("qr-export-code");

    // --- 初始化和数据处理 ---
    const params = new URLSearchParams(window.location.search);
    const surveyId = params.get("id");
    const surveyTitle = params.get("title") || "我的问卷";
    const shareLink = `${window.location.origin}/hub/answer/answer.html?id=${surveyId}`;
    const shareText = `我创建了一个问卷「${surveyTitle}」，快来参与吧！`;

    // --- 核心功能模块 ---
    const ShareModule = {
        isCopying: false,

        init() {
            this.updateTitles();
            this.setupShareLink();
            if (surveyId) {
                this.generateQRCodes();
                this.setupQRCodeDownload();
                this.setupSocialShare();
            } else {
                this.handleError();
            }
            this.setupAnimations();
        },

        updateTitles() {
            pageSurveyTitleElement.textContent = `“${escapeHTML(surveyTitle)}”`;
            document.title = `分享「${escapeHTML(surveyTitle)}」 - SurveyKit`;
        },

        setupShareLink() {
            linkInput.value = shareLink;
            copyArea.addEventListener("click", () => this.copyToClipboard());
        },
        
        copyToClipboard() {
            if (this.isCopying) return;
            this.isCopying = true;

            navigator.clipboard.writeText(shareLink).then(() => {
                copyFeedback.innerHTML = '<i class="fa fa-check"></i>';
                copyFeedback.classList.add("copied");

                setTimeout(() => {
                    copyFeedback.innerHTML = '<i class="fa fa-copy"></i>';
                    copyFeedback.classList.remove("copied");
                    this.isCopying = false;
                }, 2000);
            }).catch(err => {
                console.error("复制失败:", err);
                alert("复制链接失败，请手动复制。");
                this.isCopying = false;
            });
        },

        generateQRCodes() {
            // 生成用于页面显示的二维码
            new QRCode(qrcodeDisplayDiv, {
                text: shareLink,
                width: 176, height: 176,
                colorDark: "#1e293b", colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H,
            });

            // 生成用于下载的、更高分辨率的二维码
            new QRCode(qrExportCodeDiv, {
                text: shareLink,
                width: 256, height: 256,
                colorDark: "#1e293b", colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H,
            });
        },

        async setupQRCodeDownload() {
            downloadQrBtn.addEventListener("click", async () => {
                const btnText = downloadQrBtn.querySelector('.btn-text');
                const originalText = btnText.innerHTML;
                
                downloadQrBtn.disabled = true;
                btnText.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 生成中...';

                try {
                    // 准备用于截图的容器
                    qrExportTitle.textContent = surveyTitle;
                    
                    // 等待下一帧以确保DOM渲染完成
                    await new Promise(resolve => requestAnimationFrame(resolve));
                    
                    const canvas = await html2canvas(qrExportContainer, {
                        scale: 2, // 提高分辨率
                        backgroundColor: null, // 使用元素本身的背景色
                        useCORS: true,
                    });

                    const link = document.createElement("a");
                    link.download = `SurveyKit_Card_${surveyId}.png`;
                    link.href = canvas.toDataURL("image/png");
                    link.click();

                } catch (error) {
                    console.error("下载二维码卡片失败:", error);
                    alert("生成分享卡片失败，请稍后重试。");
                } finally {
                    downloadQrBtn.disabled = false;
                    btnText.innerHTML = originalText;
                }
            });
        },

        setupSocialShare() {
            const encodedLink = encodeURIComponent(shareLink);
            const encodedText = encodeURIComponent(shareText);
            
            const platforms = [
                { name: 'weibo', icon: 'fa-weibo', url: `http://service.weibo.com/share/share.php?url=${encodedLink}&title=${encodedText}` },
                { name: 'twitter', icon: 'fa-twitter', url: `https://twitter.com/intent/tweet?url=${encodedLink}&text=${encodedText}` },
                { name: 'telegram', icon: 'fa-telegram', url: `https://t.me/share/url?url=${encodedLink}&text=${encodedText}` },
                { name: 'wechat', icon: 'fa-wechat', url: '#', action: () => alert('请复制链接或下载分享卡片，在微信中打开并分享。') }
            ];

            platforms.forEach(p => {
                const btn = document.createElement("a");
                btn.href = p.url;
                btn.className = `social-btn ${p.name}`;
                btn.innerHTML = `<i class="fa ${p.icon}"></i>`;
                btn.target = "_blank";
                btn.rel = "noopener noreferrer";
                btn.setAttribute("aria-label", `分享到 ${p.name}`);

                if (p.action) {
                    btn.addEventListener("click", (e) => { e.preventDefault(); p.action(); });
                }
                socialShareContainer.appendChild(btn);
            });
        },

        handleError() {
            const errorMessage = "无效的问卷信息，请返回重试。";
            pageSurveyTitleElement.textContent = errorMessage;
            linkInput.value = "错误：缺少问卷ID";
            copyArea.style.cursor = "not-allowed";
            copyArea.onclick = null;
            downloadQrBtn.style.display = 'none';
        },

        setupAnimations() {
            document.querySelectorAll("[data-animate]").forEach((el) => {
                setTimeout(() => el.classList.add("is-visible"), parseFloat(el.dataset.delay || 0) * 1000);
            });
        }
    };

    ShareModule.init();
});