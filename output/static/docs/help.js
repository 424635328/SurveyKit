// public/docs/help.js

document.addEventListener("DOMContentLoaded", () => {
    /**
     * 协调整个页面的动画流程。
     * 新逻辑：动画会随着元素的每次进入/离开视口而重复触发。
     */
    const initPageAnimations = () => {
        try {
            const animatedElements = document.querySelectorAll('.animated-line');

            if (!animatedElements.length) return;

            // 使用 Intersection Observer 触发每个元素的动画
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    // 检查元素是否进入了视口
                    if (entry.isIntersecting) {
                        // 当元素可见时，添加 'is-visible' 类来触发动画
                        entry.target.classList.add('is-visible');
                    } else {
                        // 当元素离开视口时，移除 'is-visible' 类来重置动画状态
                        // 这使得动画可以在下一次进入时重新播放
                        entry.target.classList.remove('is-visible');
                    }
                });
            }, { 
                threshold: 0.1, // 元素进入视口10%时触发
            });

            // 观察所有需要动画的元素
            animatedElements.forEach(element => {
                observer.observe(element);
            });

        } catch (error) {
            console.error("Help page animation failed to initialize:", error);
            // 动画失败时的回退逻辑：直接显示所有内容
            document.querySelectorAll('.animated-line').forEach(el => {
                el.classList.add('is-visible');
            });
        }
    };

    // 确保页面资源加载完成后再启动动画
    window.addEventListener('load', initPageAnimations);
});