# GoFish 项目长期记录

## 项目基本信息
- **项目名**：GoFish（钓鱼佬钓点与鱼获分享微信小程序）
- **路径**：/Users/ashitaka/gitRep/gofish
- **技术栈**：微信小程序原生 + TypeScript + WXSS
- **后端**：本地开发指向 127.0.0.1:8080，生产预计接微信云开发

## 目录结构概览
```
miniprogram/
├── app.ts / app.json / app.wxss      入口
├── pages/                            13 个页面（含 admin 子目录）
│   ├── TabBar 五页：spots / community / publish / messages / profile
│   ├── 详情页：spot-detail / post-detail / spot-form
│   ├── 我的子页：my-spots / my-spot-detail / my-posts
│   └── admin/：reviews / review-detail
├── components/                       13 个组件
│   ├── 卡片类：spot-card / my-spot-card / post-card / spot-change-diff
│   ├── UI 原子：rating-stars / tag-chip / user-avatar / empty-state
│   └── 布局/业务：bottom-nav / bottom-safe-area / review-action-bar / review-status-tag / spot-operation-tag / spot-visibility-tag
├── custom-tab-bar/                   自定义 TabBar（中间发布按钮凸起）
├── services/                         8 个 service 文件
│   └── request.ts（HTTP 基础层，含自动刷新 token 逻辑）
├── models/index.ts                   所有 TS interface & 枚举
├── utils/spot-status.ts
├── mock/index.ts
└── images/
```

## 设计规范（来自 FISHING_MINIAPP_SPEC.md）
- 主色 #21B56B，背景 #F7F8FA，白底卡片
- 圆角：大卡片 16px，普通 12px，标签 6px
- 阴影：`0 4px 16px rgba(0,0,0,0.06)`

## 开发进度（已知）
- 基础脚手架、路由、组件、services、models 层已完成
- request.ts 含 JWT Bearer token + 401 自动重新登录逻辑
- Mock 数据层存在于 mock/index.ts
- admin 审核流程页面已建立（reviews + review-detail）
