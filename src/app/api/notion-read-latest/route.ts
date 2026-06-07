import { Client } from '@notionhq/client';
import { NextResponse } from 'next/server';

// Notionのライフログデータベースから最新のチェックイン記録を1件取得する
// 朝のブリーフィング時に「昨日の引き継ぎ」として活用する
export async function GET() {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!apiKey || !databaseId) {
    return NextResponse.json({ found: false, error: '環境変数が設定されていません' });
  }

  const notion = new Client({ auth: apiKey });

  try {
    // checkinタイプのレコードを日付の降順で1件取得する
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'タイプ',
        select: { equals: 'checkin' },
      },
      sorts: [{ property: '日付', direction: 'descending' }],
      page_size: 1,
    });

    if (response.results.length === 0) {
      // まだ記録がない場合（初日など）
      return NextResponse.json({ found: false });
    }

    // ページのプロパティから必要な情報を取り出す
    const page = response.results[0] as {
      properties: Record<string, {
        date?: { start: string };
        select?: { name: string };
        rich_text?: Array<{ plain_text: string }>;
      }>;
    };
    const props = page.properties;

    const date = props['日付']?.date?.start || '';
    const context = props['コンテキスト']?.select?.name || '';
    const userInput = props['入力内容']?.rich_text?.[0]?.plain_text || '';
    const claudeSummary = props['Claudeのサマリー']?.rich_text?.[0]?.plain_text || '';

    return NextResponse.json({
      found: true,
      date,
      context,
      userInput: userInput.slice(0, 200), // 長すぎる場合は切り詰める
      claudeSummary: claudeSummary.slice(0, 300),
    });

  } catch (error) {
    console.error('Notion読み込みエラー:', error);
    // エラー時はfound:falseを返して朝の画面が壊れないようにする
    return NextResponse.json({ found: false });
  }
}
