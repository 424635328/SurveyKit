// public/status/status.js
document.addEventListener('DOMContentLoaded', () => {
    // 处理页脚年份更新 (适用于所有使用此脚本的状态页面)
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // 获取 URL 中的所有参数
    const urlParams = new URLSearchParams(window.location.search);
    const statusCode = urlParams.get('code'); // 获取状态码参数

    // 获取当前页面的文件名 (例如 'status.html', 'error.html' 等)
    const currentPageFilename = window.location.pathname.split('/').pop();

    // 只有当存在状态码参数 并且 当前页面是 'status.html' 时才执行重定向
    if (statusCode && currentPageFilename === 'status.html') {
        let redirectBase = '';
        // 根据状态码决定跳转路径
        switch (statusCode.toLowerCase()) { // 转换为小写以支持大小写不敏感的参数
            case '404':
            case 'error':
                redirectBase = 'error.html';
                break;
            case '403':
            case 'block':
                redirectBase = 'block.html';
                break;
            case 'blank':
            case 'under_construction':
                redirectBase = 'blank.html';
                break;
            case 'success':
            case '200':
            case 'ok':
                redirectBase = 'success.html';
                break;
            default:
                // 如果是未知状态码，则不进行自动跳转，停留在当前中心页面
                console.warn(`未知状态码: ${statusCode}。停留在状态页面中心。`);
                return; // 阻止继续执行重定向
        }

        // 移除 'code' 参数，因为它只用于重定向目的，不应出现在最终页面的URL中
        const newUrlParams = new URLSearchParams(window.location.search);
        newUrlParams.delete('code'); 
        
        let queryString = newUrlParams.toString();
        if (queryString) {
            queryString = '?' + queryString;
        }

        // 构建完整的重定向URL，并使用 replace() 替换当前历史记录
        window.location.replace(redirectBase + queryString);
    }
});