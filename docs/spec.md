# ウラドリ 仕様書

> 放送の裏側を、視聴者がとりにいく

---

## 1. プロダクト概要

### 課題

- テレビの尺の制約により、取材した情報の大半がカットされる
- 視聴者は断片的な情報しか得られず、偏向報道と感じてしまう
- 視聴者の声がメディアに届かず、一方通行のメディアになっている

### 解決策

放送中・放送後に視聴者の声を蓄積し、**日テレ取材フル素材を持つソラジローAI** と **視聴者の集合知AI** が対話することで、双方向メディアを実現する。

### ターゲット

- Apple Vision Pro ユーザー（メイン体験）
- 日本テレビ視聴者

---

## 2. 体験フロー

```
① 放送中
   └── Vision Pro でスタジオ・VTR が空間に広がる
   └── 視聴者が「声」で思ったことをリアルタイム発言
   └── 発言が視聴者代表AIのコンテキストに蓄積される

② トピック終了後
   └── 視聴者の声が集約され「視聴者代表AI」が形成される
   └── ソラジローAI（取材フル素材）が登場
   └── 2つのAIが空間上で対話開始

③ AI対話中
   └── 視聴者はさらに声で介入・追加意見を投下できる
   └── ソラジローAIは3層情報で応答する
       ├── 📺 放送情報（放送スクリプト）
       ├── 📁 未放送素材（取材メモ・カット情報）
       └── 🌐 オープンデータ（政府統計・白書・論文）
```

---

## 3. システムアーキテクチャ

```
[Apple Vision Pro]
 visionOS ネイティブアプリ
 ├── ImmersiveSpace (RealityKit)
 │   ├── スタジオ・VTR 空間再現
 │   ├── ソラジローAI アバター
 │   └── 視聴者の声が空間に浮かぶ演出
 ├── SwiftUI Panel
 │   ├── AI対話テキスト表示（3層情報付き）
 │   └── 意見入力UI
 └── Speech Framework
     └── 音声認識 → テキスト変換 → API送信
          ↕ URLSession WebSocket / SSE
[Cloudflare Workers + Hono]
 ├── POST /api/topics          # トピック登録（管理者）
 ├── GET  /api/topics          # トピック一覧取得
 ├── POST /api/voice           # 視聴者の声蓄積 → D1保存
 ├── POST /api/dialog/start    # 声集約→質問生成→対話→SSE配信
 └── POST /api/ingest          # 素材登録（管理者）→ D1 + Vectorize
          ↕
 ├── Workers AI               # LLM + Embedding（Cloudflare内完結）
 │   ├── llama-3.1-70b-instruct  # 対話・質問生成
 │   └── plamo-embedding-1b      # 日本語Embedding
 ├── D1                       # 視聴者の声 蓄積DB
 ├── Vectorize                # 日テレ素材 RAG ベクトルDB
 ├── R2                       # 日テレ素材・VTR ファイル保存
 └── 外部API（日テレハッカソン） # 番組・コーナー・ニュース・YouTube
```

---

## 4. AI設計

### ソラジローAI

| 項目         | 内容                                               |
| ------------ | -------------------------------------------------- |
| モデル       | Workers AI `llama-3.1-70b-instruct`               |
| コンテキスト | Vectorize RAGから取得した3層情報                   |
| 応答形式     | 3層情報タグ付き（放送 / 未放送 / オープンデータ）  |
| ペルソナ     | ソラジロー：公平で透明性を重視するAIジャーナリスト |

### 視聴者代表AI

| 項目           | 内容                                               |
| -------------- | -------------------------------------------------- |
| モデル         | Workers AI `llama-3.1-70b-instruct`               |
| コンテキスト   | D1に蓄積された視聴者の声の集合知                   |
| 役割           | 視聴者の声を集約し、質問形式に変換してソラジローAIに投げる |
| 更新タイミング | 視聴者が新たに意見を入力するたびにコンテキスト更新 |

### 3層情報の取得設計

全てVectorize RAGで統一。LLMもWorkers AI内で完結し、データが外部に送信されない。

