'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Summary() {
  // Claudeのサマリーテキスト
  const [summary, setSummary] = useState('');
  const [context, setContext] = useState('');
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(true);

  // Notion記録ボタンの状態管理
  const [notionSaving, setNotionSaving] = useState(false); // 送信中
  const [notionSaved, setNotionSaved] = useState(false);   // 記録済み
  const [notionError, setNotionError] = useState('');      // エラーメッセージ

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
    setUserInput(parsed.userInput || '');

    // コンテキストも取得（Notion記録に使う）
    setContext(localStorage.getItem('checkin_context') || '');

    // 今日分をすでにNotionに記録済みか確認
    const today = new Date().toLocaleDateString('ja-JP');
    const savedDate = localStorage.getItem('checkin_notion_saved_date');
    if (savedDate === today) {
      setNotionSaved(true);
    }

    setLoading(false);
  }, [router]);

  // 「Notionに記録する」ボタンを押したとき
  const handleNotionSave = async () => {
    setNotionSaving(true);
    setNotionError('');
    try {
      const res = await fetch('/api/notion-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: '帰宅前チェックイン',
          context,
          userInput,
          summary,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '記録に失敗しました');
      }
      // 記録済みフラグをlocalStorageに保存（二重送信を防ぐ）
      const today = new Date().toLocaleDateString('ja-JP');
      localStorage.setItem('checkin_notion_saved_date', today);
      setNotionSaved(true);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '記録に失敗しました';
      setNotionError(message);
    } finally {
      setNotionSaving(false);
    }
  };

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

        {/* Claudeのサマリー（マークダウンを簡易レンダリング） */}
        <div className="bg-[#0f3460] rounded-2xl p-4 mb-6 text-sm leading-relaxed space-y-2">
          {summary.split('\n').map((line, i) => {
            // ## 見出し
            if (line.startsWith('## ')) {
              return <p key={i} className="text-blue-300 font-bold text-base">{line.replace('## ', '')}</p>;
            }
            // # 見出し
            if (line.startsWith('# ')) {
              return <p key={i} className="text-blue-200 font-bold text-base">{line.replace('# ', '')}</p>;
            }
            // **太字** を <strong> に変換
            const parts = line.split(/\*\*(.*?)\*\*/g);
            return (
              <p key={i} className="text-gray-200">
                {parts.map((part, j) =>
                  j % 2 === 1
                    ? <strong key={j} className="text-white">{part}</strong>
                    : part
                )}
              </p>
            );
          })}
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

        {/* Notionに記録するボタン */}
        <button
          onClick={handleNotionSave}
          disabled={notionSaved || notionSaving}
          className={`w-full py-3 rounded-full text-sm font-medium mb-3 transition-all ${
            notionSaved
              ? 'bg-green-900 text-green-400 cursor-default'      // 記録済み
              : notionSaving
              ? 'bg-gray-700 text-gray-500 cursor-wait'            // 送信中
              : 'bg-[#0f3460] text-blue-300 hover:bg-blue-900'     // 通常
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
