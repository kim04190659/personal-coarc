import { Client } from '@notionhq/client';
import { NextRequest, NextResponse } from 'next/server';

// コンテキストIDを日本語ラベルに変換するマップ
const CONTEXT_LABELS: Record<string, string> = {
  nec:    'NEC',
  family: '家族',
  dev:    '開発',
  alumni: '同窓会',
  local:  '地域',
};

export async function POST(req: NextRequest) {
  // 環境変数の確認
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!apiKey || !databaseId) {
    return NextResponse.json(
      { error: 'NOTION_API_KEY または NOTION_DATABASE_ID が設定されていません' },
      { status: 500 }
    );
  }

  // リクエストボディを取得
  const { type, context, userInput, summary } = await req.json();

  if (!type || !userInput || !summary) {
    return NextResponse.json({ error: '必要な情報が不足しています' }, { status: 400 });
  }

  // コンテキストIDを日本語ラベルに変換
  const contextLabel = CONTEXT_LABELS[context] || context;

  // 今日の日付を「YYYY-MM-DD」形式で取得
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // 例: "2026-06-07"

  // タイトルを自動生成：「2026-06-07 帰宅前チェックイン」
  const title = `${dateStr} ${type}`;

  // Notion APIクライアントを初期化
  const notion = new Client({ auth: apiKey });

  try {
    // Notionデータベースに1レコード追加
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        // タイトル（必須）
        タイトル: {
          title: [{ text: { content: title } }],
        },
        // 日付
        日付: {
          date: { start: dateStr },
        },
        // タイプ（帰宅前チェックイン / 朝のブリーフィング）
        タイプ: {
          select: { name: type },
        },
        // コンテキスト（NEC / 家族 / 開発 / 同窓会 / 地域）
        コンテキスト: {
          select: { name: contextLabel },
        },
        // 入力内容（ユーザーが入力したテキスト）
        入力内容: {
          rich_text: [{ text: { content: userInput } }],
        },
        // Claudeのサマリー（200文字以内に収める）
        Claudeのサマリー: {
          rich_text: [{ text: { content: summary.slice(0, 2000) } }],
        },
      },
    });

    return NextResponse.json({ success: true, pageId: response.id });
  } catch (error) {
    console.error('Notion書き込みエラー:', error);
    return NextResponse.json(
      { error: 'Notionへの書き込みに失敗しました' },
      { status: 500 }
    );
  }
}
