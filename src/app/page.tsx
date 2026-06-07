'use client';

import { useState } from 'react';
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
  const router = useRouter();

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
      localStorage.setItem('checkin_summary', JSON.stringify(data));
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
      </div>
    </main>
  );
}
