// public/status/error.js
document.addEventListener('DOMContentLoaded', () => {
    const errorContainer = document.querySelector('.error-container');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const reportBugBtn = document.getElementById('reportBugBtn');

    // 1. 页面加载动画
    // 给容器添加一个初始透明度为0，然后渐显的效果
    errorContainer.style.opacity = '0';
    errorContainer.style.transform = 'translateY(20px)';
    setTimeout(() => {
        errorContainer.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        errorContainer.style.opacity = '1';
        errorContainer.style.transform = 'translateY(0)';
    }, 100); // 延迟一小会儿开始动画

    // 2. 搜索功能（示例）
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            // 这里可以替换为你的网站搜索页面的URL
            // 例如: window.location.href = `/search?q=${encodeURIComponent(query)}`;
            alert(`正在搜索: "${query}"`);
            console.log(`Searching for: ${query}`);
            // 实际项目中，你会重定向到搜索结果页
            window.location.href = `/search?q=${encodeURIComponent(query)}`;
        } else {
            alert('请输入您想搜索的内容。');
        }
    });

    // 允许按回车键搜索
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchBtn.click();
        }
    });

    // 3. 报告问题按钮（示例）
    reportBugBtn.addEventListener('click', () => {
        // 在实际应用中，这里可能会弹出一个模态框，或者跳转到反馈页面
        const currentPage = window.location.href;
        alert(`感谢您的反馈！将报告当前页面的问题：\n${currentPage}\n（此功能需后端支持）`);
        console.log(`Bug reported for page: ${currentPage}`);
        // 实际操作可能是：
        window.location.href = `mailto:support@yourdomain.com?subject=页面问题反馈&body=问题页面：${encodeURIComponent(currentPage)}%0A请描述您遇到的问题：`;
    });

    // 4. 添加一些动态的背景元素（增加趣味性）
    const numShapes = 3; // 想要添加的背景图形数量
    for (let i = 0; i < numShapes; i++) {
        const shape = document.createElement('div');
        shape.classList.add('bg-shape');
        // 随机设置大小和位置
        const size = Math.random() * 150 + 100; // 100px - 250px
        shape.style.width = `${size}px`;
        shape.style.height = `${size}px`;
        shape.style.top = `${Math.random() * 100}%`;
        shape.style.left = `${Math.random() * 100}%`;
        // 随机设置动画延迟
        shape.style.animationDelay = `${Math.random() * 5}s`;
        // 随机设置颜色 (可选, 已经在CSS中nth-child设定)
        const colors = ['rgba(0, 123, 255, 0.1)', 'rgba(255, 107, 107, 0.1)', 'rgba(40, 167, 69, 0.1)'];
        shape.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        document.body.appendChild(shape);
    }
});