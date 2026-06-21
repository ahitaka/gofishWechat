# GoFish

一个面向钓鱼爱好者的小程序，支持发现钓点、分享鱼获、社区互动与钓点管理。

## 技术栈

- 微信原生小程序
- TypeScript
- WXSS
- 后端：Spring Boot（Java 21）+ MySQL + MinIO
- 部署：Docker + 飞牛 NAS + Cloudflare Tunnel

## 功能

- 钓点探索：查看地图/列表钓点，按位置、评分筛选
- 钓点详情：位置、评分、渔种、配套设施、帖子关联
- 社区分享：发布图文帖子，点赞、评论、收藏
- 发布流程：新增钓点、发布鱼获帖子
- 消息通知：评论、点赞、关注等互动通知
- 个人中心：我的钓点、我的帖子、浏览历史、关注/粉丝
- 管理后台：钓点/帖子审核

## 目录结构

```
miniprogram/
├── app.ts / app.json / app.wxss    # 小程序入口
├── pages/                          # 页面
│   ├── spots/                      # 钓点首页
│   ├── spot-detail/                # 钓点详情
│   ├── spot-form/                  # 新增/编辑钓点
│   ├── community/                  # 社区首页
│   ├── post-detail/                # 帖子详情
│   ├── publish/                    # 发布入口
│   ├── messages/                   # 消息中心
│   ├── profile/                    # 个人中心
│   ├── history/                    # 浏览历史
│   ├── my-spots/                   # 我的钓点
│   ├── my-posts/                   # 我的帖子
│   └── admin/                      # 审核后台
├── components/                     # 公共组件
├── custom-tab-bar/                 # 自定义 TabBar
├── services/                       # API 请求层
├── models/                         # TypeScript 类型定义
├── utils/                          # 工具函数
└── images/                         # 图片资源
```

## 本地开发

1. 克隆仓库
2. 安装依赖

```bash
npm install
```

3. 用微信开发者工具打开项目根目录
4. 在 `project.config.json` 中填入你的小程序 `appid`
5. 修改 `miniprogram/services/request.ts` 中的 `API_BASE_URL` 指向你的后端地址

## 可用脚本

```bash
npm run typecheck      # TypeScript 类型检查
npm run lint           # ESLint 检查
npm run lint:fix       # 自动修复 ESLint 问题
npm run format         # Prettier 格式化
npm run format:check   # Prettier 格式检查
```

## 后端接口

默认接口前缀：`/api/v1`

主要模块：

- 用户认证（微信登录）
- 钓点（CRUD、收藏、评价、审核）
- 帖子（发布、点赞、评论、收藏）
- 社交（关注、粉丝）
- 通知（系统消息、互动消息）
- 文件上传（MinIO）
- 管理后台（审核、举报）

后端仓库为私有仓库，与前端仓库分开维护。

## 设计规范

- 主色：`#21B56B`
- 背景色：`#F7F8FA`
- 卡片圆角：16px（大卡片）/ 12px（普通）/ 6px（标签）
- 卡片阴影：`0 4px 16px rgba(0, 0, 0, 0.06)`

## 说明

- 本地记忆文件（`.workbuddy/memory/`）和私有配置（`project.private.config.json`）已加入 `.gitignore`，不会进入仓库。
- `node_modules/` 需通过 `npm install` 本地安装。
