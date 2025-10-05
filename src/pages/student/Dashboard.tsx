import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Bell, 
  User, 
  LogOut,
  AlertCircle,
  CheckCircle2,
  X,
  Users,
  Download,
  Search
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { listMyAchievements, type AchievementItem } from '../../lib/api';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  maxParticipants: number;
  currentParticipants: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  registered: boolean;
  registrationStatus?: 'pending' | 'approved' | 'rejected';
}

interface Notification {
  id: string;
  message: string;
  type: 'registration' | 'event' | 'system';
  read: boolean;
  createdAt: string;
}

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState('events');
  // Achievements state
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [achLoading, setAchLoading] = useState(false);
  const [achSearch, setAchSearch] = useState('');
  const [achStatus, setAchStatus] = useState<'all'|'pending'|'approved'|'rejected'>('all');
  
  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    regdNo: user?.regdNo || '',
    branch: user?.branch || '',
    stream: user?.stream || '',
    email: user?.email || '',
    phone: '',
    year: '',
  });

  // Load mock data
  useEffect(() => {
    // In a real app, this would be an API call
    const mockEvents: Event[] = [
      {
        id: '1',
        title: 'Annual Tech Fest',
        description: 'A celebration of technology and innovation with workshops, competitions, and guest speakers.',
        date: '2023-12-15',
        maxParticipants: 100,
        currentParticipants: 45,
        status: 'upcoming',
        registered: false,
      },
      {
        id: '2',
        title: 'Hackathon 2023',
        description: '24-hour coding competition to build innovative solutions for real-world problems.',
        date: '2023-11-20',
        maxParticipants: 50,
        currentParticipants: 50,
        status: 'upcoming',
        registered: true,
        registrationStatus: 'approved',
      },
      {
        id: '3',
        title: 'Coding Bootcamp',
        description: 'Learn full-stack development in a 6-week intensive program.',
        date: '2023-10-30',
        maxParticipants: 30,
        currentParticipants: 22,
        status: 'upcoming',
        registered: false,
      },
    ];

    const mockNotifications: Notification[] = [
      {
        id: '1',
        message: 'Your registration for Hackathon 2023 has been approved!',
        type: 'registration',
        read: false,
        createdAt: new Date('2023-10-10T10:30:00').toISOString(),
      },
      {
        id: '2',
        message: 'New event: Annual Tech Fest is now open for registration',
        type: 'event',
        read: false,
        createdAt: new Date('2023-10-08T14:15:00').toISOString(),
      },
    ];

    setEvents(mockEvents);
    setNotifications(mockNotifications);
  }, []);

  // Load my achievements (when dashboard mounts and when switching to achievements tab)
  useEffect(() => {
    if (activeTab !== 'achievements') return;
    (async () => {
      try {
        setAchLoading(true);
        const data = await listMyAchievements();
        setAchievements(data);
      } catch (e) {
        console.error('Failed to load achievements', e);
      } finally {
        setAchLoading(false);
      }
    })();
  }, [activeTab]);

  const filteredAchievements = (() => {
    const s = achSearch.trim().toLowerCase();
    return achievements.filter((it) => {
      const matches = !s ||
        it.eventName.toLowerCase().includes(s) ||
        (it.description || '').toLowerCase().includes(s) ||
        (it.meritPosition || '').toLowerCase().includes(s);
      const byStatus = achStatus === 'all' || it.status === achStatus;
      return matches && byStatus;
    });
  })();

  // Export helpers for Achievements
  const achExportExcel = () => {
    const rows = filteredAchievements.map((s) => ({
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

  const achExportCsv = () => {
    const headers = ['Achievement Title','Description','Date of Submission','Category','Verified Status'];
    const lines = [headers.join(',')];
    filteredAchievements.forEach((s) => {
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

  const achExportPdf = () => {
    const doc = new jsPDF();
    (autoTable as any)(doc, {
      head: [["Achievement Title", "Description", "Date of Submission", "Category", "Verified"]],
      body: filteredAchievements.map((s) => [
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

  const achExportDoc = () => {
    const rows = filteredAchievements.map((s) => ({
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

  const handleRegisterClick = (event: Event) => {
    setSelectedEvent(event);
    setShowRegistrationForm(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would be an API call
    const registrationData = {
      eventId: selectedEvent?.id,
      ...formData,
      registrationDate: new Date().toISOString(),
      status: 'pending' as const,
    };

    // Update the event to show as registered
    setEvents(events.map(event => 
      event.id === selectedEvent?.id 
        ? { ...event, registered: true, registrationStatus: 'pending' }
        : event
    ));

    // Add notification
    const newNotification: Notification = {
      id: Date.now().toString(),
      message: `Your registration for "${selectedEvent?.title}" is pending approval`,
      type: 'registration',
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications([newNotification, ...notifications]);
    setShowRegistrationForm(false);
    setSelectedEvent(null);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const registeredEvents = events.filter(e => e.registered);
  const availableEvents = events.filter(e => !e.registered && e.status === 'upcoming' && e.currentParticipants < e.maxParticipants);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Student Portal</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                className="p-2 text-gray-600 hover:text-gray-900 relative"
                onClick={() => setActiveTab('notifications')}
              >
                <Bell className="h-6 w-6" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">My Achievements</h2>
              <div className="flex gap-2 flex-wrap">
                <button onClick={achExportExcel} className="inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-gray-50 text-sm">
                  <Download className="h-4 w-4 mr-2" /> Excel
                </button>
                <button onClick={achExportCsv} className="inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-gray-50 text-sm">
                  <Download className="h-4 w-4 mr-2" /> CSV
                </button>
                <button onClick={achExportPdf} className="inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-gray-50 text-sm">
                  <Download className="h-4 w-4 mr-2" /> PDF
                </button>
                <button onClick={achExportDoc} className="inline-flex items-center px-3 py-2 rounded-md border bg-white hover:bg-gray-50 text-sm">
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
                  value={achSearch}
                  onChange={(e) => setAchSearch(e.target.value)}
                  placeholder="Search..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <select
                value={achStatus}
                onChange={(e) => setAchStatus(e.target.value as any)}
                className="mt-2 md:mt-0 px-3 py-2 border rounded-md bg-white"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {achLoading ? (
              <div className="py-20 text-center text-gray-500">Loading...</div>
            ) : filteredAchievements.length === 0 ? (
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
                    {filteredAchievements.map((s) => (
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
        )}
              </button>
            </div>
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-700">{user?.name}</span>
              <button
                onClick={logout}
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('events')}
              className={`${activeTab === 'events' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('registered')}
              className={`${activeTab === 'registered' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              My Registrations
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`${activeTab === 'notifications' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`${activeTab === 'achievements' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Achievements
            </button>
          </nav>
        </div>

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-6">Available Events</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availableEvents.length > 0 ? (
                availableEvents.map((event) => (
                  <div key={event.id} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                          <div className="mt-1 flex items-baseline">
                            <span className="text-sm text-gray-500">
                              {event.currentParticipants} / {event.maxParticipants} participants
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                        <div className="mt-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            event.status === 'upcoming' 
                              ? 'bg-blue-100 text-blue-800' 
                              : event.status === 'ongoing' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{
                              width: `${Math.min(100, (event.currentParticipants / event.maxParticipants) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {event.maxParticipants - event.currentParticipants} spots remaining
                        </p>
                      </div>
                      <div className="mt-5">
                        <button
                          onClick={() => handleRegisterClick(event)}
                          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Register Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <div className="text-gray-400">
                    <Users className="mx-auto h-12 w-12" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No events available</h3>
                    <p className="mt-1 text-sm text-gray-500">Check back later for upcoming events.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Registered Events Tab */}
        {activeTab === 'registered' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-6">My Registrations</h2>
            {registeredEvents.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {registeredEvents.map((event) => (
                  <div key={event.id} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                          <div className="mt-1 flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              event.registrationStatus === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : event.registrationStatus === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {event.registrationStatus === 'approved' ? (
                                <CheckCircle className="mr-1 h-3 w-3" />
                              ) : event.registrationStatus === 'rejected' ? (
                                <XCircle className="mr-1 h-3 w-3" />
                              ) : (
                                <Clock className="mr-1 h-3 w-3" />
                              )}
                              {event.registrationStatus ? 
                                event.registrationStatus.charAt(0).toUpperCase() + event.registrationStatus.slice(1) : 
                                'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                      </div>
                      {event.registrationStatus === 'approved' && (
                        <div className="mt-4 p-3 bg-green-50 rounded-md">
                          <div className="flex">
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-green-800">Registration Confirmed</h3>
                              <div className="mt-1 text-sm text-green-700">
                                <p>Check your email for event details and schedule.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {event.registrationStatus === 'rejected' && (
                        <div className="mt-4 p-3 bg-red-50 rounded-md">
                          <div className="flex">
                            <XCircle className="h-5 w-5 text-red-400" />
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">Registration Not Approved</h3>
                              <div className="mt-1 text-sm text-red-700">
                                <p>This event is now full. Check out other available events.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400">
                  <Calendar className="mx-auto h-12 w-12" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No registrations</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You haven't registered for any events yet.
                    <button
                      onClick={() => setActiveTab('events')}
                      className="ml-1 text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      Browse events
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
              {unreadNotifications > 0 && (
                <button
                  onClick={() => {
                    // Mark all as read
                    setNotifications(notifications.map(n => ({ ...n, read: true })));
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              {notifications.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <div 
                        className={`block hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center">
                            <div className="min-w-0 flex-1 flex items-center">
                              <div className="flex-shrink-0">
                                {notification.type === 'registration' ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : notification.type === 'event' ? (
                                  <Calendar className="h-5 w-5 text-blue-500" />
                                ) : (
                                  <Bell className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1 px-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {notification.message}
                                  </p>
                                  <p className="mt-1 text-sm text-gray-500">
                                    {new Date(notification.createdAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              {!notification.read && (
                                <div>
                                  <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400">
                    <Bell className="mx-auto h-12 w-12" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You don't have any notifications yet.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Registration Form Modal */}
      <AnimatePresence>
        {showRegistrationForm && selectedEvent && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Register for {selectedEvent.title}
                </h3>
                <button
                  onClick={() => setShowRegistrationForm(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="regdNo" className="block text-sm font-medium text-gray-700">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      id="regdNo"
                      name="regdNo"
                      value={formData.regdNo}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                      Year of Study
                    </label>
                    <select
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
                      Branch
                    </label>
                    <input
                      type="text"
                      id="branch"
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="stream" className="block text-sm font-medium text-gray-700">
                      Stream
                    </label>
                    <input
                      type="text"
                      id="stream"
                      name="stream"
                      value={formData.stream}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                  >
                    Submit Registration
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRegistrationForm(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentDashboard;
