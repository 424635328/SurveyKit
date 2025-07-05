<div align="center">

<img src="./public/favicon.ico" alt="SurveyKit Logo" width="200" />

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
    <a href="https://survey-kit.vercel.app/contact.html" target="_blank"><strong>💬 联系我们</strong></a>
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

SurveyKit 的诞生源于一个简单的想法：**提问，是深入了解一个人的最佳方式**。我们致力于打造一个不仅功能强大，更充满人文关怀和极致美学的问卷工具。

- ### 🔐 多用户问卷管理系统 (Multi-User & Multi-Survey)

  - **安全的用户认证**: 基于 **JWT** (JSON Web Tokens) 的安全注册与登录系统，用户密码使用 `bcrypt` 加盐哈希存储，保障账户数据安全。
  - **个人问卷中心**: 提供用户专属的管理后台，轻松创建、编辑、导入、删除和追踪多套问卷，所有操作清晰可见。
  - **专属分享与分发**: 每套问卷自动生成唯一的填写链接。点击 **“分享”** 按钮即可跳转至**独立分享页**，该页提供可复制的链接和**实时生成的二维码**，方便用户分发问卷。
  - **结果聚合与可视化**: 在线聚合分析指定问卷的所有提交结果。结果以**结构化表格**形式美观呈现，支持**提交时间**、**所有问题（包括“其他”选项）**的精确显示，确保数据对齐且一目了然。
  - **灵活的数据导出**: 支持一键导出问卷的所有提交结果为 **CSV** 和 **JSON** 格式，便于离线分析或集成到其他工具。

- ### 🛠️ 一站式工具中心 (Tool Hub)

  - **可视化问卷编辑器**: 通过直观的图形界面创建和编辑问卷，支持实时预览，并一键导出/导入符合标准格式的 `JSON` 文件。
  - **流畅的问卷导入**: 告别生硬的 `prompt` 弹窗，导入问卷时提供**友好模态框**，允许用户在确认导入前预览文件信息并编辑新问卷的标题，上传过程具有清晰的加载和结果提示。
  - **便捷的问卷下载**: 在问卷管理中心，用户可以随时将自己的问卷结构（`JSON` 格式）下载到本地，便于备份或分享模板。
  - **主题定制器 (Theme Customizer)**: 实时预览并调整问卷的主色调、背景色、字体等，一键生成主题CSS，打造独特品牌风格。
  - **智能JSON修正器**: 粘贴您的 `questions.json`，自动修复常见错误（如注释、缺引号、尾逗号），确保部署万无一失。
  - **玻璃拟态设计 (Glassmorphism)**: 工具中心、联系页面等核心界面采用现代化的玻璃拟态设计，搭配流动的**极光背景**，视觉效果出众，提供沉浸式体验。

- ### 🎨 极致的用户体验 (UX First)

  - **全局命令面板**: 在任何页面按下 `⌘K` (`Ctrl+K`) 即可唤出高效的命令面板，快速导航至任何功能、工具或文档，提升操作效率。
  - **3D辉光悬停卡片**: 在联系页面等处，当鼠标悬停时，卡片会产生平滑的 **3D倾斜** 效果，并被一个动态旋转的 **辉光渐变边框** 包围，同时卡片上的图标会轻微浮动，提供丰富的视觉反馈和游戏化的交互体验。
  - **智能联系人模态框**: 点击联系方式弹出的模态框，不仅UI精致，更集成了实用功能：**二维码图片可自适应调整窗口大小**，并提供**一键复制账号**（带成功提示）和**直接保存二维码图片**的功能，极大提升了用户操作的便捷性。
  - **优雅动效与沉浸填写**: 全站采用**流式浮现动画**，结合智能题号导航、自动草稿保存，提供如丝般顺滑的填写体验。问卷填写页现在专注于**内容展示与数据收集**，提交后会跳转至简洁的提交结果页。
  - **简洁的提交结果页**: 问卷提交后，用户将跳转到一个独立的页面，清晰展示提交成功或失败的状态，并提供返回首页的选项，流程更清晰。
  - **专业文档中心**: 配备**带粘性侧边栏目录**的帮助中心与**安全中心**、**发展路线图**等多个文档页，信息透明，查阅方便。

