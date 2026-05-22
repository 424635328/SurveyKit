// SurveyKit — Soul Portrait Result Page
document.addEventListener("DOMContentLoaded", () => {

  // === DOM REFS ===
  const $ = (id) => document.getElementById(id);
  const starCanvas = $('star-canvas');
  const statusBar = $('status-bar');
  const heroSection = $('hero-section');
  const characterSvg = $('character-svg');
  const personalityBadge = $('personality-badge');
  const personalityTitle = $('personality-title');
  const personalitySubtitle = $('personality-subtitle');
  const personalityTraits = $('personality-traits');
  const radarSection = $('radar-section');
  const radarCanvas = $('radar-canvas');
  const radarLegend = $('radar-legend');
  const eggSection = $('egg-section');
  const eggText = $('egg-text');
  const rerollEggBtn = $('reroll-egg-btn');
  const actionsSection = $('actions-section');
  const backLink = $('back-link');
  const exclusiveSurveyLinkEl = $('exclusive-survey-link');
  const copyExclusiveLinkBtn = $('copy-exclusive-link-btn');
  const viewMySubmissionBtn = $('viewMySubmissionBtn');
  const goToMbtiAnalysisBtn = $('goToMbtiAnalysisBtn');
  const compareLinkInput = $('compareLinkInput');
  const startCompareBtn = $('startCompareBtn');
  const generateCompareLinkBtn = $('generateCompareLinkBtn');

  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  const surveyId = params.get("id");
  const surveyToken = params.get("token");
  const message = params.get("message");

  let surveyData = null;
  let personalityResult = null;

  // === STATUS BAR ===
  function setStatus(icon, text, cls) {
    if (!statusBar) return;
    statusBar.innerHTML = `<i class="fas fa-${icon} ${cls || ''}"></i><span>${text}</span>`;
  }

  // === REVEAL HELPER ===
  function reveal(el, display) {
    if (!el) return;
    el.style.display = display || 'block';
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  }

  // === STARFIELD ===
  if (starCanvas) {
    const ctx = starCanvas.getContext('2d');
    let stars = [], animId;
    function resize() { starCanvas.width = window.innerWidth; starCanvas.height = document.body.scrollHeight; }
    function seed() {
      stars = [];
      const n = Math.floor((starCanvas.width * starCanvas.height) / 7000);
      for (let i = 0; i < n; i++) stars.push({
        x: Math.random() * starCanvas.width, y: Math.random() * starCanvas.height,
        r: Math.random() * 1.6 + .4, vx: (Math.random() - .5) * .08, vy: (Math.random() - .5) * .08,
        o: Math.random() * .5 + .5
      });
    }
    function draw() {
      ctx.clearRect(0, 0, starCanvas.width, starCanvas.height);
      stars.forEach(s => {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0 || s.x > starCanvas.width) s.vx *= -1;
        if (s.y < 0 || s.y > starCanvas.height) s.vy *= -1;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.o})`; ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    }
    resize(); seed(); draw();
    window.addEventListener('resize', () => { cancelAnimationFrame(animId); resize(); seed(); draw(); });
  }

  // === COPY ===
  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i>';
      btn.style.background = '#10b981';
      setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 1800);
    }).catch(() => alert('复制失败，请手动复制。'));
  }

  // ===================================================================
  // SVG CARTOON CHARACTERS
  // ===================================================================
  const characterDefs = {
    explorer: {
      colors: { skin: '#fcd9b8', hair: '#6b3a2a', top: '#f59e0b', accent: '#d97706', eye: '#1e293b' },
      traits: ['好奇心', '冒险精神', '即兴', '开放心态'],
      svg: () => `
        <defs><radialGradient id="bgGrad" cx="50%" cy="40%"><stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fde68a"/></radialGradient></defs>
        <circle cx="150" cy="145" r="115" fill="url(#bgGrad)" opacity=".2"/>
        <!-- body -->
        <rect x="115" y="200" width="70" height="80" rx="20" fill="#f59e0b"/>
        <rect x="100" y="210" width="30" height="55" rx="12" fill="#d97706"/>
        <rect x="170" y="210" width="30" height="55" rx="12" fill="#d97706"/>
        <!-- backpack -->
        <rect x="185" y="195" width="35" height="50" rx="10" fill="#92400e"/>
        <rect x="190" y="200" width="12" height="18" rx="4" fill="#b45309"/>
        <!-- head -->
        <circle cx="150" cy="150" r="48" fill="#fcd9b8"/>
        <ellipse cx="165" cy="145" rx="14" ry="18" fill="#fcd9b8" opacity=".7"/>
        <!-- hair -->
        <ellipse cx="150" cy="118" rx="55" ry="28" fill="#6b3a2a"/>
        <ellipse cx="130" cy="120" rx="18" ry="24" fill="#6b3a2a"/>
        <!-- eyes -->
        <ellipse cx="136" cy="148" rx="7" ry="8" fill="white"/>
        <ellipse cx="164" cy="148" rx="7" ry="8" fill="white"/>
        <circle cx="138" cy="149" r="4.5" fill="#1e293b"/>
        <circle cx="166" cy="149" r="4.5" fill="#1e293b"/>
        <circle cx="139" cy="147" r="1.8" fill="white"/>
        <circle cx="167" cy="147" r="1.8" fill="white"/>
        <!-- smile -->
        <path d="M138 165 Q150 178 162 165" fill="none" stroke="#b45309" stroke-width="2.5" stroke-linecap="round"/>
        <!-- map in hand -->
        <rect x="88" y="235" width="28" height="20" rx="2" fill="#fef3c7" transform="rotate(-8 102 245)"/>
        <line x1="95" y1="240" x2="110" y2="238" stroke="#d97706" stroke-width="1"/>
        <line x1="95" y1="245" x2="110" y2="243" stroke="#d97706" stroke-width="1"/>
        <!-- compass -->
        <circle cx="210" cy="170" r="12" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
        <line x1="210" y1="162" x2="210" y2="178" stroke="#b45309" stroke-width="1.5"/>
        <line x1="202" y1="170" x2="218" y2="170" stroke="#b45309" stroke-width="1.5"/>
      `
    },
    guardian: {
      colors: { skin: '#f5d5b8', hair: '#334155', top: '#3b82f6', accent: '#1d4ed8', eye: '#0f172a' },
      traits: ['可靠', '秩序', '稳重', '守护'],
      svg: () => `
        <defs><radialGradient id="bgGrad" cx="50%" cy="40%"><stop offset="0%" stop-color="#dbeafe"/><stop offset="100%" stop-color="#93c5fd"/></radialGradient></defs>
        <circle cx="150" cy="145" r="115" fill="url(#bgGrad)" opacity=".2"/>
        <!-- shield behind -->
        <path d="M150 185 L120 215 L120 250 L150 270 L180 250 L180 215 Z" fill="#1d4ed8" opacity=".15"/>
        <!-- body -->
        <rect x="118" y="200" width="64" height="78" rx="18" fill="#3b82f6"/>
        <rect x="105" y="210" width="26" height="52" rx="10" fill="#1d4ed8"/>
        <rect x="169" y="210" width="26" height="52" rx="10" fill="#1d4ed8"/>
        <!-- head -->
        <circle cx="150" cy="148" r="50" fill="#f5d5b8"/>
        <!-- hair -->
        <ellipse cx="150" cy="115" rx="56" ry="26" fill="#334155"/>
        <rect x="98" y="110" width="104" height="16" rx="8" fill="#334155"/>
        <!-- eyes -->
        <ellipse cx="134" cy="146" rx="7" ry="8" fill="white"/>
        <ellipse cx="166" cy="146" rx="7" ry="8" fill="white"/>
        <circle cx="135" cy="147" r="4.5" fill="#0f172a"/>
        <circle cx="167" cy="147" r="4.5" fill="#0f172a"/>
        <circle cx="136" cy="145" r="1.8" fill="white"/>
        <circle cx="168" cy="145" r="1.8" fill="white"/>
        <!-- calm smile -->
        <path d="M142 168 Q150 176 158 168" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
        <!-- glasses -->
        <circle cx="134" cy="146" r="11" fill="none" stroke="#475569" stroke-width="2"/>
        <circle cx="166" cy="146" r="11" fill="none" stroke="#475569" stroke-width="2"/>
        <line x1="145" y1="146" x2="155" y2="146" stroke="#475569" stroke-width="2"/>
      `
    },
    extrovert: {
      colors: { skin: '#ffdbb5', hair: '#e11d48', top: '#ec4899', accent: '#db2777', eye: '#1e1b4b' },
      traits: ['社交能量', '热情', '表达力', '感染力'],
      svg: () => `
        <defs><radialGradient id="bgGrad" cx="50%" cy="40%"><stop offset="0%" stop-color="#fce7f3"/><stop offset="100%" stop-color="#f9a8d4"/></radialGradient></defs>
        <circle cx="150" cy="145" r="115" fill="url(#bgGrad)" opacity=".2"/>
        <!-- body -->
        <rect x="115" y="200" width="70" height="78" rx="22" fill="#ec4899"/>
        <!-- arms wide open -->
        <ellipse cx="60" cy="235" rx="30" ry="14" fill="#f472b6" transform="rotate(15 60 235)"/>
        <ellipse cx="240" cy="235" rx="30" ry="14" fill="#f472b6" transform="rotate(-15 240 235)"/>
        <!-- legs -->
        <rect x="120" y="272" width="22" height="40" rx="10" fill="#db2777"/>
        <rect x="158" y="272" width="22" height="40" rx="10" fill="#db2777"/>
        <!-- head -->
        <circle cx="150" cy="148" r="48" fill="#ffdbb5"/>
        <!-- hair (big curly) -->
        <ellipse cx="150" cy="112" rx="58" ry="30" fill="#e11d48"/>
        <circle cx="105" cy="125" r="18" fill="#e11d48"/>
        <circle cx="195" cy="125" r="18" fill="#e11d48"/>
        <circle cx="120" cy="108" r="16" fill="#e11d48"/>
        <circle cx="180" cy="108" r="16" fill="#e11d48"/>
        <!-- big smile -->
        <ellipse cx="134" cy="146" rx="7" ry="8" fill="white"/>
        <ellipse cx="166" cy="146" rx="7" ry="8" fill="white"/>
        <circle cx="136" cy="147" r="4.5" fill="#1e1b4b"/>
        <circle cx="168" cy="147" r="4.5" fill="#1e1b4b"/>
        <circle cx="137" cy="145" r="2" fill="white"/>
        <circle cx="169" cy="145" r="2" fill="white"/>
        <path d="M135 165 Q150 185 165 165" fill="#e11d48" opacity=".3"/>
        <path d="M135 164 Q150 182 165 164" fill="none" stroke="#be123c" stroke-width="2.5" stroke-linecap="round"/>
        <!-- sparkles -->
        <text x="230" y="185" font-size="18">✨</text>
        <text x="70" y="180" font-size="14">🌟</text>
      `
    },
    introvert: {
      colors: { skin: '#f5dcc3', hair: '#1e293b', top: '#6366f1', accent: '#4338ca', eye: '#0f172a' },
      traits: ['内省', '深度思考', '宁静', '细腻'],
      svg: () => `
        <defs><radialGradient id="bgGrad" cx="50%" cy="40%"><stop offset="0%" stop-color="#e0e7ff"/><stop offset="100%" stop-color="#a5b4fc"/></radialGradient></defs>
        <circle cx="150" cy="145" r="115" fill="url(#bgGrad)" opacity=".2"/>
        <!-- body -->
        <rect x="120" y="200" width="60" height="76" rx="18" fill="#6366f1"/>
        <rect x="112" y="210" width="22" height="50" rx="9" fill="#4338ca"/>
        <rect x="166" y="210" width="22" height="50" rx="9" fill="#4338ca"/>
        <!-- head -->
        <circle cx="150" cy="150" r="46" fill="#f5dcc3"/>
        <!-- hair (neat) -->
        <ellipse cx="150" cy="118" rx="52" ry="24" fill="#1e293b"/>
        <rect x="100" y="116" width="100" height="12" rx="6" fill="#1e293b"/>
        <!-- glasses -->
        <circle cx="136" cy="148" r="12" fill="none" stroke="#334155" stroke-width="2.5"/>
        <circle cx="164" cy="148" r="12" fill="none" stroke="#334155" stroke-width="2.5"/>
        <line x1="148" y1="148" x2="152" y2="148" stroke="#334155" stroke-width="2.5"/>
        <!-- eyes behind glasses -->
        <circle cx="137" cy="149" r="4" fill="#0f172a"/>
        <circle cx="165" cy="149" r="4" fill="#0f172a"/>
        <circle cx="138" cy="147" r="1.5" fill="white"/>
        <circle cx="166" cy="147" r="1.5" fill="white"/>
        <!-- gentle smile -->
        <path d="M142 166 Q150 173 158 166" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
        <!-- book in hands -->
        <rect x="118" y="235" width="35" height="25" rx="3" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
        <line x1="124" y1="242" x2="147" y2="242" stroke="#94a3b8" stroke-width="1"/>
        <line x1="124" y1="248" x2="147" y2="248" stroke="#94a3b8" stroke-width="1"/>
        <line x1="124" y1="254" x2="140" y2="254" stroke="#94a3b8" stroke-width="1"/>
        <!-- mug -->
        <rect x="178" y="240" width="20" height="22" rx="3" fill="#cbd5e1"/>
        <path d="M198 244 Q206 244 206 251 Q206 258 198 258" fill="none" stroke="#cbd5e1" stroke-width="2.5"/>
        <ellipse cx="188" cy="240" rx="10" ry="2" fill="#e2e8f0"/>
      `
    },
    feeling: {
      colors: { skin: '#ffe0cc', hair: '#a21caf', top: '#d946ef', accent: '#a21caf', eye: '#2e1065' },
      traits: ['感性', '共情', '艺术', '浪漫'],
      svg: () => `
        <defs><radialGradient id="bgGrad" cx="50%" cy="40%"><stop offset="0%" stop-color="#fae8ff"/><stop offset="100%" stop-color="#e9d5ff"/></radialGradient></defs>
        <circle cx="150" cy="145" r="115" fill="url(#bgGrad)" opacity=".2"/>
        <!-- body -->
        <ellipse cx="150" cy="220" rx="40" ry="55" fill="#d946ef"/>
        <!-- arms holding heart -->
        <path d="M115 210 Q100 240 115 250" fill="none" stroke="#c026d3" stroke-width="14" stroke-linecap="round"/>
        <path d="M185 210 Q200 240 185 250" fill="none" stroke="#c026d3" stroke-width="14" stroke-linecap="round"/>
        <!-- heart -->
        <path d="M150 255 C150 240 138 232 131 240 C124 248 135 262 150 275 C165 262 176 248 169 240 C162 232 150 240 150 255Z" fill="#f43f5e"/>
        <!-- legs -->
        <rect x="130" y="265" width="16" height="30" rx="7" fill="#a21caf"/>
        <rect x="154" y="265" width="16" height="30" rx="7" fill="#a21caf"/>
        <!-- head -->
        <circle cx="150" cy="150" r="46" fill="#ffe0cc"/>
        <!-- hair (flowing) -->
        <ellipse cx="150" cy="116" rx="54" ry="28" fill="#a21caf"/>
        <ellipse cx="110" cy="135" rx="16" ry="30" fill="#a21caf"/>
        <ellipse cx="190" cy="135" rx="16" ry="30" fill="#a21caf"/>
        <!-- eyes (wide, dreamy) -->
        <ellipse cx="136" cy="148" rx="8" ry="9" fill="white"/>
        <ellipse cx="164" cy="148" rx="8" ry="9" fill="white"/>
        <circle cx="137" cy="149" r="5" fill="#2e1065"/>
        <circle cx="165" cy="149" r="5" fill="#2e1065"/>
        <circle cx="139" cy="147" r="2.5" fill="white"/>
        <circle cx="167" cy="147" r="2.5" fill="white"/>
        <!-- blush -->
        <ellipse cx="125" cy="157" rx="9" ry="4" fill="#f9a8d4" opacity=".6"/>
        <ellipse cx="175" cy="157" rx="9" ry="4" fill="#f9a8d4" opacity=".6"/>
        <!-- soft smile -->
        <path d="M140 163 Q150 173 160 163" fill="none" stroke="#c026d3" stroke-width="2" stroke-linecap="round" opacity=".7"/>
        <!-- paint palette -->
        <ellipse cx="80" cy="200" rx="22" ry="14" fill="#f5d0fe" transform="rotate(-15 80 200)"/>
        <circle cx="73" cy="195" r="4" fill="#ef4444"/><circle cx="83" cy="192" r="4" fill="#3b82f6"/>
        <circle cx="78" cy="205" r="4" fill="#eab308"/><circle cx="90" cy="203" r="4" fill="#10b981"/>
      `
    },
    thinking: {
      colors: { skin: '#f3d5b5', hair: '#292524', top: '#14b8a6', accent: '#0d9488', eye: '#292524' },
      traits: ['理性', '逻辑', '策略', '洞察'],
      svg: () => `
        <defs><radialGradient id="bgGrad" cx="50%" cy="40%"><stop offset="0%" stop-color="#ccfbf1"/><stop offset="100%" stop-color="#5eead4"/></radialGradient></defs>
        <circle cx="150" cy="145" r="115" fill="url(#bgGrad)" opacity=".15"/>
        <!-- gear decorations -->
        <circle cx="260" cy="180" r="18" fill="none" stroke="#14b8a6" stroke-width="2" opacity=".3">
          <animateTransform attributeName="transform" type="rotate" from="0 260 180" to="360 260 180" dur="12s" repeatCount="indefinite"/>
        </circle>
        <circle cx="40" cy="170" r="12" fill="none" stroke="#14b8a6" stroke-width="1.5" opacity=".25">
          <animateTransform attributeName="transform" type="rotate" from="360 40 170" to="0 40 170" dur="8s" repeatCount="indefinite"/>
        </circle>
        <!-- body -->
        <rect x="120" y="200" width="60" height="76" rx="16" fill="#14b8a6"/>
        <rect x="113" y="210" width="22" height="52" rx="9" fill="#0d9488"/>
        <rect x="165" y="210" width="22" height="52" rx="9" fill="#0d9488"/>
        <!-- head -->
        <circle cx="150" cy="148" r="48" fill="#f3d5b5"/>
        <!-- hair -->
        <ellipse cx="150" cy="118" rx="53" ry="22" fill="#292524"/>
        <rect x="98" y="114" width="104" height="8" rx="4" fill="#292524"/>
        <!-- glasses (square/analytical) -->
        <rect x="122" y="137" width="22" height="16" rx="3" fill="none" stroke="#44403c" stroke-width="2.5"/>
        <rect x="156" y="137" width="22" height="16" rx="3" fill="none" stroke="#44403c" stroke-width="2.5"/>
        <line x1="144" y1="145" x2="156" y2="145" stroke="#44403c" stroke-width="2.5"/>
        <!-- eyes -->
        <circle cx="134" cy="145" r="4" fill="#292524"/>
        <circle cx="168" cy="145" r="4" fill="#292524"/>
        <circle cx="135" cy="143" r="1.5" fill="white"/>
        <circle cx="169" cy="143" r="1.5" fill="white"/>
        <!-- slight confident smirk -->
        <path d="M140 163 Q150 171 160 163" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
        <!-- clipboard -->
        <rect x="195" y="225" width="28" height="32" rx="3" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
        <rect x="200" y="233" width="18" height="2" rx="1" fill="#cbd5e1"/>
        <rect x="200" y="239" width="18" height="2" rx="1" fill="#cbd5e1"/>
        <rect x="200" y="245" width="12" height="2" rx="1" fill="#cbd5e1"/>
        <circle cx="209" cy="228" r="2.5" fill="#94a3b8"/>
      `
    }
  };

  function renderCharacter(type) {
    const def = characterDefs[type] || characterDefs.balanced || characterDefs.explorer;
    if (!characterSvg) return;

    characterSvg.innerHTML = def.svg();

    // Apply personality colors to hero
    const c = def.colors;
    document.querySelector('.hero-glow').style.background =
      `radial-gradient(circle, ${c.accent} 0%, transparent 70%)`;
    personalityBadge.style.background = `${c.accent}20`;
    personalityBadge.style.borderColor = `${c.accent}50`;
    personalityBadge.style.color = c.accent;

    return def;
  }

  // Map analysis result to character type
  function mapToCharacterType(primaryTag) {
    const map = {
      '天生的探险家': 'explorer', '自由的吟游诗人': 'explorer',
      '沉稳的守护者': 'guardian', '可靠的智慧顾问': 'guardian',
      '耀眼的社交新星': 'extrovert',
      '宁静的内心漫游者': 'introvert',
      '浪漫的感性艺术家': 'feeling',
      '冷静的理性思考者': 'thinking',
      '和谐的平衡主义者': 'feeling',
    };
    return map[primaryTag] || 'explorer';
  }

  // ===================================================================
  // RADAR CHART
  // ===================================================================
  function drawRadar(scores) {
    if (!radarCanvas) return;
    const ctx = radarCanvas.getContext('2d');
    const w = 360, h = 360, cx = w / 2, cy = h / 2, r = 130;
    radarCanvas.width = w; radarCanvas.height = h;

    const dims = [
      { key: 'explorer_vs_guardian', label: '探索 ↔ 守护', pos: '探索', neg: '守护', color: '#f59e0b' },
      { key: 'extrovert_vs_introvert', label: '外向 ↔ 内向', pos: '外向', neg: '内向', color: '#ec4899' },
      { key: 'feeling_vs_thinking', label: '感性 ↔ 理性', pos: '感性', neg: '理性', color: '#8b5cf6' },
    ];

    // Normalize to 0-1
    const maxAbs = Math.max(...dims.map(d => Math.abs(scores[d.key])), 5);
    const data = dims.map(d => ({
      ...d,
      value: Math.min(Math.abs(scores[d.key]) / maxAbs, 1),
      direction: scores[d.key] >= 0 ? 1 : -1,
    }));

    // Background grid
    [.25, .5, .75, 1].forEach(level => {
      ctx.beginPath();
      data.forEach((_, i) => {
        const angle = (Math.PI * 2 / data.length) * i - Math.PI / 2;
        const px = cx + Math.cos(angle) * r * level;
        const py = cy + Math.sin(angle) * r * level;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,.06)';
      ctx.stroke();
    });

    // Axis lines
    data.forEach((_, i) => {
      const angle = (Math.PI * 2 / data.length) * i - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.strokeStyle = 'rgba(255,255,255,.1)';
      ctx.stroke();
    });

    // Data fill
    ctx.beginPath();
    data.forEach((d, i) => {
      const angle = (Math.PI * 2 / data.length) * i - Math.PI / 2;
      const dist = r * d.value * d.direction;
      const px = cx + Math.cos(angle) * Math.abs(dist);
      const py = cy + Math.sin(angle) * Math.abs(dist);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots
    data.forEach((d, i) => {
      const angle = (Math.PI * 2 / data.length) * i - Math.PI / 2;
      const dist = r * d.value * d.direction;
      const px = cx + Math.cos(angle) * Math.abs(dist);
      const py = cy + Math.sin(angle) * Math.abs(dist);
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = d.color; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // Labels
    data.forEach((d, i) => {
      const angle = (Math.PI * 2 / data.length) * i - Math.PI / 2;
      const lx = cx + Math.cos(angle) * (r + 28);
      const ly = cy + Math.sin(angle) * (r + 28);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(d.label, lx, ly);
    });

    // Legend
    if (radarLegend) {
      radarLegend.innerHTML = data.map(d =>
        `<div class="radar-legend-item"><span class="radar-legend-dot" style="background:${d.color}"></span>${d.label}: <b style="color:#e2e8f0">${d.direction > 0 ? d.pos : d.neg}</b></div>`
      ).join('');
    }
  }

  // ===================================================================
  // PERSONALITY ANALYZER (from original, slightly cleaned)
  // ===================================================================
  const personalityAnalyzer = (() => {
    const SCORING_RULES = {
      explorer_vs_guardian: [
        {qId:"q2_travel_prep",weight:2,scores:{相机和日记本:1,充电宝和降噪耳机:-1}},
        {qId:"q16_new_word",weight:2.5,scores:{"一种难以言说的美好感觉":1,"一种微妙的社交尴尬":.5,"一种对未来的乐观期待":1.5,"一种独处时的舒适感":-.5}},
        {qId:"q43_food_explorer",weight:1.5,scores:{"尝试没吃过的新品，追求刺激":1,"点熟悉的老几样，安全可靠":-1}},
        {qId:"q71_supermarket_path",weight:1,scores:{"随心所欲，逛遍每个货架":1,按清单直奔主题:-1}},
        {qId:"q79_comfort_zone",weight:2,scores:{"是需要不断打破和走出的地方":1,"是补充能量、提供安全感的港湾":-1}},
        {qId:"q90_last_day_on_earth",weight:1.5,scores:{"去做一件一直想做却没敢做的事":1,和最爱的人待在一起:0,吃遍所有想吃的美食:.5}},
      ],
      extrovert_vs_introvert: [
        {qId:"q31_social_battery",weight:2.5,dynamicScore:v=>(parseInt(v,10)-50)/25},
        {qId:"q4_party_role",weight:1.5,scores:{穿梭于人群中的社交达人:1,在角落安静观察大家的人:-1}},
        {qId:"q34_group_preference",weight:1.8,scores:{一大群人的热闹派对:1,几个密友的深度长谈:-1}},
        {qId:"q38_reply_speed",weight:1,scores:{'看到就回的"秒回怪"':1,'攒到有空再统一回复':-1}},
        {qId:"q49_unplug_way",weight:1.2,scores:{和朋友面对面聊天:1,去户外散步或运动:.5,看一本纸质书:-.5}},
        {qId:"q55_energy_source",weight:1.5,scores:{与志同道合的人深度交流:1,高质量的独处:-1}},
      ],
      feeling_vs_thinking: [
        {qId:"q53_decision_making",weight:2.5,scores:{内心的直觉和第一感觉:1,详尽的数据和利弊分析:-1}},
        {qId:"q3_rainy_day_feeling",weight:1.5,scores:{"终于可以宅家了，很安心":1,"有点打乱计划，略感烦躁":-1}},
        {qId:"q23_truth_or_happiness",weight:1.8,scores:{活在一个美丽的谎言里:1,知道一个残酷的真相:-1}},
        {qId:"q27_ideal_world",weight:1.5,scores:{绝对的公平:1,绝对的自由:-.5}},
        {qId:"q58_joy_source",weight:1,scores:{与人分享带来的快乐:1,获得成就带来的喜悦:-1}},
        {qId:"q81_accepting_criticism",weight:1.2,scores:{感到沮丧和自我怀疑:1,本能地想要辩护:-.5,反思其中有价值的部分:-1}},
      ],
    };
    const KEYWORD_RULES = {
      extrovert_vs_introvert: {
        q14_spirit_animal:{狮:1,狗:1,海豚:1,狼:.5,燕子:.5,猫:-1,狐狸:-.5,鲸:-1,猫头鹰:-1},
        q20_fictional_friend:{社交:1,朋友:1,派对:1,独处:-1,思考:-1,安静:-1,内向:-1,外向:1},
      },
      feeling_vs_thinking: {
        q11_scent_memory:{花:1,雨:1,阳光:1,海:1,面包:.5,泥土:.5,书:-.5,墨香:-.5},
        q17_dream_job:{情绪调酒师:1,梦境设计师:1,星际植物学家:-.5,时光旅行导游:.5},
        q54_crying_reason:{感动:1,委屈:.5,压力:.5,喜极而泣:1},
      },
    };
    const PROFILES = {
      explorer_high:{tag:"天生的探险家",desc:"你的血液里流淌着对未知的好奇。比起按部就班，你更享受随性而至的惊喜，世界的每一个角落都是你等待发现的宝藏。"},
      guardian_high:{tag:"沉稳的守护者",desc:"你珍视稳定与秩序，是值得信赖的计划者。对你而言，可预见的安稳生活本身就是一种最深切的幸福。"},
      extrovert_high:{tag:"耀眼的社交新星",desc:"你从与他人的互动中汲取能量，是天生的派对核心。你的热情和活力，能轻易点亮周围的每一个人。"},
      introvert_high:{tag:"宁静的内心漫游者",desc:"你享受独处的时光，丰富的内心世界是你最宝贵的财富。比起外界的喧嚣，你更愿意聆听自己灵魂深处的声音。"},
      feeling_high:{tag:"浪漫的感性艺术家",desc:"你用直觉和情感来感受世界，对美有着天生的敏感。你的决策往往跟随着内心的感觉，而非冰冷的逻辑。"},
      thinking_high:{tag:"冷静的理性思考者",desc:"你习惯用逻辑和分析来解决问题，是出色的策略家。在你眼中，世界像一个精密的仪器，等待着被理解和优化。"},
      explorer_feeling:{tag:"自由的吟游诗人",desc:"你既是探索未知的冒险家，也是追随内心的艺术家。生活是一场充满即兴创作的壮丽旅程。"},
      guardian_thinking:{tag:"可靠的智慧顾问",desc:"你将理性的思辨与对稳定的追求完美结合，是朋友眼中最可靠的军师。"},
      balanced_soul:{tag:"和谐的平衡主义者",desc:"你在多个维度上都展现出了惊人的平衡感。既能拥抱变化，也懂得珍惜安稳；既享受社交，也需要独处。你是一个复杂而迷人的多面体。"},
    };

    const analyze = (data) => {
      const scores = {explorer_vs_guardian:0,extrovert_vs_introvert:0,feeling_vs_thinking:0};
      for (const dim in SCORING_RULES) {
        SCORING_RULES[dim].forEach(rule => {
          const answer = data[rule.qId];
          if (!answer) return;
          if (rule.dynamicScore) scores[dim] += rule.dynamicScore(answer) * rule.weight;
          else if (rule.scores?.[answer] !== undefined) scores[dim] += rule.scores[answer] * rule.weight;
        });
      }
      for (const dim in KEYWORD_RULES) {
        for (const qId in KEYWORD_RULES[dim]) {
          const answer = (data[qId] || '').toLowerCase();
          if (!answer) continue;
          for (const kw in KEYWORD_RULES[dim][qId]) {
            if (answer.includes(kw.toLowerCase())) scores[dim] += KEYWORD_RULES[dim][qId][kw];
          }
        }
      }
      const sorted = Object.entries(scores).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
      const getKey = (dim, score) => Math.abs(score) < 3.5 ? null : score > 0 ? dim.split('_vs_')[0] : dim.split('_vs_')[1];
      const p1 = getKey(sorted[0][0], sorted[0][1]);
      const p2 = getKey(sorted[1][0], sorted[1][1]);
      const composite = [p1, p2].sort().join('_');
      if (PROFILES[composite]) return {scores, primary: PROFILES[composite], secondary: null};
      return {scores, primary: PROFILES[p1 + '_high'] || PROFILES.balanced_soul, secondary: p2 && p2 !== p1 ? PROFILES[p2 + '_high'] : null};
    };
    return {analyze};
  })();

  // ===================================================================
  // EGG SYSTEM
  // ===================================================================
  const eggPool = {
    q1_beverage:a=>`需要提神时首选「${a}」，这很符合你的风格！☕`,
    q2_travel_prep:a=>`说走就走时最先打包「${a}」，是个有备之人！🎒`,
    q3_rainy_day_feeling:a=>`窗外下雨时感觉「${a}」，对生活有独特感受。🌧️`,
    q4_party_role:a=>`派对上的「${a}」，社交定位明确！🥳`,
    q7_room_style:a=>`理想居住空间是「${a}」风格，品味独特！🏡`,
    q14_spirit_animal:a=>`「${a}」代表你的内在灵魂！🦊`,
    q17_dream_job:a=>`最想从事「${a}」，勇敢追梦！🧑‍🚀`,
    q27_ideal_world:a=>`你理想世界最重要的是「${a}」。🌍`,
    q40_love_language:a=>`最偏爱的爱语是「${a}」，真情流露！🥰`,
    q47_perfect_weekend:a=>`完美周末必须包含「${a}」。✨`,
    q60_inner_child:a=>`内心小孩最喜欢「${a}」，童心未泯！👶`,
    q86_dinner_with_anyone:a=>`想和「${a}」共进晚餐，思想的盛宴！🍽️`,
    q95_ultimate_freedom:a=>`终极自由意味着「${a}」。🕊️`,
    q97_legacy:a=>`希望留给世界「${a}」，胸怀大志！🌍`,
    q100_final_words:a=>`你选择「${a}」结束这次探索。🎉`,
  };

  let currentEggs = [], lastEggIdx = -1;
  function showEgg() {
    if (!eggSection || !eggText || !surveyData) return;
    currentEggs = Object.keys(eggPool).filter(k => surveyData[k] && String(surveyData[k]).trim());
    if (currentEggs.length === 0) { eggSection.style.display = 'none'; return; }
    let idx;
    do { idx = Math.floor(Math.random() * currentEggs.length); } while (currentEggs.length > 1 && idx === lastEggIdx);
    lastEggIdx = idx;
    eggText.textContent = eggPool[currentEggs[idx]](surveyData[currentEggs[idx]]);
    reveal(eggSection);
    if (rerollEggBtn) rerollEggBtn.style.display = currentEggs.length > 1 ? 'inline-flex' : 'none';
  }

  // ===================================================================
  // MAIN RENDER
  // ===================================================================
  async function render() {
    if (status !== 'success' || !surveyId) {
      window.location.replace(`/status/error.html?message=${encodeURIComponent(message || '提交过程中发生未知错误。')}`);
      return;
    }

    setStatus('spinner fa-spin', '正在从数据星河中检索你的档案...');

    try {
      // Fetch data
      let data;
      const cached = sessionStorage.getItem('lastSurveyData');
      if (cached) {
        data = JSON.parse(cached);
        sessionStorage.removeItem('lastSurveyData');
      } else {
        const res = await fetch(`/api/get-survey.mjs?id=${surveyId}${surveyToken ? `&token=${surveyToken}` : ''}`);
        if (!res.ok) throw new Error('无法获取提交数据');
        data = await res.json();
      }
      surveyData = data;

      setStatus('check-circle', '档案检索成功！正在绘制你的灵魂画像...', 'done');

      // Analyze
      const result = personalityAnalyzer.analyze(surveyData);
      personalityResult = result;

      // Render character
      const charType = mapToCharacterType(result.primary.tag);
      const charDef = renderCharacter(charType);

      // Personality text
      personalityTitle.textContent = result.primary.tag;
      personalitySubtitle.textContent = result.primary.desc;
      personalityTraits.innerHTML = charDef.traits.map((t, i) =>
        `<span class="trait-chip${i < 2 ? ' highlight' : ''}">${t}</span>`
      ).join('');

      // Radar
      drawRadar(result.scores);
      // Egg
      showEgg();

      // Reveal all sections with stagger
      setTimeout(() => reveal(heroSection, 'flex'), 200);
      setTimeout(() => { reveal(radarSection); }, 500);
      setTimeout(() => { if (currentEggs.length > 0) reveal(eggSection); }, 800);
      setTimeout(() => reveal(actionsSection, 'grid'), 1000);
      setTimeout(() => reveal(backLink, 'inline-flex'), 1200);

    } catch (err) {
      setStatus('exclamation-triangle', '数据加载失败', '');
      window.location.replace(`/status/error.html?message=${encodeURIComponent(err.message || '无法获取你的提交结果。')}`);
    }
  }

  // ===================================================================
  // ACTION SETUP
  // ===================================================================
  function setupActions() {
    if (!surveyId) return;

    const link = `${window.location.origin}/viewer.html?id=${surveyId}${surveyToken ? `&token=${surveyToken}` : ''}`;
    if (exclusiveSurveyLinkEl) exclusiveSurveyLinkEl.textContent = link;
    if (copyExclusiveLinkBtn) copyExclusiveLinkBtn.addEventListener('click', () => copyText(link, copyExclusiveLinkBtn));
    if (viewMySubmissionBtn) viewMySubmissionBtn.addEventListener('click', () => window.open(link, '_blank'));
    if (goToMbtiAnalysisBtn) goToMbtiAnalysisBtn.addEventListener('click', () => window.open(`/mbti.html?id=${surveyId}${surveyToken ? `&token=${surveyToken}` : ''}`, '_blank'));

    if (startCompareBtn) startCompareBtn.addEventListener('click', () => {
      const raw = compareLinkInput.value.trim();
      if (!raw) return alert('请输入对方的问卷专属链接或ID。');
      let id2 = raw, token2 = null;
      if (raw.startsWith('http')) {
        try { const u = new URL(raw); id2 = u.searchParams.get('id'); token2 = u.searchParams.get('token'); } catch { return alert('链接格式无效。'); }
      }
      if (!id2 || !id2.startsWith('survey_')) return alert('无法从输入中提取有效问卷ID。');
      window.open(`/compare.html?id1=${surveyId}&token1=${surveyToken||''}&id2=${id2}${token2?`&token2=${token2}`:''}`, '_blank');
    });

    if (generateCompareLinkBtn) generateCompareLinkBtn.addEventListener('click', () => {
      const u = `${window.location.origin}/compare.html?id1=${surveyId}${surveyToken?`&token1=${surveyToken}`:''}`;
      copyText(u, generateCompareLinkBtn);
    });

    if (rerollEggBtn) rerollEggBtn.addEventListener('click', showEgg);
  }

  // === INIT ===
  if (status === 'success') {
    setStatus('spinner fa-spin', '正在校验你的时空坐标...');
    render();
    setupActions();
  } else {
    render();
  }
});
