'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const METHODS = ['電話', '訪問', 'LINE', 'メモ'];

type Record = {
  date: string;
  method: string;
  condition: string;
  nextPlan: string;
};

export default function MiekoRecord() {
  const [method, setMethod] = useState('電話');
  const [condition, setCondition] = useState('');
  const [nextPlan, setNextPlan] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [pastRecords, setPastRecords] = useState<Record[]>([]);
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem('mieko_records');
    if (raw) {
      const records = JSON.parse(raw);
      setPastRecords(records.slice(0, 10));
    }
  }, []);

  const handleSave = async () => {
    if (!condition.trim()) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/family-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'みえこ（義母）',
          method,
          condition,
          nextPlan,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '記録に失敗しました');
      }

      const today = new Date().toLocaleDateString('ja-JP');
      const newRecord = { date: today, method, condition, nextPlan };
      const raw = localStorage.getItem('mieko_records');
      const existing = raw ? JSON.parse(raw) : [];
      existing.unshift(newRecord);
      localStorage.setItem('mieko_records', JSON.stringify(existing));

      setPastRecords(existing.slice(0, 10));
      setSaved(true);
      setCondition('');
      setNextPlan('');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '記録に失敗しました';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#1a2a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">👵</div>
          <h1 className="text-white text-xl font-bold">みえこの記録</h1>
          <p className="text-pink-300 text-xs mt-1">義母 / 義父逝去後・悲嘆に寄り添う段階</p>
          <p className="text-gray-500 text-xs mt-1">
            {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
        </div>

        {/* 記録フォーム */}
        <div className="bg-[#2a1a20] rounded-2xl p-4 mb-6">

          {/* 連絡手段 */}
          <p className="text-gray-400 text-xs mb-2">連絡・会った手段</p>
          <div className="flex gap-2 mb-4 flex-wrap">
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  method === m
                    ? 'bg-pink-700 text-white border-transparent'
                    : 'border-gray-600 text-gray-400 bg-transparent hover:border-pink-500'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* 様子・気になること */}
          <p className="text-gray-400 text-xs mb-2">今日の様子・気になること</p>
          <textarea
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="例：落ち着いて話せていた。年金の手続きを心配していた..."
            rows={4}
            className="w-full bg-[#1a2a1a] text-gray-200 rounded-xl p-3 text-sm resize-none border border-pink-900 focus:outline-none focus:border-pink-500 placeholder-gray-600 mb-3"
          />

          {/* 次回予定 */}
          <p className="text-gray-400 text-xs mb-2">次回の連絡・訪問予定</p>
          <input
            type="text"
            value={nextPlan}
            onChange={(e) => setNextPlan(e.target.value)}
            placeholder="例：来週末に訪問。一緒に役所に行く"
            className="w-full bg-[#1a2a1a] text-gray-200 rounded-xl p-3 text-sm border border-pink-900 focus:outline-none focus:border-pink-500 placeholder-gray-600"
          />
        </div>

        {/* 保存ボタン */}
        {saved ? (
          <div className="bg-pink-900 rounded-full py-4 text-center text-pink-300 text-sm font-medium mb-3">
            ✓ Notionに記録しました
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={!condition.trim() || saving}
            className="w-full bg-pink-700 hover:bg-pink-800 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-full transition-all text-sm mb-3"
          >
            {saving ? '記録中...' : '📝 Notionに記録する'}
          </button>
        )}

        {error && <p className="text-red-400 text-xs text-center mb-3">{error}</p>}

        {saved && (
          <button
            onClick={() => setSaved(false)}
            className="w-full text-gray-500 text-xs mb-4 hover:text-gray-300 transition-colors"
          >
            + もう一件記録する
          </button>
        )}

        {/* 過去の記録一覧 */}
        {pastRecords.length > 0 && (
          <div className="mb-6">
            <p className="text-gray-400 text-xs mb-2">過去の記録</p>
            <div className="space-y-2">
              {pastRecords.map((r, i) => (
                <div key={i} className="bg-[#2a1a20] rounded-xl p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-pink-300 text-xs font-medium">{r.date}</span>
                    <span className="text-gray-500 text-xs">{r.method}</span>
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    {r.condition.slice(0, 50)}{r.condition.length > 50 ? '…' : ''}
                  </p>
                  {r.nextPlan && (
                    <p className="text-pink-400 text-xs mt-1">→ {r.nextPlan}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => router.push('/')}
          className="w-full text-gray-600 text-xs hover:text-gray-400 transition-colors"
        >
          ← トップへ戻る
        </button>
      </div>
    </main>
  );
}
