<div align="center">

<img src="./public/favicon.ico" alt="SurveyKit Demo" width="200" />

<h1 align="center">SurveyKit - 你的多用户问卷SaaS平台</h1>
<p align="center">
  一个高度可定制、设计驱动的网页版深度问卷平台。现已进化为支持<b>多用户、多问卷管理</b>的完整解决方案，并集成了AI人格分析与一站式可视化工具集。
  <br />
  它不仅仅是一个表单，更是一次探索和分享思想的仪式。
</p>

<p align="center">
  <a href="https://survey-kit.vercel.app/" target="_blank"><strong>🚀 立即体验</strong></a>
  ·
  <a href="https://github.com/424635328/SurveyKit/issues" target="_blank">报告Bug</a>
  ·
  <a href="https://github.com/424635328/SurveyKit/issues" target="_blank">提出新功能</a>
</p>

<p align="center">
  <a href="https://survey-kit.vercel.app/hub/hub.html" target="_blank"><strong>🛠️ 访问工具中心</strong></a>
  ·
  <a href="https://survey-kit.vercel.app/docs/help.html" target="_blank"><strong>📖 阅读帮助文档</strong></a>
  ·
  <a href="https://survey-kit.vercel.app/docs/roadmap.html" target="_blank"><strong>🔮 查看路线图</strong></a>
</p>

<div align="center">

