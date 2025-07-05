// public/hub/answer/submission-result.js
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const message = params.get('message');
    const surveyId = params.get('surveyId');
    const submissionId = params.get('submissionId');

    const statusIcon = document.getElementById('status-icon');
    const statusTitle = document.getElementById('status-title');
    const statusMessage = document.getElementById('status-message');
    const aiAnalyzeBtn = document.getElementById('ai-analyze-btn');
    const exportButtonsContainer = document.getElementById('export-buttons');
    
    const screenshotOverlay = document.getElementById('screenshot-overlay');
    const imageRenderArea = document.getElementById('image-render-area');

    let surveyDataCache = null;
    let answersCache = null;

    async function prepareExportData() {
        if (surveyDataCache && answersCache) return { surveyData: surveyDataCache, answers: answersCache };

        const answersJson = sessionStorage.getItem(`survey_answers_${submissionId}`);
        if (!answersJson) throw new Error('无法找到您的答案，请勿刷新页面后下载。');

        const answers = JSON.parse(answersJson);
        const response = await fetch(`/api/survey-details.mjs?id=${surveyId}`);
        if (!response.ok) throw new Error('无法获取问卷详情。');
        
        const surveyData = await response.json();
        surveyDataCache = surveyData;
        answersCache = answers;
        return { surveyData, answers };
    }

    function triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    async function handleExport(format, button) {
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';

        try {
            const { surveyData, answers } = await prepareExportData();
            const filenameBase = `${surveyData.title}_我的答案`;

            if (format === 'json' || format === 'csv' || format === 'xlsx') {
                if (format === 'json') {
                    const jsonBlob = new Blob([JSON.stringify({ survey: surveyData, answers: answers }, null, 2)], { type: 'application/json' });
                    triggerDownload(jsonBlob, `${filenameBase}.json`);
                } else {
                    const dataForSheet = surveyData.questions.flatMap(part => 
                        part.questions.map(q => ({
                            'Section': part.legend,
                            'Question': q.text,
                            'Answer': answers[q.id] || 'N/A'
                        }))
                    );
                    const ws = XLSX.utils.json_to_sheet(dataForSheet);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Answers');
                    XLSX.writeFile(wb, `${filenameBase}.${format}`);
                }
            } else if (format === 'image') {
                let renderHtml = `<h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center; color: #e2e8f0;">${surveyData.title}</h1>`;
                surveyData.questions.forEach(part => {
                    renderHtml += `<h2 style="font-size: 18px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #475569; padding-bottom: 5px; color: #cbd5e1;">${part.legend}</h2>`;
                    part.questions.forEach(q => {
                        const answer = answers[q.id] || 'N/A';
                        renderHtml += `<div style="margin-bottom: 15px;"><p style="font-weight: bold; margin-bottom: 5px; color: #94a3b8;">${q.text}</p><p style="padding: 8px; background-color: #1e293b; border-radius: 4px; color: #e2e8f0; border: 1px solid #334155;">${answer}</p></div>`;
                    });
                });
                imageRenderArea.innerHTML = renderHtml;
                
                screenshotOverlay.classList.remove('hidden');
                screenshotOverlay.classList.add('flex');

                await new Promise(resolve => requestAnimationFrame(resolve));
                
                try {
                    const canvas = await html2canvas(imageRenderArea, {
                        scale: 2,
                        backgroundColor: '#0f172a',
                        useCORS: true,
                    });
                    const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                    triggerDownload(imageBlob, `${filenameBase}.png`);
                } finally {
                    screenshotOverlay.classList.add('hidden');
                    screenshotOverlay.classList.remove('flex');
                    imageRenderArea.innerHTML = '';
                }
            }
        } catch (error) {
            alert('导出失败: ' + error.message);
        } finally {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    function renderPage() {
        if (status === 'success') {
            statusIcon.innerHTML = `<i class="fa fa-check-circle text-green-400"></i>`;
            statusTitle.textContent = '提交成功！';
            statusMessage.textContent = '感谢您的参与，您的回答已成功记录。';
            
            if (surveyId && submissionId) {
                aiAnalyzeBtn.classList.remove('hidden');
                exportButtonsContainer.classList.remove('hidden');
                aiAnalyzeBtn.onclick = () => { window.location.href = `../../mbti.html?id=${submissionId}`; };
                exportButtonsContainer.querySelectorAll('.export-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => handleExport(e.currentTarget.dataset.format, e.currentTarget));
                });
            }
        } else {
            statusIcon.innerHTML = `<i class="fa fa-times-circle text-red-400"></i>`;
            statusTitle.textContent = '提交失败';
            statusMessage.textContent = decodeURIComponent(message || '发生未知错误，请稍后再试。');
        }
    }
    
    document.querySelector('header').innerHTML = `<div class="container mx-auto px-4 py-4 flex justify-between items-center"><div class="flex items-center space-x-2"><span class="text-indigo-500 text-2xl"><i class="fa fa-wpforms"></i></span><a href="../../index.html" class="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">SurveyKit</a></div></div>`;
    document.querySelector('footer').innerHTML = `<div class="container mx-auto px-4"><div class="flex justify-center"><p>© ${new Date().getFullYear()} SurveyKit</p></div></div>`;
    
    renderPage();
});