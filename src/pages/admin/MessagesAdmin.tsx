import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { apiFetch } from '../../lib/api';

interface Message {
  _id: string;
  subject: string;
  content: string;
  name?: string;
  email?: string;
  createdAt: string;
}

const MessagesAdmin: React.FC = () => {
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sender, setSender] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Message[]>('/messages');
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    return items.filter((m) => {
      const t = new Date(m.createdAt);
      const inFrom = fromDate ? t >= fromDate : true;
      const inTo = toDate ? t <= toDate : true;
      const inQuery = q
        ? (m.subject?.toLowerCase().includes(q.toLowerCase()) || m.content?.toLowerCase().includes(q.toLowerCase()))
        : true;
      const inSender = sender
        ? ((m.email || '').toLowerCase().includes(sender.toLowerCase()) || (m.name || '').toLowerCase().includes(sender.toLowerCase()))
        : true;
      return inFrom && inTo && inQuery && inSender;
    });
  }, [items, q, from, to, sender]);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin: Messages</h1>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <Card className="mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input className="w-full border rounded-lg px-3 py-2" value={q} onChange={(e) => setQ(e.target.value)} placeholder="subject or content" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender</label>
                <input className="w-full border rounded-lg px-3 py-2" value={sender} onChange={(e) => setSender(e.target.value)} placeholder="name or email" />
              </div>
              <div className="flex items-end">
                <Button variant="secondary" onClick={load}>Refresh</Button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-gray-500">No messages found.</div>
            ) : (
              <div className="space-y-3">
                {filtered.map((m) => (
                  <div key={m._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{m.subject}</div>
                      <div className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-xs text-gray-500">{m.name || 'Anonymous'} {m.email && `• ${m.email}`}</div>
                    <div className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{m.content}</div>
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

export default MessagesAdmin;