| source | データ取得元 | 登録方法 |
|--------|-----------|---------|
| `broadcast` | コーナー情報（headline, memo等） | ingest auto: 外部APIから自動取得 |
| `unaired` | ニュース記事、YouTube動画情報 | ingest auto: 外部APIから自動取得 |
| `opendata` | 政府統計・白書等 | ingest manual: 管理者が手動テキスト登録 |

### データ機密性

- 日テレ提供データの機密性を考慮し、LLM・Embeddingは全てCloudflare Workers AI内で処理
- Claude API等の外部LLMサービスは使用しない（データがCloudflare外に送信されるため）
- AI GatewayおよびAnthropic SDKは不要

---

## 5. 技術スタック

### バックエンド

| 種別           | 技術               | 用途             |
| -------------- | ------------------ | ---------------- |
| 言語           | TypeScript         | 全体             |
| フレームワーク | Hono               | APIサーバー      |
| ランタイム     | Cloudflare Workers | サーバーレス実行 |
| ORM            | Drizzle ORM        | D1操作           |

### フロントエンド（visionOS）

| 種別             | 技術                    | 用途                     |
| ---------------- | ----------------------- | ------------------------ |
| 言語             | Swift                   | visionOSアプリ全体       |
| UIフレームワーク | SwiftUI                 | 2D UIパネル              |
| 3Dフレームワーク | RealityKit              | 空間コンテンツ・VTR配置  |
| 空間設計ツール   | Reality Composer Pro    | シーンのGUI設計          |
| 没入モード       | ImmersiveSpace          | フル没入（スタジオ再現） |
| 音声入力         | Speech framework        | 視聴者の声認識           |
| 動画再生         | AVFoundation            | VTR・放送映像再生        |
| API通信          | URLSession              | Hono Workers API呼び出し |
| リアルタイム     | URLSessionWebSocketTask | WebSocket接続            |

### AI・RAG（全てCloudflare Workers AI内で完結）

| 種別            | 技術                            | 用途                         |
| --------------- | ------------------------------- | ---------------------------- |
| LLMモデル       | @cf/meta/llama-3.1-70b-instruct | 対話・質問生成（Workers AI） |
| Embeddingモデル | @cf/pfnet/plamo-embedding-1b    | 日本語テキストベクトル化     |
| ベクトルDB      | Cloudflare Vectorize            | 日テレ素材RAG検索            |

### Cloudflareサービス

| サービス        | 用途                                |
| --------------- | ----------------------------------- |
| Workers         | Honoアプリ実行環境（有料プラン）    |
| Workers AI      | LLM + Embedding（データ外部送信なし）|
| D1              | 視聴者の声蓄積DB（SQLite）          |
| Vectorize       | 日テレ素材RAGベクトルDB             |
| R2              | 日テレ素材・VTRファイルストレージ   |

### 開発ツール

| 種別             | 技術         | 用途                           |
| ---------------- | ------------ | ------------------------------ |
| ローカル開発     | Wrangler     | Workers / D1 / R2ローカル実行  |
| パッケージ管理   | pnpm         | 依存関係管理                   |
| テスト           | Vitest       | テスト実行                     |
| Workers テスト   | @cloudflare/vitest-pool-workers | D1等バインディングテスト |
| Linter/Formatter | Biome        | ESLint + Prettier代替          |
| Swift IDE        | Xcode 15以上 | visionOSビルド・シミュレーター |

---

## 6. プロジェクト構成

