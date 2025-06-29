// compare.js - 支持0个、1个、2个SurveyID场景

document.addEventListener('DOMContentLoaded', () => {

    const compareModule = (() => {
        // --- 元素获取 ---
        const resultsContainer = document.getElementById('compare-results-container');
        const scoreContainer = document.getElementById('match-score-container');
        const singleIdPrompt = document.getElementById('single-id-prompt'); // 单ID输入界面
        const doubleIdPrompt = document.getElementById('double-id-prompt'); // 双ID输入界面 (新增)
        const finalizeCompareBtn = document.getElementById('finalizeCompareBtn');
        const compareTwoIdsBtn = document.getElementById('compareTwoIdsBtn'); // 双ID对比按钮 (新增)
        const receiverIdInput = document.getElementById('receiverIdInput');
        const firstIdInput = document.getElementById('firstIdInput'); // 第一个ID输入框 (新增)
        const secondIdInput = document.getElementById('secondIdInput'); // 第二个ID输入框 (新增)
        const scoreEl = document.getElementById('match-score');
        const summaryEl = document.getElementById('match-summary');
        const loadingSpinner = document.getElementById('loading-compare-spinner');
        const loadingTextEl = document.getElementById('loading-compare-text');
        const errorMessageEl = document.getElementById('error-message');
        const resultsList = document.getElementById('results-list');

        // --- 动态加载 questionMap ---
        let questionMap = {};
        let currentLoadingInterval = null;


        /**
         * 显示加载动画和文本。
         * @param {string} message - 加载文本。
         */
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

        /**
         * 隐藏加载动画。
         */
        const hideLoading = () => {
            if (currentLoadingInterval) {
                clearInterval(currentLoadingInterval);
                currentLoadingInterval = null;
            }
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
        };

        /**
         * 显示错误信息。
         * @param {string} message - 错误信息文本。
         */
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


        /**
         * 动画计数器效果。
         * @param {HTMLElement} element - 显示数字的元素。
         * @param {number} start - 起始数字。
         * @param {number} end - 结束数字。
         * @param {number} duration - 动画持续时间（毫秒）。
         */
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

        // ========================================================================
        // =======================  XSS 漏洞修复区域  ===========================
        // ========================================================================
        const renderResults = (data1, data2, finalScore) => {
            hideLoading();

            if (!resultsList) {
                console.error("Results list container not found!");
                displayError("页面元素缺失，无法显示对比结果。");
                return;
            }
            // 使用 textContent 清空，更安全且高效
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

                // --- 开始安全地创建 DOM 元素 ---
                
                // 1. 创建主容器 div.result-item
                const item = document.createElement('div');
                item.className = 'result-item';
                if (isMatch) {
                    item.classList.add('is-match');
                }
                
                // 2. 创建问题列
                const questionCol = document.createElement('div');
                questionCol.className = 'question-column';
                const questionP = document.createElement('p');
                questionP.className = 'question';
                // 使用 textContent 安全地设置问题文本
                questionP.textContent = questionText;
                questionCol.appendChild(questionP);

                // 3. 创建第一个答案列
                const answerCol1 = document.createElement('div');
                answerCol1.className = 'answer-column';
                const answerP1 = document.createElement('p');
                answerP1.className = 'answer';
                // 使用 textContent 安全地设置答案1
                answerP1.textContent = answer1;
                if (answer1 === '未回答') {
                    answerP1.classList.add('no-answer');
                }
                answerCol1.appendChild(answerP1);

                // 4. 创建第二个答案列
                const answerCol2 = document.createElement('div');
                answerCol2.className = 'answer-column';
                const answerP2 = document.createElement('p');
                answerP2.className = 'answer';
                // 使用 textContent 安全地设置答案2
                answerP2.textContent = answer2;
                if (answer2 === '未回答') {
                    answerP2.classList.add('no-answer');
                }
                answerCol2.appendChild(answerP2);

                // 5. 将所有创建的列组装到主容器中
                item.appendChild(questionCol);
                item.appendChild(answerCol1);
                item.appendChild(answerCol2);
                
                // 6. 将完全构建好的、安全的 item 添加到列表中
                resultsList.appendChild(item);
            }
            
            // 显示得分仪表盘和总结
            if(scoreContainer) scoreContainer.style.display = 'block';
            if(resultsContainer) resultsContainer.style.display = 'block';

            if(scoreEl) {
                scoreEl.textContent = '0';
                countUp(scoreEl, 0, finalScore, 1500);
            }
            if(summaryEl) {
                // 这里的 summaryEl 也使用了 textContent，是安全的
                summaryEl.textContent = `在你们共同回答的 ${totalQuestions} 个问题中，有 ${matchCount} 个答案完全一致！`;
            }
        };
        // ========================================================================
        // =========================  修复区域结束  =============================
        // ========================================================================


        // --- 核心执行函数 ---
        const performComparison = async (id1, id2) => {
            showLoading("正在获取问卷数据...");

            try {
                // 并行获取三份数据：问卷结构、答案1、答案2
                const [questionsRes, survey1Res, survey2Res] = await Promise.all([
                    fetch('/questions.json'),
                    fetch(`/api/get-survey?id=${id1}`),
                    fetch(`/api/get-survey?id=${id2}`)
                ]);

                if (!questionsRes.ok) throw new Error('无法加载问卷结构文件 (questions.json)。');
                
                // 检查问卷数据响应状态
                let errorMessages = [];
                if (!survey1Res.ok) errorMessages.push(`无法获取ID为 ${id1} 的问卷数据 (${survey1Res.status})。`);
                if (!survey2Res.ok) errorMessages.push(`无法获取ID为 ${id2} 的问卷数据 (${survey2Res.status})。`);
                
                if (errorMessages.length > 0) {
                    displayError(errorMessages.join('\n') + '\n请检查ID是否正确或问卷是否存在。');
                    return;
                }
                
                // 1. 生成 questionMap
                const sections = await questionsRes.json();
                sections.flatMap(s => s.questions).forEach(q => {
                    questionMap[q.id] = q.text;
                });
                
                // 2. 获取答案
                const data1 = await survey1Res.json();
                const data2 = await survey2Res.json();

                // 3. 计算得分
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

                // 4. 渲染结果
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
            const id2 = params.get('id2');

            if (id1 && id2) {
                scoreContainer.style.display = 'none';
                resultsContainer.style.display = 'none';
                singleIdPrompt.style.display = 'none';
                doubleIdPrompt.style.display = 'none';
                errorMessageEl.style.display = 'none';

                await performComparison(id1, id2);

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
                        window.location.href = `/compare.html?id1=${id1}&id2=${id2_receiver}`;
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
                        const secondId = secondIdInput.value.trim();
                        
                        if (!firstId || !secondId) {
                            alert('请输入两个问卷ID！');
                            if (!firstId) firstIdInput.focus();
                            else secondIdInput.focus();
                            return;
                        }
                        
                        window.location.href = `/compare.html?id1=${firstId}&id2=${secondId}`;
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