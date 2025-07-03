// public/hub/toolchain/customizer.js

document.addEventListener('DOMContentLoaded', () => {

  const inputs = {
    primary: document.getElementById('primary-color'),
    background: document.getElementById('background-color'),
    card: document.getElementById('card-color'),
    text: document.getElementById('text-color'),
    secondaryText: document.getElementById('secondary-text-color')
  };

  const values = {
    primary: document.getElementById('primary-color-value'),
    background: document.getElementById('background-color-value'),
    card: document.getElementById('card-color-value'),
    text: document.getElementById('text-color-value'),
    secondaryText: document.getElementById('secondary-text-color-value')
  };

  const codeOutput = document.getElementById('css-code-output');

  const applyBtn = document.getElementById('apply-theme-btn');
  const resetBtn = document.getElementById('reset-theme-btn');
  const copyBtn = document.getElementById('copy-code-btn');
  
  const THEME_STORAGE_KEY = 'surveyKitUserTheme';

  const defaultTheme = {
    primary: '#6366f1',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b',
    secondaryText: '#64748b'
  };

  function updateTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty('--survey-primary', theme.primary);
    root.style.setProperty('--survey-bg', theme.background);
    root.style.setProperty('--survey-card-bg', theme.card);
    root.style.setProperty('--survey-text', theme.text);
    root.style.setProperty('--survey-secondary-text', theme.secondaryText);

    Object.keys(theme).forEach(key => {
        const inputKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
        if (inputs[key]) {
            inputs[key].value = theme[key];
        }
        if (values[key]) {
            values[key].textContent = theme[key];
        }
    });

    updateCodeOutput(theme);
  }
  
  function getThemeFromInputs() {
    return {
      primary: inputs.primary.value,
      background: inputs.background.value,
      card: inputs.card.value,
      text: inputs.text.value,
      secondaryText: inputs.secondaryText.value
    };
  }

  function updateCodeOutput(theme) {
    const code = `
:root {
  <span class="token">--survey-primary</span>: <span class="value">${theme.primary}</span>;
  <span class="token">--survey-background</span>: <span class="value">${theme.background}</span>;
  <span class="token">--survey-card-bg</span>: <span class="value">${theme.card}</span>;
  <span class="token">--survey-text-color</span>: <span class="value">${theme.text}</span>;
  <span class="token">--survey-secondary-text-color</span>: <span class="value">${theme.secondaryText}</span>;
}
    `.trim();
    codeOutput.innerHTML = code;
  }
  
  // **已修改**：这个函数现在只负责保存和UI反馈
  function applyAndSaveTheme() {
    const currentTheme = getThemeFromInputs();
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(currentTheme));
    
    applyBtn.classList.add('is-active');
    applyBtn.innerHTML = '<i class="fa fa-check"></i>已应用！';
    
    setTimeout(() => {
      applyBtn.classList.remove('is-active');
      applyBtn.innerHTML = '<i class="fa fa-check mr-2"></i>应用主题';
    }, 2000);
  }
  
  // **新增**：处理“应用并跳转”按钮的逻辑
  function applyAndRedirect() {
    const currentTheme = getThemeFromInputs();
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(currentTheme));
    
    // 短暂延迟以确保 localStorage 写入完成，然后跳转
    setTimeout(() => {
      window.location.href = '../../survey.html'; // **确保这个路径是正确的**
    }, 100);
  }
  
  function resetToDefaults() {
    localStorage.removeItem(THEME_STORAGE_KEY);
    updateTheme(defaultTheme);
  }

  function copyCodeToClipboard() {
    const codeText = codeOutput.innerText;
    navigator.clipboard.writeText(codeText).then(() => {
      const originalIcon = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="fa fa-check"></i>';
      copyBtn.classList.add('copied');
      
      setTimeout(() => {
        copyBtn.innerHTML = originalIcon;
        copyBtn.classList.remove('copied');
      }, 2000);
    }).catch(err => {
      console.error('无法复制到剪贴板:', err);
      alert('复制失败！');
    });
  }

  Object.values(inputs).forEach(input => {
      if(input) input.addEventListener('input', () => updateTheme(getThemeFromInputs()));
  });
  
  applyBtn.addEventListener('click', applyAndSaveTheme); 
  const applyAndGoBtn = document.getElementById('apply-and-go-btn'); // 需要在HTML中添加这个ID
  if (applyAndGoBtn) {
    applyAndGoBtn.addEventListener('click', applyAndRedirect);
  }

  resetBtn.addEventListener('click', resetToDefaults);
  copyBtn.addEventListener('click', copyCodeToClipboard);

  const savedTheme = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY)) || defaultTheme;
  updateTheme(savedTheme);
});