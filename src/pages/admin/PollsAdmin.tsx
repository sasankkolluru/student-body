import React, { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { apiFetch, createPoll, deletePoll, activatePoll, deactivatePoll } from '../../lib/api';

interface PollOption { _id: string; text: string; votes: number; }
interface Poll { _id: string; title: string; description?: string; options: PollOption[]; totalVotes: number; endDate?: string; createdAt?: string; isActive?: boolean; visibleAt?: string; }

const PollsAdmin: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [optionText, setOptionText] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [endDate, setEndDate] = useState('');
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = useMemo(() => title.trim() && options.length >= 2, [title, options]);

  const loadPolls = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Poll[]>('/polls?all=true');
      setPolls(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let s: Socket | null = null;
    let intervalId: any = null;

    // initial load
    loadPolls();

    // socket candidates
    const socketBase = (import.meta.env.VITE_API_BASE as string || '').replace(/\/api\/?$/, '');
    const candidates = [socketBase, 'http://localhost:4000', 'http://127.0.0.1:4000'].filter(Boolean);
    let idx = 0;
    const tryConnect = (url: string) => {
      const client = io(url, { path: '/socket.io/' });
      client.on('connect_error', () => {
        if (idx < candidates.length - 1) {
          idx += 1;
          client.removeAllListeners();
          client.disconnect();
          tryConnect(candidates[idx]!);
        }
      });
      client.on('polls:new', () => loadPolls());
      client.on('polls:deleted', () => loadPolls());
      client.on('polls:updated', () => loadPolls());
      client.on('polls:visibility', () => loadPolls());
      s = client;
    };
    try {
      tryConnect(candidates[idx]!);
    } catch {}

    // polling fallback
    intervalId = setInterval(() => loadPolls(), 10000);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (s) { s.removeAllListeners(); s.disconnect(); }
    };
  }, []);

  const addOption = () => {
    const t = optionText.trim();
    if (!t) return;
    setOptions((prev) => [...prev, t]);
    setOptionText('');
  };

  const removeOption = (idx: number) => setOptions((prev) => prev.filter((_, i) => i !== idx));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    try {
      setLoading(true);
      await createPoll({ title: title.trim(), description: description.trim() || undefined, options, endDate: endDate ? new Date(endDate).toISOString() : undefined });
      setTitle(''); setDescription(''); setOptions([]); setEndDate('');
      await loadPolls();
    } catch (err: any) {
      setError(err.message || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this poll?')) return;
    try {
      await deletePoll(id);
      await loadPolls();
    } catch (err: any) {
      setError(err.message || 'Failed to delete poll');
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin: Manage Polls</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Create a Poll</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input className="w-full border rounded-lg px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Poll title" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full border rounded-lg px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Options (min 2)</label>
                <div className="flex gap-2 mb-2">
                  <input className="flex-1 border rounded-lg px-3 py-2" value={optionText} onChange={(e) => setOptionText(e.target.value)} placeholder="Add option text" />
                  <Button type="button" onClick={addOption}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt, idx) => (
                    <span key={idx} className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                      {opt}
                      <button type="button" className="ml-2 text-red-600" onClick={() => removeOption(idx)}>×</button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="datetime-local" className="w-full border rounded-lg px-3 py-2" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div>
                <Button type="submit" disabled={!canCreate || loading}>{loading ? 'Creating...' : 'Create Poll'}</Button>
              </div>
            </form>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Existing Polls</h2>
              <a className="text-blue-600 hover:underline" href="/voting">Go to Voting</a>
            </div>
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : polls.length === 0 ? (
              <div className="text-gray-500">No polls yet.</div>
            ) : (
              <div className="space-y-3">
                {polls.map((p) => (
                  <div key={p._id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{p.title}</div>
                      <div className="text-sm text-gray-600">Options: {p.options.length} • Total votes: {p.totalVotes}</div>
                      <div className="text-xs mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                          {p.isActive ? 'Active' : 'Hidden'}
                        </span>
                        {p.visibleAt && (
                          <span className="ml-2 text-gray-500">since {new Date(p.visibleAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => window.open('/voting', '_self')}>View</Button>
                      {p.isActive ? (
                        <Button variant="secondary" className="!text-white !bg-yellow-600 hover:!bg-yellow-700" onClick={async () => { try { await deactivatePoll(p._id); await loadPolls(); } catch (e:any) { setError(e.message || 'Failed to deactivate'); } }}>Deactivate</Button>
                      ) : (
                        <Button variant="secondary" className="!text-white !bg-green-600 hover:!bg-green-700" onClick={async () => { try { await activatePoll(p._id); await loadPolls(); } catch (e:any) { setError(e.message || 'Failed to activate'); } }}>Activate</Button>
                      )}
                      <Button variant="secondary" className="!text-white !bg-red-600 hover:!bg-red-700" onClick={() => handleDelete(p._id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PollsAdmin;
