# 五子棋對戰平台 - 雲端部署指南

本專案採用前後端分離架構，適合部署到各種雲端平台。

## 架構概覽

```
┌─────────────────┐     WebSocket/HTTP     ┌─────────────────┐
│   Frontend      │ ◄───────────────────► │    Backend      │
│   (Next.js)     │                        │  (Socket.IO)    │
│                 │                        │                 │
│  Vercel/        │                        │  Railway/       │
│  Netlify        │                        │  Render/        │
│                 │                        │  Fly.io         │
└─────────────────┘                        └────────┬────────┘
                                                    │
                                           ┌────────▼────────┐
                                           │   PostgreSQL    │
                                           │   (Supabase/    │
                                           │    Railway)     │
                                           └─────────────────┘
```

---

## 方案一：Vercel (前端) + Railway (後端) - 推薦 ⭐

### ✅ 步驟 1：準備 PostgreSQL 資料庫（已完成）

你已經完成 Supabase 資料庫設定！連接字串：
```
postgresql://postgres.noxrnoupolxrxastdowv:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

---

### 步驟 2：推送程式碼到 GitHub

1. 確保你的專案已經推送到 GitHub
2. 如果還沒有，執行：
   ```bash
   cd F:\github\Gomoku_cloud
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

---

### 步驟 3：部署後端到 Railway（詳細步驟）

