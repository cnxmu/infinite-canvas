<p align="center">
  <img src="web/public/logo.svg" width="96" alt="infinite-canvas logo">
</p>

<h1 align="center">无限画布 (infinite-canvas)</h1>

<p align="center">
  <a href="https://linux.do/"><img src="https://img.shields.io/badge/Linux.do-Community-2b6de8?style=flat-square" alt="Linux.do"></a>
  <a href="https://render.com/deploy?repo=https://github.com/basketikun/infinite-canvas"><img src="https://img.shields.io/badge/Render-Deploy-46e3b7?style=flat-square&logo=render&logoColor=111111" alt="Deploy to Render"></a>
  <a href="https://github.com/basketikun/infinite-canvas"><img src="https://img.shields.io/github/stars/basketikun/infinite-canvas?style=flat-square&logo=github" alt="GitHub stars"></a>
  <a href="VERSION"><img src="https://img.shields.io/badge/version-v0.5.0-2563eb?style=flat-square" alt="Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-f97316?style=flat-square" alt="License"></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite&logoColor=white" alt="Vite"></a>
  <a href="https://reactrouter.com/"><img src="https://img.shields.io/badge/React_Router-7-ca4245?style=flat-square&logo=reactrouter&logoColor=white" alt="React Router"></a>
</p>

无限画布是一款面向图片创作的开源工作台。它把画布编排、AI 图片生成、参考图编辑、对话助手、提示词库和素材沉淀放在同一个界面里，适合用来探索视觉方案并连续迭代图片结果。

> [!CAUTION]
> 项目目前处于开发阶段，不保证历史数据兼容。浏览器存储结构、导入导出格式和配置格式都可能直接调整，欢迎关注后续更新。对外开放时建议把账号、计费、审计、风控、用户配额和权限隔离放在固定接口站点侧实现，前端仍主要作为浏览器本地画布工具使用。
>
> 如果你需要稳定维护自己的分支，建议自行 fork 后独立开发。二次开发与 PR 请保留原作者信息和前端页面标识。

## 核心功能

- 无限画布：多画布项目、节点拖拽缩放、连线、小地图、撤销重做、导入导出。
- AI 创作：浏览器前台直连固定接口站点，支持 OpenAI / Gemini 调用格式，以及文生图、图生图、参考图编辑、文本问答、音频和视频生成；Seedance 2.0 需由固定接口站点代理兼容。
- 画布助手：围绕选中节点和上游节点对话、生图，并把结果插回画布。
- 本地 Agent：通过本机 Canvas Agent 连接 Codex / Claude Code，让 Agent 通过 MCP 操作当前画布；
- Codex App 插件：提供 Codex app 插件，安装后会自动注册 MCP 并尝试拉起本地 Agent。
- 提示词库：浏览器前端直连多个 GitHub 开源项目，并缓存到 IndexedDB。

完整功能说明见 [功能介绍](docs/content/docs/overview/features.mdx)。

如果你在为担心没有合适的生图API来发愁，可以查看该免费生图项目：[chatgpt2api](https://github.com/basketikun/chatgpt2api)

## 技术栈

- 前端：Vite、React、React Router、TypeScript、Tailwind CSS、Ant Design、Zustand、TanStack Query。
- 前端：提示词库、WebDAV 和 AI 接口都由浏览器前端直连。
- 部署：静态站点托管或 Docker。

## 快速开始

AI API Key、固定接口站点选择、画布、素材和生成记录默认保存在浏览器本地。

```bash
git clone git@github.com:basketikun/infinite-canvas.git
cd infinite-canvas
cd web
bun install
bun run dev
```

Docker 运行：

```bash
docker build -t infinite-canvas .
docker run --rm -p 3000:3000 infinite-canvas
```

运行后默认端口3000，可访问 `http://localhost:3000`。

首次打开后进入右上角配置，在 `https://img.xmu.la` 和 `https://aiba.hk` 中选择接口站点，并填入自己的 `API Key` 和模型名。

## New API 自动配置

如果使用 New API，可在 `系统设置 -> 聊天方式 -> 添加聊天设置` 中填入：

```text
https://canvas.best?apiKey={key}&baseUrl=https://img.xmu.la
```

跳转后会自动打开配置弹窗并填入 API Key。`baseUrl` 参数只会归一到 `https://img.xmu.la` 或 `https://aiba.hk`，不再写入任意地址。
如果自己部署了，可以把 `https://canvas.best` 替换成你部署的地址。

## 效果展示

<table width="100%">
  <tr>
    <td width="50%"><img src="https://i.ibb.co/TDFvGWDT/image.png" alt="image" border="0"></td>
    <td width="50%"><img src="https://i.ibb.co/zVwJq3YS/image.png" alt="image" border="0"></td>
  </tr>
  <tr>
    <td width="50%"><img src="https://i.ibb.co/PvY3qhhK/image.png" alt="image" border="0"></td>
    <td width="50%"><img src="https://i.ibb.co/7D04LwN/image.png" alt="image" border="0"></td>
  </tr>
  <tr>
    <td width="50%"><img src="https://i.ibb.co/bj30FtS5/5.png" alt="5" border="0"></td>
    <td width="50%"><img src="https://i.ibb.co/hxRvjw51/image.png" alt="image" border="0"></td>
  </tr>
  <tr>
    <td width="50%"><img src="https://i.ibb.co/jkWsF8q1/image.png" alt="image" border="0"></td>
    <td width="50%"><img src="https://i.ibb.co/XrnfXHx7/image.png" alt="image" border="0"></td>
  </tr>
</table>

## 文档

- [快速开始](docs/content/docs/overview/quick-start.mdx)
- [功能介绍](docs/content/docs/overview/features.mdx)
- [Render 部署](docs/content/docs/overview/render.mdx)
- [Docker 部署](docs/content/docs/overview/docker.mdx)
- [画布节点操作手册](docs/content/docs/canvas/canvas-node-manual.mdx)
- [画布快捷键](docs/content/docs/canvas/canvas-shortcuts.mdx)
- [贡献者协议](CLA.md)
- [漏洞提交](SECURITY.md)
- [待办事项](docs/content/docs/progress/todo.mdx)
- [本地 Canvas Agent](canvas-agent/README.md)
- [Codex app 插件](plugins/infinite-canvas)
