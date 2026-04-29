## Next + Cloudflare 練習專案

目前包含：
- `/api/ping`：基本 API 測試
- `/api/todos`：D1 Todo 練習（GET/POST）
- `db/0001_create_todos.sql`：建立 `todos` 資料表

## 本機啟動

```bash
npm run dev
```

打開 [http://localhost:3000](http://localhost:3000)。

## D1 設定步驟

1) 建立 D1 資料庫（Cloudflare Dashboard）
- Storage & Databases -> D1 -> Create database
- 記下 `account id` 與 `database id`

2) 建立資料表
- 到 D1 Console 執行 `db/0001_create_todos.sql`

3) 設定環境變數（本機 `.env.local` 與 Cloudflare Pages 都要設）

```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_D1_DATABASE_ID=your_database_id
CLOUDFLARE_API_TOKEN=your_api_token
```

4) API Token 權限建議
- 需要 D1 的讀寫權限（至少可查詢與寫入指定 DB）

## 驗收

- 首頁 `Step 2` 可新增 Todo
- 可按重新讀取看到最新列表
- 直接打 `/api/todos` 可看到 JSON

## 下一步

- DELETE `/api/todos/:id`
- KV 快取 Todo 列表
- R2 圖片上傳
