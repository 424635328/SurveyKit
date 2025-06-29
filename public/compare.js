document.addEventListener('DOMContentLoaded', () => {

    const compareModule = (() => {
        const resultsContainer = document.getElementById('compare-results-container');
        const scoreContainer = document.getElementById('match-score-container');
        const singleIdPrompt = document.getElementById('single-id-prompt');
        const doubleIdPrompt = document.getElementById('double-id-prompt');
        const finalizeCompareBtn = document.getElementById('finalizeCompareBtn');
        const compareTwoIdsBtn = document.getElementById('compareTwoIdsBtn');
        const receiverIdInput = document.getElementById('receiverIdInput');
        const firstIdInput = document.getElementById('firstIdInput');
        const secondIdInput = document.getElementById('secondIdInput');
        const scoreEl = document.getElementById('match-score');
        const summaryEl = document.getElementById('match-summary');
        const loadingSpinner = document.getElementById('loading-compare-spinner');
        const loadingTextEl = document.getElementById('loading-compare-text');
        const errorMessageEl = document.getElementById('error-message');
        const resultsList = document.getElementById('results-list');

        let questionMap = {};
        let currentLoadingInterval = null;

        const showLoading = (message = "正在加载，请稍候...") => {
            if (loadingSpinner && loadingTextEl) {
                loadingSpinner.style.display = 'flex';
                scoreContainer.style.display = 'none';
                resultsContainer.style.display = 'none';
                errorMessageEl.style.display = 'none';
                singleIdPrompt.style.display = 'none';
                doubleIdPrompt.style.display = 'none';

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

        const displayError = (message) => {
            hideLoading();
            if (errorMessageEl) {
                errorMessageEl.textContent = message;
                errorMessageEl.style.display = 'block';
            }
            if (scoreContainer) scoreContainer.style.display = 'none';
            if (resultsContainer) resultsContainer.style.display = 'none';
            if (singleIdPrompt) singleIdPrompt.style.display = 'none';
            if (doubleIdPrompt) doubleIdPrompt.style.display = 'none';
        };

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
            hideLoading();

            if (!resultsList) {
                console.error("Results list container not found!");
                displayError("页面元素缺失，无法显示对比结果。");
                return;
            }
            resultsList.textContent = '';

            let matchCount = 0;
            const totalQuestions = Object.keys(questionMap).length;

            for (const key in questionMap) {
                const questionText = questionMap[key];
                const answer1 = String(data1[key] || '未回答').trim();
                const answer2 = String(data2[key] || '未回答').trim();

                const extractCustomContent = (answer) => {
                    const match = answer.match(/^其他 \(自定义内容: (.+)\)$/);
                    return match ? match[1].trim() : answer;
                };

                const processedAnswer1 = extractCustomContent(answer1);
                const processedAnswer2 = extractCustomContent(answer2);
                
                const isMatch = (processedAnswer1 !== '未回答' && processedAnswer2 !== '未回答' && 
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
                answerP1.textContent = answer1;
                if (answer1 === '未回答') {
                    answerP1.classList.add('no-answer');
                }
                answerCol1.appendChild(answerP1);

                const answerCol2 = document.createElement('div');
                answerCol2.className = 'answer-column';
                const answerP2 = document.createElement('p');
                answerP2.className = 'answer';
                answerP2.textContent = answer2;
                if (answer2 === '未回答') {
                    answerP2.classList.add('no-answer');
                }
                answerCol2.appendChild(answerP2);

                item.appendChild(questionCol);
                item.appendChild(answerCol1);
                item.appendChild(answerCol2);
                
                resultsList.appendChild(item);
            }
            
            if(scoreContainer) scoreContainer.style.display = 'block';
            if(resultsContainer) resultsContainer.style.display = 'block';

            if(scoreEl) {
                scoreEl.textContent = '0';
                countUp(scoreEl, 0, finalScore, 1500);
            }
            if(summaryEl) {
                summaryEl.textContent = `在你们共同回答的 ${totalQuestions} 个问题中，有 ${matchCount} 个答案完全一致！`;
            }
        };

        const performComparison = async (id1, token1, id2, token2) => { // 接收两个 ID 和对应的 Token
            showLoading("正在获取问卷数据...");

            try {
                const [questionsRes, survey1Res, survey2Res] = await Promise.all([
                    fetch('/questions.json'),
                    fetch(`/api/get-survey?id=${id1}${token1 ? `&token=${token1}` : ''}`), // 拼接 token1
                    fetch(`/api/get-survey?id=${id2}${token2 ? `&token=${token2}` : ''}`)  // 拼接 token2
                ]);

                if (!questionsRes.ok) throw new Error('无法加载问卷结构文件 (questions.json)。');
                
                let errorMessages = [];
                if (!survey1Res.ok) {
                    const errorData = await survey1Res.json();
                    errorMessages.push(`无法获取ID为 ${id1} 的问卷数据: ${errorData.message || survey1Res.statusText} (${survey1Res.status})。`);
                }
                if (!survey2Res.ok) {
                    const errorData = await survey2Res.json();
                    errorMessages.push(`无法获取ID为 ${id2} 的问卷数据: ${errorData.message || survey2Res.statusText} (${survey2Res.status})。`);
                }
                
                if (errorMessages.length > 0) {
                    displayError(errorMessages.join('\n') + '\n请检查ID或令牌是否正确，或问卷是否存在。');
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
                displayError(`加载失败: ${error.message}\n请尝试刷新页面。`);
            } finally {
                hideLoading();
            }
        };

        const init = async () => {
            if (!resultsContainer || !scoreContainer || !singleIdPrompt || !doubleIdPrompt || !loadingSpinner || !errorMessageEl || !resultsList) {
                console.error("Compare page UI elements are not fully loaded.");
                displayError("页面初始化失败：部分UI元素缺失。");
                return;
            }

            const params = new URLSearchParams(window.location.search);
            const id1 = params.get('id1');
            const token1 = params.get('token1'); // 获取 token1
            const id2 = params.get('id2');
            const token2 = params.get('token2'); // 获取 token2

            if (id1 && id2) {
                scoreContainer.style.display = 'none';
                resultsContainer.style.display = 'none';
                singleIdPrompt.style.display = 'none';
                doubleIdPrompt.style.display = 'none';
                errorMessageEl.style.display = 'none';

                await performComparison(id1, token1, id2, token2); // 传递两个 ID 和对应的 Token

            } else if (id1 && !id2) {
                scoreContainer.style.display = 'none';
                resultsContainer.style.display = 'none';
                doubleIdPrompt.style.display = 'none';
                loadingSpinner.style.display = 'none';
                errorMessageEl.style.display = 'none';
                singleIdPrompt.style.display = 'block';

                if(finalizeCompareBtn) {
                    finalizeCompareBtn.addEventListener('click', () => {
                        const id2_receiver = receiverIdInput.value.trim();
                        if (!id2_receiver) {
                            alert('请输入你自己的问卷ID！');
                            receiverIdInput.focus();
                            return;
                        }
                        // 如果存在 token1，则在跳转时也带上
                        window.location.href = `/compare.html?id1=${id1}${token1 ? `&token1=${token1}` : ''}&id2=${id2_receiver}`;
                    });
                }
                
                receiverIdInput.addEventListener('keyup', (e) => {
                    if (e.key === 'Enter') {
                        finalizeCompareBtn.click();
                    }
                });

            } else {
                scoreContainer.style.display = 'none';
                resultsContainer.style.display = 'none';
                singleIdPrompt.style.display = 'none';
                loadingSpinner.style.display = 'none';
                errorMessageEl.style.display = 'none';
                doubleIdPrompt.style.display = 'block';

                if(compareTwoIdsBtn) {
                    compareTwoIdsBtn.addEventListener('click', () => {
                        const firstId = firstIdInput.value.trim();
                        const firstToken = params.get('token1') || null; // 确保获取或为null
                        const secondId = secondIdInput.value.trim();
                        const secondToken = params.get('token2') || null; // 确保获取或为null
                        
                        if (!firstId || !secondId) {
                            alert('请输入两个问卷ID！');
                            if (!firstId) firstIdInput.focus();
                            else secondIdInput.focus();
                            return;
                        }
                        
                        // 跳转时带上两个 ID 和对应的 Token
                        window.location.href = `/compare.html?id1=${firstId}${firstToken ? `&token1=${firstToken}` : ''}&id2=${secondId}${secondToken ? `&token2=${secondToken}` : ''}`;
                    });
                }
                
                firstIdInput.addEventListener('keyup', (e) => {
                    if (e.key === 'Enter' && secondIdInput.value.trim()) {
                        compareTwoIdsBtn.click();
                    } else if (e.key === 'Enter') {
                        secondIdInput.focus();
                    }
                });
                
                secondIdInput.addEventListener('keyup', (e) => {
                    if (e.key === 'Enter') {
                        compareTwoIdsBtn.click();
                    }
                });
            }
        };

        return { init };
    })();

    compareModule.init();
});