'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Summary() {
  // Claudeのサマリーテキスト
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // チェックイン画面でlocalStorageに保存したサマリーを読み込む
    const data = localStorage.getItem('checkin_summary');
    if (!data) {
      // データがなければトップに戻す
      router.push('/');
      return;
    }

    const parsed = JSON.parse(data);
    setSummary(parsed.summary || '');
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* 完了バッジ */}
        <div className="mb-6">
          <span className="inline-block bg-green-900 text-green-400 text-xs font-medium px-3 py-1 rounded-full">
            ✓ 仕事、置きました
          </span>
        </div>

        {/* Claudeのサマリー */}
        <div className="bg-[#0f3460] rounded-2xl p-4 mb-6">
          {/* サマリーテキストをそのまま表示 */}
          {/* 改行を<br>に変換して読みやすく */}
          <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
            {summary}
          </p>
        </div>

        {/* 家族3人のカード（視覚的なリマインダー） */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-[#0f3460] rounded-xl p-3 text-center">
            <div className="text-lg mb-1">👩</div>
            <p className="text-blue-300 text-xs font-bold">直美</p>
            <p className="text-gray-400 text-xs mt-1">体調配慮</p>
          </div>
          <div className="bg-[#0f3460] rounded-xl p-3 text-center">
            <div className="text-lg mb-1">👵</div>
            <p className="text-blue-300 text-xs font-bold">みえこ</p>
            <p className="text-gray-400 text-xs mt-1">寄り添う</p>
          </div>
          <div className="bg-[#0f3460] rounded-xl p-3 text-center">
            <div className="text-lg mb-1">👵</div>
            <p className="text-blue-300 text-xs font-bold">ゆみこ</p>
            <p className="text-gray-400 text-xs mt-1">目を合わせて</p>
          </div>
        </div>

        {/* 完了ボタン */}
        <button
          onClick={() => router.push('/done')}
          className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-4 rounded-full transition-all text-sm"
        >
          家族モードで出発する →
        </button>

        {/* やり直しリンク */}
        <button
          onClick={() => router.push('/')}
          className="w-full text-gray-600 text-xs mt-3 hover:text-gray-400 transition-colors"
        >
          ← 入力し直す
        </button>
      </div>
    </main>
  );
}
