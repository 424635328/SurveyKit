<div align="center">

<img src="./public/favicon.ico" alt="SurveyKit Demo" width="800" />

<h1 align="center">SurveyKit - 一份为你定制的深度问卷</h1>
<p align="center">
  一个高度可定制、设计驱动的网页版深度问卷平台，现已集成AI人格分析与一站式可视化工具集。
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

- ### 🎨 极致的用户体验 (UX First)
  - **全局命令面板搜索**: 在任何页面按下 `⌘K` (`Ctrl+K`) 即可唤出高效的命令面板，快速导航至任何功能、工具或文档。
  - **优雅动效**: 全站采用基于 `IntersectionObserver` 的**循环流式浮现动画**，内容随滚动反复优雅呈现，交互体验如丝般顺滑。
  - **沉浸式填写**: 所有题目一次性加载，自由滚动填写。右上角固定的 10x10 **智能题号导航**，支持平滑跳转、高亮当前题目并区分答题状态。
  - **无忧的自动草稿**: 使用 `localStorage` 实时保存填写进度，意外关闭也不怕丢失。
  - **专业帮助文档**: 配备**带粘性侧边栏目录**的帮助中心，自动高亮当前章节，查阅体验极佳。

- ### 🛠️ 一站式工具中心 (Tool Hub)
  - **可视化问卷编辑器**: 通过直观的图形界面创建和编辑问卷，支持实时预览，并一键导出/导入多种格式（JSON, Excel, CSV, TXT）。
  - **答案预览器**: 无需跳转，直接在工具箱中输入问卷ID，即可查看完整的问卷答案，并支持多种格式导出。
  - **JSON 校验与格式化器**: 粘贴您的 `questions.json` 内容，一键检查语法错误并美化格式，确保部署万无一失。
  - **玻璃拟态设计 (Glassmorphism)**: 工具中心等核心页面采用现代化的玻璃拟态设计，搭配流动的**极光背景**，视觉效果出众。

- ### 🤖 AI 驱动的人格分析
  - **即时生成报告**: 提交问卷后，用户可一键跳转，由**火山方舟大模型**驱动的 AI 将为其生成一份专属、详细的 MBTI 风格人格报告。
  - **沉浸式等待体验**: AI 分析过程采用流式提示，报告生成后也支持逐段打字机效果呈现，有效降低用户等待焦虑。

- ### 📊 优雅的结果呈现与分享
  - **访谈式结果页**: 将数据渲染成一篇排版精美的访谈录，告别枯燥的数据罗列。
  - **专属链接与安全**: 提交问卷后生成**独一无二的专属链接（包含密钥）**，确保只有持有链接的用户才能访问自己的结果。
  - **安全找回机制**: 用户可凭提交时留下的邮箱或问卷ID，通过邮件**安全找回**专属链接。
  - **默契度大挑战**: 支持与朋友对比答案，动态计算并展示默契度分数。
  - **多种导出格式**: 问卷结果支持导出为结构化的 **JSON**, **TXT**, 以及扁平化的 **Excel** 和 **CSV** 文件。

---

## 🛠️ 技术栈 (Tech Stack)

