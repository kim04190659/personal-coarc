import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

// Claude APIクライアントを初期化
// ANTHROPIC_API_KEY は .env.local に設定する
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
  // リクエストボディからコンテキストと入力テキストを取得
  const { context, userInput } = await req.json();

  if (!userInput) {
    return NextResponse.json({ error: '入力が空です' }, { status: 400 });
  }

  const contextLabel = CONTEXT_LABELS[context] || context;

  // Claudeへのプロンプト
  // 家族の情報を埋め込んでおくことで、毎回説明しなくて済む
  const prompt = `あなたはYoshitaka（木村好孝）の個人AIアシスタントです。

【Yoshitakaの家族情報】
- 直美（妻）：体調不良・通院中。無理な負担をかけないことが最優先。
- みえこ（義母）：義父が最近亡くなったばかり。悲嘆に寄り添う段階。
- ゆみこ（実母）：聴覚障害あり。目を合わせて、ゆっくりと。

【今日の入力情報】
- 所属コンテキスト：${contextLabel}
- 今日の仕事の重さ：${userInput}

以下の4つを、短く・温かく返してください。管理口調でなく、友人のように。

1. 共感の一言（1文。「それは大変だったね」のような自然な言葉で）
2. 明日への引き継ぎメモ（箇条書き1〜2行。明日確認すべきことだけ）
3. 家族3人への今夜の配慮（それぞれ1行ずつ。具体的に）
4. 直美への「最初の一言」提案（帰宅してすぐ言える一文）

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
