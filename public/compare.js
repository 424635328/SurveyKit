document.addEventListener('DOMContentLoaded', () => {

    // 获取所有必要的DOM元素
    const resultsContainer = document.getElementById('compare-results-container');
    const scoreContainer = document.getElementById('match-score-container');
    const singleLinkPrompt = document.getElementById('single-link-prompt'); 
    const doubleLinkPrompt = document.getElementById('double-link-prompt'); 
    const finalizeCompareBtn = document.getElementById('finalizeCompareBtn');
    const compareTwoLinksBtn = document.getElementById('compareTwoLinksBtn'); 
    const receiverLinkInput = document.getElementById('receiverLinkInput'); 
    const firstLinkInput = document.getElementById('firstLinkInput'); 
    const secondLinkInput = document.getElementById('secondLinkInput'); 
    const scoreEl = document.getElementById('match-score');
    const summaryEl = document.getElementById('match-summary');
    const loadingSpinner = document.getElementById('loading-compare-spinner');
    const loadingTextEl = document.getElementById('loading-compare-text');
    const statusMessageEl = document.getElementById('status-message'); 
    const resultsList = document.getElementById('results-list');

    let questionMap = {};
    let currentLoadingInterval = null;

    // 工具函数：从问卷链接中提取ID和Token
    // 此函数现在可以处理两种情况：
    // 1. 输入是完整的问卷专属链接 (viewer.html?id=xxx&token=yyy)
    // 2. 输入是纯粹的问卷ID (survey_xxx) - 这是为了兼容单ID粘贴场景，但现在主要场景是链接
    const parseSurveyLink = (input) => {
        // 尝试作为完整的URL解析
        if (input.startsWith('http://') || input.startsWith('https://')) {
            try {
                const url = new URL(input);
                const currentHost = window.location.hostname;
                const linkHost = url.hostname;

                // 简单的域名检查，防止处理非本平台的链接
                // 考虑 Vercel 部署的 *.vercel.app 子域名情况
                if (linkHost !== currentHost && !linkHost.endsWith('.vercel.app') && linkHost !== 'localhost') {
                     return { error: '请输入本平台的问卷专属链接，不支持外部链接。' };
                }
                
                const id = url.searchParams.get('id');
                const token = url.searchParams.get('token');
                if (!id) {
                    return { error: '链接中未找到问卷ID。请确保链接格式正确，例如包含 "?id=..."。' };
                }
                return { id, token };
            } catch (e) {
                return { error: '无效的链接格式。请确保输入完整的问卷专属链接。' };
            }
        } 
        // 尝试作为纯粹的ID处理（兼容旧的或从result页复制的单ID）
        else if (input.startsWith('survey_')) {
            return { id: input, token: null }; // 纯ID没有token，设为null
        }
        // 其他不识别的格式
        return { error: '无法识别的输入格式。请粘贴完整的问卷专属链接或纯问卷ID。' };
    };

    // UI管理器模块 (保持不变)
    const uiManager = (() => {
        const hideAllSections = () => {
            [resultsContainer, scoreContainer, singleLinkPrompt, doubleLinkPrompt, loadingSpinner, statusMessageEl].forEach(el => {
                if (el) el.style.display = 'none';
            });
        };

        const showLoading = (message = "正在加载，请稍候...") => {
            hideAllSections();
            if (loadingSpinner && loadingTextEl) {
                loadingSpinner.style.display = 'flex';
                loadingTextEl.textContent = message;
                let dots = '';
                currentLoadingInterval = setInterval(() => {
                    dots = dots.length < 3 ? dots + '.' : '';
                    loadingTextEl.textContent = message + dots;
                }, 500);
            }
        };

        const hideLoading = () => {
            if (currentLoadingInterval) {
                clearInterval(currentLoadingInterval);
                currentLoadingInterval = null;
            }
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
        };

        const displayMessage = (message, type = 'info') => {
            hideAllSections();
            hideLoading();
            if (statusMessageEl) {
                statusMessageEl.textContent = message;
                statusMessageEl.className = 'message-text';
                if (type === 'error') {
                    statusMessageEl.classList.add('message-error');
                } else if (type === 'success') {
                    statusMessageEl.classList.add('message-success');
                } else {
                    statusMessageEl.classList.add('message-info');
                }
                statusMessageEl.style.display = 'block';
            }
        };

        const displayPrompt = (type) => {
            hideAllSections();
            if (type === 'single' && singleLinkPrompt) {
                singleLinkPrompt.style.display = 'block';
            } else if (type === 'double' && doubleLinkPrompt) {
                doubleLinkPrompt.style.display = 'block';
            }
        };

        const displayResultsUI = () => {
            hideAllSections();
            if (scoreContainer) scoreContainer.style.display = 'block';
            if (resultsContainer) resultsContainer.style.display = 'block';
        };

        return { showLoading, hideLoading, displayMessage, displayPrompt, displayResultsUI };
    })();

    const countUp = (element, start, end, duration) => {
        let startTime = null;
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            element.textContent = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    };

    const renderResults = (data1, data2, finalScore) => {
        if (!resultsList) {
            uiManager.displayMessage("页面元素缺失，无法显示对比结果。", 'error');
            return;
        }
        resultsList.textContent = '';

        let matchCount = 0;
        const totalQuestions = Object.keys(questionMap).length;

        for (const key in questionMap) {
            const questionText = questionMap[key];
            const rawAnswer1 = String(data1[key] || '').trim();
            const rawAnswer2 = String(data2[key] || '').trim();

            const extractCustomContent = (answer) => {
                const match = answer.match(/^其他 \(自定义内容: (.+)\)$/);
                return match ? match[1].trim() : answer;
            };

            const processedAnswer1 = extractCustomContent(rawAnswer1);
            const processedAnswer2 = extractCustomContent(rawAnswer2);

            const isMatch = (rawAnswer1 !== '' && rawAnswer2 !== '' &&
                             processedAnswer1.toLowerCase() === processedAnswer2.toLowerCase());

            if (isMatch) matchCount++;

            const item = document.createElement('div');
            item.className = 'result-item';
            if (isMatch) {
                item.classList.add('is-match');
            }

            const questionCol = document.createElement('div');
            questionCol.className = 'question-column';
            const questionP = document.createElement('p');
            questionP.className = 'question';
            questionP.textContent = questionText;
            questionCol.appendChild(questionP);

            const answerCol1 = document.createElement('div');
            answerCol1.className = 'answer-column';
            const answerP1 = document.createElement('p');
            answerP1.className = 'answer';
            answerP1.textContent = rawAnswer1 === '' ? '未回答' : rawAnswer1;
            if (rawAnswer1 === '') {
                answerP1.classList.add('no-answer');
            }
            answerCol1.appendChild(answerP1);

            const answerCol2 = document.createElement('div');
            answerCol2.className = 'answer-column';
            const answerP2 = document.createElement('p');
            answerP2.className = 'answer';
            answerP2.textContent = rawAnswer2 === '' ? '未回答' : rawAnswer2;
            if (rawAnswer2 === '') {
                answerP2.classList.add('no-answer');
            }
            answerCol2.appendChild(answerP2);

            item.appendChild(questionCol);
            item.appendChild(answerCol1);
            item.appendChild(answerCol2);

            resultsList.appendChild(item);
        }

        uiManager.displayResultsUI();

        if(scoreEl) {
            scoreEl.textContent = '0';
            countUp(scoreEl, 0, finalScore, 1500);
        }
        if(summaryEl) {
            summaryEl.textContent = `在你们共同回答的 ${totalQuestions} 个问题中，有 ${matchCount} 个答案完全一致！`;
        }
    };

    const performComparison = async (id1, token1, id2, token2) => {
        uiManager.showLoading("正在获取问卷数据...");

        try {
            const [questionsRes, survey1Res, survey2Res] = await Promise.all([
                fetch('/questions.json'),
                fetch(`/api/get-survey?id=${id1}${token1 ? `&token=${token1}` : ''}`),
                fetch(`/api/get-survey?id=${id2}${token2 ? `&token=${token2}` : ''}`)
            ]);

            if (!questionsRes.ok) throw new Error('无法加载问卷结构文件 (questions.json)。');

            let errorMessages = [];
            if (!survey1Res.ok) {
                const errorData = await survey1Res.json();
                errorMessages.push(`无法获取ID为 ${id1} 的问卷数据: ${errorData.message || survey1Res.statusText} (${survey1Res.status})`);
            }
            if (!survey2Res.ok) {
                const errorData = await survey2Res.json();
                errorMessages.push(`无法获取ID为 ${id2} 的问卷数据: ${errorData.message || survey2Res.statusText} (${survey2Res.status})`);
            }

            if (errorMessages.length > 0) {
                uiManager.displayMessage(errorMessages.join('\n') + '\n请检查链接或ID是否正确，或问卷是否存在。', 'error');
                return;
            }

            const sections = await questionsRes.json();
            sections.flatMap(s => s.questions).forEach(q => {
                questionMap[q.id] = q.text;
            });

            const data1 = await survey1Res.json();
            const data2 = await survey2Res.json();

            let comparableAnswersCount = 0;
            let actualMatches = 0;

            for (const key in questionMap) {
                const answer1 = String(data1[key] || '').trim();
                const answer2 = String(data2[key] || '').trim();

                if (answer1 !== '' && answer2 !== '') {
                    comparableAnswersCount++;
                    const extractCustomContent = (ans) => {
                        const match = ans.match(/^其他 \(自定义内容: (.+)\)$/);
                        return match ? match[1].trim() : ans;
                    };
                    const processedAnswer1 = extractCustomContent(answer1);
                    const processedAnswer2 = extractCustomContent(answer2);

                    if (processedAnswer1.toLowerCase() === processedAnswer2.toLowerCase()) {
                        actualMatches++;
                    }
                }
            }

            const finalScore = comparableAnswersCount > 0 ? Math.round((actualMatches / comparableAnswersCount) * 100) : 0;

            renderResults(data1, data2, finalScore);

        } catch (error) {
            console.error('对比问卷时出错:', error);
            uiManager.displayMessage(`加载失败: ${error.message}\n请尝试刷新页面。`, 'error');
        } finally {
            uiManager.hideLoading();
        }
    };

    // 页面初始化函数
    const init = async () => {
        // 检查所有必要的UI元素是否都存在
        const requiredElements = [resultsContainer, scoreContainer, singleLinkPrompt, doubleLinkPrompt, loadingSpinner, statusMessageEl, resultsList, finalizeCompareBtn, compareTwoLinksBtn, receiverLinkInput, firstLinkInput, secondLinkInput];
        if (requiredElements.some(el => !el)) {
            console.error("Compare page UI elements are not fully loaded.");
            uiManager.displayMessage("页面初始化失败：部分UI元素缺失。", 'error');
            return;
        }

        // 从URL中获取原始参数
        const params = new URLSearchParams(window.location.search);
        let id1Param = params.get('id1');
        let token1Param = params.get('token1');
        let id2Param = params.get('id2');
        let token2Param = params.get('token2');

        // ★ 核心修改：统一解析URL参数中的ID和Token ★
        // 优化解析逻辑，优先使用独立参数，如果独立参数不存在且看起来像链接，再尝试解析链接
        
        let finalId1 = null;
        let finalToken1 = null;
        let finalId2 = null;
        let finalToken2 = null;

        // 处理第一个问卷的ID和Token
        if (id1Param) {
            if (id1Param.startsWith('http://') || id1Param.startsWith('https://')) {
                const parsed = parseSurveyLink(id1Param);
                if (parsed.error) {
                    uiManager.displayMessage(`URL参数中第一个问卷链接无效：${parsed.error}`, 'error');
                } else {
                    finalId1 = parsed.id;
                    finalToken1 = token1Param || parsed.token; // 优先使用独立的token1Param
                }
            } else { // 假定是纯ID
                finalId1 = id1Param;
                finalToken1 = token1Param;
            }
        }

        // 处理第二个问卷的ID和Token
        if (id2Param) {
            if (id2Param.startsWith('http://') || id2Param.startsWith('https://')) {
                const parsed = parseSurveyLink(id2Param);
                if (parsed.error) {
                    uiManager.displayMessage(`URL参数中第二个问卷链接无效：${parsed.error}`, 'error');
                } else {
                    finalId2 = parsed.id;
                    finalToken2 = token2Param || parsed.token; // 优先使用独立的token2Param
                }
            } else { // 假定是纯ID
                finalId2 = id2Param;
                finalToken2 = token2Param;
            }
        }
        // ★ 核心修改结束 ★

        if (finalId1 && finalId2) {
            // 情况1: URL中包含两个有效ID（可能已通过上述解析），直接进行对比
            await performComparison(finalId1, finalToken1, finalId2, finalToken2);

        } else if (finalId1 && !finalId2) {
            // 情况2: URL中只包含第一个有效ID (作为发起方)，等待接收方输入自己的链接
            uiManager.displayPrompt('single');
            
            receiverLinkInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    finalizeCompareBtn.click();
                }
            });
            finalizeCompareBtn.addEventListener('click', () => {
                const receiverInput = receiverLinkInput.value.trim(); // 获取用户输入的完整链接或ID
                if (!receiverInput) {
                    uiManager.displayMessage('请输入你自己的问卷专属链接或ID！', 'error');
                    receiverLinkInput.focus();
                    return;
                }

                const parsedReceiver = parseSurveyLink(receiverInput); // 解析输入
                if (parsedReceiver.error) {
                    uiManager.displayMessage(`你输入的链接解析失败：${parsedReceiver.error}`, 'error');
                    receiverLinkInput.focus();
                    return;
                }
                
                // 跳转到包含两个ID和所有可能的token的URL
                window.location.href = `/compare.html?id1=${finalId1}${finalToken1 ? `&token1=${finalToken1}` : ''}&id2=${parsedReceiver.id}${parsedReceiver.token ? `&token2=${parsedReceiver.token}` : ''}`;
            });

        } else {
            // 情况3: URL中没有有效ID，显示双链接输入界面
            uiManager.displayPrompt('double');
            
            // 为两个链接输入框和按钮添加事件监听
            const handleLinkInput = async () => {
                const link1 = firstLinkInput.value.trim();
                const link2 = secondLinkInput.value.trim();

                if (!link1 || !link2) {
                    uiManager.displayMessage('请完整输入两个问卷专属链接！', 'error');
                    if (!link1) firstLinkInput.focus();
                    else secondLinkInput.focus();
                    return;
                }

                const parsed1 = parseSurveyLink(link1);
                const parsed2 = parseSurveyLink(link2);

                if (parsed1.error) {
                    uiManager.displayMessage(`第一个链接解析失败：${parsed1.error}`, 'error');
                    firstLinkInput.focus();
                    return;
                }
                if (parsed2.error) {
                    uiManager.displayMessage(`第二个链接解析失败：${parsed2.error}`, 'error');
                    secondLinkInput.focus();
                    return;
                }

                // 成功解析后，直接调用 performComparison，不再跳转页面
                await performComparison(parsed1.id, parsed1.token, parsed2.id, parsed2.token);
            };

            compareTwoLinksBtn.addEventListener('click', handleLinkInput);

            firstLinkInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    if (secondLinkInput.value.trim()) {
                        handleLinkInput();
                    } else {
                        secondLinkInput.focus();
                    }
                }
            });
            secondLinkInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    handleLinkInput();
                }
            });
        }
    };

    init();
});