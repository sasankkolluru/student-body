import React, { useEffect, useMemo, useState } from 'react';
import { listMyAchievements, type AchievementItem } from '../../lib/api';
import { Download, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const MyAchievements: React.FC = () => {
  const [items, setItems] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all'|'pending'|'approved'|'rejected'>('all');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await listMyAchievements();
        setItems(data);
      } catch (e) {
        console.error('Failed to load achievements', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items.filter((it) => {
      const matches = !s ||
        it.eventName.toLowerCase().includes(s) ||
        (it.description || '').toLowerCase().includes(s) ||
        (it.meritPosition || '').toLowerCase().includes(s);
      const byStatus = status === 'all' || it.status === status;
      return matches && byStatus;
    });
  }, [items, search, status]);

  const exportExcel = () => {
    const rows = filtered.map((s) => ({
      'Achievement Title': s.eventName,
      Description: s.description || '',
      'Date of Submission': s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '',
      Category: s.eventClassification || s.eventType || '',
      'Verified Status': s.status === 'approved' ? 'Yes' : 'No'
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'My Achievements');
    XLSX.writeFile(wb, 'my_achievements.xlsx');
  };

  const exportCsv = () => {
    const headers = ['Achievement Title','Description','Date of Submission','Category','Verified Status'];
    const lines = [headers.join(',')];
    filtered.forEach((s) => {
      const row = [
        s.eventName,
        (s.description || '').replace(/\n|\r|,/g, ' '),
        s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '',
        s.eventClassification || s.eventType || '',
        s.status === 'approved' ? 'Yes' : 'No'
      ];
      lines.push(row.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_achievements.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    (autoTable as any)(doc, {
      head: [["Achievement Title", "Description", "Date of Submission", "Category", "Verified"]],
      body: filtered.map((s) => [
        s.eventName,
        (s.description || '').slice(0, 80),
        s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '',
        s.eventClassification || s.eventType || '',
        s.status === 'approved' ? 'Yes' : 'No'
      ]),
      styles: { fontSize: 8 }
    });
    doc.save('my_achievements.pdf');
  };

  const exportDoc = () => {
    const rows = filtered.map((s) => ({
      title: s.eventName,
      desc: s.description || '',
      date: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '',
      category: s.eventClassification || s.eventType || '',
      verified: s.status === 'approved' ? 'Yes' : 'No'
    }));
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>My Achievements</title></head><body>
      <h2>My Achievements</h2>
      <table border="1" cellspacing="0" cellpadding="4">
        <thead><tr>
          <th>Achievement Title</th><th>Description</th><th>Date of Submission</th><th>Category</th><th>Verified Status</th>
        </tr></thead>
        <tbody>
          ${rows.map(r => `<tr><td>${r.title}</td><td>${r.desc.replace(/</g,'&lt;')}</td><td>${r.date}</td><td>${r.category}</td><td>${r.verified}</td></tr>`).join('')}
        </tbody>
      </table>
    </body></html>`;
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_achievements.doc';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Achievements</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportExcel} className="inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-gray-50 text-sm">
            <Download className="h-4 w-4 mr-2" /> Excel
          </button>
          <button onClick={exportCsv} className="inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-gray-50 text-sm">
            <Download className="h-4 w-4 mr-2" /> CSV
          </button>
          <button onClick={exportPdf} className="inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-gray-50 text-sm">
            <Download className="h-4 w-4 mr-2" /> PDF
          </button>
          <button onClick={exportDoc} className="inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-gray-50 text-sm">
            <Download className="h-4 w-4 mr-2" /> Word
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-4">
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="mt-2 md:mt-0 px-3 py-2 border rounded-md bg-white"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-500">No achievements found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Achievement Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Submission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.eventName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.description || ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.eventClassification || s.eventType || ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.status === 'approved' ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyAchievements;
