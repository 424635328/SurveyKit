// file: public/result.js
document.addEventListener("DOMContentLoaded", () => {
    const starCanvas = document.getElementById('star-canvas');
    const statusDisplay = document.getElementById("status-display");
    const personalityCard = document.getElementById("personality-card");
    const personalityTagEl = document.getElementById("personality-tag");
    const personalityDescEl = document.getElementById("personality-desc");
    const secondaryPersonalityEl = document.getElementById("secondary-personality");
    const eggContainer = document.getElementById("egg-container");
    const eggText = document.getElementById("egg-text");
    const rerollEggBtn = document.getElementById("reroll-egg-btn");
    const actionsContainer = document.getElementById("actions-container");
    const viewMySubmissionBtn = document.getElementById("viewMySubmissionBtn");
    const compareLinkInput = document.getElementById("compareLinkInput");
    const startCompareBtn = document.getElementById("startCompareBtn");
    const generateCompareLinkBtn = document.getElementById("generateCompareLinkBtn");
    const goToMbtiAnalysisBtn = document.getElementById("goToMbtiAnalysisBtn");
    const exclusiveSurveyLinkEl = document.getElementById("exclusive-survey-link");
    const copyExclusiveLinkBtn = document.getElementById("copy-exclusive-link-btn");
    const backAction = document.querySelector(".back-action");

    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const surveyId = params.get("id");
    const surveyToken = params.get("token");
    const message = params.get("message");
    
    let surveyData = null;
    let currentAvailableEggs = [];
    let lastDisplayedEggIndex = -1;
    let loadingTimeout;

    const updateStatus = (icon, message, iconClass = '') => {
        if (statusDisplay) {
            statusDisplay.innerHTML = `<span class="icon ${iconClass}"><i class="fa-solid ${icon}"></i></span><span>${message}</span>`;
        }
    };

    if (starCanvas) {
        const ctx = starCanvas.getContext('2d');
        let stars = [];
        let animationFrameId;

        const setCanvasSize = () => {
            starCanvas.width = window.innerWidth;
            starCanvas.height = document.body.scrollHeight;
        };

        const createStars = () => {
            stars = [];
            const starCount = Math.floor((starCanvas.width * starCanvas.height) / 8000);
            for (let i = 0; i < starCount; i++) {
                stars.push({
                    x: Math.random() * starCanvas.width,
                    y: Math.random() * starCanvas.height,
                    radius: Math.random() * 1.5 + 0.5,
                    vx: (Math.random() - 0.5) * 0.1,
                    vy: (Math.random() - 0.5) * 0.1,
                    opacity: Math.random() * 0.5 + 0.5
                });
            }
        };

        const drawStars = () => {
            ctx.clearRect(0, 0, starCanvas.width, starCanvas.height);
            ctx.fillStyle = `rgba(255, 255, 255, 0.8)`;
            stars.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();
                star.x += star.vx;
                star.y += star.vy;
                if (star.x < 0 || star.x > starCanvas.width) star.vx = -star.vx;
                if (star.y < 0 || star.y > starCanvas.height) star.vy = -star.vy;
            });
            animationFrameId = requestAnimationFrame(drawStars);
        };

        const initStarfield = () => {
            setCanvasSize();
            createStars();
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            drawStars();
        };
        
        initStarfield();
        window.addEventListener('resize', initStarfield);
        
        const resizeObserver = new ResizeObserver(() => {
            setCanvasSize();
            createStars();
        });
        resizeObserver.observe(document.body);
    }
    
    function copyToClipboard(textToCopy, buttonElement) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalIcon = buttonElement.innerHTML;
            buttonElement.innerHTML = '<i class="fa fa-check"></i>';
            buttonElement.style.backgroundColor = '#22c55e';
            setTimeout(() => {
                buttonElement.innerHTML = originalIcon;
                buttonElement.style.backgroundColor = '';
            }, 2000);
        }).catch(() => {
            alert('复制失败，请手动复制。');
        });
    }

    const parseSurveyLink = (input) => {
        if (input.startsWith('http://') || input.startsWith('https://')) {
            try {
                const url = new URL(input);
                const currentHost = window.location.hostname;
                const linkHost = url.hostname;

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
        else if (input.startsWith('survey_')) {
            return { id: input, token: null };
        }
        return { error: '无法识别的输入格式。请粘贴完整的问卷专属链接或纯问卷ID。' };
    };

    const personalityAnalyzer = (() => {
        const SCORING_RULES = {
            explorer_vs_guardian: [{qId: "q2_travel_prep",weight: 2,scores: {相机和日记本: 1,充电宝和降噪耳机: -1}}, {qId: "q16_new_word",weight: 2.5,scores: {"一种难以言说的美好感觉": 1,"一种微妙的社交尴尬": 0.5,"一种对未来的乐观期待": 1.5,"一种独处时的舒适感": -0.5}}, {qId: "q43_food_explorer",weight: 1.5,scores: {"尝试没吃过的新品，追求刺激": 1,"点熟悉的老几样，安全可靠": -1}}, {qId: "q71_supermarket_path",weight: 1,scores: {"随心所欲，逛遍每个货架": 1,按清单直奔主题: -1}}, {qId: "q79_comfort_zone",weight: 2,scores: {"是需要不断打破和走出的地方": 1,"是补充能量、提供安全感的港湾": -1}}, {qId: "q90_last_day_on_earth",weight: 1.5,scores: {"去做一件一直想做却没敢做的事": 1,和最爱的人待在一起: 0,吃遍所有想吃的美食: 0.5}}, ],
            extrovert_vs_introvert: [{qId: "q31_social_battery",weight: 2.5,dynamicScore: (val) => (parseInt(val, 10) - 50) / 25}, {qId: "q4_party_role",weight: 1.5,scores: {穿梭于人群中的社交达人: 1,在角落安静观察大家的人: -1}}, {qId: "q34_group_preference",weight: 1.8,scores: {一大群人的热闹派对: 1,几个密友的深度长谈: -1}}, {qId: "q38_reply_speed",weight: 1,scores: {"看到就回的“秒回怪”": 1,攒到有空再统一回复: -1}}, {qId: "q49_unplug_way",weight: 1.2,scores: {和朋友面对面聊天: 1,去户外散步或运动: 0.5,看一本纸质书: -0.5}}, {qId: "q55_energy_source",weight: 1.5,scores: {与志同道合的人深度交流: 1,高质量的独处: -1}}, ],
            feeling_vs_thinking: [{qId: "q53_decision_making",weight: 2.5,scores: {内心的直觉和第一感觉: 1,详尽的数据和利弊分析: -1}}, {qId: "q3_rainy_day_feeling",weight: 1.5,scores: {"终于可以宅家了，很安心": 1,"有点打乱计划，略感烦躁": -1}}, {qId: "q23_truth_or_happiness",weight: 1.8,scores: {活在一个美丽的谎言里: 1,知道一个残酷的真相: -1}}, {qId: "q27_ideal_world",weight: 1.5,scores: {绝对的公平: 1,绝对的自由: -0.5}}, {qId: "q58_joy_source",weight: 1,scores: {与人分享带来的快乐: 1,获得成就带来的喜悦: -1}}, {qId: "q81_accepting_criticism",weight: 1.2,scores: {感到沮丧和自我怀疑: 1,本能地想要辩护: -0.5,反思其中有价值的部分: -1}}, ],
        };
        const KEYWORD_RULES = {
            extrovert_vs_introvert: {q14_spirit_animal: {狮: 1,狗: 1,海豚: 1,狼: 0.5,燕子: 0.5,猫: -1,狐狸: -0.5,鲸: -1,猫头鹰: -1},q20_fictional_friend: {社交: 1,朋友: 1,派对: 1,独处: -1,思考: -1,安静: -1,内向: -1,外向: 1},},
            feeling_vs_thinking: {q11_scent_memory: {花: 1,雨: 1,阳光: 1,海: 1,面包: 0.5,泥土: 0.5,书: -0.5,墨香: -0.5},q17_dream_job: {情绪调酒师: 1,梦境设计师: 1,星际植物学家: -0.5,时光旅行导游: 0.5},q54_crying_reason: {感动: 1,委屈: 0.5,压力: 0.5,喜极而泣: 1},},
        };
        const PROFILES = {
            explorer_high: {tag: "天生的探险家",desc: "你的血液里流淌着对未知的好奇。比起按部就班，你更享受随性而至的惊喜，世界的每一个角落都是你等待发现的宝藏。"},
            guardian_high: {tag: "沉稳的守护者",desc: "你珍视稳定与秩序，是值得信赖的计划者。对你而言，可预见的安稳生活本身就是一种最深切的幸福。"},
            extrovert_high: {tag: "耀眼的社交新星",desc: "你从与他人的互动中汲取能量，是天生的派对核心。你的热情和活力，能轻易点亮周围的每一个人。"},
            introvert_high: {tag: "宁静的内心漫游者",desc: "你享受独处的时光，丰富的内心世界是你最宝贵的财富。比起外界的喧嚣，你更愿意聆听自己灵魂深处的声音。"},
            feeling_high: {tag: "浪漫的感性艺术家",desc: "你用直觉和情感来感受世界，对美有着天生的敏感。你的决策往往跟随着内心的感觉，而非冰冷的逻辑。"},
            thinking_high: {tag: "冷静的理性思考者",desc: "你习惯用逻辑和分析来解决问题，是出色的策略家。在你眼中，世界像一个精密的仪器，等待着被理解和优化。"},
            explorer_feeling: {tag: "自由的吟游诗人",desc: "你既是探索未知的冒险家，也是追随内心的艺术家。对你来说，生活是一场充满即兴创作的壮丽旅程。"},
            guardian_thinking: {tag: "可靠的智慧顾问",desc: "你将理性的思辨与对稳定的追求完美结合。你是朋友眼中最可靠的军师，总能给出周全而明智的建议。"},
            balanced_soul: {tag: "和谐的平衡主义者",desc: "你在多个维度上都展现出了惊人的平衡感。既能拥抱变化，也懂得珍惜安稳；既享受社交，也需要独处。你是一个复杂而迷人的多面体。"},
        };
        const analyze = (data) => {
            const scores = {explorer_vs_guardian: 0,extrovert_vs_introvert: 0,feeling_vs_thinking: 0};
            for (const dim in SCORING_RULES) { SCORING_RULES[dim].forEach((rule) => { const answer = data[rule.qId]; if (answer) { if (rule.dynamicScore && typeof rule.dynamicScore === "function") scores[dim] += rule.dynamicScore(answer) * rule.weight; else if (rule.scores && typeof rule.scores === "object" && rule.scores[answer] !== undefined) scores[dim] += rule.scores[answer] * rule.weight; } }); }
            for (const dim in KEYWORD_RULES) { for (const qId in KEYWORD_RULES[dim]) { const answer = data[qId]?.toLowerCase() || ""; if (answer) { for (const keyword in KEYWORD_RULES[dim][qId]) { if (answer.includes(keyword.toLowerCase())) scores[dim] += KEYWORD_RULES[dim][qId][keyword]; } } } }
            const sortedDimensions = Object.entries(scores).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
            const getProfileKey = (dim, score) => { const threshold = 3.5; if (Math.abs(score) < threshold) return null; const [dim1, dim2] = dim.split("_vs_"); return score > 0 ? dim1 : dim2; };
            const primaryDimName = sortedDimensions[0][0];
            const primaryDimScore = sortedDimensions[0][1];
            const secondaryDimName = sortedDimensions[1][0];
            const secondaryDimScore = sortedDimensions[1][1];
            const primaryProfile = getProfileKey(primaryDimName, primaryDimScore);
            const secondaryProfile = getProfileKey(secondaryDimName, secondaryDimScore);
            const compositeKey = [primaryProfile, secondaryProfile].sort().join("_");
            if (PROFILES[compositeKey]) { return {primary: PROFILES[compositeKey],secondary: null}; }
            return {primary: PROFILES[`${primaryProfile}_high`] || PROFILES["balanced_soul"],secondary: secondaryProfile && secondaryProfile !== primaryProfile ? PROFILES[`${secondaryProfile}_high`] : null,};
        };
        return { analyze };
    })();

    const showEgg = () => {
        if (!eggContainer || !eggText || !rerollEggBtn || !surveyData) return;
        const eggPool = {q1_beverage: (answer) => `需要提神时，你首选“${answer}”，这很符合你的风格！☕`,q2_travel_prep: (answer) => `一场说走就走的旅行，你最先打包的是“${answer}”，是个有备之人！🎒`,q3_rainy_day_feeling: (answer) => `窗外下雨时你感觉“${answer}”，看来对生活有独特的感受。🌧️`,q4_party_role: (answer) => `在派对上，你更可能是“${answer}”，社交定位明确！🥳`,q5_book_or_movie: (answer) => `好故事你偏爱“${answer}”方式体验，是个深度内容爱好者！📖`,q7_room_style: (answer) => `你理想的居住空间是“${answer}”风格，品味独特！🏡`,q8_music_for_focus: (answer) => `专注时你偏爱“${answer}”作为背景音，专注力惊人！🎧`,q9_art_preference: (answer) => `在博物馆里，“${answer}”最吸引你，你有一双发现美的眼睛。🖼️`,q10_fashion_statement: (answer) => `对你而言，穿衣打扮更重要的是“${answer}”，活出自我！👗`,q11_scent_memory: (answer) => `“${answer}”的气味能唤起你温暖的回忆，真是个有故事的人。👃`,q12_city_or_nature: (answer) => `你希望墙上挂“${answer}”的画，审美独特！🌆🌳`,q13_superpower_choice: (answer) => `如果可以，你希望拥有“${answer}”的超能力，真是个有趣的选择！✨`,q14_spirit_animal: (answer) => `“${answer}”代表你的内在灵魂，看来你很有灵性。🦊🐳`,q15_doodle_habit: (answer) => `开会走神时你爱画“${answer}”，这是你的专属思考模式！✍️`,q16_new_word: (answer) => `你创造的新词用来形容“${answer}”，真有创意！💡`,q17_dream_job: (answer) => `你最想从事的梦幻职业是“${answer}”，勇敢追梦！🧑‍🚀`,q18_window_view: (answer) => `你希望窗外是“${answer}”的景象，向往自由。🌌`,q19_magic_item: (answer) => `如果能得到，你希望拥有“${answer}”这件魔法道具，很实用！🎒`,q20_fictional_friend: (answer) => `你最想和“${answer}”成为朋友，看来你们会有很多共同语言！🤝`,q21_life_motto: (answer) => `你的信条是“${answer}”，这指引着你的人生方向。🧭`,q22_luck_or_effort: (answer) => `你认为成功更多取决于“${answer}”，信念坚定！💪`,q23_truth_or_happiness: (answer) => `如果必须二选一，你选择“${answer}”，真是个深思熟虑的人。🤔`,q24_past_or_future: (answer) => `你的思绪更常停留在“${answer}”，是个有情怀的人。⏳`,q25_knowledge_or_experience: (answer) => `你更倾向于通过“${answer}”学习，学以致用！📚`,q26_meaning_of_life: (answer) => `对你而言，人生的意义在于“${answer}”，非常有深度。💖`,q27_ideal_world: (answer) => `你理想中的世界，更重要的是“${answer}”，追求宏大目标。🌍`,q28_regret_type: (answer) => `你更容易为“${answer}”感到后悔，这很真实。😔`,q29_wisdom_source: (answer) => `你觉得智慧更多来源于“${answer}”，是个善于学习的人。🧠`,q30_forgive_or_forget: (answer) => `面对伤害，你的处理方式更接近“${answer}”，心胸宽广。❤️‍🩹`,q32_friendship_basis: (answer) => `对你来说，深厚友谊的基础是“${answer}”，非常看重人际关系。👯`,q33_conflict_style: (answer) => `与朋友矛盾时，你通常会“${answer}”，是个解决问题的高手。🤝`,q34_group_preference: (answer) => `你更享受“${answer}”的聚会，你很清楚自己想要什么。🎉`,q35_giving_or_receiving: (answer) => `在人际关系中，你更享受“${answer}”，是个有爱心的人。🎁`,q36_listening_style: (answer) => `朋友倾诉时，你更倾向于“${answer}”，是个很好的倾听者。👂`,q37_first_impression: (answer) => `你通常给人的第一印象是“${answer}”，这很符合你的气质。👤`,q38_reply_speed: (answer) => `你收到消息的回复习惯是“${answer}”，是高效的沟通者。⚡`,q39_alone_vs_lonely: (answer) => `你对“独处”和“孤独”的理解是“${answer}”，洞察力深刻。🧘`,q40_love_language: (answer) => `你最偏爱的“爱的语言”是“${answer}”，真情流露。🥰`,q41_morning_or_night: (answer) => `你觉得自己是“${answer}”，早睡早起还是夜猫子？⏰`,q42_workspace_style: (answer) => `你的工作桌面通常是“${answer}”，反映了你的风格。🖥️`,q43_food_explorer: (answer) => `点外卖时你倾向于“${answer}”，是个冒险家！🍔`,q44_digital_organization: (answer) => `你的手机应用组织方式是“${answer}”，很有个性！📱`,q45_information_source: (answer) => `你获取资讯的主要渠道是“${answer}”，是个信息灵通人士。📰`,q46_saving_habit: (answer) => `你的消费习惯更接近“${answer}”，是个理财小能手。💰`,q47_perfect_weekend: (answer) => `一个完美的周末必须包含“${answer}”，会享受生活！✨`,q48_memory_keeping: (answer) => `你通过“${answer}”记录生活，很有纪念意义。📸`,q49_unplug_way: (answer) => `当你想抽离电子世界时，会选择“${answer}”，注重身心健康。🧘‍♀️`,q50_holiday_preference: (answer) => `对于假期，你更喜欢“${answer}”，是个热爱生活的人！✈️`,q51_stress_relief: (answer) => `感到压力大时，你首选“${answer}”来解压，非常有效！😌`,q52_nostalgia_trigger: (answer) => `“${answer}”最容易让你陷入怀旧情绪，很有情怀。🕰️`,q54_crying_reason: (answer) => `你上次流泪更可能是因为“${answer}”，情感丰富。😢`,q55_energy_source: (answer) => `让你感到“充电”的活动是“${answer}”，找到了能量源泉！🔋`,q56_self_talk: (answer) => `你的内心对话风格更接近“${answer}”，是个自律的人。🗣️`,q57_anger_expression: (answer) => `当你生气时，你的表现更倾向于“${answer}”，真实面对情绪。😠`,q58_joy_source: (answer) => `“${answer}”的快乐对你来说更持久，是个分享家！🥳`,q59_facing_fear: (answer) => `面对恐惧，你的第一反应是“${answer}”，是个勇敢的人。🦁`,q60_inner_child: (answer) => `你内心的“小孩”最喜欢“${answer}”，童心未泯！👶`,q61_guilty_pleasure: (answer) => `你最大的“罪恶快感”是“${answer}”，嘿嘿，小秘密被发现了！🤫`,q62_phone_wallpaper: (answer) => `你的手机壁纸是“${answer}”，非常有个人风格。📱`,q63_go_to_karaoke_song: (answer) => `去KTV，你的必点曲目风格是“${answer}”，点燃气氛！🎤`,q64_first_app_morning: (answer) => `早上醒来你最先打开“${answer}”App，是个信息灵通的人。📰`,q65_weird_skill: (answer) => `你有个“${answer}”的隐藏技能，太酷了！✨`,q66_collecting_habit: (answer) => `你有收藏“${answer}”的习惯，是个有情怀的人。📮`,q67_ideal_superpower_in_life: (answer) => `生活中的“微超能力”你希望是“${answer}”，愿望很实际！🌟`,q68_sleep_position: (answer) => `你的常用睡姿是“${answer}”，睡得舒服最重要。😴`,q69_beverage_temperature: (answer) => `喝东西你更偏爱“${answer}”的，味蕾独特。🧊☕`,q70_window_seat_or_aisle: (answer) => `坐飞机或火车你选“${answer}”，是个注重体验的人。🪟🚶‍♂️`,q72_playlist_or_album: (answer) => `听音乐你更习惯“${answer}”，是个有品味的人。🎶`,q73_old_item_handling: (answer) => `对于旧物你倾向于“${answer}”，处理方式干脆利落。🗑️`,q74_game_preference: (answer) => `如果玩游戏，你更喜欢“${answer}”类型，是个有策略的人。🎮`,q75_emoji_style: (answer) => `你最常用的表情包风格是“${answer}”，是个有趣的灵魂！😂`,q76_problem_solving: (answer) => `遇到复杂问题，你第一步是“${answer}”，雷厉风行！🚀`,q77_learning_style: (answer) => `学习新东西时，“${answer}”对你最有效，效率专家！📈`,q78_big_picture_or_details: (answer) => `你的思维模式更倾向于“${answer}”，高屋建瓴或细致入微。🧐`,q79_comfort_zone: (answer) => `关于“舒适区”，你认为“${answer}”，观念深刻！💡`,q80_multitasking: (answer) => `你更习惯“${answer}”的工作模式，效率高手！🎯`,q81_accepting_criticism: (answer) => `收到批评时，你第一反应是“${answer}”，心胸开阔！👂`,q82_new_idea_source: (answer) => `你的新点子通常来源于“${answer}”，灵感迸发！✨`,q83_rule_follower_or_breaker: (answer) => `面对规则，你天性是“${answer}”，是个有原则的人！📜`,q84_information_trust: (answer) => `对于新信息，你更倾向于“${answer}”，判断力强！⚖️`,q85_decision_regret: (answer) => `做完决定后，你“${answer}”容易感到后悔，心态成熟。😊`,q86_dinner_with_anyone: (answer) => `如果能和“${answer}”共进晚餐，这一定是一场思想的盛宴！🍽️`,q87_one_day_as_someone_else: (answer) => `如果能体验一天别人的人生，你选“${answer}”，充满好奇！💫`,q88_message_in_a_bottle: (answer) => `你希望漂流瓶里是“${answer}”，内心充满渴望！📜`,q89_perfect_memory: (answer) => `你希望永久保存“${answer}”这段记忆，非常珍贵！💖`,q90_last_day_on_earth: (answer) => `如果明天是世界末日，今天你选择“${answer}”，真实面对生命。🌎`,q91_ideal_age: (answer) => `你认为人生最美好的年龄阶段是“${answer}”，珍惜当下！🌸`,q92_history_witness: (answer) => `你希望穿越回去见证“${answer}”这个历史瞬间，胸怀天下！🏛️`,q93_ideal_teacher: (answer) => `你理想中的“老师”或“导师”是“${answer}”，明师难求！🧑‍🏫`,q94_life_as_a_book: (answer) => `你的人生结局是“${answer}”，充满哲思！📖`,q95_ultimate_freedom: (answer) => `对你来说，“终极的自由”意味着“${answer}”，向往极致。🕊️`,q96_epitaph: (answer) => `你希望墓志铭上写“${answer}”，真是个有趣的人！🪦`,q97_legacy: (answer) => `你希望留给世界最重要的东西是“${answer}”，胸怀大志！🌍`,q98_define_success: (answer) => `你定义“成功的人生”是“${answer}”，很有自己的见解。🏆`,q99_one_question_to_universe: (answer) => `如果能向宇宙问一个问题，你问“${answer}”，深邃的灵魂！🌌`,q100_final_words: (answer) => `恭喜完成！你选择“${answer}”结束这次探索，完美收官！🎉`,};

        currentAvailableEggs = Object.keys(eggPool).filter((key) => surveyData[key] && String(surveyData[key]).trim() !== "");

        if (currentAvailableEggs.length > 0) {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * currentAvailableEggs.length);
            } while (currentAvailableEggs.length > 1 && randomIndex === lastDisplayedEggIndex);
            const randomEggKey = currentAvailableEggs[randomIndex];
            lastDisplayedEggIndex = randomIndex;
            eggText.textContent = eggPool[randomEggKey](surveyData[randomEggKey]);
            eggContainer.style.display = "block";
            rerollEggBtn.style.display = currentAvailableEggs.length > 1 ? "flex" : "none";
        } else {
            eggContainer.style.display = "none";
        }
    };

    const showElementGradually = (element, delay, displayType = 'block') => {
        if (element) {
            setTimeout(() => {
                element.style.display = displayType;
                setTimeout(() => element.classList.add("is-visible"), 50);
            }, delay);
        }
    };

    const processSurveyData = (data) => {
        surveyData = data;
        const { primary, secondary } = personalityAnalyzer.analyze(surveyData);
        if (primary && personalityTagEl && personalityDescEl) {
            personalityTagEl.textContent = primary.tag;
            personalityDescEl.textContent = primary.desc;
            if (secondary && secondaryPersonalityEl) {
                secondaryPersonalityEl.textContent = `同时，你似乎也带有一点「${secondary.tag}」的特质。`;
                secondaryPersonalityEl.style.display = "block";
            } else if (secondaryPersonalityEl) {
                secondaryPersonalityEl.style.display = "none";
            }
        }
        showEgg();
    };

    const renderPage = async () => {
        if (status === "success" && surveyId) {
            updateStatus('fa-satellite-dish', '正在从仓库中检索你的档案...');

            loadingTimeout = setTimeout(() => {
                updateStatus('fa-gauge-high', '数据量较大，正在加速检索，请稍候...');
            }, 2500);

            try {
                let fetchedData = null;
                const storedData = sessionStorage.getItem('lastSurveyData');
                if (storedData) {
                    fetchedData = JSON.parse(storedData);
                    sessionStorage.removeItem('lastSurveyData');
                } else {
                    const response = await fetch(`/api/get-survey.mjs?id=${surveyId}${surveyToken ? `&token=${surveyToken}` : ''}`);
                    if (!response.ok) throw new Error("无法获取刚提交的数据");
                    fetchedData = await response.json();
                }

                clearTimeout(loadingTimeout);
                updateStatus('fa-check-circle', '档案检索成功！正在生成报告...', 'success');

                processSurveyData(fetchedData);

                const staggeredDelay = 200;
                let currentDelay = 0;

                showElementGradually(personalityCard, currentDelay);
                currentDelay += staggeredDelay;

                if (eggContainer && currentAvailableEggs.length > 0) {
                     showElementGradually(eggContainer, currentDelay);
                     currentDelay += staggeredDelay;
                } else {
                    eggContainer.style.display = 'none';
                }

                showElementGradually(actionsContainer, currentDelay, 'grid');
                currentDelay += staggeredDelay;

                showElementGradually(backAction, currentDelay, 'inline-block');

            } catch (error) {
                clearTimeout(loadingTimeout);
                window.location.replace(`/status/error.html?message=${encodeURIComponent(`数据加载失败：${error.message || "无法获取你的提交结果。"}`)}`);
            }
        } else {
            window.location.replace(`/status/error.html?message=${encodeURIComponent(message || "提交过程中发生未知错误。")}`);
        }
    };

    const setupActions = () => {
        if (!surveyId) return;

        const exclusiveLink = `${window.location.origin}/viewer.html?id=${surveyId}${surveyToken ? `&token=${surveyToken}` : ''}`;
        if (exclusiveSurveyLinkEl) exclusiveSurveyLinkEl.textContent = exclusiveLink;
        if (copyExclusiveLinkBtn) copyExclusiveLinkBtn.addEventListener("click", () => copyToClipboard(exclusiveLink, copyExclusiveLinkBtn));
        if (viewMySubmissionBtn) viewMySubmissionBtn.addEventListener("click", () => window.open(exclusiveLink, "_blank"));

        if (startCompareBtn) {
            startCompareBtn.addEventListener("click", () => {
                const otherInput = compareLinkInput.value.trim();
                if (!otherInput) {
                    alert("请输入对方的问卷专属链接或ID。");
                    compareLinkInput.focus();
                    return;
                }
                const parsedOther = parseSurveyLink(otherInput);
                if (parsedOther.error) {
                    alert(`对方链接解析失败：${parsedOther.error}`);
                    compareLinkInput.focus();
                    return;
                }
                window.open(`/compare.html?id1=${surveyId}&token1=${surveyToken || ''}&id2=${parsedOther.id}${parsedOther.token ? `&token2=${parsedOther.token}` : ''}`, "_blank");
            });
        }

        if (generateCompareLinkBtn) {
            generateCompareLinkBtn.addEventListener("click", () => {
                const compareUrl = `${window.location.origin}/compare.html?id1=${surveyId}${surveyToken ? `&token1=${surveyToken}` : ''}`;
                navigator.clipboard.writeText(compareUrl).then(
                    () => alert("你的专属对比链接已复制！\n\n快把它发给你的朋友，等TA填写完自己的问卷后，打开这个链接并输入TA的问卷专属链接，就可以开始对比啦！"),
                    () => alert("复制失败，请手动复制。")
                );
            });
        }
        
        if (rerollEggBtn) rerollEggBtn.addEventListener("click", showEgg);
        if (goToMbtiAnalysisBtn) goToMbtiAnalysisBtn.addEventListener("click", () => window.open(`/mbti.html?id=${surveyId}${surveyToken ? `&token=${surveyToken}` : ''}`, "_blank"));
    };

    const init = () => {
        if (status === "success") {
            updateStatus('fa-spinner fa-spin', '正在校验你的时空坐标...');
            renderPage();
            setupActions();
        } else {
            renderPage();
        }
    };
    
    init();
});