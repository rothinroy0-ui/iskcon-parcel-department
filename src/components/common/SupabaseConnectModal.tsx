import React, { useState } from 'react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  clearSupabaseConfig, 
  testSupabaseConnection 
} from '../../lib/supabase';
import { useData } from '../../context/DataContext';
import { 
  X, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  Database, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface SupabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConnectModal: React.FC<SupabaseConnectModalProps> = ({ isOpen, onClose }) => {
  const { isLiveSupabase, refreshData, seedLiveDatabase, devotees, auditLogs } = useData();

  const config = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(config.url);
  const [supabaseKey, setSupabaseKey] = useState(config.key);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tablesExist: boolean } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseKey) {
      alert('Please enter both Supabase Project URL and Anon Key.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setSeedResult(null);

    const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      saveSupabaseConfig(supabaseUrl, supabaseKey);
      await refreshData();
    }
  };

  const handleDisconnect = async () => {
    clearSupabaseConfig();
    setSupabaseUrl('');
    setSupabaseKey('');
    setTestResult(null);
    setSeedResult(null);
    await refreshData();
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    const res = await seedLiveDatabase();
    setIsSeeding(false);
    setSeedResult(res.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Server className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif">Connect with Live Supabase Data</h3>
              <p className="text-[11px] text-emerald-200">
                PostgreSQL Database & Row Level Security Integration
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Status Header */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
            isLiveSupabase 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isLiveSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-bold">
                {isLiveSupabase ? 'Status: Connected to Live Supabase' : 'Status: Running in Interactive Demo Mode'}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-600">
              {devotees.length} Devotees Active
            </span>
          </div>

          {/* Quick Steps Guide */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              How to Connect in 3 Simple Steps:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
              <li>
                Create or open your project at{' '}
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-emerald-700 font-bold hover:underline inline-flex items-center"
                >
                  supabase.com <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                </a>
              </li>
              <li>
                Run the script in <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-800">supabase/schema.sql</code> in Supabase SQL Editor.
              </li>
              <li>
                Copy the <strong>Project URL</strong> &amp; <strong>Anon Key</strong> from Project Settings ➔ API, paste below, and click Connect!
              </li>
            </ol>
          </div>

          {/* Form */}
          <form onSubmit={handleTestAndConnect} className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                required
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Supabase Anon Public API Key
              </label>
              <input
                type="password"
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl flex items-start space-x-2 ${
                testResult.success 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">{testResult.success ? 'Connection Successful!' : 'Connection Failed'}</div>
                  <div className="text-[11px] mt-0.5">{testResult.message}</div>
                </div>
              </div>
            )}

            {seedResult && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{seedResult}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isTesting}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <Server className="w-4 h-4" />
                <span>{isTesting ? 'Testing...' : 'Test & Connect to Supabase'}</span>
              </button>

              {isLiveSupabase && (
                <>
                  <button
                    type="button"
                    onClick={handleSeedData}
                    disabled={isSeeding}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
                    title="Insert initial devotees and departments into Supabase"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isSeeding ? 'Seeding...' : 'Seed Sample Devotees into DB'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors ml-auto"
                  >
                    Disconnect
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