#### 3.1 註冊/登入 Railway
1. 前往 [railway.app](https://railway.app)
2. 點擊右上角 **Login** → 選擇 **Login with GitHub**
3. 授權 Railway 存取你的 GitHub

#### 3.2 建立新專案
1. 點擊 **New Project**
2. 選擇 **Deploy from GitHub repo**
3. 找到並選擇你的 `Gomoku_cloud` repository
4. 如果看不到，點擊 **Configure GitHub App** 授權存取

#### 3.3 設定專案（重要！）
Railway 會自動偵測專案，但我們需要手動設定：

1. 點擊剛建立的 service（卡片）
2. 進入 **Settings** 標籤
3. 設定以下內容：

   | 設定項目 | 值 |
   |---------|-----|
   | **Root Directory** | `backend` |
   | **Build Command** | `npm install && npx prisma generate && npm run build` |
   | **Start Command** | `npx prisma db push && npm start` |

#### 3.4 設定環境變數
1. 點擊 **Variables** 標籤
2. 點擊 **New Variable** 或 **RAW Editor**
3. 添加以下環境變數：

   ```
   DATABASE_URL=postgresql://postgres.noxrnoupolxrxastdowv:Aa0098480621@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
   JWT_SECRET=gomoku_production_secret_key_2024_change_this
   PORT=3001
   CORS_ORIGIN=*
   ```
   
   > ⚠️ `CORS_ORIGIN=*` 是暫時的，等前端部署完成後要改成前端 URL

#### 3.5 部署
1. 點擊 **Deploy** 或 Railway 會自動開始部署
2. 等待部署完成（約 2-5 分鐘）
3. 查看 **Deployments** 標籤確認狀態為 ✅

#### 3.6 取得後端 URL
1. 部署成功後，進入 **Settings** 標籤
2. 找到 **Networking** 區塊
3. 點擊 **Generate Domain** 生成公開網址
4. 記下這個 URL，格式類似：
   ```
   https://gomoku-backend-production.up.railway.app
   ```

---

### 步驟 4：部署前端到 Vercel（詳細步驟）

#### 4.1 註冊/登入 Vercel
1. 前往 [vercel.com](https://vercel.com)
2. 點擊 **Sign Up** → 選擇 **Continue with GitHub**
3. 授權 Vercel 存取你的 GitHub

#### 4.2 導入專案
1. 點擊 **Add New...** → **Project**
2. 在 **Import Git Repository** 找到 `Gomoku_cloud`
3. 點擊 **Import**

#### 4.3 設定專案（重要！）
1. **Framework Preset**: 選擇 `Next.js`（應該會自動偵測）
2. **Root Directory**: 點擊 **Edit** → 輸入 `frontend` → 點擊 **Continue**
3. **Environment Variables**: 點擊展開，添加：

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SOCKET_URL` | `https://你的Railway後端URL` |

   例如：
   ```
   NEXT_PUBLIC_SOCKET_URL=https://gomoku-backend-production.up.railway.app
   ```

#### 4.4 部署
1. 點擊 **Deploy**
2. 等待部署完成（約 1-3 分鐘）
3. 部署成功後會顯示你的網站 URL，格式類似：
   ```
   https://gomoku-cloud.vercel.app
   ```

---

### 步驟 5：更新後端 CORS 設定（重要！）

1. 回到 [Railway Dashboard](https://railway.app/dashboard)
2. 進入你的 Gomoku 專案
3. 點擊 **Variables** 標籤
4. 找到 `CORS_ORIGIN`，更新為你的 Vercel 前端 URL：
   ```
   CORS_ORIGIN=https://gomoku-cloud.vercel.app
   ```
   > 把 `gomoku-cloud.vercel.app` 換成你實際的 Vercel URL

5. Railway 會自動重新部署

---

### 步驟 6：驗證部署成功

1. 開啟你的 Vercel 前端網址
2. 測試以下功能：
   - [ ] 網頁正常載入
   - [ ] 可以註冊新帳號
   - [ ] 可以登入
   - [ ] 可以建立房間
   - [ ] 可以進行對戰

---

### 常見問題排解

#### ❌ Railway 部署失敗
檢查 **Deployments** 標籤的錯誤日誌：
- `Cannot find module`: 確認 Root Directory 設為 `backend`
- `prisma generate failed`: 確認 Build Command 正確

#### ❌ 前端無法連接後端
1. 開啟瀏覽器開發者工具（F12）→ Console
2. 檢查是否有 CORS 錯誤
3. 確認 `NEXT_PUBLIC_SOCKET_URL` 設定正確
4. 確認 Railway 的 `CORS_ORIGIN` 設定正確

#### ❌ 資料庫連接失敗
1. 確認 Supabase 專案沒有暫停
2. 確認使用的是 Session Pooler 連接字串
3. 在 Railway 的 Deployments 查看錯誤日誌

---

## 方案二：Render (全套免費) - 適合測試

### 後端部署

1. 前往 [Render](https://render.com)
2. 建立 Web Service，連結 GitHub repo
3. 設定：
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
4. 新增 PostgreSQL 資料庫（Render 提供免費版）
5. 設定環境變數

### 前端部署

1. 建立 Static Site（或使用 Vercel）
2. 設定 `NEXT_PUBLIC_SOCKET_URL` 指向後端

---

## 方案三：Fly.io (WebSocket 最佳支援)

Fly.io 對 WebSocket 支援最好，適合即時對戰遊戲。

### 安裝 Fly CLI

```bash
# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# 或使用 npm
npm install -g flyctl
```

### 部署後端

```bash
cd backend

# 登入
fly auth login

# 初始化
fly launch

# 設定環境變數
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set JWT_SECRET="your-secret-key"
fly secrets set CORS_ORIGIN="https://your-frontend.vercel.app"

# 部署
fly deploy
```

建立 `backend/Dockerfile`：

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma/
RUN npx prisma generate

COPY dist ./dist/

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

建立 `backend/fly.toml`：

```toml
app = "gomoku-backend"
primary_region = "nrt"  # 東京，離台灣近

[build]

[env]
  PORT = "3001"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true

[[services]]
  protocol = "tcp"
  internal_port = 3001

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.ports]]
    port = 80
    handlers = ["http"]
```

---

## 環境變數清單

### 後端 (Backend)

| 變數名 | 說明 | 範例 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 連接字串 | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT 簽名密鑰 | 隨機 32+ 字元字串 |
| `PORT` | 伺服器埠號 | `3001` |
| `CORS_ORIGIN` | 允許的前端來源 | `https://your-app.vercel.app` |

### 前端 (Frontend)

| 變數名 | 說明 | 範例 |
|--------|------|------|
| `NEXT_PUBLIC_SOCKET_URL` | 後端 WebSocket URL | `https://your-backend.railway.app` |

---

## 更新前端 Socket 連接

確保 `frontend/src/services/socketService.ts` 使用環境變數：

```typescript
private serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
```

---

## 常見問題

### 1. WebSocket 連接失敗

- 確認後端 CORS 設定正確
- 確認前端 `NEXT_PUBLIC_SOCKET_URL` 正確
- 部分平台需要啟用 WebSocket 支援

### 2. 資料庫連接失敗

- 確認 `DATABASE_URL` 格式正確
- 確認資料庫允許外部連接
- 執行 `npx prisma db push` 建立表格

### 3. 建置失敗

```bash
# 本地測試建置
cd backend && npm run build
cd frontend && npm run build
```

---

## 推薦配置（最佳性價比）

| 服務 | 平台 | 費用 |
|------|------|------|
| 前端 | Vercel | 免費 |
| 後端 | Railway / Fly.io | 免費額度 |
| 資料庫 | Supabase / Railway | 免費額度 |

總費用：**$0/月**（在免費額度內）

---

## 部署檢查清單

- [ ] PostgreSQL 資料庫已建立
- [ ] 後端 `prisma/schema.prisma` 改為 `postgresql`
- [ ] 後端環境變數已設定
- [ ] 後端已成功部署並可訪問
- [ ] 前端 `NEXT_PUBLIC_SOCKET_URL` 已設定
- [ ] 前端已成功部署
- [ ] WebSocket 連接正常
- [ ] 登入/註冊功能正常
- [ ] 對戰功能正常
