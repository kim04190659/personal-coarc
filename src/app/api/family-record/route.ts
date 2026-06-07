import { Client } from '@notionhq/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.FAMILY_RECORD_DATABASE_ID;

  if (!apiKey || !databaseId) {
    return NextResponse.json(
      { error: 'NOTION_API_KEY または FAMILY_RECORD_DATABASE_ID が設定されていません' },
      { status: 500 }
    );
  }

  // リクエストボディ：対象・連絡手段・様子・次回予定
  const { target, method, condition, nextPlan } = await req.json();

  if (!target || !condition) {
    return NextResponse.json({ error: '対象と様子・気になることは必須です' }, { status: 400 });
  }

  // タイトルを「YYYY-MM-DD ゆみこ」形式で自動生成
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  // 対象名の先頭部分（「ゆみこ（実母）」→「ゆみこ」）を取り出す
  const shortName = target.split('（')[0];
  const title = `${dateStr} ${shortName}`;

  const notion = new Client({ auth: apiKey });

  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        タイトル: {
          title: [{ text: { content: title } }],
        },
        日付: {
          date: { start: dateStr },
        },
        対象: {
          select: { name: target },
        },
        連絡手段: {
          select: { name: method || 'メモ' },
        },
        '様子・気になること': {
          rich_text: [{ text: { content: condition.slice(0, 2000) } }],
        },
        次回予定: {
          rich_text: [{ text: { content: (nextPlan || '').slice(0, 2000) } }],
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
