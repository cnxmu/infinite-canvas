# docs

这里是 Infinite Canvas 的独立文档站，不是主画布应用。主应用在仓库根目录的 `web/` 下，使用 Vite + React Router；本文档站使用 Next.js + Fumadocs，并保留搜索等运行时路由能力。

启动开发服务：

```bash
bun run dev
```

构建并启动本地生产服务：

```bash
bun run build
bun run start
```

使用已发布镜像运行 Docker Compose：

```bash
docker compose up -d
```

或基于本地源码构建：

```bash
docker compose -f docker-compose.local.yml up -d --build
```

## 目录说明

常用文件：

- `src/lib/source.ts`：Fumadocs 内容源适配器，`loader()` 提供文档内容访问入口。
- `src/lib/layout.shared.tsx`：文档站布局的共享配置。
- `content/docs/`：实际文档内容，主要为 `.mdx` 文件。

| Route                     | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `app/(home)`              | 文档站首页和其他独立页面。                             |
| `app/docs`                | 文档内容布局和页面。                                   |
| `app/api/search/route.ts` | 文档搜索接口。                                         |

### Fumadocs MDX

`source.config.ts` 用来配置 frontmatter schema 等 Fumadocs MDX 行为。

更多说明见 [Fumadocs MDX 文档](https://fumadocs.dev/docs/mdx)。
