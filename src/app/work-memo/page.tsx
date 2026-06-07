'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// 仕事メモ1件分の型
type WorkMemo = {
  id: string;   // ユニークID（タイムスタンプ）
  date: string; // 日付（ja-JP形式）
  time: string; // 時刻（HH:MM）
  text: string; // メモ内容
};

export default function WorkMemo() {
  const [input, setInput] = useState('');
  const [memos, setMemos] = useState<WorkMemo[]>([]);
  const [saved, setSaved] = useState(false); // 「保存しました」の一時表示
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // ページを開いたとき、今日のメモを読み込む
  useEffect(() => {
    const raw = localStorage.getItem('work_memos');
    if (raw) {
      const all: WorkMemo[] = JSON.parse(raw);
      // 今日分だけ表示する
      const today = new Date().toLocaleDateString('ja-JP');
      const todayMemos = all.filter(m => m.date === today);
      setMemos(todayMemos.slice(0, 5)); // 最大5件
    }
    // ページを開いた瞬間にテキストエリアにフォーカス
    textareaRef.current?.focus();
  }, []);

  // 「メモする」ボタンを押したとき
  const handleSave = () => {
    if (!input.trim()) return;

    const now = new Date();
    const date = now.toLocaleDateString('ja-JP');
    const time = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

    const newMemo: WorkMemo = {
      id: String(now.getTime()),
      date,
      time,
      text: input.trim(),
    };

    // localStorageに追記する（最新を先頭に）
    const raw = localStorage.getItem('work_memos');
    const all: WorkMemo[] = raw ? JSON.parse(raw) : [];
    all.unshift(newMemo);
    // 全体で最大50件まで保持する
    if (all.length > 50) all.splice(50);
    localStorage.setItem('work_memos', JSON.stringify(all));

    // 今日分だけを画面に表示する
    const todayMemos = all.filter(m => m.date === date);
    setMemos(todayMemos.slice(0, 5));

    // 入力欄をリセットして「保存しました」を一瞬表示
    setInput('');
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);

    // 次のメモを入力しやすいようにフォーカスを戻す
    textareaRef.current?.focus();
  };

  // Enterキー（Shift+Enterは改行）で保存
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <main className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* ヘッダー */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✏️</div>
          <h1 className="text-white text-xl font-bold">仕事メモ帳</h1>
          <p className="text-gray-400 text-xs mt-1">気になることを即メモ。帰宅前に使う。</p>
          <p className="text-gray-600 text-xs mt-0.5">
            {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
        </div>

        {/* 入力エリア */}
        <div className="bg-[#0f1a30] rounded-2xl p-4 mb-4">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`今気になっていることを書く...\n（Enterで保存 / Shift+Enterで改行）`}
            rows={4}
            className="w-full bg-transparent text-gray-200 text-sm resize-none focus:outline-none placeholder-gray-600 leading-relaxed"
          />
        </div>

        {/* 保存ボタン */}
        <button
          onClick={handleSave}
          disabled={!input.trim()}
          className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-full transition-all text-sm mb-4"
        >
          {saved ? '✓ メモしました' : '📝 メモする'}
        </button>

        {/* 今日のメモ一覧 */}
        {memos.length > 0 && (
          <div className="mb-6">
            <p className="text-gray-500 text-xs mb-2">今日のメモ（{memos.length}件）</p>
            <div className="space-y-2">
              {memos.map((memo) => (
                <div key={memo.id} className="bg-[#0f1a30] rounded-xl p-3">
                  <p className="text-amber-600 text-xs mb-1">{memo.time}</p>
                  <p className="text-gray-300 text-xs leading-relaxed">{memo.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {memos.length === 0 && (
          <div className="text-center py-4 mb-6">
            <p className="text-gray-600 text-xs">今日のメモはまだありません</p>
          </div>
        )}

        {/* ナビゲーション */}
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-3 rounded-xl text-xs text-gray-500 hover:text-gray-300 transition-colors text-center"
          >
            ← チェックインへ
          </button>
          <button
            onClick={() => router.push('/morning')}
            className="flex-1 py-3 rounded-xl text-xs text-gray-500 hover:text-gray-300 transition-colors text-center"
          >
            🌅 朝のブリーフィング
          </button>
        </div>
      </div>
    </main>
  );
}
