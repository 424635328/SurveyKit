// public/status/error.js
document.addEventListener('DOMContentLoaded', () => {

  // 1. 动态更新页脚年份，一劳永逸
  const currentYearElement = document.getElementById('current-year');
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }

  // 2. 处理从URL传入的动态错误消息
  const urlParams = new URLSearchParams(window.location.search);
  const errorMessage = urlParams.get('message');
  const errorMessageElement = document.getElementById('dynamicErrorMessage');

  if (errorMessage && errorMessageElement) {
    errorMessageElement.textContent = decodeURIComponent(errorMessage);
    // 使用 classList 操作，而不是直接修改 style
    errorMessageElement.classList.remove('hidden');
  }

  // 3. 为“返回上一页”链接添加安全返回的事件监听
  const backLink = document.getElementById('backLink');
  if (backLink) {
    backLink.addEventListener('click', (event) => {
      event.preventDefault(); // 阻止 a 标签的默认跳转行为
      // 检查是否有历史记录，有则返回，没有则不执行任何操作（避免返回到空白页）
      if (window.history.length > 1) {
        window.history.back();
      }
    });
  }

  // 4. 实现站内搜索功能
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault(); // 阻止表单默认的提交刷新行为
      const query = searchInput.value.trim();
      
      if (query) {
        window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
      } else {
        // 可选：给用户一个提示如果输入为空
        searchInput.focus();
        searchInput.placeholder = "请输入内容后再搜索...";
      }
    });
  }
});