import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, Clock, Filter, Download } from 'lucide-react';
import { listAchievements, updateAchievementStatus, type AchievementItem } from '../../lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const AchievementSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const items = await listAchievements(status as any);
      setSubmissions(items);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    const headers = ['Student','RegdNo','Branch','Event','Type','Status','Date'];
    const lines = [headers.join(',')];
    filteredSubmissions.forEach((s) => {
      const row = [
        s.studentName,
        s.registrationNumber,
        s.branch || '',
        s.eventName,
        s.eventType || '',
        s.status,
        s.dateOfParticipation || ''
      ];
      lines.push(row.map(v => '"' + String(v ?? '').replace(/"/g,'""') + '"').join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'achievements.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateAchievementStatus(id, status);
      await loadSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.registrationNumber.includes(searchTerm) ||
      submission.eventName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const exportToExcel = () => {
    const rows = filteredSubmissions.map((s) => ({
      Student: s.studentName,
      RegdNo: s.registrationNumber,
      Branch: s.branch || '',
      Event: s.eventName,
      Type: s.eventType || '',
      Status: s.status,
      Date: s.dateOfParticipation || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Achievements');
    XLSX.writeFile(wb, 'achievements.xlsx');
  };

  const exportToPdf = () => {
    const doc = new jsPDF();
    (autoTable as any)(doc, {
      head: [["Student", "RegdNo", "Branch", "Event", "Type", "Status", "Date"]],
      body: filteredSubmissions.map((s) => [
        s.studentName,
        s.registrationNumber,
        s.branch || '',
        s.eventName,
        s.eventType || '',
        s.status,
        s.dateOfParticipation || ''
      ]),
      styles: { fontSize: 8 }
    });
    doc.save('achievements.pdf');
  };

  // Basic Word export using HTML table wrapped as .doc
  const exportToDoc = () => {
    const header = ['Student','RegdNo','Branch','Event','Type','Status','Date'];
    const rows = filteredSubmissions.map((s) => [
      s.studentName,
      s.registrationNumber,
      s.branch || '',
      s.eventName,
      s.eventType || '',
      s.status,
      s.dateOfParticipation || ''
    ]);
    const tableRows = rows.map(r => `<tr>${r.map(c => `<td style="border:1px solid #ccc;padding:4px;">${String(c ?? '')}</td>`).join('')}</tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Achievements</title></head><body>
      <h2>Achievements</h2>
      <table style="border-collapse:collapse;">
        <thead><tr>${header.map(h => `<th style=\"border:1px solid #ccc;padding:4px;background:#f5f5f5;\">${h}</th>`).join('')}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </body></html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'achievements.doc';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Achievement Submissions</h2>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search submissions..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button onClick={exportToExcel} className="inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-gray-50 text-sm">
            <Download className="h-4 w-4 mr-2" /> Export Excel
          </button>
          <button onClick={exportToCsv} className="inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-gray-50 text-sm">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </button>
          <button onClick={exportToPdf} className="inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-gray-50 text-sm">
            <Download className="h-4 w-4 mr-2" /> Export PDF
          </button>
          <button onClick={exportToDoc} className="inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-gray-50 text-sm">
            <Download className="h-4 w-4 mr-2" /> Export Word
          </button>
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No submissions found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter === 'all' 
              ? 'No submissions have been made yet.'
              : `No ${statusFilter} submissions found.`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubmissions.map((submission) => (
                <tr key={submission._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {submission.studentName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.studentName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {submission.registrationNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{submission.eventName}</div>
                    <div className="text-sm text-gray-500">{submission.branch}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {submission.eventType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(submission.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          // View details logic here
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      {submission.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => updateStatus(submission._id, 'approved')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(submission._id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AchievementSubmissions;