```
uradori/
├── server/                        # Hono + Cloudflare Workers
│   ├── src/
│   │   ├── index.ts               # エントリーポイント
│   │   ├── routes/
│   │   │   ├── topics.ts          # トピック登録・一覧API
│   │   │   ├── voice.ts           # 視聴者の声受付API
│   │   │   ├── dialog.ts          # 声集約→質問生成→対話→SSE配信
│   │   │   └── ingest.ts          # 素材登録（D1 + Vectorize）
│   │   ├── ai/
│   │   │   ├── sorajiro.ts        # ソラジローAI（Workers AI + RAG）
│   │   │   └── audience.ts        # 視聴者代表AI（声集約→質問生成）
│   │   ├── db/
│   │   │   └── schema.ts          # Drizzle ORMスキーマ定義
│   │   └── middleware/
│   │       └── admin-auth.ts      # X-Admin-Key認証ミドルウェア
│   ├── test/
│   │   ├── routes/                # API統合テスト
│   │   └── ai/                    # AIロジックユニットテスト
│   ├── wrangler.jsonc
│   └── vitest.config.ts
├── ios/                           # visionOSアプリ（Swift）
│   ├── UradoriApp.swift
│   ├── Views/
│   │   ├── ImmersiveView.swift    # RealityKit空間（スタジオ・VTR）
│   │   ├── DialogView.swift       # AI対話テキスト表示
│   │   └── VoiceInputView.swift   # 音声入力UI
│   ├── Models/
│   │   ├── SorajiroAI.swift       # ソラジローAIモデル
│   │   └── AudienceAI.swift       # 視聴者代表AIモデル
│   └── Services/
│       ├── APIClient.swift        # Workers API呼び出し
│       └── SpeechService.swift    # 音声認識
└── docs/
    └── spec.md                    # 仕様書
```

---

## 7. APIインターフェース仕様

### 認証

- **管理者API**: `X-Admin-Key` ヘッダー + 環境変数のシークレットキー
- **視聴者API**: 認証不要

### エンドポイント一覧

| メソッド | パス | 認証 | 用途 |
|---------|------|------|------|
| POST | `/api/topics` | Admin Key | トピック登録 |
| GET | `/api/topics` | なし | トピック一覧取得 |
| POST | `/api/voice` | なし | 視聴者の声を蓄積 |
| POST | `/api/dialog/start` | なし | 声集約→質問生成→ソラジロー対話→SSE配信 |
| POST | `/api/ingest` | Admin Key | 素材をVectorize登録 |

### `POST /api/topics`（管理者）

トピック（コーナー）を手動登録。管理者がtitle_idとコーナー情報を指定して登録する。

```typescript
// Request
Headers: { "X-Admin-Key": "secret" }
Body: {
  title_id: string,          // 外部API番組コード (例: "ﾐ00C")
  onair_date: string,        // YYYY-MM-DD
  headline: string,          // コーナー見出し
  corner_start_time?: string,
  corner_end_time?: string,
  headline_genre?: string,
  broadcast_script?: string
}
// Response: 201
{ id: string, ok: true }
```

### `GET /api/topics`（公開）

トピック一覧取得。title_idとonair_dateで任意フィルター可能。

```typescript
// Query: ?title_id=ﾐ00C&onair_date=2026-03-28
// Response: 200
{
  items: [{
    id: string,
    title_id: string,
    onair_date: string,
    headline: string,
    corner_start_time: string | null,
    corner_end_time: string | null,
    headline_genre: string | null
  }]
}
```

### `POST /api/voice`（公開）

視聴者の声を蓄積。テキストは500文字制限。

```typescript
// Request
Body: { topic_id: string, text: string }
// Response: 201
{ id: string, ok: true }
```

### `POST /api/dialog/start`（公開）

視聴者の声を集約 → LLMで質問生成 → ソラジローAIと自動対話 → SSE配信。

```typescript
// Request
Body: { topic_id: string }

// Response: SSEストリーム

// 1. 質問一覧（視聴者の声を集約してAI生成）
event: questions
data: { questions: [{ text: string, based_on_count: number }] }

// 2. 各質問に対するソラジローAIの応答を順次配信
event: dialog
data: {
  question: string,
  speaker: "sorajiro",
  text: string,
  source: "broadcast" | "unaired" | "opendata"
}

// 3. 全質問の対話完了
event: done
data: { session_id: string }
```

### `POST /api/ingest`（管理者）

素材をVectorizeに登録。外部API自動取得モードと手動テキスト登録モードを切り替え。