[![Vercel Deployment](https://img.shields.io/github/deployments/424635328/SurveyKit/production?label=Vercel&logo=vercel&style=for-the-badge)](https://survey-kit.vercel.app/)
[![GitHub Stars](https://img.shields.io/github/stars/424635328/SurveyKit?style=for-the-badge&logo=github&color=FFD700)](https://github.com/424635328/SurveyKit/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Top Language](https://img.shields.io/github/languages/top/424635328/SurveyKit?style=for-the-badge&logo=javascript)](https://github.com/424635328/SurveyKit)

</div>

</div>

---

## ✨ 项目亮点 (Highlights)

SurveyKit 的诞生源于一个简单的想法：**提问，是深入了解一个人的最佳方式**。我们致力于打造一个不仅功能强大，更充满人文关怀的问卷工具。

- ### 🔐 多用户问卷管理系统 (Multi-User & Multi-Survey)

  - **安全的用户认证**: 基于 **JWT** 的安全注册与登录系统，密码使用 `bcrypt` 加盐哈希存储，保障账户安全。
  - **个人问卷中心**: 在用户专属的管理后台，轻松创建、编辑、导入、删除和追踪多套问卷。
  - **专属分享与追踪**: 每套问卷自动生成唯一的分享链接和结果查看页，实时追踪答卷数量。
  - **结果聚合与导出**: 在线聚合分析指定问卷的所有提交结果，并支持一键导出为 **CSV** 格式。

- ### 🛠️ 一站式工具中心 (Tool Hub)

  - **可视化问卷编辑器**: 通过直观的图形界面创建和编辑问卷，支持实时预览，并一键导出/导入多种格式。
  - **主题定制器 (Theme Customizer)**: 实时预览并调整问卷的主色调、背景色、字体等，一键生成主题CSS，打造独特品牌风格。
  - **智能JSON修正器**: 粘贴您的 `questions.json`，自动修复常见错误（如注释、缺引号、尾逗号），确保部署万无一失。
  - **玻璃拟态设计 (Glassmorphism)**: 工具中心等核心页面采用现代化的玻璃拟态设计，搭配流动的**极光背景**，视觉效果出众。

- ### 🎨 极致的用户体验 (UX First)

  - **全局命令面板**: 在任何页面按下 `⌘K` (`Ctrl+K`) 即可唤出高效的命令面板，快速导航至任何功能、工具或文档。
  - **优雅动效与沉浸填写**: 全站采用**循环流式浮现动画**，结合智能题号导航、自动草稿，提供如丝般顺滑的填写体验。
  - **专业文档中心**: 配备**带粘性侧边栏目录**的帮助中心与**安全中心**、**发展路线图**等多个文档页，信息透明，查阅方便。

- ### 🤖 AI 驱动的人格分析

  - **即时生成报告**: 提交问卷后，用户可一键跳转，由**火山方舟大模型**驱动的 AI 将为其生成一份专属、详细的 MBTI 风格人格报告。
  - **沉浸式等待体验**: AI 分析过程采用流式提示，报告生成后也支持逐段打字机效果呈现，有效降低用户等待焦虑。

- ### 📊 优雅的结果呈现与分享 (旧版/单问卷模式)

  - **访谈式结果页**: 将数据渲染成一篇排版精美的访谈录，告别枯燥的数据罗列。
  - **安全找回机制**: 用户可凭提交时留下的邮箱或问卷ID，通过邮件**安全找回**专属链接。
  - **默契度大挑战**: 支持与朋友对比答案，动态计算并展示默契度分数。

---

## 🛠️ 技术栈 (Tech Stack)

| 领域 | 技术 |
| :--- | :--- |
| **前端** | ![HTML5](https://img.shields.io/badge/-HTML5-E34F26?logo=html5&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/-TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white) ![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?logo=javascript&logoColor=black) (ESM) |
| **AI 服务** | ![Volcengine](https://img.shields.io/badge/-Volcano_Ark-CF2E2D.svg?logo=volvo&logoColor=white) (火山方舟) |
| **后端/部署** | ![Vercel](https://img.shields.io/badge/-Vercel-000000?logo=vercel&logoColor=white) & ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white) (Serverless) |
| **数据库** | ![Redis](https://img.shields.io/badge/-Redis-DC382D?logo=redis&logoColor=white) (Vercel KV) |
| **邮件服务** | ![Resend](https://img.shields.io/badge/-Resend-000000.svg?logo=resend&logoColor=white) |
| **核心依赖** | ![Zod](https://img.shields.io/badge/-Zod-3E67B1?logo=zod&logoColor=white) ![bcryptjs](https://img.shields.io/badge/-bcrypt.js-6C42F1?logo=bcrypt&logoColor=white) ![jsonwebtoken](https://img.shields.io/badge/-JWT-000000?logo=jsonwebtokens&logoColor=white) ![Upstash](https://img.shields.io/badge/-Upstash_Ratelimit-16A34A?logo=upstash&logoColor=white) ![SheetJS](https://img.shields.io/badge/-SheetJS-217346?logo=microsoft-excel&logoColor=white) |

---

## 🚀 快速开始 (Getting Started)

想在自己的 Vercel 账号上部署这个项目吗？非常简单！

### 1. Fork & Clone

将仓库 Fork 到你的 GitHub，然后 Clone 到本地。

```bash
git clone https://github.com/YOUR_USERNAME/SurveyKit.git
cd SurveyKit
```

### 2. 安装依赖

```bash
npm install
```

### 3. 设置环境变量

在 Vercel 项目设置的 **"Environment Variables"** 中，添加以下密钥：

- `JWT_SECRET`: `一个用于签发用户令牌的强密钥 (例如，使用 openssl rand -hex 32 生成)`
- `ARK_API_KEY`: `你的火山引擎API Key` (用于AI服务)
- `RESEND_API_KEY`: `你的Resend API Key` (用于发送邮件)
- `SENDER_EMAIL`: `你的Resend验证过的发送邮箱地址` (例如 `onboarding@resend.dev`)
- `ADMIN_TOKEN`: `你设置的一个长而随机的管理员密钥` (用于旧版API的后门访问，请保密)

### 4. 部署到 Vercel (关键步骤)

1. 登录 Vercel，从你的 GitHub 导入你 Fork 的仓库。
2. 在 **"Project Settings" -> "General"** 中，找到 **"Root Directory"** 设置。
3. **将根目录修改为 `public`**。这是最关键的一步。
4. 框架预设 (Framework Preset) 应自动识别为 **"Other"**。
5. 在 **"Storage"** 标签页创建一个新的 KV 数据库并连接到项目。
6. 点击 **"Deploy"**。

部署完成后，Vercel 会将 `public` 目录作为网站根目录来提供服务，所有链接都将正常工作！

---

## 🎨 创建你的问卷 (Creating Your Survey)

### 方式一：使用多问卷管理系统 (推荐)

1. 访问你部署好的项目，点击右上角或工具中心进入**登录/注册**页面。
2. 注册并登录你的账户。
3. 系统将自动跳转到**问卷管理中心** (`/hub/toolchain/management.html`)。
4. 点击 **“创建新问卷”** 进入可视化编辑器，或点击 **“导入问卷”** 上传一个 `JSON` 文件。
5. 创建完成后，你将在管理中心看到你的新问卷。
6. 点击问卷卡片上的 **“分享”** 按钮，即可获得专属的问卷链接进行分发。
7. 点击 **“查看结果”**，即可在线分析数据或将其导出为 CSV 文件。

### 方式二：静态单问卷部署 (传统方式)

如果你只需要一个简单的、无需登录的静态问卷，可以沿用传统方式：

1. 在本地项目中，直接修改 `public/questions.json` 文件。
2. 确保添加一个用于**收集用户邮箱的问题**（`id` 为 `q_email`）以启用“找回链接”功能。
3. 将修改后的代码重新部署到 Vercel。访问 `https://your-app-url/survey.html` 即为你的问卷。

---

## 🔐 安全性 (Security)

SurveyKit 致力于保障用户数据的隐私与安全。我们相信透明是建立信任的基石。

- **用户认证与授权**: 采用行业标准的 JWT 进行会话管理，用户密码通过 `bcrypt` 加盐哈希安全存储。用户只能访问和管理自己名下的问卷数据。
- **Serverless 架构**: 部署在 Vercel 环境，自动处理基础设施安全更新，减少传统服务器风险。
- **API 速率限制与授权**: 所有关键后端 API 均实施了速率限制和严格的授权检查，有效抵御自动化攻击和未授权访问。
- **严格的输入校验**: 前后端均采用 `Zod` 进行严格的数据输入校验，防止注入攻击和恶意数据。
- **XSS 防护**: 所有用户生成内容在渲染时都经过严格的 HTML 转义，彻底杜绝跨站脚本攻击 (XSS) 风险。
- **凭证安全**: 所有敏感密钥均通过 Vercel 环境变量安全管理，绝不暴露在代码库中。

> 想了解更多细节？请访问我们的 **[安全中心文档](./public/docs/security.html)**。

---

## 📁 项目结构 (Project Structure)

项目结构已扩展以支持多用户功能，所有前端静态文件均位于 `public` 目录下，后端 API 位于独立的 `api` 目录。

```
/ (项目根目录)
├── public/                 # (Vercel 部署的根目录)
│   ├── index.html, survey.html, etc.
│   ├── search.html         # 🆕 全局搜索页
│   ├── hub/
│   │   ├── hub.html
│   │   ├── login.html      # 🆕 用户登录/注册页
│   │   ├── custom-questions/ # 可视化问卷编辑器
│   │   └── toolchain/
│   │       ├── management.html # 🆕 问卷管理中心
│   │       ├── results.html    # 🆕 问卷结果查看页
│   │       ├── share.html      # 🆕 问卷分享页
│   │       ├── customizer.html # 🆕 主题定制器
│   │       └── validator.html  # 智能JSON校验器
│   ├── docs/
│   │   ├── help.html
│   │   ├── security.html # 🆕 安全中心文档
│   │   └── roadmap.html  # 🆕 发展路线图
│   └── ... (其他页面和资源)
│
├── api/                    # Vercel Serverless Functions
│   ├── auth.mjs            # 🆕 用户认证 (登录/注册)
│   ├── surveys.mjs         # 🆕 问卷管理 (获取/删除)
│   ├── upload-survey.mjs   # 🆕 上传/创建新问卷
│   ├── get-public-survey.mjs # 🆕 获取公开问卷信息
│   ├── get-results.mjs     # 🆕 获取问卷结果 (需授权)
│   ├── save.mjs            # (旧) 保存单问卷答案
│   ├── get-survey.mjs      # (旧) 获取单问卷答案
│   ├── analyze-mbti.mjs    # AI分析
│   └── recover-link.mjs    # (旧) 找回链接
│
├── package.json            # 项目依赖与配置
└── README.md               # 你正在阅读的文档
```

---

## 🔮 未来探索 (Roadmap)

我们正致力于让 SurveyKit 变得更加强大和灵活。以下是我们的部分计划，欢迎提出你的想法！

- #### 🚀 **近期计划 (Next Up)**

  - **高级数据分析**: 在后台为问卷创建者提供可视化的数据统计报告，包括图表、交叉分析等。
  - **自动化测试**: 引入 Vitest 或 Cypress，为核心功能添加单元和端到端测试，确保代码质量。
  - **数据生命周期管理**: 为问卷数据设置自动过期时间 (TTL)，并提供用户自行删除数据的功能。

- #### 🔮 **未来构想 (Future Ideas)**

  - **第三方集成**: 探索与 Notion, Google Sheets, Zapier 等工具的集成，实现数据自动化流转。
  - **团队协作功能**: 允许多个用户协作编辑和管理同一份问卷，并设置不同的访问权限。

> 想了解更详细的计划？请访问我们的 **[发展路线图页面](./public/docs/roadmap.html)**。

---

## 🤝 贡献指南 (Contributing)

欢迎所有形式的贡献！无论你是想修复一个 Bug，实现一个新功能，还是仅仅改进一下文档，我们都非常欢迎。

1. **Fork** 这个仓库
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到你的分支 (`git push origin feature/AmazingFeature`)
5. **开启一个 Pull Request**

---

## 📄 许可证 (License)

本项目采用 MIT 许可证。

---

> This project was created with ❤️ by **[424635328](https://github.com/424635328)**.
