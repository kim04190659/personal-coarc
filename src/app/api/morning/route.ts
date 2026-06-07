import Anthropic from '@anthropic-ai/sdk';
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

export async function POST(req: NextRequest) {
  // リクエストボディからコンテキストと今朝の気持ちを取得
  const { context, userInput } = await req.json();

  if (!userInput) {
    return NextResponse.json({ error: '入力が空です' }, { status: 400 });
  }

  const contextLabel = CONTEXT_LABELS[context] || context;

  // 朝用のプロンプト
  // 帰宅前チェックインとは逆に「今日を始める」モード
  const prompt = `あなたはYoshitaka（木村好孝）の個人AIアシスタントです。

【Yoshitakaの家族情報】
- 直美（妻）：体調不良・通院中。無理な負担をかけないことが最優先。
- みえこ（義母）：義父が最近亡くなったばかり。悲嘆に寄り添う段階。
- ゆみこ（実母）：聴覚障害あり。目を合わせて、ゆっくりと。

【今朝の入力情報】
- 今日のメイン所属：${contextLabel}
- 今朝の気持ち・今日の心配事：${userInput}

朝のブリーフィングとして、以下を短く・温かく返してください。

1. 今朝の一言（1文。「今日も一歩ずつ」のような前向きな言葉で）
2. 今日の家族への気配り（それぞれ1行。今日意識すること）
3. 今日の仕事で一番大事な1点（1行。${contextLabel}の視点で）
4. 今夜の帰宅前リマインダー（1文。「帰り際に○○を忘れずに」）

全体で200文字以内にまとめてください。`;

  // Claude APIを呼び出す
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001', // 高速・低コストのモデル
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  // Claudeの返答テキストを取り出す
  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '';

  return NextResponse.json({ summary: responseText });
}
