Shimmer | AI Chat Web

<div align="center">

一个基于 Vue 3 + TypeScript + TailwindCSS 构建的现代化 AI 对话客户端

特性 • 技术栈 • 目录结构 • 快速开始 • 部署

</div>

📖 项目简介

这是一个功能强大的 AI 聊天 Web 应用，旨在提供流畅、类似原生应用的对话体验。前端采用 Vue 3 生态系统构建，UI 风格简洁现代。

项目深度集成 DeepSeek API，支持最新的推理模型（Reasoner），能够直观展示模型的思考过程。它支持多轮对话、流式响应、文件/图片上传分析等高级功能，并采用虚拟滚动技术优化长列表性能。后端对接 Django 服务（前后端分离架构）。

✨ 功能特性

🤖 DeepSeek 深度集成：完美支持 DeepSeek 系列模型，包括 reasoning (思考过程) 的可视化展示。

🌊 实时流式响应：基于 Server-Sent Events (SSE) 实现打字机效果，响应迅速流畅。

💬 多轮会话管理：支持创建多个会话窗口，自动保存上下文，随时切换。

⏯️ 灵活控制：支持生成过程中的暂停与继续，完全掌控对话节奏。

📝 Markdown 渲染：完美渲染代码块、公式、表格及富文本格式。

📁 多媒体支持：支持文件和图片的上传。

⚡ 极致性能：采用 vue-virtual-scroller 实现消息列表的虚拟滚动，海量消息也能丝滑流畅。

🔐 隐私安全：用户自定义 API Key，密钥仅存储在本地浏览器（LocalStorage），不经由服务器中转。

🌍 国际化 (i18n)：内置多语言支持，轻松切换界面语言。

🛠️ 健壮的工程化：

封装 Axios 拦截器，统一处理请求与响应逻辑。

完善的 TypeScript 类型定义。

模块化的 Pinia 状态管理。

🛠 技术栈

前端 (Frontend)

核心框架: Vue 3 (Composition API)

构建工具: Vite

语言: TypeScript

UI 框架: Shadcn-Vue (基于 Radix Vue)

样式: Tailwind CSS

状态管理: Pinia

路由: Vue Router

国际化: Vue I18n

HTTP 客户端: Axios

性能优化: Vue Virtual Scroller

后端 (Backend)

框架: Django (REST Framework)

注：本项目为前端仓库，需要配合 Django 后端服务运行。

📂 目录结构

src
├── api/                  # API 接口请求定义
├── assets/               # 静态资源文件
├── components/           # 公共组件
│   ├── ai-elements/      # AI 相关特定组件 
│   ├── chatArea/         # 聊天主区域组件
│   ├── sidebar/          # 侧边栏组件
│   ├── ui/               # Shadcn UI 基础组件
│   └── i18n/             # 国际化组件
├── lib/                  # 工具库 (utils 别名或特定库封装)
├── locales/              # 国际化语言包资源
├── router/               # 路由配置
├── store/                # Pinia 状态管理
│   ├── modules/
│   │   ├── chat.ts       # 会话状态
│   │   ├── model.ts      # 模型配置状态
│   │   ├── setting.ts    # 全局设置
│   │   └── user.ts       # 用户信息
│   └── index.ts
├── style/                # 全局样式
├── utils/                # 通用工具函数
├── views/                # 页面视图
│   ├── 404/
│   └── ChatView/         # 核心聊天页面
├── App.vue               # 根组件
├── main.ts               # 入口文件
└── permission.ts         # 权限控制/路由守卫


🚀 快速开始

环境要求

Node.js >= 18

pnpm >= 8

1. 克隆项目

git clone [https://github.com/ShaneChing7/Shimmer-AIChatBot](https://github.com/ShaneChing7/Shimmer-AIChatBot)
cd your-repo-name


2. 安装依赖

pnpm install


3. 环境配置

复制环境变量文件并配置你的后端地址：

cp .env.development .env.local


修改 .env.local 文件：

# 你的 Django 后端 API 地址
VITE_API_BASE_URL=http://localhost:8000/api


4. 启动开发服务器

pnpm dev


访问 http://localhost:5173 即可看到项目。

⚙️ 配置说明

首次访问时，请点击设置图标，在设置面板中填入你的 DeepSeek API Key。

Key 将存储在你的本地浏览器 LocalStorage 中。

📦 构建生产环境

pnpm build


构建完成后，静态文件将生成在 dist 目录中。

🤝 贡献

欢迎提交 Issue 和 Pull Request！

Fork 本仓库

新建 Feat_xxx 分支

提交代码

新建 Pull Request

📄 License

MIT License © 2024 Shane