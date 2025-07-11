<div align="center">

<img src="./public/favicon.ico" alt="SurveyKit Logo" width="180" />

<h1 align="center">SurveyKit</h1>

<p align="center">
  一款现代、美观、功能强大的多用户问卷SaaS平台
</p>


<p align="center">
  <a href="https://survey-kit.vercel.app/" target="_blank"><strong>🚀 在线体验</strong></a>
  ·
  <a href="https://github.com/424635328/SurveyKit/issues" target="_blank">报告 Bug</a>
  ·
  <a href="https://github.com/424635328/SurveyKit/issues" target="_blank">功能建议</a>
  ·
  <a href="https://survey-kit.vercel.app/docs/help.html" target="_blank"><strong>📖 查看文档</strong></a>
</p>

<div align="center">

[![Vercel Deployment](https://img.shields.io/github/deployments/424635328/SurveyKit/production?label=Vercel&logo=vercel&style=for-the-badge)](https://survey-kit.vercel.app/)
[![GitHub Stars](https://img.shields.io/github/stars/424635328/SurveyKit?style=for-the-badge&logo=github&color=FFD700)](https://github.com/424635328/SurveyKit/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Top Language](https://img.shields.io/github/languages/top/424635328/SurveyKit?style=for-the-badge&logo=javascript)](https://github.com/424635328/SurveyKit)

</div>

</div>

## ✨ 概览

SurveyKit 的诞生源于一个简单的想法：**提问，是深入了解一个人的最佳方式**。我们致力于打造一个不仅功能强大，更充满人文关怀和极致美学的问卷工具。

## 核心功能

| 功能分类 | 特性 | 描述 |
| :--- | :--- | :--- |
| 🔐 **多用户系统** | **安全认证** | 基于 JWT + `bcrypt` 加盐哈希，保障用户账户与数据安全。 |
| | **个人问卷中心** | 在专属后台轻松创建、编辑、导入、删除和追踪多套问卷。 |
| | **一键分享** | 为每份问卷生成独立分享页，包含链接与实时二维码，便于分发。 |
| | **结果聚合分析** | 在线聚合所有提交结果，以结构化表格美观呈现，支持按提交时间排序。 |
| | **数据导出** | 一键将问卷结果导出为 **CSV** 和 **JSON** 格式，便于离线分析。 |
| 🛠️ **一站式工具集** | **可视化编辑器** | 所见即所得的问卷编辑器，支持实时预览与 JSON 导入/导出。 |
| | **智能 JSON 修正器** | 自动修复 `questions.json` 中常见的格式错误，确保部署成功。 |
| | **主题定制器** | 实时调整问卷颜色、字体，一键生成主题 CSS，打造品牌风格。 |
| | **玻璃拟态设计** | 工具中心、联系页面采用现代化的玻璃拟态设计与极光背景，体验出众。 |
| 🎨 **极致用户体验** | **全局命令面板** | `⌘K` (`Ctrl+K`) 快速唤醒，秒速导航至任意功能页面。 |
| | **3D 辉光卡片** | 悬停时产生平滑的 3D 倾斜与辉光特效，提供丰富的视觉反馈。 |
| | **优雅动效** | 全站采用流式浮现动画，结合自动草稿保存，提供丝滑的填写体验。 |
| | **清晰流程** | 独立的提交结果页与带粘性目录的文档中心，信息架构清晰。 |
| 🤖 **AI 赋能** | **AI 人格分析** | 由**火山方舟大模型**驱动，提交问卷后一键生成专属的 MBTI 风格人格报告。 |
| | **沉浸式报告生成** | AI 分析过程采用流式提示与打字机效果，有效缓解等待焦虑。 |

## 🛠️ 技术栈

-   **前端**: `HTML5` `TailwindCSS` `JavaScript (ESM)`
-   **后端**: `Node.js (Vercel Serverless Functions)`
-   **数据库**: `Redis (Vercel KV)`
-   **AI 服务**: `火山方舟大模型 (Volcano Ark)`
-   **核心依赖**:
    -   `Zod` (数据校验)
    -   `bcrypt.js` (密码加密)
    -   `jsonwebtoken` (身份认证)
    -   `Upstash Ratelimit` (API 速率限制)
    -   `Resend` (邮件服务)
    -   `SheetJS` (CSV 导出)

## 🚀 快速开始

在自己的 Vercel 账号上部署一个属于你的 SurveyKit 实例。

### 先决条件

-   一个 [GitHub](https://github.com/) 账户
-   一个 [Vercel](https://vercel.com/) 账户
-   [Node.js](https://nodejs.org/en/) (用于本地开发)

### 部署步骤

1.  **Fork & Clone 仓库**
    ```bash
    git clone https://github.com/YOUR_USERNAME/SurveyKit.git
    cd SurveyKit
    ```

2.  **安装依赖 (本地开发可选)**
    ```bash
    npm install
    ```

3.  **设置环境变量**
    登录 Vercel，导入你的仓库后，在项目设置的 "Environment Variables" 中添加以下密钥：
    -   `JWT_SECRET`: 用于签发用户令牌的强密钥 (推荐使用 `openssl rand -hex 32` 生成)
    -   `ARK_API_KEY`: 你的火山引擎 API Key
    -   `RESEND_API_KEY`: 你的 Resend API Key
    -   `SENDER_EMAIL`: 你的 Resend 验证过的发件邮箱
    -   `ADMIN_TOKEN`: (可选) 用于旧版 API 的管理员密钥，请保持私密

4.  **连接数据库**
    在 Vercel 项目设置的 "Storage" 标签页，创建一个新的 KV 数据库并连接到当前项目。

5.  **配置并部署**
    -   在 "Project Settings" -> "General" 中，找到 **Root Directory** 设置。
    -   ⚠️ **将根目录修改为 `public`**。这是最关键的一步！
    -   框架预设 (Framework Preset) 应为 **"Other"**。
    -   点击 **"Deploy"**，稍等片刻即可完成部署。

## 📖 使用指南

### 方式一：多用户问卷管理系统 (推荐)

这是 SurveyKit 的核心使用方式，提供完整的问卷生命周期管理。

1.  访问你部署好的项目，**注册并登录**。
2.  进入**问卷管理中心**，你可以：
    -   **创建新问卷**：使用可视化编辑器从零开始构建。
    -   **导入问卷**：上传符合规范的 `JSON` 文件。
3.  在问卷列表中，你可以：
    -   **分享问卷**：获取专属链接和二维码。
    -   **查看结果**：在线浏览所有提交数据，并支持导出为 CSV/JSON。
    -   **管理问卷**：随时编辑或删除你的问卷。

### 方式二：静态单问卷模式 (特定场景)

如果你只需要一个简单的、无需登录的静态问卷：

1.  直接在本地修改 `public/questions.json` 文件。
2.  重新部署到 Vercel。
3.  访问 `https://your-app-url/survey.html` 即为你的问卷页。

## 🔐 安全性

我们严肃对待数据安全，并采取了多层防护措施：

-   **用户数据隔离**：严格的授权机制确保用户只能访问自己的数据。
-   **密码安全**：用户密码通过 `bcrypt` 加盐哈希存储，无法被逆向破解。
-   **API 防护**：所有关键 API 均实施了速率限制和严格的授权检查。
-   **输入校验**：前后端使用 `Zod` 进行严格的数据校验，有效防止注入攻击。
-   **防 XSS 攻击**：所有用户生成内容在前端渲染时都经过严格转义。
-   **凭证管理**：所有敏感密钥通过 Vercel 环境变量安全管理，绝不暴露于前端。

> 更多细节请查阅 **[安全中心文档](https://survey-kit.vercel.app/docs/security.html)**。

<details>
<summary>📁 <b>点击查看简化的项目结构</b></summary>

```
/
├── public/                 # Vercel 部署的静态文件根目录
│   ├── index.html          # 首页
│   ├── hub/                # 多用户系统核心功能区 (需登录)
│   │   ├── login.html
│   │   ├── toolchain/      # 问卷管理、结果查看等
│   │   └── answer/         # 问卷填写页 (公开)
│   ├── docs/               # 文档中心
│   ├── ... (其他页面和资源)
│
├── api/                    # Vercel Serverless Functions (后端API)
│   ├── auth.mjs            # 用户认证
│   ├── surveys.mjs         # 问卷增删改查
│   ├── submissions.mjs     # 问卷提交处理
│   ├── analyze-mbti.mjs    # AI人格分析
│   └── ... (其他API)
│
├── package.json
└── README.md
```

</details>

## 🔮 路线图 (Roadmap)

我们正致力于让 SurveyKit 变得更强大。以下是部分计划：

-   [ ] **高级数据图表分析**：在后台为问卷提供饼图、柱状图等可视化报告。
-   [ ] **自动化测试集成**：引入 Vitest 或 Cypress，保障代码质量和系统稳定性。
-   [ ] **团队协作功能**：允许多用户协作管理同一份问卷。
-   [ ] **更多问题类型**：支持文件上传、矩阵题、评分题等。

> 查看完整的 **[发展路线图](https://survey-kit.vercel.app/docs/roadmap.html)**，欢迎提出你的想法！

## 🤝 贡献

欢迎所有形式的贡献！无论是修复 Bug、实现新功能还是改进文档。

1.  **Fork** 本仓库。
2.  创建你的功能分支 (`git checkout -b feature/AmazingFeature`)。
3.  提交你的更改 (`git commit -m 'Add some AmazingFeature'`)。
4.  推送到你的分支 (`git push origin feature/AmazingFeature`)。
5.  **开启一个 Pull Request**。

## 📄 许可证

本项目采用 [MIT](https://opensource.org/licenses/MIT) 许可证。

---

<p align="center">
  由 <a href="https://github.com/424635328" target="_blank">424635328</a> 倾心打造 ❤️
</p>