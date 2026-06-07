'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 5つの所属コンテキスト（帰宅前チェックインと同じ定義）
const CONTEXTS = [
  { id: 'nec',    label: '🏢 NEC',    active: 'bg-blue-600 text-white border-transparent' },
  { id: 'family', label: '🏠 家族',   active: 'bg-pink-600 text-white border-transparent' },
  { id: 'dev',    label: '💻 開発',   active: 'bg-purple-600 text-white border-transparent' },
  { id: 'alumni', label: '🎓 同窓会', active: 'bg-green-600 text-white border-transparent' },
  { id: 'local',  label: '🌏 地域',   active: 'bg-orange-600 text-white border-transparent' },
];

export default function Morning() {
  const [selectedContext, setSelectedContext] = useState('nec');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // サマリー表示フラグと取得したサマリーテキスト
  const [summary, setSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  // 昨日のチェックイン記録（Notionから取得）
  const [pastMemo, setPastMemo] = useState<{ date: string; userInput: string } | null>(null);

  // Notion記録ボタンの状態管理
  const [notionSaving, setNotionSaving] = useState(false); // 送信中
  const [notionSaved, setNotionSaved] = useState(false);   // 記録済み
  const [notionError, setNotionError] = useState('');      // エラーメッセージ

  const router = useRouter();

  // ページを開いたとき、今日の朝のブリーフィングがすでに保存されていれば表示する
  useEffect(() => {
    const today = new Date().toLocaleDateString('ja-JP');
    const saved = localStorage.getItem('morning_brief');
    if (saved) {
      const parsed = JSON.parse(saved);
      // 今日分だけ復元する（日付が違えば無視）
      if (parsed.date === today && parsed.summary) {
        setSummary(parsed.summary);
        setInput(parsed.userInput || '');
        setSelectedContext(parsed.context || 'nec');
        setShowSummary(true);
      }
    }
    // 今日分をすでにNotionに記録済みか確認
    const savedDate = localStorage.getItem('morning_notion_saved_date');
    if (savedDate === today) {
      setNotionSaved(true);
    }
  }, []);

  // 「今日を始める」ボタンを押したとき
  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);

    try {
      // /api/morning にPOSTしてClaudeの朝ブリーフィングを取得
      const res = await fetch('/api/morning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: selectedContext, userInput: input }),
      });
      const data = await res.json();
      const summaryText = data.summary || '';

      // Notionから取得した昨日の引き継ぎメモを保存する
      if (data.pastMemo) {
        setPastMemo(data.pastMemo);
      }

      // 今日の朝ブリーフィングとして保存
      const today = new Date().toLocaleDateString('ja-JP');
      localStorage.setItem('morning_brief', JSON.stringify({
        date: today,
        context: selectedContext,
        userInput: input,
        summary: summaryText,
      }));

      setSummary(summaryText);
      setShowSummary(true);
    } catch (e) {
      console.error('エラーが発生しました:', e);
      alert('エラーが発生しました。もう一度試してください。');
    } finally {
      setLoading(false);
    }
  };

  // 「Notionに記録する」ボタンを押したとき
  const handleNotionSave = async () => {
    setNotionSaving(true);
    setNotionError('');
    try {
      const res = await fetch('/api/notion-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: '朝のブリーフィング',
          context: selectedContext,
          userInput: input,
          summary,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '記録に失敗しました');
      }
      // 記録済みフラグをlocalStorageに保存（二重送信を防ぐ）
      const today = new Date().toLocaleDateString('ja-JP');
      localStorage.setItem('morning_notion_saved_date', today);
      setNotionSaved(true);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '記録に失敗しました';
      setNotionError(message);
    } finally {
      setNotionSaving(false);
    }
  };

  // マークダウンを簡易レンダリングするヘルパー
  // **太字** と ## 見出し に対応
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return <p key={i} className="text-yellow-300 font-bold text-sm mt-2">{line.replace('## ', '')}</p>;
      }
      if (line.startsWith('# ')) {
        return <p key={i} className="text-yellow-200 font-bold text-base mt-2">{line.replace('# ', '')}</p>;
      }
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-gray-200 text-sm leading-relaxed">
          {parts.map((part, j) =>
            j % 2 === 1
              ? <strong key={j} className="text-white">{part}</strong>
              : part
          )}
        </p>
      );
    });
  };

  return (
    <main className="min-h-screen bg-[#1a2a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🌅</div>
          <h1 className="text-white text-xl font-bold">朝のブリーフィング</h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('ja-JP', {
              month: 'long', day: 'numeric', weekday: 'short'
            })}
          </p>
        </div>

        {/* サマリー表示モード */}
        {showSummary ? (
          <>
            {/* 完了バッジ */}
            <div className="mb-4">
              <span className="inline-block bg-green-900 text-green-400 text-xs font-medium px-3 py-1 rounded-full">
                ✓ 今日のブリーフィング完了
              </span>
            </div>

            {/* 昨日の引き継ぎメモ（Notionから取得できた場合のみ表示） */}
            {pastMemo && (
              <div className="bg-[#0a2010] border border-green-900 rounded-xl p-3 mb-4">
                <p className="text-green-500 text-xs font-medium mb-1">
                  📖 昨日の引き継ぎ（{pastMemo.date}）
                </p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {pastMemo.userInput.slice(0, 80)}{pastMemo.userInput.length > 80 ? '…' : ''}
                </p>
              </div>
            )}

            {/* Claudeのサマリー */}
            <div className="bg-[#0f3020] rounded-2xl p-4 mb-6 space-y-1">
              {renderMarkdown(summary)}
            </div>

            {/* 家族カード（視覚的なリマインダー） */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="bg-[#0f3020] rounded-xl p-3 text-center">
                <div className="text-lg mb-1">👩</div>
                <p className="text-green-300 text-xs font-bold">直美</p>
                <p className="text-gray-400 text-xs mt-1">体調配慮</p>
              </div>
              <div className="bg-[#0f3020] rounded-xl p-3 text-center">
                <div className="text-lg mb-1">👵</div>
                <p className="text-green-300 text-xs font-bold">みえこ</p>
                <p className="text-gray-400 text-xs mt-1">寄り添う</p>
              </div>
              <div className="bg-[#0f3020] rounded-xl p-3 text-center">
                <div className="text-lg mb-1">👵</div>
                <p className="text-green-300 text-xs font-bold">ゆみこ</p>
                <p className="text-gray-400 text-xs mt-1">目を合わせて</p>
              </div>
            </div>

            {/* Notionに記録するボタン */}
            <button
              onClick={handleNotionSave}
              disabled={notionSaved || notionSaving}
              className={`w-full py-3 rounded-full text-sm font-medium mb-3 transition-all ${
                notionSaved
                  ? 'bg-green-900 text-green-400 cursor-default'
                  : notionSaving
                  ? 'bg-gray-700 text-gray-500 cursor-wait'
                  : 'bg-[#0f3020] text-green-300 hover:bg-green-900'
              }`}
            >
              {notionSaved
                ? '✓ Notionに記録しました'
                : notionSaving
                ? '記録中...'
                : '📝 Notionに記録する'}
            </button>

            {/* エラーメッセージ */}
            {notionError && (
              <p className="text-red-400 text-xs text-center mb-3">{notionError}</p>
            )}

            {/* やり直しボタン */}
            <button
              onClick={() => setShowSummary(false)}
              className="w-full text-gray-600 text-xs hover:text-gray-400 transition-colors mb-3"
            >
              ← 今朝の入力をやり直す
            </button>

            {/* 帰宅前チェックインへ切り替えるリンク */}
            <button
              onClick={() => router.push('/')}
              className="w-full bg-[#0f3020] text-gray-400 text-xs py-3 rounded-full hover:text-white transition-all"
            >
              🌇 帰宅前チェックインへ
            </button>
          </>
        ) : (
          <>
            {/* 入力モード */}

            {/* 所属コンテキスト選択 */}
            <div className="mb-6">
              <p className="text-gray-400 text-xs mb-2">今日のメイン所属</p>
              <div className="flex flex-wrap gap-2">
                {CONTEXTS.map((ctx) => (
                  <button
                    key={ctx.id}
                    onClick={() => setSelectedContext(ctx.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selectedContext === ctx.id
                        ? ctx.active
                        : 'border-gray-600 text-gray-400 bg-transparent hover:border-gray-400'
                    }`}
                  >
                    {ctx.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 今朝の気持ち入力 */}
            <div className="mb-6">
              <p className="text-gray-400 text-xs mb-2">今朝の気持ち・今日の心配事は？</p>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="例：今日は大事な会議がある。昨夜あまり眠れなかった..."
                rows={4}
                className="w-full bg-[#0f3020] text-gray-200 rounded-xl p-3 text-sm resize-none border border-[#1e5030] focus:outline-none focus:border-green-500 placeholder-gray-600"
              />
            </div>

            {/* 送信ボタン */}
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
              className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-full transition-all text-sm mb-3"
            >
              {loading ? 'ブリーフィング生成中...' : '今日を始める →'}
            </button>

            {/* 帰宅前チェックインへのリンク */}
            <button
              onClick={() => router.push('/')}
              className="w-full text-gray-600 text-xs hover:text-gray-400 transition-colors"
            >
              ← 帰宅前チェックインへ
            </button>
          </>
        )}
      </div>
    </main>
  );
}
