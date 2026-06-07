'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Done() {
  const [context, setContext] = useState('');
  const router = useRouter();

  useEffect(() => {
    // 使用したコンテキストを読み込む（記録用）
    const ctx = localStorage.getItem('checkin_context') || '';
    setContext(ctx);

    // 今日の記録として日付と一緒に保存する
    const today = new Date().toLocaleDateString('ja-JP');
    const history = JSON.parse(localStorage.getItem('checkin_history') || '[]');
    const summary = localStorage.getItem('checkin_summary') || '{}';

    // 重複しないよう今日分だけ追加
    const alreadySaved = history.some((h: { date: string }) => h.date === today);
    if (!alreadySaved) {
      history.push({ date: today, context: ctx, summary: JSON.parse(summary) });
      localStorage.setItem('checkin_history', JSON.stringify(history));
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">

        {/* メインメッセージ */}
        <div className="text-6xl mb-6">🏠</div>
        <h1 className="text-white text-xl font-bold mb-3">
          仕事は置きました。
        </h1>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          今夜は夫・息子として帰ります。<br />
          管理タスクはゼロ。ただ一緒にいる。
        </p>

        {/* 今夜のリマインダー */}
        <div className="bg-[#0f3460] rounded-2xl p-4 mb-8 text-left">
          <p className="text-blue-300 text-xs font-bold mb-2">🔵 今夜、守ること</p>
          <ul className="text-gray-300 text-sm space-y-2">
            <li>・直美の体調に合わせて、そっとそばに</li>
            <li>・みえこの気持ちに寄り添う</li>
            <li>・ゆみこと目を合わせて話す</li>
          </ul>
        </div>

        {/* 完了ボタン */}
        <button
          onClick={() => {
            // 入力データをクリアして最初の画面に戻す
            localStorage.removeItem('checkin_summary');
            localStorage.removeItem('checkin_context');
            router.push('/');
          }}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-full transition-all text-sm mb-3"
        >
          ✓ 家族モードで出発
        </button>

        {/* 今日の日付表示 */}
        <p className="text-gray-600 text-xs">
          {new Date().toLocaleDateString('ja-JP', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
          })}
        </p>
      </div>
    </main>
  );
}