| 领域          | 技术                                                                                                                                                                                                                                                              |
| :------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **前端**      | ![HTML5](https://img.shields.io/badge/-HTML5-E34F26?logo=html5&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/-TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white) ![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?logo=javascript&logoColor=black) (ESM) |
| **AI 服务**   | ![Volcengine](https://img.shields.io/badge/-Volcano_Ark-CF2E2D.svg?logo=volvo&logoColor=white) (火山方舟)                                                                                                                                                         |
| **后端/部署** | ![Vercel](https://img.shields.io/badge/-Vercel-000000?logo=vercel&logoColor=white) & ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white) (Serverless)                                                                           |
| **数据库**    | ![Redis](https://img.shields.io/badge/-Redis-DC382D?logo=redis&logoColor=white) (Vercel KV)                                                                                                                                                                       |
| **邮件服务**  | ![Resend](https://img.shields.io/badge/-Resend-000000.svg?logo=resend&logoColor=white)                                                                                                                                                                            |
| **核心依赖**  | ![Zod](https://img.shields.io/badge/-Zod-3E67B1?logo=zod&logoColor=white) ![Upstash](https://img.shields.io/badge/-Upstash_Ratelimit-16A34A?logo=upstash&logoColor=white) ![SheetJS](https://img.shields.io/badge/-SheetJS-217346?logo=microsoft-excel&logoColor=white) |

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

在 Vercel 项目设置的 **"Environment Variables"** 中，添加你的火山方舟 API 密钥、邮件服务密钥和管理员令牌：

-   `ARK_API_KEY`: `你的火山引擎API Key` (用于AI服务)
-   `RESEND_API_KEY`: `你的Resend API Key` (用于发送邮件)
-   `SENDER_EMAIL`: `你的Resend验证过的发送邮箱地址` (例如 `onboarding@resend.dev` 或 `noreply@yourdomain.com`)
-   `ADMIN_TOKEN`: `你设置的一个长而随机的管理员密钥` (用于访问所有问卷数据，请务必保密)

### 4. 部署到 Vercel (关键步骤)

1.  登录 Vercel，从你的 GitHub 导入你 Fork 的仓库。
2.  在 **"Project Settings" -> "General"** 中，找到 **"Root Directory"** 设置。
3.  **将根目录修改为 `public`**。这是最关键的一步，它告诉 Vercel 你的所有网站内容都在 `public` 文件夹下。
4.  返回部署页面，**框架预设 (Framework Preset)** 应自动识别为 **"Other"**。
5.  在 **"Storage"** 标签页创建一个新的 KV 数据库并连接到项目。
6.  点击 **"Deploy"**。

部署完成后，Vercel 会将 `public` 目录作为网站根目录来提供服务，所有链接都将正常工作！

---

## 🎨 如何定制问卷 (Customizing the Survey)

你有两种方式来创建属于你的专属问卷：

### 方式一：使用可视化编辑器 (推荐)

1.  访问部署好的项目，进入 **工具中心** (`/hub/hub.html`)。
2.  点击 **"可视化编辑器"** 卡片。
3.  在编辑器中自由添加、删除、修改问题和选项。
4.  完成时，请确保添加一个用于**收集用户邮箱的问题**（例如，`id` 为 `q_email`，`type` 为 `text`，`inputmode` 为 `email`），这将使得“找回链接”功能正常工作。
5.  完成后，点击 **导出** 按钮，选择 `JSON` 格式，将文件保存为 `questions.json`。
6.  用这个新文件替换掉你项目 `public/` 目录下的同名文件，然后重新部署。

### 方式二：手动编辑 `questions.json`

直接在你本地代码的 `public/questions.json` 文件中进行修改。文件结构定义如下：

| 字段        | 类型    | 描述                                                                                                       | 示例                                                            |
| :---------- | :------ | :--------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------- |
| **`id`**    | String  | **(必须)** 问题的唯一标识符。对于邮箱问题，请使用 `q_email`。                                              | `"q1_drink_choice"`, `"q_email"`                                |
| **`text`**  | String  | **(必须)** 显示给用户的问题文本（可包含题号）。                                                              | `"1. 咖啡 vs 奶茶？"`, `"你的邮箱地址："`                         |
| **`type`**  | String  | **(必须)** 问题类型。支持：`"radio"`, `"select"`, `"text"`, `"textarea"`, `"color"`, `"range"`。            | `"radio"`, `"text"`                                             |
| `inputmode` | String  | (可选, for `text`) 软键盘类型，例如 `email`。                                                              | `"email"`                                                       |
| `options`   | Array   | (对于 `radio` 和 `select` 必须) 定义选项。                                                       | `[{"value": "coffee", "label": "☕ 咖啡"}]` |
| `hasOther`  | Boolean | (可选) 若为 `true`，为选择题自动添加一个可填写的“其他”选项。                          | `true`                                                          |
| `rangeLeft` | String  | (可选, for `range`) 滑块左侧的文本描述。                                                                   | `"安静独处"`                                                    |
| `rangeRight`| String  | (可选, for `range`) 滑块右侧的文本描述。                                                                   | `"随时派对"`                                                    |

**注意**：如果你修改了用于人格分析的问题 ID 或选项，需要同步更新 `api/analyze-mbti.mjs` 中相关的分析逻辑。

---

## 🔐 安全性 (Security)

SurveyKit 致力于保障用户数据的隐私与安全，在设计和实现中融入了多项安全实践：

-   **Serverless 架构**: 部署在 Vercel Serverless 环境，自动处理基础设施安全更新和补丁，减少传统服务器风险。
-   **API 授权**: 所有问卷答案的读取接口都实现了基于**独有令牌 (Access Token)** 的授权机制。没有正确令牌无法访问数据，防止任意用户通过猜测 ID 批量访问。
-   **管理员后门**: 为项目管理员提供了基于**环境变量**的独立超级令牌，可在必要时合法访问所有数据，不影响普通用户安全模型。
-   **API 速率限制**: 对所有关键后端 API (提交、读取、AI 分析、找回链接) 均实施了速率限制，有效抵御自动化攻击和资源耗尽（DoS）风险。
-   **输入校验**: 前后端均采用 `Zod` 进行严格的数据输入校验，防止注入攻击、恶意数据格式和程序崩溃。
-   **XSS 防护**: 前端所有渲染用户生成内容的区域都进行了严格的 HTML 转义或使用安全的 DOM API (`textContent`, `createElement`)，彻底杜绝跨站脚本攻击 (XSS) 风险。
-   **凭证安全**: 敏感 API 密钥（如 AI 服务、邮件服务密钥）通过 Vercel 环境变量安全管理，不暴露在代码库中。

---

## 📁 项目结构 (Project Structure)

项目结构清晰，所有前端静态文件均位于 `public` 目录下，后端 API 位于独立的 `api` 目录。

```
/ (项目根目录)
├── public/                 # (Vercel 部署的根目录)
│   ├── index.html          # 项目首页
│   ├── survey.html         # 问卷填写页
│   ├── result.html         # 提交结果页
│   ├── viewer.html         # 问卷答案预览器
│   ├── compare.html        # 默契度对比页
│   ├── mbti.html           # AI人格分析页
│   ├── recover.html        # 找回问卷链接页
│   │
│   ├── hub/                # 🛠️ 工具中心模块
│   │   ├── hub.html
│   │   ├── custom-questions/ # 可视化问卷编辑器
│   │   └── toolchain/        # 工具集 (JSON校验器等)
│   │
│   ├── docs/               # 📖 帮助文档模块
│   │   └── help.html
│   │
│   ├── status/             # 🎨 状态页模块 (404, 403, 建设中, 成功)
│   │
│   ├── ... (其他页面的JS/CSS)
│   └── questions.json      # 核心：默认问卷结构定义文件
│
├── api/                    # Vercel Serverless Functions
│   ├── save.mjs
│   ├── get-survey.mjs
│   ├── analyze-mbti.mjs
│   └── recover-link.mjs
│
├── package.json            # 项目依赖与配置
└── README.md               # 项目说明文档
```

---

## 🔮 未来探索 (Roadmap)

我们正致力于让 SurveyKit 变得更加强大和灵活。

-   #### 📝 **多问卷管理系统**
    -   **动态问卷**: 开发管理后台，允许用户通过 UI 创建并保存多套问卷，每套问卷生成唯一的分享链接 (`/s/[surveyId]`)。

-   #### 🎨 **主题与个性化**
    -   **一键暗色模式**: 实现全局主题切换。
    -   **主题定制器**: 完善工具中心的“主题定制器”，允许为每套问卷选择主色调。

-   #### 🧪 **自动化测试**
    -   **单元/端到端测试**: 使用 **Vitest** 或 **Cypress** 为核心功能添加自动化测试，保证代码质量。

-   #### 🗑️ **数据生命周期管理**
    -   **自动清理**: 为问卷数据设置过期时间 (TTL)，自动清理旧数据以节省存储和保护隐私。
    -   **用户删除**: 提供用户通过其专属链接自行删除问卷数据的功能。

---

## 🤝 贡献指南 (Contributing)

欢迎所有形式的贡献！无论你是想修复一个 Bug，实现一个新功能，还是仅仅改进一下文档，我们都非常欢迎。

1.  **Fork** 这个仓库
2.  创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3.  提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4.  推送到你的分支 (`git push origin feature/AmazingFeature`)
5.  **开启一个 Pull Request**

---

## 📄 许可证 (License)

本项目采用 MIT 许可证。

---

> This project was created with ❤️ by **[424635328](https://github.com/424635328)**.
