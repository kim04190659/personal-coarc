'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// コンテキストIDを絵文字ラベルに変換
const CONTEXT_LABELS: Record<string, string> = {
  nec:    '🏢 NEC',
  family: '🏠 家族',
  dev:    '💻 開発',
  alumni: '🎓 同窓会',
  local:  '🌏 地域',
};

// チェックイン履歴の1件分の型定義
type CheckInRecord = {
  date: string; // 例: "2026/6/7"
  context: string;
  summary: {
    summary: string;
    userInput?: string;
  };
};

export default function History() {
  const [history, setHistory] = useState<CheckInRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [weekDays, setWeekDays] = useState<{ label: string; date: string; done: boolean }[]>([]);
  const router = useRouter();

  useEffect(() => {
    // localStorageから履歴を読み込む
    const raw = localStorage.getItem('checkin_history');
    const records: CheckInRecord[] = raw ? JSON.parse(raw) : [];

    // 日付の新しい順に並べ替える
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setHistory(records);

    // 連続日数を計算する
    // 「今日から遡って何日連続で記録があるか」を数える
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const target = new Date(today);
      target.setDate(today.getDate() - i);
      // 日本語ロケールの日付形式（"2026/6/7"）に合わせる
      const targetStr = target.toLocaleDateString('ja-JP');
      const found = records.some(r => r.date === targetStr);
      if (found) {
        count++;
      } else {
        break; // 途切れたら終了
      }
    }
    setStreak(count);

    // 直近7日間のカレンダーデータを作成する
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString('ja-JP');
      week.push({
        label: days[d.getDay()],
        date: String(d.getDate()),
        done: records.some(r => r.date === dateStr),
      });
    }
    setWeekDays(week);
  }, []);

  return (
    <main className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🗓</div>
          <h1 className="text-white text-xl font-bold">チェックイン履歴</h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
        </div>

        {/* 連続日数バッジ */}
        <div className="bg-[#0f3460] rounded-2xl p-5 mb-6 text-center">
          {streak > 0 ? (
            <>
              <p className="text-5xl font-bold text-white mb-1">{streak}</p>
              <p className="text-blue-300 text-sm">日連続チェックイン</p>
              <p className="text-gray-500 text-xs mt-2">この調子で続けよう</p>
            </>
          ) : (
            <>
              <p className="text-gray-400 text-sm mb-1">まだ記録がありません</p>
              <p className="text-gray-600 text-xs">今日から始めよう</p>
            </>
          )}
        </div>

        {/* 7日間カレンダー */}
        <div className="mb-6">
          <p className="text-gray-400 text-xs mb-2">直近7日間</p>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, i) => (
              <div key={i} className="text-center">
                {/* 曜日 */}
                <p className="text-gray-500 text-xs mb-1">{day.label}</p>
                {/* 日付の丸（記録あり：青塗り / なし：グレー枠） */}
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium ${
                  day.done
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-700 text-gray-600'
                }`}>
                  {day.done ? '✓' : day.date}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 記録一覧 */}
        <div className="mb-6">
          <p className="text-gray-400 text-xs mb-2">過去の記録（最新30件）</p>
          {history.length === 0 ? (
            <div className="bg-[#0f3460] rounded-xl p-4 text-center">
              <p className="text-gray-500 text-sm">記録がまだありません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 30).map((record, i) => (
                <div key={i} className="bg-[#0f3460] rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    {/* 日付 */}
                    <span className="text-blue-300 text-xs font-medium">{record.date}</span>
                    {/* コンテキスト */}
                    <span className="text-gray-400 text-xs">
                      {CONTEXT_LABELS[record.context] || record.context}
                    </span>
                  </div>
                  {/* 入力内容の先頭40文字 */}
                  {record.summary?.userInput && (
                    <p className="text-gray-300 text-xs leading-relaxed">
                      {record.summary.userInput.slice(0, 40)}
                      {record.summary.userInput.length > 40 ? '…' : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* トップへ戻るリンク */}
        <button
          onClick={() => router.push('/')}
          className="w-full text-gray-600 text-xs hover:text-gray-400 transition-colors"
        >
          ← 帰宅前チェックインへ
        </button>
      </div>
    </main>
  );
}
