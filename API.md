# API 接口文档

> **项目**：季悠然的便签（note）  
> **文档版本**：v1.0  
> **更新时间**：2026-03-05  
> **基础路径**：`/api`

---

## 📌 通用说明

### 认证方式

| 方式 | 说明 | 适用接口 |
|------|------|---------|
| `Authorization` Header | Bearer Token，由 SSO 登录后获得 | 需要用户身份的接口 |
| `x-user-id` Header | 当前用户的 SSO ID（数字） | 返回便签时判断收藏状态 |

### 通用响应格式

**成功响应**：返回具体数据对象或 `{ msg: 'ok' }`

**错误响应**：
```json
{
  "statusCode": 400,
  "statusMessage": "错误信息"
}
```

### 常见错误码

| 状态码 | 说明 |
|--------|------|
| `400` | 请求参数缺失或格式错误 |
| `401` | Token 已过期（`token expired`） |
| `404` | 便签不存在（`note not exist!`） |
| `500` | 服务器内部错误 |

### 便签对象结构（MemoRes）

```typescript
{
  id: number        // 便签数据库 ID
  sid: string       // 便签唯一标识符（URL 中的 ID）
  content: string   // 便签内容
  locked: boolean   // 是否已加密（有 key 时为 true）
  favoured: boolean // 当前用户是否已收藏
}
```

---

## 📋 接口列表

### 一、便签操作

---

#### 1. 获取便签

```
GET /api/getNote
```

**描述**：根据便签 SID 获取便签内容。

**请求参数**

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| `sid` | Query | string | ✅ | 便签唯一标识符 |
| `x-user-id` | Header | number | ❌ | 当前用户 ID，用于判断是否已收藏 |

**响应示例**

```json
{
  "id": 1,
  "sid": "abc123",
  "content": "便签内容",
  "locked": false,
  "favoured": false
}
```

**错误情况**

| 情况 | 状态码 | 消息 |
|------|--------|------|
| `sid` 未传 | 400 | `sid required!` |
| 便签不存在 | 404 | `note not exist!` |

---

#### 2. 创建 / 更新便签

```
POST /api/updateNote
```

**描述**：保存便签内容。若便签不存在则自动创建；若存在则更新内容。携带 Token 创建时，便签会绑定到当前用户。

**请求参数**

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| `sid` | Query | string | ✅ | 便签唯一标识符 |
| `Authorization` | Header | string | ❌ | Bearer Token，携带后便签归属到当前用户 |
| `x-user-id` | Header | number | ❌ | 当前用户 ID |

**请求体（JSON）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `content` | string | ✅ | 便签内容 |
| `key` | string | ❌ | 便签密钥（加密时使用） |

**请求示例**

```json
{
  "content": "这是我的便签内容",
  "key": "mypassword"
}
```

**响应示例**

```json
{
  "id": 1,
  "sid": "abc123",
  "content": "这是我的便签内容",
  "locked": true,
  "favoured": false
}
```

**错误情况**

| 情况 | 状态码 | 消息 |
|------|--------|------|
| `sid` 或 `content` 未传 | 400 | `data missing!` |
| 密钥不匹配 | 400 | `key error!` |
| Token 过期 | 401 | `token expired` |

---

#### 3. 删除便签

```
DELETE /api/delNote
```

**描述**：根据 SID 删除便签。若便签有密钥保护，需要传入正确的密钥。

**请求参数**

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| `sid` | Query | string | ✅ | 便签唯一标识符 |
| `key` | Query | string | ❌ | 便签密钥（加密便签必填） |

**响应示例**

```json
{
  "msg": "ok"
}
```

**错误情况**

| 情况 | 状态码 | 消息 |
|------|--------|------|
| `sid` 未传 | 400 | `sid required!` |
| 密钥不匹配 | 400 | `key error` |

> **注意**：若便签不存在，接口仍返回 `{ msg: 'ok' }`，不报错。

---

### 二、用户操作

---

#### 4. 用户登录（SSO）

```
GET /api/login
```

**描述**：通过 SSO ticket 验证用户身份，完成登录。

**请求参数**

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| `ticket` | Query | string | ✅ | SSO 登录后返回的 ticket |

**响应示例**

```json
{
  "id": 123,
  "email": "user@example.com",
  "role": "USER"
}
```

**错误情况**

| 情况 | 状态码 | 消息 |
|------|--------|------|
| `ticket` 未传 | 400 | `ticket required!` |
| ticket 验证失败 | 400 | `Failed to retrieve data!` |

---

