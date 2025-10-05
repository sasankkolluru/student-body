import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiFetch } from '../lib/api';

interface Message {
  _id: string;
  subject: string;
  content: string;
  name?: string;
  email?: string;
  createdAt: string;
}

const MessagesPage: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Message[]>([]);

  const loadMessages = async () => {
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

  useEffect(() => { loadMessages(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;
    try {
      setLoading(true);
      await apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({ subject: subject.trim(), content: content.trim() })
      });
      setSubject('');
      setContent('');
      await loadMessages();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your message here"
                  required
                />
              </div>
              <div>
                <Button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Message'}</Button>
              </div>
            </form>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Messages</h2>
              <Button variant="secondary" onClick={loadMessages}>Refresh</Button>
            </div>
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : items.length === 0 ? (
              <div className="text-gray-500">No messages yet.</div>
            ) : (
              <div className="space-y-3">
                {items.map((m) => (
                  <div key={m._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{m.subject}</div>
                      <div className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{m.content}</div>
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

export default MessagesPage;
