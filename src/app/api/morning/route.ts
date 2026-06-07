import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@notionhq/client';
import { NextRequest, NextResponse } from 'next/server';

// Claude APIクライアントを初期化
const client = new Anthropic();

// コンテキストを日本語に変換するマップ
const CONTEXT_LABELS: Record<string, string> = {
  nec:    'NEC（統括部長）',
  family: '家族',
  dev:    '開発プロジェクト',
  alumni: '鹿児島高専同窓会',
  local:  '地域活動',
};

// Notionから最新のチェックイン記録を直接取得する（内部ヘルパー）
// 外部APIを呼ぶ代わりに直接SDKを使うことでサーバー間通信を避ける
async function fetchLatestCheckin(): Promise<{
  found: boolean;
  date?: string;
  context?: string;
  userInput?: string;
  claudeSummary?: string;
}> {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!apiKey || !databaseId) return { found: false };

  try {
    const notion = new Client({ auth: apiKey });
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'タイプ',
        select: { equals: 'checkin' },
      },
      sorts: [{ property: '日付', direction: 'descending' }],
      page_size: 1,
    });

    if (response.results.length === 0) return { found: false };

    const page = response.results[0] as {
      properties: Record<string, {
        date?: { start: string };
        select?: { name: string };
        rich_text?: Array<{ plain_text: string }>;
      }>;
    };
    const props = page.properties;

    return {
      found: true,
      date: props['日付']?.date?.start || '',
      context: props['コンテキスト']?.select?.name || '',
      userInput: (props['入力内容']?.rich_text?.[0]?.plain_text || '').slice(0, 150),
      claudeSummary: (props['Claudeのサマリー']?.rich_text?.[0]?.plain_text || '').slice(0, 200),
    };
  } catch {
    return { found: false };
  }
}

export async function POST(req: NextRequest) {
  // リクエストボディからコンテキストと今朝の気持ちを取得
  const { context, userInput } = await req.json();

  if (!userInput) {
    return NextResponse.json({ error: '入力が空です' }, { status: 400 });
  }

  const contextLabel = CONTEXT_LABELS[context] || context;

  // Notionから昨日の記録を取得して、Claude のプロンプトに含める
  const latestCheckin = await fetchLatestCheckin();

  // 過去の記録があれば「昨日の引き継ぎ」セクションを作成する
  let checkinContext = '';
  let latestDate = '';
  if (latestCheckin.found && latestCheckin.userInput) {
    latestDate = latestCheckin.date || '';
    checkinContext = `
【${latestDate}のチェックイン記録】
コンテキスト: ${latestCheckin.context || '不明'}
Yoshitakaさんの入力: ${latestCheckin.userInput}
AIサマリー（昨日）: ${latestCheckin.claudeSummary || '（なし）'}

上記を踏まえて、今日のアドバイスに「昨日からの継続」の視点を1つ含めてください。`;
  }

  // 朝用のプロンプト（Notion記録がある場合は文脈付き）
  const prompt = `あなたはYoshitaka（木村好孝）の個人AIアシスタントです。

【Yoshitakaの家族情報】
- 直美（妻）：体調不良・通院中。無理な負担をかけないことが最優先。
- みえこ（義母）：義父が最近亡くなったばかり。悲嘆に寄り添う段階。
- ゆみこ（実母）：聴覚障害あり。目を合わせて、ゆっくりと。

【今朝の入力情報】
- 今日のメイン所属：${contextLabel}
- 今朝の気持ち・今日の心配事：${userInput}
${checkinContext}
朝のブリーフィングとして、以下を短く・温かく返してください。

1. 今朝の一言（1文。「今日も一歩ずつ」のような前向きな言葉で）
2. 今日の家族への気配り（それぞれ1行。今日意識すること）
3. 今日の仕事で一番大事な1点（1行。${contextLabel}の視点で）
4. 今夜の帰宅前リマインダー（1文。「帰り際に○○を忘れずに」）

全体で200文字以内にまとめてください。`;

  try {
    // Claude APIを呼び出す
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Notionから取得した過去記録の概要もレスポンスに含める（画面表示用）
    return NextResponse.json({
      summary: responseText,
      // 過去記録が取得できた場合のみ表示する引き継ぎメモ
      pastMemo: latestCheckin.found ? {
        date: latestDate,
        userInput: latestCheckin.userInput,
      } : null,
    });
  } catch (error) {
    console.error('Claude APIエラー:', error);
    return NextResponse.json({ error: 'APIエラーが発生しました' }, { status: 500 });
  }
}