#### 5. 获取我的便签列表

```
GET /api/getUserNote
```

**描述**：获取当前登录用户创建的便签列表，支持分页。

**请求参数**

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| `Authorization` | Header | string | ✅ | Bearer Token |
| `page` | Query | number | ❌ | 页码，默认 `1` |
| `limit` | Query | number | ❌ | 每页数量，默认 `100` |

**响应示例**

```json
{
  "total": 25,
  "data": [
    {
      "id": 1,
      "sid": "abc123",
      "content": "便签内容",
      "locked": false,
      "favoured": true
    }
  ]
}
```

**错误情况**

| 情况 | 状态码 | 消息 |
|------|--------|------|
| Token 未传 | 400 | `token required!` |
| Token 过期 | 401 | `token expired` |

---

### 三、收藏操作

---

#### 6. 获取收藏便签列表

```
GET /api/getFavourNote
```

**描述**：获取当前登录用户收藏的便签列表，支持分页。

**请求参数**

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| `Authorization` | Header | string | ✅ | Bearer Token |
| `page` | Query | number | ❌ | 页码，默认 `1` |
| `limit` | Query | number | ❌ | 每页数量，默认 `100` |

**响应示例**

```json
{
  "total": 5,
  "data": [
    {
      "id": 2,
      "sid": "xyz789",
      "content": "收藏的便签内容",
      "locked": false,
      "favoured": true
    }
  ]
}
```

**错误情况**

| 情况 | 状态码 | 消息 |
|------|--------|------|
| Token 未传 | 400 | `token required!` |
| Token 过期 | 401 | `token expired` |

---

#### 7. 收藏便签

```
POST /api/addFavourNote
```

**描述**：将指定便签添加到当前用户的收藏夹。

**请求参数**

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| `id` | Query | number | ✅ | 便签的数据库 ID（非 SID） |
| `Authorization` | Header | string | ✅ | Bearer Token |

**响应示例**

```json
{
  "msg": "ok"
}
```

**错误情况**

| 情况 | 状态码 | 消息 |
|------|--------|------|
| `id` 或 Token 未传 | 400 | `params missing!` |
| Token 过期 | 401 | `token expired` |

---

#### 8. 取消收藏便签

```
DELETE /api/delFavourNote
```

**描述**：将指定便签从当前用户的收藏夹中移除。

**请求参数**

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| `id` | Query | number | ✅ | 便签的数据库 ID（非 SID） |
| `Authorization` | Header | string | ✅ | Bearer Token |

**响应示例**

```json
{
  "msg": "ok"
}
```

**错误情况**

| 情况 | 状态码 | 消息 |
|------|--------|------|
| `id` 或 Token 未传 | 400 | `params missing!` |
| Token 过期 | 401 | `token expired` |

---

## 📊 接口汇总

| # | 接口名称 | 方法 | 路径 | 需要登录 |
|---|---------|------|------|---------|
| 1 | 获取便签 | `GET` | `/api/getNote` | ❌ |
| 2 | 创建/更新便签 | `POST` | `/api/updateNote` | ❌（可选） |
| 3 | 删除便签 | `DELETE` | `/api/delNote` | ❌ |
| 4 | SSO 登录 | `GET` | `/api/login` | ❌（ticket） |
| 5 | 获取我的便签 | `GET` | `/api/getUserNote` | ✅ |
| 6 | 获取收藏列表 | `GET` | `/api/getFavourNote` | ✅ |
| 7 | 收藏便签 | `POST` | `/api/addFavourNote` | ✅ |
| 8 | 取消收藏 | `DELETE` | `/api/delFavourNote` | ✅ |

---

## 🔄 外部依赖

所有需要用户身份验证的接口，均会向 SSO 服务发起 Token 校验请求：

```
GET {ssoApi}/user/validate
Header: Authorization: Bearer <token>
```

SSO 验证通过后返回用户信息（`id`、`email`、`role` 等），接口再进行后续数据库操作。

---

## 🗄️ 数据说明

### SID vs ID

| 字段 | 类型 | 说明 | 使用场景 |
|------|------|------|---------|
| `sid` | string | 便签业务标识符，即 URL 中的 ID | 查询、更新、删除便签 |
| `id` | number | 便签数据库自增主键 | 收藏/取消收藏操作 |

### 加密逻辑

- 便签的 `key` 字段存储密钥
- `locked: true` 表示该便签有密钥保护
- 更新或删除加密便签时必须提供正确的 `key`，否则返回 `key error`
- 加密功能**仅适用于在线便签**，本地便签不涉及
