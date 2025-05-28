'use client';

import React, { useState } from 'react';
import Widget from '../app/components/Widget';
import KnowledgeBaseDashboard from '../app/components/KnowledgeBaseDashboard';

export default function Page() {
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeySet, setApiKeySet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      setLoading(true);
      setError(null);

      try {
        const kbService = new (await import('../app/lib/elevenlabs-api')).ElevenLabsKnowledgeBase(apiKey);
        const isValid = await kbService.testApiKey();

        if (isValid) {
          setApiKeySet(true);
          setSuccess('API key validated successfully!');
        } else {
          setError('Invalid API key. Please check your key and try again.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to validate API key');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-100 font-sans">
      {/* Header */}
      <div className="pt-16 px-6 text-center max-w-6xl mx-auto">
        <p className="text-base leading-6 mb-6">
          Cross-platform generative-AI speech by Larynx.
        </p>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 rounded-lg p-1 flex">
            <button
              onClick={() => setShowKnowledgeBase(false)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                !showKnowledgeBase
                  ? 'bg-white/20 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              🎤 Voice Assistant
            </button>
            <button
              onClick={() => setShowKnowledgeBase(true)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                showKnowledgeBase
                  ? 'bg-white/20 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              📚 Knowledge Base
            </button>
          </div>
        </div>

        {/* Voice Assistant Tab */}
        {!showKnowledgeBase && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white/5 rounded-xl p-5 mb-6">
              <h2 className="text-lg font-bold mb-4">Available Client Tools:</h2>

              <div className="border-b border-white/10 py-3 flex justify-between items-center">
                <span className="text-sm">Get battery level</span>
                <div className="flex gap-2 text-xs text-slate-300">
                  <span className="bg-white/10 px-2 py-1 rounded">web</span>
                  <span className="bg-white/10 px-2 py-1 rounded">ios</span>
                  <span className="bg-white/10 px-2 py-1 rounded">android</span>
                </div>
              </div>

              <div className="border-b border-white/10 py-3 flex justify-between items-center">
                <span className="text-sm">Change screen brightness</span>
                <div className="flex gap-2 text-xs text-slate-300">
                  <span className="bg-white/10 px-2 py-1 rounded">ios</span>
                  <span className="bg-white/10 px-2 py-1 rounded">android</span>
                </div>
              </div>

              <div className="py-3 flex justify-between items-center">
                <span className="text-sm">Flash screen</span>
                <div className="flex gap-2 text-xs text-slate-300">
                  <span className="bg-white/10 px-2 py-1 rounded">ios</span>
                  <span className="bg-white/10 px-2 py-1 rounded">android</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-5">
              <h3 className="text-lg font-bold mb-3">How to Use</h3>
              <div className="text-left space-y-2 text-sm text-slate-300">
                <p>• Click the "VOICE CHAT" button to start a conversation</p>
                <p>• Allow microphone access when prompted</p>
                <p>• Speak naturally with your AI assistant</p>
                <p>• The assistant can access your device's battery level, brightness controls, and screen flash</p>
                <p>• Click the red button to end the conversation</p>
              </div>
            </div>
          </div>
        )}

        {/* Knowledge Base Tab */}
        {showKnowledgeBase && (
          <div>
            {!apiKeySet ? (
              <div className="max-w-md mx-auto">
                <div className="bg-white/5 rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-4">ElevenLabs API Key Required</h2>
                  <p className="text-sm text-slate-300 mb-4">
                    To manage your knowledge base, please enter your ElevenLabs API key.
                  </p>

                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                      <p className="text-red-200 text-sm">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-4">
                      <p className="text-green-200 text-sm">{success}</p>
                    </div>
                  )}

                  <form onSubmit={handleApiKeySubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">API Key</label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your ElevenLabs API key..."
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 rounded-lg font-medium transition-colors"
                    >
                      {loading ? 'Validating...' : 'Validate API Key'}
                    </button>
                  </form>

                  <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                    <p className="text-xs text-yellow-200">
                      🔒 Your API key is stored locally and not sent to any external servers except ElevenLabs.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-sm text-slate-300">API Key configured</span>
                  </div>
                  <button
                    onClick={() => {
                      setApiKeySet(false);
                      setApiKey('');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    Change API Key
                  </button>
                </div>
                <KnowledgeBaseDashboard apiKey={apiKey} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Voice Widget */}
      {!showKnowledgeBase && <Widget platform="web" />}
    </div>
  );
}
