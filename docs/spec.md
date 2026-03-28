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
 ├── POST /api/voice          # 音声・テキスト入力受付 → D1保存
 ├── GET  /api/audience-ai/:topicId  # 視聴者集約AI生成
 ├── GET  /api/sorajiro-ai/stream    # ソラジローAI SSE応答
 └── GET  /api/dialog/:sessionId     # AI対話セッション管理
          ↕
 ├── Cloudflare AI Gateway    # Claude API プロキシ・ログ管理
 ├── D1                       # 視聴者の声 蓄積DB
 ├── Vectorize                # 日テレ素材 RAG ベクトルDB
 ├── R2                       # 日テレ素材・VTR ファイル保存
 ├── Durable Objects          # WebSocket リアルタイムセッション
 └── Stream                   # VTR 動画配信
          ↕
 Claude API (claude-sonnet-4-20250514)
 └── web_search tool          # オープンデータ リアルタイム取得
```

---

## 4. AI設計

### ソラジローAI

| 項目         | 内容                                               |
| ------------ | -------------------------------------------------- |
| モデル       | Claude Sonnet（AI Gateway経由）                    |
| コンテキスト | 日テレ提供の取材メモ・未放送素材（Vectorize RAG）  |
| ツール       | web_search（オープンデータ取得）                   |
| 応答形式     | 3層情報タグ付き（放送 / 未放送 / オープンデータ）  |
| ペルソナ     | ソラジロー：公平で透明性を重視するAIジャーナリスト |

### 視聴者代表AI

| 項目           | 内容                                               |
| -------------- | -------------------------------------------------- |
| モデル         | Claude Sonnet（AI Gateway経由）                    |
| コンテキスト   | D1に蓄積された視聴者の声の集合知                   |
| 役割           | 視聴者の疑問・意見を代弁して議論する               |
| 更新タイミング | 視聴者が新たに意見を入力するたびにコンテキスト更新 |

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

### AI・RAG

| 種別            | 技術                      | 用途                             |
| --------------- | ------------------------- | -------------------------------- |
| LLM SDK         | Anthropic TypeScript SDK  | Claude API呼び出し               |
| LLMプロキシ     | Cloudflare AI Gateway     | ログ・キャッシュ・レート管理     |
| ベクトルDB      | Cloudflare Vectorize      | 日テレ素材RAG検索                |
| Embeddingモデル | @cf/baai/bge-base-en-v1.5 | テキストベクトル化（Workers AI） |
| 検索ツール      | Claude web_search tool    | オープンデータ取得               |

### Cloudflareサービス

| サービス        | 用途                                |
| --------------- | ----------------------------------- |
| Workers         | Honoアプリ実行環境                  |
| D1              | 視聴者の声蓄積DB（SQLite）          |
| Vectorize       | 日テレ素材RAGベクトルDB             |
| R2              | 日テレ素材・VTRファイルストレージ   |
| Durable Objects | WebSocketリアルタイムセッション管理 |
| AI Gateway      | Claude APIプロキシ                  |
| Stream          | VTR動画配信                         |

### 開発ツール

| 種別             | 技術         | 用途                           |
| ---------------- | ------------ | ------------------------------ |
| ローカル開発     | Wrangler     | Workers / D1 / R2ローカル実行  |
| パッケージ管理   | pnpm         | モノレポ管理                   |
| モノレポ         | Turborepo    | apps/ と packages/ 管理        |
| Linter/Formatter | Biome        | ESLint + Prettier代替          |
| Swift IDE        | Xcode 15以上 | visionOSビルド・シミュレーター |

---

## 6. プロジェクト構成

```
uradori/
├── apps/
│   └── worker/                    # Hono + Cloudflare Workers
│       ├── src/
│       │   ├── index.ts           # エントリーポイント
│       │   ├── routes/
│       │   │   ├── voice.ts       # 視聴者の声受付API
│       │   │   ├── audience-ai.ts # 視聴者集約AI
│       │   │   ├── sorajiro-ai.ts # ソラジローAI（RAG + web_search）
│       │   │   └── dialog.ts      # AI対話SSEストリーミング
│       │   └── durable-objects/
│       │       └── DialogSession.ts
│       └── wrangler.toml
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
├── packages/
│   ├── db/                        # Drizzle スキーマ定義
│   └── ai/                        # Claude API共通ロジック
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 7. APIインターフェース仕様

```typescript
// 視聴者の声を蓄積
POST /api/voice
  Body:    { topicId: string, text: string }
  Response: { ok: boolean }

// 視聴者集約AIを生成
GET /api/audience-ai/:topicId
  Response: { summary: string, voiceCount: number }

// ソラジローAI SSEストリーミング応答
GET /api/sorajiro-ai/stream?topicId=xxx&message=xxx
  Response: SSE stream
  Event data: {
    speaker: "sorajiro" | "audience",
    text: string,
    source: "broadcast" | "unaired" | "opendata"
  }

// 日テレ素材をVectorizeにインデックス登録
POST /api/ingest
  Body: { topicId: string, content: string, type: "script" | "memo" | "unaired" }
  Response: { ok: boolean }
```

---

## 8. D1 データスキーマ

```sql
-- トピック（放送された各ニュース）
CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  aired_at TIMESTAMP NOT NULL,
  broadcast_script TEXT
);

-- 視聴者の声
CREATE TABLE audience_voices (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES topics(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI対話ログ
CREATE TABLE dialog_logs (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  speaker TEXT NOT NULL, -- 'sorajiro' | 'audience'
  text TEXT NOT NULL,
  source TEXT,           -- 'broadcast' | 'unaired' | 'opendata'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9. 役割分担

|          | 担当A（バックエンド）                                                              | 担当B（visionOS）                                                               |
| -------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 技術     | TypeScript / Hono / Cloudflare                                                     | Swift / SwiftUI / RealityKit                                                    |
| 担当範囲 | Workers API / D1 / Vectorize RAG / Claude API / AI Gateway / Durable Objects / SSE | Xcode プロジェクト / SwiftUI UI / APIClient / RealityKit 空間 / Speech 音声入力 |
| 接点     | APIインターフェース仕様（セクション7）を共有して並行開発                           | 同左                                                                            |

---

## 10. ハッカソン実装優先度

### Day 1（コア機能）

- [ ] Hono + Workers セットアップ
- [ ] Claude API（AI Gateway経由）で対話動作確認
- [ ] D1スキーマ作成・視聴者の声蓄積API
- [ ] SSEストリーミング（AI応答のリアルタイム配信）
- [ ] Xcodeプロジェクト作成
- [ ] SwiftUI基本画面（意見入力 + 対話表示）
- [ ] APIClient.swift（Workers APIとの接続）

### Day 2（差別化機能）

- [ ] Vectorize RAG（日テレ素材インデックス登録・検索）
- [ ] web_searchでオープンデータ取得・3層情報応答
- [ ] Durable Objects + WebSocket リアルタイム同期
- [ ] RealityKit ImmersiveSpace（スタジオ空間再現）
- [ ] AVFoundation VTR動画再生
- [ ] Speech Framework 音声入力

### 時間があれば

- [ ] ARKit ハンドジェスチャーで介入操作
- [ ] Eye tracking で視線操作
- [ ] 視聴者の声が空間に浮かぶ演出