```typescript
// 外部API自動取得モード（コーナー・ニュース・YouTube）
Headers: { "X-Admin-Key": "secret" }
Body: {
  mode: "auto",
  topic_id: string,
  sources: ("corners" | "news" | "youtube")[]
}

// 手動テキスト登録モード（opendata等）
Headers: { "X-Admin-Key": "secret" }
Body: {
  mode: "manual",
  topic_id: string,
  content: string,
  type: "opendata",
  source_url?: string    // 出典URL
}

// Response: 201
{ ok: true, indexed_count: number }
```

### エラーレスポンス（全エンドポイント共通）

```typescript
// 成功
{ ok: true, ...data }

// エラー
{
  ok: false,
  error: {
    code: "VALIDATION_ERROR" | "UNAUTHORIZED" | "NOT_FOUND" | "INTERNAL_ERROR",
    message: string
  }
}
```

| ステータス | code | 用途 |
|-----------|------|------|
| 400 | `VALIDATION_ERROR` | バリデーション失敗（500文字超過、必須フィールド欠如等） |
| 401 | `UNAUTHORIZED` | Admin Key不正・未指定 |
| 404 | `NOT_FOUND` | topic_idが存在しない等 |
| 500 | `INTERNAL_ERROR` | サーバー内部エラー |

### CORS

- 本番: CORSなし（visionOSネイティブアプリはURLSessionで接続）
- 開発: `localhost:*` のみ許可（ブラウザ/Swagger UIからのテスト用）

---

## 8. D1 データスキーマ

### 設計方針

- **ID生成**: UUID v7（全テーブル共通、時系列ソート可能）
- **FK制約**: 全テーブルで有効化（`PRAGMA foreign_keys = ON`）
- **削除方針**: 削除機能なし
- **外部APIキャッシュ**: コーナー情報のみD1保存、視聴率・YouTube等は都度外部API

### テーブル定義

```sql
-- トピック（コーナー単位、外部APIのcornersに対応）
CREATE TABLE topics (
  id TEXT PRIMARY KEY,              -- UUID v7
  title_id TEXT NOT NULL,           -- 外部API番組コード (例: "ﾐ00C")
  onair_date TEXT NOT NULL,         -- 放送日 (YYYY-MM-DD)
  headline TEXT NOT NULL,           -- コーナー見出し
  corner_start_time TEXT,           -- コーナー開始時刻
  corner_end_time TEXT,             -- コーナー終了時刻
  headline_genre TEXT,              -- ジャンル
  broadcast_script TEXT             -- 放送スクリプト
);

-- 視聴者の声
CREATE TABLE audience_voices (
  id TEXT PRIMARY KEY,              -- UUID v7
  topic_id TEXT NOT NULL REFERENCES topics(id),
  text TEXT NOT NULL,               -- 500文字制限
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI対話セッション
CREATE TABLE dialog_sessions (
  id TEXT PRIMARY KEY,              -- UUID v7
  topic_id TEXT NOT NULL REFERENCES topics(id),
  status TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'ended'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

-- AI対話ログ
CREATE TABLE dialog_logs (
  id TEXT PRIMARY KEY,              -- UUID v7
  session_id TEXT NOT NULL REFERENCES dialog_sessions(id),
  topic_id TEXT NOT NULL REFERENCES topics(id),
  speaker TEXT NOT NULL,            -- 'sorajiro' | 'audience'
  text TEXT NOT NULL,
  source TEXT,                      -- 'broadcast' | 'unaired' | 'opendata'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 素材メタデータ
CREATE TABLE materials (
  id TEXT PRIMARY KEY,              -- UUID v7
  topic_id TEXT NOT NULL REFERENCES topics(id),
  type TEXT NOT NULL,               -- 'script' | 'memo' | 'unaired'
  content TEXT NOT NULL,
  vectorize_id TEXT,                -- Vectorizeに登録したベクトルのID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_topics_titleid_date ON topics(title_id, onair_date);
CREATE INDEX idx_audience_voices_topic ON audience_voices(topic_id);
CREATE INDEX idx_dialog_sessions_topic ON dialog_sessions(topic_id);
CREATE INDEX idx_dialog_logs_session ON dialog_logs(session_id);
CREATE INDEX idx_dialog_logs_topic_created ON dialog_logs(topic_id, created_at);
CREATE INDEX idx_materials_topic ON materials(topic_id);
```

