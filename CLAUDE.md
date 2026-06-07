@AGENTS.md

# Personal CoArc 開発ルール

## プロジェクト概要
Yoshitaka（木村好孝）の個人AI支援アプリ。5つの帰属（NEC・家族・開発・同窓会・地域）を横断するWell-Beingのための日次ルーティンを支援する。

## 開発方針（必須ルール）

### 1. スプリント計画をNotionに保存してから開発を始める
- 新機能の開発前に、NotionにスプリントページをまずSprint Notionに作成する
- スプリントは1〜2週間単位を目安にする
- 内容：目標・実装機能リスト・完了条件

### 2. 設計書をNotionに保存してから実装に入る
- 各機能のUI設計・API設計・データ構造をNotionページとして作成する
- 「どこに何を保存するか」を先に決めてから、コードを書く
- 設計書なしで実装を始めてはならない

### 3. ライフログデータはNotionに残す
- チェックインの記録・朝ブリーフィングの結果・家族状況のメモは、Notionデータベースに蓄積する
- localStorageはUIの一時状態のみに使用する（セッション間で引き継ぐ必要のないデータ）
- 長期的に振り返るデータはすべてNotionに書き込む設計にする

## 技術スタック
- フロントエンド：Next.js (App Router) + TypeScript + Tailwind CSS
- AI：Claude Haiku（claude-haiku-4-5-20251001）
- デプロイ：Vercel（GitHub連携で自動デプロイ）
- データ：Notion MCP（ライフログ）、localStorage（UI一時状態）

## 現在のページ構成
- `/` — 帰宅前チェックイン（メイン）
- `/morning` — 朝のブリーフィング
- `/summary` — Claudeのサマリー表示
- `/done` — 完了画面

## セキュリティ制約
- NECの内部情報は絶対に含めない
- APIキー（ANTHROPIC_API_KEY）は .env.local にのみ保存し、コミットしない
- 家族の個人情報はプロンプトに直接埋め込む形式を維持（DBには保存しない）
