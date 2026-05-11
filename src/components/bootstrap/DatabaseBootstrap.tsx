import { useEffect, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useMinigameStore } from '../../store/minigameStore'

const SETUP_SQL = `CREATE TABLE minigames (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  video_url TEXT,
  has_audio BOOLEAN DEFAULT true,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE minigames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read"   ON minigames FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON minigames FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON minigames FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON minigames FOR DELETE USING (true);`

export function DatabaseBootstrap({ children }: { children: ReactNode }) {
  const { loadStatus, errorMessage, load } = useMinigameStore()

  useEffect(() => {
    load()
  }, [])

  if (loadStatus === 'ready') return <>{children}</>

  return (
    <div
      className="w-screen h-screen flex flex-col items-center justify-center p-8"
      style={{ background: 'linear-gradient(160deg,#eef2ff 0%,#f5f3ff 50%,#fff7ed 100%)' }}
    >
      {loadStatus === 'loading' || loadStatus === 'idle' ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-5"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-full border-4 border-[#e5e7eb] border-t-[#4f8cff]"
          />
          <p className="font-display text-2xl text-[#0f172a]">Verbinde mit Datenbank…</p>
          <p className="text-[#475569] font-body">BrainArena lädt Minispiele</p>
        </motion.div>
      ) : loadStatus === 'setup_required' ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="bg-white rounded-3xl shadow-lg border-2 border-[#f59e0b] p-8">
            <div className="text-5xl mb-4 text-center">🗄️</div>
            <h1 className="font-display text-3xl text-[#0f172a] text-center mb-2">
              Datenbank-Einrichtung erforderlich
            </h1>
            <p className="text-[#475569] font-body text-center mb-6">
              Die Minispiel-Tabelle muss einmalig erstellt werden. Führe folgenden SQL-Code im Supabase Dashboard aus:
            </p>

            <ol className="font-body text-[#475569] text-sm mb-4 space-y-1 list-decimal list-inside">
              <li>Gehe zu <strong className="text-[#0f172a]">supabase.com</strong> → dein Projekt</li>
              <li>Klicke links auf <strong className="text-[#0f172a]">SQL Editor</strong></li>
              <li>Klicke <strong className="text-[#0f172a]">New Query</strong></li>
              <li>Füge den folgenden Code ein und klicke <strong className="text-[#0f172a]">Run</strong></li>
            </ol>

            <pre className="bg-[#0f172a] text-[#e2e8f0] text-xs rounded-xl p-4 overflow-x-auto font-mono mb-6 whitespace-pre-wrap">
              {SETUP_SQL}
            </pre>

            <button
              onClick={load}
              className="w-full py-3 rounded-xl bg-[#4f8cff] text-white font-display text-xl hover:bg-[#3b7de8] transition-colors cursor-pointer"
            >
              🔄 Erneut versuchen
            </button>
          </div>
        </motion.div>
      ) : (
        /* loadStatus === 'error' */
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-lg border-2 border-[#ef4444] p-8 text-center">
            <div className="text-5xl mb-4">❌</div>
            <h1 className="font-display text-2xl text-[#0f172a] mb-3">
              Keine Verbindung zur Datenbank
            </h1>
            <p className="text-[#475569] font-body mb-2">
              Bitte Internetverbindung prüfen und erneut versuchen.
            </p>
            {errorMessage && (
              <p className="text-[#ef4444] font-mono text-xs mb-6 bg-[#fee2e2] rounded-lg p-3 text-left break-all">
                {errorMessage}
              </p>
            )}
            <button
              onClick={load}
              className="w-full py-3 rounded-xl bg-[#4f8cff] text-white font-display text-xl hover:bg-[#3b7de8] transition-colors cursor-pointer"
            >
              🔄 Erneut versuchen
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