- ### 🤖 AI 驱动的人格分析

  - **即时生成报告**: 提交问卷后，用户可一键跳转，由**火山方舟大模型**驱动的 AI 将为其生成一份专属、详细的 MBTI 风格人格报告。
  - **沉浸式等待体验**: AI 分析过程采用流式提示，报告生成后也支持逐段打字机效果呈现，有效降低用户等待焦虑。

- ### 📊 优雅的结果呈现与分享 (旧版/特定场景模式)

  - **访谈式结果页**: 将数据渲染成一篇排版精美的访谈录，告别枯燥的数据罗列。
  - **安全找回机制**: 用户可凭提交时留下的邮箱或问卷ID，通过邮件**安全找回**专属链接。
  - **默契度大挑战**: 支持与朋友对比答案，动态计算并展示默契度分数。

---

## 🛠️ 技术栈 (Tech Stack)

| 领域 | 技术 |
| :--- | :--- |
| **前端** | ![HTML5](https://img.shields.io/badge/-HTML5-E34F26?logo=html5&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/-TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white) ![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?logo=javascript&logoColor=black) (ESM) |
| **AI 服务** | ![Volcengine](https://img.shields.io/badge/-Volcano_Ark-CF2E2D.svg?logo=volvo&logoColor=white) (火山方舟大模型) |
| **后端/部署** | ![Vercel](https://img.shields.io/badge/-Vercel-000000?logo=vercel&logoColor=white) & ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white) (Serverless Functions) |
| **数据库** | ![Redis](https://img.shields.io/badge/-Redis-DC382D?logo=redis&logoColor=white) (Vercel KV) |
| **邮件服务** | ![Resend](https://img.shields.io/badge/-Resend-000000.svg?logo=resend&logoColor=white) |
| **核心依赖** | ![Zod](https://img.shields.io/badge/-Zod-3E67B1?logo=zod&logoColor=white) (数据校验) ![bcryptjs](https://img.shields.io/badge/-bcrypt.js-6C42F1?logo=bcrypt&logoColor=white) (密码加密) ![jsonwebtoken](https://img.shields.io/badge/-JWT-000000?logo=jsonwebtokens&logoColor=white) (身份认证) ![Upstash](https://img.shields.io/badge/-Upstash_Ratelimit-16A34A?logo=upstash&logoColor=white) (API 速率限制) ![SheetJS](https://img.shields.io/badge/-SheetJS-217346?logo=microsoft-excel&logoColor=white) (CSV 导出) |

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

在 Vercel 项目设置的 **"Environment Variables"** 中，添加以下密钥。请务必妥善保管这些密钥。

- `JWT_SECRET`: `一个用于签发用户令牌的强密钥 (例如，使用 openssl rand -hex 32 生成)`
- `ARK_API_KEY`: `你的火山引擎API Key` (用于AI服务)
- `RESEND_API_KEY`: `你的Resend API Key` (用于发送邮件)
- `SENDER_EMAIL`: `你的Resend验证过的发送邮箱地址` (例如 `onboarding@resend.dev`)
- `ADMIN_TOKEN`: `你设置的一个长而随机的管理员密钥` (用于旧版API的后门访问，请保密，推荐只在必要时设置)

### 4. 部署到 Vercel (关键步骤)

1.  登录 Vercel，从你的 GitHub 导入你 Fork 的仓库。
2.  在 **"Project Settings" -> "General"** 中，找到 **"Root Directory"** 设置。
3.  **将根目录修改为 `public`**。这是最关键的一步，确保 Vercel 正确提供静态文件服务。
4.  框架预设 (Framework Preset) 应自动识别为 **"Other"**。
5.  在 **"Storage"** 标签页创建一个新的 KV 数据库并连接到项目。
6.  点击 **"Deploy"**。

部署完成后，Vercel 会将 `public` 目录作为网站根目录来提供服务，所有前端路由和后端 API 都将正常工作！

---

## 🎨 创建你的问卷 (Creating Your Survey)

### 方式一：使用多问卷管理系统 (推荐)

这是 SurveyKit 的核心使用方式，提供完整的问卷生命周期管理。

1.  访问你部署好的项目，点击右上角或工具中心进入**登录/注册**页面。
2.  注册并登录你的账户。
3.  系统将自动跳转到**问卷管理中心** (`/hub/toolchain/management.html`)。
4.  **创建问卷**: 点击 **“创建新问卷”** 进入可视化编辑器，通过拖拽和配置构建你的问卷。
5.  **导入问卷**: 点击 **“导入问卷”** 上传一个符合规范的 `JSON` 文件。系统会通过友好模态框引导你确认问卷标题。
6.  **管理问卷**: 在管理中心，你可以看到所有创建和导入的问卷列表。
7.  **分享问卷**: 点击问卷卡片上的 **“分享”** 按钮，即可跳转至**专属分享页**，获取填写链接和二维码，方便你向目标受众分发。填写问卷页面位于 `/hub/answer/answer.html`。
8.  **查看结果**: 点击 **“查看结果”**，即可进入**结果分析页** (`/hub/toolchain/results.html`)，在线浏览所有提交数据。数据将以对齐的表格形式呈现，并支持**一键导出为 CSV 和 JSON 文件**。

### 方式二：静态单问卷部署 (旧版/特定场景)

如果你只需要一个简单的、无需登录的静态问卷，且不涉及多问卷管理，可以沿用传统方式：

1.  在本地项目中，直接修改 `public/questions.json` 文件，定义你的问卷结构。
2.  **（可选）** 如果需要启用“找回链接”功能，请确保问卷中添加一个用于**收集用户邮箱的问题**（其 `id` 为 `q_email`）。
3.  将修改后的代码重新部署到 Vercel。访问 `https://your-app-url/survey.html` 即为你的问卷填写页面。

---

## 🔐 安全性 (Security)

SurveyKit 致力于保障用户数据的隐私与安全。我们相信透明是建立信任的基石。

- **用户认证与授权**: 采用行业标准的 JWT 进行会话管理，用户密码通过 `bcrypt` 加盐哈希安全存储。所有用户只能访问和管理自己名下的问卷及其提交数据，严格防止跨用户数据泄露。
- **Serverless 架构**: 项目部署在 Vercel 环境，Vercel 自动处理基础设施的安全更新、SSL 证书管理和 DDoS 防护，减少传统服务器运维风险。
- **API 速率限制与授权**: 所有关键后端 API (如用户认证、问卷管理和结果获取) 均实施了速率限制和严格的授权检查，有效抵御暴力破解、爬虫和未授权访问。
- **严格的输入校验**: 前后端均采用强大的 `Zod` 库进行严格的数据输入校验，防止常见的注入攻击（如 SQL 注入、NoSQL 注入）和恶意数据提交。
- **XSS 防护**: 所有用户生成或后端返回的内容在前端渲染时都经过严格的 HTML 转义处理，彻底杜绝跨站脚本攻击 (XSS) 风险。
- **凭证安全**: 所有敏感密钥（如 JWT 密钥、API Key）均通过 Vercel 环境变量安全管理，绝不暴露在客户端代码或公共代码库中。
- **公开问卷安全性**: 问卷填写页面 (`/hub/answer/answer.html`) 及其对应的问卷详情 API (`/api/survey-details.mjs`) 已调整为**无需认证**，以支持公开填写。但后台管理相关的 API 仍需严格认证，确保后台数据安全。

> 想了解更多细节？请访问我们的 **[安全中心文档](./public/docs/security.html)**。

---

## 📁 项目结构 (Project Structure)

项目结构已精心设计，所有前端静态文件均位于 `public` 目录下（作为 Vercel 部署的根目录），后端 API 位于独立的 `api` 目录，便于开发和部署。

```
/ (项目根目录)
├── public/                 # Vercel 部署的静态文件根目录
│   ├── index.html, survey.html, etc.
│   ├── contact.html      # 🆕 交互式联系我们页面
│   ├── search.html         # 全局搜索页
│   ├── hub/
│   │   ├── hub.html        # 工具中心入口
│   │   ├── login.html      # 用户登录/注册页
│   │   ├── custom-questions/ # 可视化问卷编辑器
│   │   ├── answer/
│   │   │   ├── answer.html # 问卷填写页 (公开访问)
│   │   │   └── submission-result.html # 问卷提交结果页 (简洁)
│   │   └── toolchain/
│   │       ├── management.html # 问卷管理中心 (需登录)
│   │       ├── results.html    # 问卷结果查看页 (需登录，高可视化)
│   │       ├── share.html      # 问卷分享页 (展示链接和二维码)
│   │       ├── customizer.html # 主题定制器
│   │       └── validator.html  # 智能JSON校验器
│   ├── docs/
│   │   ├── help.html       # 帮助文档
│   │   ├── security.html   # 安全中心文档
│   │   └── roadmap.html    # 发展路线图
│   └── ... (其他页面和资源，如 CSS, JS, 图片等)
│
├── api/                    # Vercel Serverless Functions (后端API)
│   ├── auth.mjs            # 用户认证 (登录/注册)
│   ├── surveys.mjs         # 问卷列表管理 (用户问卷列表、删除问卷)
│   ├── upload-survey.mjs   # 上传/创建新问卷
│   ├── survey-details.mjs  # 获取单个问卷详情 (公开)
│   ├── submissions.mjs     # 提交问卷答案
│   ├── get-results.mjs     # 获取问卷所有提交结果 (需授权)
│   ├── get-public-survey.mjs # 获取公开问卷信息 (旧版)
│   ├── save.mjs            # (旧版) 保存单问卷答案
│   ├── get-survey.mjs      # (旧版) 获取单问卷答案
│   ├── analyze-mbti.mjs    # AI人格分析
│   └── recover-link.mjs    # (旧版) 找回链接
│
├── package.json            # 项目依赖与配置
└── README.md               # 你正在阅读的文档
```

---

## 🔮 未来探索 (Roadmap)

我们正致力于让 SurveyKit 变得更加强大和灵活。以下是我们的部分计划，欢迎提出你的想法！

- #### 🚀 **近期计划 (Next Up)**

  - **高级数据分析**: 在后台为问卷创建者提供可视化的数据统计报告，包括图表（如饼图、柱状图）、交叉分析、关键词云等，帮助用户更直观地理解数据。
  - **自动化测试**: 引入 Vitest (单元/集成测试) 或 Cypress (端到端测试)，为核心功能添加全面的自动化测试，确保代码质量和系统稳定性。
  - **数据生命周期管理**: 允许用户为问卷数据设置自动过期时间 (TTL)，并提供用户自行手动删除问卷及所有相关数据的功能，更好地控制数据隐私。

- #### 🔮 **未来构想 (Future Ideas)**

  - **第三方集成**: 探索与 Notion, Google Sheets, Zapier 等主流工具的集成，实现问卷提交数据的自动化流转和更广泛的应用。
  - **团队协作功能**: 允许多个用户在同一个组织或团队下协作编辑和管理同一份问卷，并设置不同的访问权限和角色。
  - **更多问题类型**: 扩展问卷编辑器，支持更多丰富的问题类型，如多选、下拉菜单、日期选择、文件上传等。

> 想了解更详细的计划？请访问我们的 **[Roadmap](https://survey-kit.vercel.app/docs/roadmap.html)**

---

## 🤝 贡献指南 (Contributing)

欢迎所有形式的贡献！无论你是想修复一个 Bug，实现一个新功能，还是仅仅改进一下文档，我们都非常欢迎。

1.  **Fork** 这个仓库到你的 GitHub 账户。
2.  克隆你 Fork 的仓库到本地 (`git clone YOUR_FORK_URL`)。
3.  创建你的功能分支 (`git checkout -b feature/AmazingFeature`)。
4.  在你的分支上进行更改并提交 (`git commit -m 'Add some AmazingFeature'`)。
5.  推送到你的远程分支 (`git push origin feature/AmazingFeature`)。
6.  **开启一个 Pull Request**，描述你的更改和动机。

---

## 📄 许可证 (License)

本项目采用 MIT 许可证。

---

> This project was created with ❤️ by **[424635328](https://github.com/424635328)**.
