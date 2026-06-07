'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 5つの所属コンテキスト
const CONTEXTS = [
  { id: 'nec',    label: '🏢 NEC',    active: 'bg-blue-600 text-white border-transparent' },
  { id: 'family', label: '🏠 家族',   active: 'bg-pink-600 text-white border-transparent' },
  { id: 'dev',    label: '💻 開発',   active: 'bg-purple-600 text-white border-transparent' },
  { id: 'alumni', label: '🎓 同窓会', active: 'bg-green-600 text-white border-transparent' },
  { id: 'local',  label: '🌏 地域',   active: 'bg-orange-600 text-white border-transparent' },
];

export default function CheckIn() {
  // 選択中のコンテキスト（最初はNEC）
  const [selectedContext, setSelectedContext] = useState('nec');
  // 入力テキスト
  const [input, setInput] = useState('');
  // 送信中フラグ（ボタンの二重クリック防止）
  const [loading, setLoading] = useState(false);
  // 今朝のブリーフィング完了フラグ（朝に使っていれば緑表示）
  const [morningDone, setMorningDone] = useState(false);
  // 今日の仕事メモ件数（バッジ表示用）
  const [memoCount, setMemoCount] = useState(0);
  const router = useRouter();

  // 今日の朝ブリーフィングと仕事メモを確認する
  useEffect(() => {
    const today = new Date().toLocaleDateString('ja-JP');

    // 朝ブリーフィング確認
    const saved = localStorage.getItem('morning_brief');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today && parsed.summary) {
        setMorningDone(true);
      }
    }

    // 今日の仕事メモ件数を確認
    const rawMemos = localStorage.getItem('work_memos');
    if (rawMemos) {
      const allMemos: Array<{ date: string }> = JSON.parse(rawMemos);
      const todayCount = allMemos.filter(m => m.date === today).length;
      setMemoCount(todayCount);
    }
  }, []);

  // 「家族モードに切り替える」ボタンを押したとき
  const handleSubmit = async () => {
    if (!input.trim()) return;
    setLoading(true);

    try {
      // /api/checkin にPOSTしてClaudeのサマリーを取得
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: selectedContext, userInput: input }),
      });
      const data = await res.json();

      // 次の画面で使うためにlocalStorageに保存
      // userInputも一緒に保存しておく（Notion記録時に必要）
      localStorage.setItem('checkin_summary', JSON.stringify({ ...data, userInput: input }));
      localStorage.setItem('checkin_context', selectedContext);

      // サマリー画面へ移動
      router.push('/summary');
    } catch (e) {
      console.error('エラーが発生しました:', e);
      alert('エラーが発生しました。もう一度試してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* 家族連絡記録へのナビゲーション（2ボタン横並び） */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => router.push('/record/yumiko')}
            className="flex-1 py-3 rounded-xl text-xs font-medium bg-[#1e1a2e] text-purple-400 border border-purple-900 hover:border-purple-600 transition-all text-center"
          >
            👵 ゆみこの記録
          </button>
          <button
            onClick={() => router.push('/record/mieko')}
            className="flex-1 py-3 rounded-xl text-xs font-medium bg-[#1a1520] text-pink-400 border border-pink-900 hover:border-pink-600 transition-all text-center"
          >
            👵 みえこの記録
          </button>
        </div>

        {/* 朝のブリーフィングへのナビゲーション */}
        <button
          onClick={() => router.push('/morning')}
          className={`w-full mb-3 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            morningDone
              ? 'bg-green-900 text-green-400 border border-green-700'  // 今朝完了済み
              : 'bg-[#0f3020] text-gray-400 border border-gray-700 hover:border-green-600 hover:text-green-400'  // 未完了
          }`}
        >
          <span>🌅 朝のブリーフィング</span>
          {morningDone
            ? <span className="text-xs bg-green-800 px-2 py-0.5 rounded-full">✓ 完了</span>
            : <span className="text-xs text-gray-600">タップで開く</span>
          }
        </button>

        {/* 仕事メモへのナビゲーション */}
        <button
          onClick={() => router.push('/work-memo')}
          className="w-full mb-6 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 bg-[#1a1530] text-gray-400 border border-gray-700 hover:border-amber-600 hover:text-amber-400"
        >
          <span>✏️ 仕事メモ帳</span>
          {memoCount > 0
            ? <span className="text-xs bg-amber-900 text-amber-400 px-2 py-0.5 rounded-full">{memoCount}件</span>
            : <span className="text-xs text-gray-600">気になることを即メモ</span>
          }
        </button>

        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🌇</div>
          <h1 className="text-white text-xl font-bold">帰宅前チェックイン</h1>
          <p className="text-gray-400 text-sm mt-1">仕事を置いて、家族モードへ</p>
        </div>

        {/* 所属コンテキスト選択 */}
        <div className="mb-6">
          <p className="text-gray-400 text-xs mb-2">今日の所属コンテキスト</p>
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

        {/* 今日の仕事の重さ入力 */}
        <div className="mb-6">
          <p className="text-gray-400 text-xs mb-2">今日の仕事、一言で言うと？</p>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例：経営会議が長引いて消耗した..."
            rows={4}
            className="w-full bg-[#0f3460] text-gray-200 rounded-xl p-3 text-sm resize-none border border-[#1e4080] focus:outline-none focus:border-blue-500 placeholder-gray-600"
          />
        </div>

        {/* 送信ボタン */}
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || loading}
          className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-full transition-all text-sm"
        >
          {loading ? '切り替え中...' : '家族モードに切り替える →'}
        </button>

        {/* 履歴リンク */}
        <button
          onClick={() => router.push('/history')}
          className="w-full text-gray-600 text-xs mt-4 hover:text-gray-400 transition-colors"
        >
          🗓 チェックイン履歴を見る
        </button>
      </div>
    </main>
  );
}
