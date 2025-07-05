document.addEventListener("DOMContentLoaded", () => {
    const initTypewriter = (selector, initialDelay, charDelay) => {
        const elements = document.querySelectorAll(selector);
        const gradientClasses = ['gradient-1', 'gradient-2', 'gradient-3', 'gradient-4', 'gradient-5'];

        elements.forEach((element, elementIndex) => {
            const text = element.getAttribute('data-text');
            if (!text) return;

            // 1. 清空元素内容，为打字机效果做准备
            element.innerHTML = '';
            // 确保元素初始状态是隐藏的，让CSS处理 initial opacity: 0;
            // element.style.opacity = '0'; // 这一行是多余的，CSS已处理

            // 计算该元素开始动画的总延迟：
            // initialDelay (全局开始延迟) + elementIndex * 50 (同类元素错开延迟)
            const totalElementStartDelay = initialDelay + (elementIndex * 50);

            // 假设父元素的 CSS opacity 过渡时间是 300ms (0.3s)，我们可以在此基础上加一个缓冲
            const parentFadeInDuration = 300; // 对应 CSS 中 transition: opacity 0.3s ease;
            const bufferBeforeTyping = 50; // 在父元素淡入后，等待一小段时间再开始打字

            // 第一个 setTimeout：控制整个元素动画的开始时间
            setTimeout(() => {
                // 2. 使父容器可见。CSS 的 transition 会使它平滑淡入。
                element.style.opacity = '1';

                // 3. 嵌套的 setTimeout：在父容器淡入动画完成后，开始逐字打字
                setTimeout(() => {
                    const characters = Array.from(text);
                    characters.forEach((char, charIndex) => {
                        setTimeout(() => {
                            const span = document.createElement('span');
                            span.className = 'typewriter-char'; // 字符自身会从 opacity:0 动画
                            span.textContent = char;
                            
                            // 应用渐变文本效果，只对特定元素类型（如heading, title, subtitle）
                            if (char.trim() !== '') {
                                 const randomGradient = gradientClasses[Math.floor(Math.random() * gradientClasses.length)];
                                 if (element.classList.contains('section-heading') || 
                                     element.classList.contains('category-title') ||
                                     element.classList.contains('pili-card-subtitle')) {
                                    span.classList.add('gradient-text', randomGradient);
                                 }
                            }
                            element.appendChild(span);
                        }, charIndex * charDelay);
                    });
                }, parentFadeInDuration + bufferBeforeTyping); // 在父元素淡入结束后才开始逐字动画
            }, totalElementStartDelay); // 整个元素的初始延迟
        });
    };

    // 为每个需要打字机效果的元素类别调用函数
    initTypewriter('.section-heading', 100, 40);
    initTypewriter('.section-subheading', 400, 15);
    initTypewriter('.category-title', 600, 50);
    initTypewriter('.pili-card-subtitle', 800, 30);

    // 更新页脚年份
    const footerYear = document.getElementById('footer-year');
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }
});