---

## 9. テスト戦略

### フレームワーク

| 種別 | 技術 | 用途 |
|------|------|------|
| テストFW | Vitest | テスト実行 |
| Workers対応 | @cloudflare/vitest-pool-workers | D1等のバインディングをテスト内で利用 |

### テスト範囲

#### API統合テスト

| エンドポイント | テスト内容 |
|---------------|----------|
| `POST /api/topics` | 正常登録、Admin Key不正で401、バリデーションエラー |
| `GET /api/topics` | 一覧取得、title_id・onair_dateフィルタリング |
| `POST /api/voice` | 正常蓄積、500文字超過で400、存在しないtopic_idで400 |
| `POST /api/dialog/start` | SSEストリーム開始確認 |
| `POST /api/ingest` | 素材登録、Vectorize連携確認 |

#### AIロジック ユニットテスト（Workers AIモック）

- 視聴者の声 → 質問生成のプロンプト組み立て
- ソラジローAIのRAGコンテキスト構築
- SSEイベントのフォーマット

---

## 10. SSE設計

- **Workersプラン**: 有料プラン（$5/月）— CPU時間無制限、SSEタイムアウトなし
- **質問数上限**: 制限なし（LLMが必要と判断した数だけ生成）
- **クライアント切断**: SSE切断を検知したらWorkers AI呼び出しも中断

---

## 11. 環境変数一覧

### シークレット（`wrangler secret put`）

| 変数名 | 用途 |
|--------|------|
| `ADMIN_KEY` | X-Admin-Key認証 |
| `HACKATHON_API_KEY` | 外部API(日テレハッカソン)認証 |
| `HACKATHON_API_URL` | 外部APIベースURL |

### バインディング

| バインディング名 | 種別 | 用途 |
|-----------------|------|------|
| `DB` | D1 | データベース |
| `VECTORIZE` | Vectorize | ベクトルインデックス |
| `AI` | Workers AI | LLM（llama-3.1-70b）+ Embedding（plamo-embedding-1b） |

---

## 12. 役割分担

|          | 担当A（バックエンド）                                                        | 担当B（visionOS）                                                               |
| -------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 技術     | TypeScript / Hono / Cloudflare                                               | Swift / SwiftUI / RealityKit                                                    |
| 担当範囲 | Workers API / D1 / Vectorize RAG / Workers AI / SSE                          | Xcode プロジェクト / SwiftUI UI / APIClient / RealityKit 空間 / Speech 音声入力 |
| 接点     | APIインターフェース仕様（セクション7）を共有して並行開発                     | 同左                                                                            |

---

## 13. ハッカソン実装優先度

### Day 1（コア機能）

- [ ] Hono + Workers セットアップ
- [ ] Workers AI（llama-3.1-70b）で対話動作確認
- [ ] D1スキーマ作成・視聴者の声蓄積API
- [ ] SSEストリーミング（AI応答のリアルタイム配信）
- [ ] Xcodeプロジェクト作成
- [ ] SwiftUI基本画面（意見入力 + 対話表示）
- [ ] APIClient.swift（Workers APIとの接続）

### Day 2（差別化機能）

- [ ] Vectorize RAG（外部APIからのingest・plamo-embedding-1bでベクトル化）
- [ ] 3層情報応答（broadcast / unaired / opendata タグ付き）
- [ ] RealityKit ImmersiveSpace（スタジオ空間再現）
- [ ] AVFoundation VTR動画再生
- [ ] Speech Framework 音声入力

### 時間があれば

- [ ] ARKit ハンドジェスチャーで介入操作
- [ ] Eye tracking で視線操作
- [ ] 視聴者の声が空間に浮かぶ演出
