# 架构治理规则（2.1 阶段）

> 本文档定义了项目架构的强制规则，所有新代码必须遵守。违反规则的 PR 不应被合并。

---

## 一、依赖规则（核心）

```
允许的依赖链：
  UI (pages/components) → modules → services → domain → core
                              ↗
                    api / platform
```

```
禁止的依赖：
  domain  ❌ 不得依赖 services / modules / store / wx API
  core    ❌ 不得包含业务逻辑，不得依赖 store / domain / services
  services ❌ 不得操作 storage，不得调用 wx API，不得调用 modules
  modules ❌ 不得互相调用
  store   ❌ 不得调用 API，不得包含业务逻辑
  adapter ❌ 不得包含业务逻辑，不得调用 domain / services / core
```

---

## 二、各层职责

### 2.1 API 层 (`src/api/`)

| 职责 | 禁止 |
|------|------|
| 统一请求出口 | 包含业务逻辑 |
| 拦截器（token注入/loading控制） | 直接操作UI |
| 统一错误处理 | 修改API返回结构 |

### 2.2 Services 层 (`src/services/`)

| 职责 | 禁止 |
|------|------|
| 组合 API 调用 | 操作 storage |
| 调用 domain 逻辑 | 调用 wx API |
| 轻量数据转换 | 调用 modules |
| 业务编排 | 包含UI逻辑 |

### 2.3 Domain 层 (`src/domain/`)

| 职责 | 禁止 |
|------|------|
| 纯数据模型与计算 | 依赖 services |
| 业务规则校验 | 依赖 store |
| 匹配/评分算法 | 依赖 modules |
| 不依赖任何外部模块 | 调用 wx API |

### 2.4 Modules 层 (`src/modules/`)

| 职责 | 禁止 |
|------|------|
| 组合 services + store | 互相调用 |
| 对页面暴露业务接口 | 直接调用 wx API（必须通过 services） |
| 状态管理联动 | 包含 UI 渲染逻辑 |

### 2.5 Store 层 (`src/store/`)

| 职责 | 禁止 |
|------|------|
| 单一领域状态管理 | 调用 API |
| subscribe 通知 | 包含业务逻辑 |
| getter / setter | 互相引用其他 store |

### 2.6 Core 层 (`src/core/`)

| 职责 | 禁止 |
|------|------|
| 事件总线 | 包含业务逻辑 |
| 插件管理 | 依赖 store / domain / services |
| 权限容器 | 直接操作 UI |

### 2.7 Adapter 层 (`src/adapter/`)

| 职责 | 禁止 |
|------|------|
| 旧 storage 兼容 | 写业务逻辑 |
| globalData 映射 | 调用 domain |
| 图片路径兼容 | 调用 services / core |

---

## 三、事件命名规范

所有事件必须使用命名空间前缀：

| 命名空间 | 用途 | 示例 |
|----------|------|------|
| `user:*` | 用户相关 | `user:login`, `user:logout`, `user:roleChange` |
| `chat:*` | 聊天相关 | `chat:newMessage`, `chat:unreadChange`, `chat:conversationOpen` |
| `feed:*` | 信息流相关 | `feed:beforeRender`, `feed:build` |
| `system:*` | 系统生命周期 | `system:init`, `system:start` |
| `plugin:*` | 插件相关 | `plugin:installed`, `plugin:ai-recommend:ready` |
| `core:*` | 内核保留 | 仅 core 内部使用 |

### 事件使用规则

```
✔ 只用于：状态通知 / 生命周期同步 / 解耦通信
❌ 禁止 emit 无命名空间的事件
❌ 禁止在 handler 中写业务逻辑
❌ 禁止通过事件跨模块直接调用
```

---

## 四、Store 规则

```
每个 store 文件职责：
  /store/userStore.js    — 用户状态
  /store/chatStore.js    — 聊天状态
  /store/feedStore.js    — 信息流状态
  /store/appStore.js     — 应用全局状态

规则：
  ✔ 只存储状态，不包含方法
  ✔ 使用 subscribe 做被动通知
  ❌ store 之间禁止互相引用
  ❌ store 不能调用 API
  ❌ store 不能包含业务逻辑
```

---

## 五、Module 规则

```
✔ modules 只能做三件事：
  1. 调用 services 获取/提交数据
  2. 调用 store 更新/读取状态
  3. 组合以上逻辑对页面暴露方法

❌ 禁止的行为：
  - moduleA 调用 moduleB
  - module 直接调用 wx API（wx.request 等）
  - module 操作页面路由（wx.navigateTo / wx.reLaunch 等）
```

---

## 六、数据流规范

### 标准数据流

```
UI (pages/components)
  → modules.xxx.method()      ← 页面只调用 modules
    → services.xxx.method()   ← modules 编排 services
      → api.request()         ← services 调用 API
      → domain.model/logic    ← services 调用 domain 计算
    → store.xxx.set()         ← modules 更新状态
  ← 返回结果给 UI
```

### 禁止的数据流

```
✗ UI → api 直接调用
✗ UI → services 跳过 modules
✗ services → store 直接写数据
✗ modules → 互相调用
✗ domain → 依赖外部模块
```

---

## 七、文件命名与组织规范

```
src/
  api/          — 所有 API 请求（统一出口）
  services/     — 业务编排（禁止操作 storage/wx）
  store/        — 状态管理（按领域拆分，禁止互相引用）
  modules/      — 业务模块（禁止互相调用）
  domain/       — 领域模型（纯逻辑，零依赖）
  core/         — 微内核（不含业务）
  plugins/      — 插件（通过事件扩展）
  ai/           — AI Pipeline
  feed-engine/  — 信息流引擎
  platform/     — SaaS 平台能力
  adapter/      — 旧系统兼容层
  constants/    — 常量
  utils/        — 工具函数
  hooks/        — 可复用逻辑
```

---

## 八、违规处理

| 违规类型 | 处理方式 |
|----------|----------|
| domain 依赖 services | ❌ 拒绝合并 |
| core 包含业务逻辑 | ❌ 拒绝合并 |
| services 操作 storage | ❌ 拒绝合并 |
| modules 互相调用 | ❌ 拒绝合并 |
| store 调用 API | ❌ 拒绝合并 |
| adapter 写业务逻辑 | ❌ 拒绝合并 |
| emit 无命名空间事件 | ⚠️ warning，限期整改 |

---

*最后更新: 2.1 阶段治理完成*
