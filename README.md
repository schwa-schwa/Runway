# AI姿勢分析アプリ『Runway』

## 概要

このアプリケーションは、ユーザーが撮影した動画からリアルタイムで姿勢を分析し、スコアをフィードバックする卒業研究プロジェクトです。MediaPipeを使用して体のランドマークを検出し、複数の指標に基づいて姿勢の正確性を評価します。
Dockerを使用して環境構築を行うため、OSに依存せず簡単に実行できます。

## 主な機能

*   ユーザー選択機能
*   チャレンジ（分析する動作）の選択機能
*   動画によるリアルタイム姿勢分析・採点機能
*   分析結果の表示機能
*   AIによるアドバイス生成機能（Gemini API使用）

## 使用技術

*   **バックエンド**: Python, Django, Django REST Framework, Gunicorn
*   **フロントエンド**: React, JavaScript, Nginx
*   **データベース**: PostgreSQL
*   **姿勢推定**: Google MediaPipe
*   **AIアドバイス**: Google Gemini API
*   **インフラ**: Docker, Docker Compose

---

## 前提条件

*   **Docker Desktop**: インストールされ、起動していること。
*   **Google API Key**: Gemini APIを使用するために必要です。

## 起動手順

### 1. プロジェクトのダウンロード

```bash
git clone git@github.com:schwa-schwa/Runway.git

```

### 2. 環境変数の設定

`runway-app` ディレクトリ直下に `.env` ファイルを作成し、以下の内容を記述してください。
**注意**: `your_api_key_here` の部分は、ご自身のGoogle APIキーに書き換えてください。

```env
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=db
GOOGLE_API_KEY=your_api_key_here
```

### 3. アプリケーションのビルドと起動

以下のコマンドを実行して、コンテナをビルド・起動します。
コンテナ起動時に自動的にデータベースのマイグレーションと静的ファイルの収集が実行されます。

```bash
docker-compose up -d --build
```

### 4. アプリケーションへのアクセス

ブラウザで以下のURLにアクセスしてください。

*   **フロントエンド（アプリ画面）**: http://localhost

---

## 開発者向け情報

### コンテナの停止

```bash
docker-compose down
```

### ログの確認

```bash
# 全てのログ
docker-compose logs

# 特定のサービスのログ（例：バックエンド）
docker-compose logs web
```

### バックエンドの再起動（設定変更時など）

```bash
docker-compose restart web
docker-compose restart frontend
```
