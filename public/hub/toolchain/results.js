document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('surveyKitToken');
    if (!token) {
        window.location.href = `../login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const surveyId = params.get('id');

    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const resultsContent = document.getElementById('results-content');
    const surveyTitleEl = document.getElementById('survey-title');
    const submissionCountEl = document.getElementById('submission-count');
    const tableEl = document.getElementById('results-table');
    const downloadCsvBtn = document.getElementById('download-csv-btn');
    
    let fullResultsData = null;

    async function fetchResults() {
        if (!surveyId) {
            showError('URL中缺少问卷ID。');
            return;
        }

        try {
            // 使用 Promise.all 并行获取问卷结构和回答
            const [structureRes, resultsRes] = await Promise.all([
                fetch(`/api/surveys.mjs?id=${surveyId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`/api/get-results.mjs?id=${surveyId}`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!structureRes.ok || !resultsRes.ok) {
                 throw new Error('获取数据失败，请检查权限或问卷ID。');
            }
            
            const allSurveys = await structureRes.json();
            const surveyStructure = allSurveys.find(s => s.id === surveyId);
            const resultsData = await resultsRes.json();
            
            if (!surveyStructure) {
                throw new Error('找不到该问卷的结构信息。');
            }

            fullResultsData = { structure: surveyStructure, submissions: resultsData.submissions };
            renderResults(fullResultsData);
            loadingState.classList.add('hidden');
            resultsContent.classList.remove('hidden');

        } catch (error) {
            showError(error.message);
        }
    }

    function renderResults(data) {
        surveyTitleEl.textContent = `“${data.structure.title}”`;
        submissionCountEl.textContent = data.submissions.length;
        
        if(data.submissions.length === 0) {
            tableEl.innerHTML = '<tbody><tr><td class="text-center p-8 text-slate-400">暂无任何回答数据。</td></tr></tbody>';
            downloadCsvBtn.disabled = true;
            return;
        }

        const questionMap = new Map(data.structure.questions.flatMap(s => s.questions).map(q => [q.id, q.text]));
        
        const headers = Array.from(questionMap.keys());
        const headerTexts = Array.from(questionMap.values());

        const thead = document.createElement('thead');
        thead.innerHTML = `<tr>${headerTexts.map(text => `<th>${escapeHtml(text)}</th>`).join('')}</tr>`;
        tableEl.appendChild(thead);

        const tbody = document.createElement('tbody');
        data.submissions.forEach(submission => {
            const row = document.createElement('tr');
            row.innerHTML = headers.map(id => `<td>${escapeHtml(submission[id] || '')}</td>`).join('');
            tbody.appendChild(row);
        });
        tableEl.appendChild(tbody);
    }
    
    function downloadCSV() {
        if (!fullResultsData || fullResultsData.submissions.length === 0) return;

        const questionMap = new Map(fullResultsData.structure.questions.flatMap(s => s.questions).map(q => [q.id, q.text]));
        const headers = Array.from(questionMap.values());
        const headerKeys = Array.from(questionMap.keys());
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + "\r\n";

        fullResultsData.submissions.forEach(submission => {
            const row = headerKeys.map(key => {
                const value = submission[key] || '';
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvContent += row.join(',') + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${fullResultsData.structure.title}_results.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function showError(message) {
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
        errorState.textContent = `加载失败: ${message}`;
    }
    
    function escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>"']/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[match]));
    }

    downloadCsvBtn.addEventListener('click', downloadCSV);
    document.getElementById('current-year-footer').textContent = new Date().getFullYear();
    document.querySelectorAll('[data-animate]').forEach(el => el.classList.add('is-visible'));
    fetchResults();
});