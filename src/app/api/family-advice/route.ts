import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

// Claude APIクライアントを初期化
const client = new Anthropic();

// 家族の連絡記録を受け取り、今後の気配りヒントをClaudeが生成する
// yumiko・miekoページから記録保存後に呼び出される
export async function POST(req: NextRequest) {
  const { target, method, condition, nextPlan, pastConditions } = await req.json();

  if (!condition) {
    return NextResponse.json({ error: '入力が空です' }, { status: 400 });
  }

  // 過去の記録があればテキスト化する（最大2件）
  const pastText = pastConditions && pastConditions.length > 0
    ? pastConditions
        .slice(0, 2)
        .map((c: string, i: number) => `${i + 1}. ${c.slice(0, 80)}`)
        .join('\n')
    : '（記録なし）';

  // Claudeへのプロンプト
  const prompt = `Yoshitaka（木村好孝）さんの${target}との記録を読んで、今後の気配りのヒントを2〜3点、温かく具体的に教えてください。

【今日の記録】
連絡手段: ${method}
今日の様子: ${condition}
次回予定: ${nextPlan || 'なし'}

【過去の記録（参考）】
${pastText}

条件：
- 100文字以内
- 箇条書きでなく、自然な文章で
- Yoshitakaさんが次に会うときに意識できる具体的なことを1〜2つ含める`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const advice = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ advice });

  } catch (error) {
    console.error('Claude APIエラー:', error);
    return NextResponse.json(
      { error: 'アドバイスの生成に失敗しました' },
      { status: 500 }
    );
  }
}
