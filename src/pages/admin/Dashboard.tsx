import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Calendar, BarChart2, Trophy, FileText, Download, Trash2, X, Edit, Users, Check, XCircle } from 'lucide-react';
import AchievementSubmissions from '../../components/admin/AchievementSubmissions';
import EventForm from '../../components/admin/EventForm';
import { Event, Poll } from '../../types';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface Registration {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  regdNo: string;
  branch: string;
  year: string;
  status: 'pending' | 'approved' | 'rejected';
  registeredAt: string;
}

interface AdminEvent extends Event {
  registrations: Registration[];
  status: 'upcoming' | 'ongoing' | 'completed';
}

// Sample data for demonstration
const sampleEvent: AdminEvent = {
  id: '1',
  title: 'Annual Sports Day',
  description: 'Join us for a day of sports and fun activities!',
  date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  time: '10:00',
  location: 'University Ground',
  category: 'sports',
  organizer: 'Sports Committee',
  registrationOpen: true,
  maxParticipants: 100,
  currentParticipants: 0,
  image: '',
  department: 'All',
  studentLead1: { name: 'John Doe', contact: '9876543210' },
  studentLead2: { name: 'Jane Smith', contact: '9876543211' },
  facultyLead1: { name: 'Dr. Robert', contact: 'robert@univ.edu' },
  facultyLead2: { name: 'Dr. Sarah', contact: 'sarah@univ.edu' },
  registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  prizes: ['1st Prize: ₹10,000', '2nd Prize: ₹5,000', '3rd Prize: ₹2,500'],
  rules: ['Participants must bring their ID cards', 'No late entries allowed'],
  requirements: ['Sports shoes', 'Water bottle'],
  registrations: [
    {
      id: '1',
      studentId: 'STU001',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      phone: '9876543210',
      regdNo: '20BEC1234',
      branch: 'CSE',
      year: '3rd',
      status: 'pending',
      registeredAt: new Date().toISOString()
    },
    {
      id: '2',
      studentId: 'STU002',
      name: 'Maria Garcia',
      email: 'maria@example.com',
      phone: '9876543211',
      regdNo: '20BEC1235',
      branch: 'ECE',
      year: '2nd',
      status: 'approved',
      registeredAt: new Date().toISOString()
    }
  ],
  status: 'upcoming',
};

// Sample poll data
const samplePolls: Poll[] = [
  {
    id: '1',
    question: 'Which programming language do you prefer?',
    options: [
      { id: '1', text: 'JavaScript', votes: 25 },
      { id: '2', text: 'Python', votes: 35 },
      { id: '3', text: 'Java', votes: 20 },
      { id: '4', text: 'C++', votes: 15 },
    ],
    totalVotes: 95,
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: 'admin',
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    question: 'What framework do you use for frontend?',
    options: [
      { id: '1', text: 'React', votes: 45 },
      { id: '2', text: 'Vue', votes: 25 },
      { id: '3', text: 'Angular', votes: 20 },
      { id: '4', text: 'Svelte', votes: 10 },
    ],
    totalVotes: 100,
    isActive: false,
    createdAt: new Date().toISOString(),
    createdBy: 'admin',
    endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isPollFormOpen, setIsPollFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [newPoll, setNewPoll] = useState<Omit<Poll, 'id' | 'createdAt' | 'createdBy' | 'totalVotes'>>({ 
    question: '',
    options: [{ id: '1', text: '', votes: 0 }, { id: '2', text: '', votes: 0 }],
    isActive: true,
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Load data from localStorage
  useEffect(() => {
    const storedEvents = localStorage.getItem('admin_events');
    const storedPolls = localStorage.getItem('admin_polls');
    
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents));
    } else {
      // Initialize with sample data if none exists
      setEvents([sampleEvent]);
    }

    if (storedPolls) {
      setPolls(JSON.parse(storedPolls));
    } else {
      // Initialize with sample polls
      setPolls(samplePolls);
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem('admin_events', JSON.stringify(events));
    }
  }, [events]);

  useEffect(() => {
    if (polls.length > 0) {
      localStorage.setItem('admin_polls', JSON.stringify(polls));
    }
  }, [polls]);

  const handleSaveEvent = async (eventData: Omit<Event, 'id' | 'currentParticipants'>) => {
    if (editingEvent) {
      // Update existing event
      setEvents(events.map(e => 
        e.id === editingEvent.id ? { ...eventData, id: editingEvent.id, currentParticipants: e.currentParticipants } as AdminEvent : e
      ));
    } else {
      // Add new event
      const newEvent: AdminEvent = {
        ...eventData,
        id: Date.now().toString(),
        currentParticipants: 0,
        registrations: [],
        status: 'upcoming',
      };
      setEvents([...events, newEvent]);
    }
    setIsEventFormOpen(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      setEvents(events.filter(e => e.id !== eventId));
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(null);
      }
    }
  };

  const handleUpdateRegistrationStatus = (eventId: string, registrationId: string, status: 'approved' | 'rejected') => {
    setEvents(events.map(event => {
      if (event.id === eventId) {
        const updatedRegistrations = event.registrations.map(reg => 
          reg.id === registrationId ? { ...reg, status } : reg
        );
        return {
          ...event,
          registrations: updatedRegistrations,
          currentParticipants: updatedRegistrations.filter(r => r.status === 'approved').length
        };
      }
      return event;
    }));
  };

  const exportToExcel = (event: AdminEvent) => {
    if (!event.registrations?.length) return;
    const worksheet = XLSX.utils.json_to_sheet(event.registrations);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `registrations_${event.title.replace(/\s+/g, '_')}.xlsx`);
  };

  // Poll Management
  const handleCreatePoll = () => {
    const newPollData: Poll = {
      ...newPoll,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      totalVotes: 0
    };
    setPolls([...polls, newPollData]);
    setNewPoll({ 
      question: '',
      options: [{ id: '1', text: '', votes: 0 }, { id: '2', text: '', votes: 0 }],
      isActive: true,
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
    setIsPollFormOpen(false);
  };

  const handleUpdatePoll = () => {
    if (!editingPoll) return;
    
    const updatedPolls = polls.map(poll => 
      poll.id === editingPoll.id 
        ? { ...newPoll, id: editingPoll.id, createdAt: editingPoll.createdAt, createdBy: editingPoll.createdBy, totalVotes: editingPoll.totalVotes }
        : poll
    );
    
    setPolls(updatedPolls);
    setEditingPoll(null);
    setIsPollFormOpen(false);
  };

  const handleDeletePoll = (pollId: string) => {
    if (window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      setPolls(polls.filter(poll => poll.id !== pollId));
    }
  };

  const togglePollStatus = (pollId: string) => {
    setPolls(polls.map(poll => 
      poll.id === pollId 
        ? { ...poll, isActive: !poll.isActive }
        : poll
    ));
  };

  const addPollOption = () => {
    setNewPoll({
      ...newPoll,
      options: [...newPoll.options, { id: Date.now().toString(), text: '', votes: 0 }]
    });
  };

  const removePollOption = (index: number) => {
    if (newPoll.options.length <= 2) return; // Keep at least 2 options
    const updatedOptions = [...newPoll.options];
    updatedOptions.splice(index, 1);
    setNewPoll({ ...newPoll, options: updatedOptions });
  };

  const updatePollOption = (index: number, value: string) => {
    const updatedOptions = [...newPoll.options];
    updatedOptions[index].text = value;
    setNewPoll({ ...newPoll, options: updatedOptions });
  };

  // Export Functions
  const exportToPDF = (event: AdminEvent) => {
    if (!event.registrations?.length) {
      alert('No registrations to export');
      return;
    }

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text(`Registrations for ${event.title}`, 14, 22);
    
    // Event details
    doc.setFontSize(12);
    doc.text(`Date: ${new Date(event.date).toLocaleDateString()}`, 14, 32);
    doc.text(`Location: ${event.location}`, 14, 40);
    doc.text(`Total Registrations: ${event.registrations.length}`, 14, 48);
    
    // Table data
    const tableColumn = ['Name', 'Email', 'Phone', 'Reg. No', 'Branch', 'Status'];
    const tableRows = event.registrations.map(reg => [
      reg.name,
      reg.email,
      reg.phone,
      reg.regdNo,
      reg.branch,
      reg.status.charAt(0).toUpperCase() + reg.status.slice(1)
    ]);
    
    // Add table
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      styles: { 
        fontSize: 10,
        cellPadding: 2,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 10 }
    });
    
    // Save the PDF
    doc.save(`registrations_${event.title.replace(/\s+/g, '_')}.pdf`);
  };

  const exportPollResults = (poll: Poll) => {
    // Export to Excel
    const worksheet = XLSX.utils.json_to_sheet(
      poll.options.map(option => ({
        'Option': option.text,
        'Votes': option.votes,
        'Percentage': poll.totalVotes > 0 ? `${Math.round((option.votes / poll.totalVotes) * 100)}%` : '0%'
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Poll Results');
    
    // Add summary data
    const summaryData = [
      ['Poll Question:', poll.question],
      ['Total Votes:', poll.totalVotes],
      ['Status:', poll.isActive ? 'Active' : 'Ended'],
      ['End Date:', new Date(poll.endDate).toLocaleDateString()]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' 
    });
    
    saveAs(data, `poll_results_${poll.question.substring(0, 30)}.xlsx`);
  };

  const exportPollResultsPDF = (poll: Poll) => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text(`Poll Results: ${poll.question}`, 14, 22);
    
    // Poll details
    doc.setFontSize(12);
    doc.text(`Total Votes: ${poll.totalVotes}`, 14, 32);
    doc.text(`Status: ${poll.isActive ? 'Active' : 'Ended'}`, 14, 40);
    doc.text(`End Date: ${new Date(poll.endDate).toLocaleDateString()}`, 14, 48);
    
    // Chart data
    const chartData = {
      labels: poll.options.map(opt => opt.text),
      data: poll.options.map(opt => (poll.totalVotes > 0 ? (opt.votes / poll.totalVotes) * 100 : 0))
    };
    
    // Simple bar chart
    const startX = 20;
    const startY = 70;
    const barHeight = 10;
    const barSpacing = 15;
    const maxBarWidth = 150;
    const maxValue = Math.max(...chartData.data, 1); // Avoid division by zero
    
    chartData.labels.forEach((label, index) => {
      const y = startY + (index * barSpacing);
      const percentage = chartData.data[index].toFixed(1);
      const barWidth = (chartData.data[index] / maxValue) * maxBarWidth;
      
      // Bar
      doc.setFillColor(52, 152, 219);
      doc.rect(startX, y - 5, barWidth, barHeight, 'F');
      
      // Label and percentage
      doc.setFontSize(10);
      doc.text(label, startX, y);
      doc.text(`${percentage}% (${poll.options[index].votes} votes)`, startX + barWidth + 5, y);
    });
    
    // Table with detailed results
    const tableColumn = ['Option', 'Votes', 'Percentage'];
    const tableRows = poll.options.map(option => [
      option.text,
      option.votes.toString(),
      poll.totalVotes > 0 ? `${Math.round((option.votes / poll.totalVotes) * 100)}%` : '0%'
    ]);
    
    // Add table
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: startY + (chartData.labels.length * barSpacing) + 10,
      styles: { 
        fontSize: 10,
        cellPadding: 2,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 10 }
    });
    
    // Save the PDF
    doc.save(`poll_results_${poll.question.substring(0, 30)}.pdf`);
  };

  // Effect to handle form reset when opening/closing
  useEffect(() => {
    if (isPollFormOpen && editingPoll) {
      setNewPoll({
        question: editingPoll.question,
        options: editingPoll.options.map(opt => ({ ...opt })),
        isActive: editingPoll.isActive,
        endDate: editingPoll.endDate
      });
    } else if (!isPollFormOpen) {
      setNewPoll({ 
        question: '',
        options: [{ id: '1', text: '', votes: 0 }, { id: '2', text: '', votes: 0 }],
        isActive: true,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      setEditingPoll(null);
    }
  }, [isPollFormOpen, editingPoll]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setEditingPoll(null);
                  setIsPollFormOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Poll
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('events')}
                className={`${activeTab === 'events'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Calendar className="mr-2 h-5 w-5" />
                Events
              </button>
              <button
                onClick={() => setActiveTab('polls')}
                className={`${activeTab === 'polls'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <BarChart2 className="mr-2 h-5 w-5" />
                Polls
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`${activeTab === 'achievements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Trophy className="mr-2 h-5 w-5" />
                Achievements
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {isEventFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {editingEvent ? 'Edit Event' : 'Create New Event'}
                  </h2>
                  <button
                    onClick={() => {
                      setIsEventFormOpen(false);
                      setEditingEvent(null);
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <EventForm
                  event={editingEvent || undefined}
                  onSave={handleSaveEvent}
                  onCancel={() => {
                    setIsEventFormOpen(false);
                    setEditingEvent(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Events</h2>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setIsEventFormOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Create Event
              </button>
            </div>

            {selectedEvent ? (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{selectedEvent.title} - Registrations</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => exportToExcel(selectedEvent)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Download className="-ml-0.5 mr-2 h-4 w-4" />
                      Export to Excel
                    </button>
                    <button
                      onClick={() => exportToPDF(selectedEvent)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FileText className="-ml-0.5 mr-2 h-4 w-4" />
                      Export to PDF
                    </button>
                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Back to Events
                    </button>
                  </div>
                </div>

                {selectedEvent.registrations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration No</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedEvent.registrations.map((registration) => (
                          <tr key={registration.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{registration.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{registration.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{registration.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{registration.regdNo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{registration.branch}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                registration.status === 'approved' 
                                  ? 'bg-green-100 text-green-800' 
                                  : registration.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {registration.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateRegistrationStatus(selectedEvent.id, registration.id, 'approved')}
                                    className="text-green-600 hover:text-green-900 mr-3"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleUpdateRegistrationStatus(selectedEvent.id, registration.id, 'rejected')}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No registrations yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Registrations will appear here once students sign up for this event.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <div key={event.id} className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {new Date(`${event.date}T${event.time}`).toLocaleString()}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.status === 'upcoming' 
                            ? 'bg-blue-100 text-blue-800' 
                            : event.status === 'ongoing'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      
                      <p className="mt-3 text-sm text-gray-500 line-clamp-3">{event.description}</p>
                      
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Registrations: {event.currentParticipants}/{event.maxParticipants || '∞'}</span>
                          <span>{event.registrations.length} total</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ 
                              width: `${event.maxParticipants 
                                ? Math.min(100, (event.currentParticipants / event.maxParticipants) * 100) 
                                : event.currentParticipants > 0 ? 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(event)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Registrations
                        </button>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEvent(event);
                              setIsEventFormOpen(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Edit className="-ml-0.5 mr-1.5 h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(event.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <Trash2 className="-ml-0.5 mr-1.5 h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'polls' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Polls</h2>
              <button
                onClick={() => {
                  setEditingPoll(null);
                  setIsPollFormOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Poll
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {polls.map((poll) => (
                <div key={poll.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">{poll.question}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        poll.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {poll.isActive ? 'Active' : 'Ended'}
                      </span>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      {poll.options.map((option) => (
                        <div key={option.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="truncate max-w-[180px]">{option.text}</span>
                            <span className="font-medium">
                              {poll.totalVotes > 0 ? `${Math.round((option.votes / poll.totalVotes) * 100)}%` : '0%'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 text-sm text-gray-500">
                      {poll.totalVotes} total vote{poll.totalVotes !== 1 ? 's' : ''} • 
                      Ends {new Date(poll.endDate).toLocaleDateString()}
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => exportPollResults(poll)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Excel
                      </button>
                      <button
                        onClick={() => exportPollResultsPDF(poll)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        PDF
                      </button>
                      <button
                        onClick={() => togglePollStatus(poll.id)}
                        className={`inline-flex items-center px-3 py-1.5 border ${
                          poll.isActive 
                            ? 'border-yellow-300 text-yellow-700 bg-yellow-100 hover:bg-yellow-200' 
                            : 'border-green-300 text-green-700 bg-green-100 hover:bg-green-200'
                        } shadow-sm text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      >
                        {poll.isActive ? (
                          <>
                            <XCircle className="mr-1.5 h-3.5 w-3.5" />
                            End Poll
                          </>
                        ) : (
                          <>
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                            Reactivate
                          </>
                        )}
                      </button>
                      <div className="flex-1"></div>
                      <button
                        onClick={() => {
                          setEditingPoll(poll);
                          setIsPollFormOpen(true);
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Edit className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePoll(poll.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="bg-white shadow rounded-lg p-6">
            <AchievementSubmissions />
          </div>
        )}

        {/* Poll Form Modal */}
        {isPollFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {editingPoll ? 'Edit Poll' : 'Create New Poll'}
                  </h2>
                  <button
                    onClick={() => setIsPollFormOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="question" className="block text-sm font-medium text-gray-700">
                      Question *
                    </label>
                    <input
                      type="text"
                      id="question"
                      value={newPoll.question}
                      onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter your question"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options *
                    </label>
                    <div className="space-y-2">
                      {newPoll.options.map((option, index) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => updatePollOption(index, e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder={`Option ${index + 1}`}
                          />
                          {newPoll.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removePollOption(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addPollOption}
                      className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add Option
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                        End Date *
                      </label>
                      <input
                        type="datetime-local"
                        id="endDate"
                        value={newPoll.endDate.slice(0, 16)}
                        onChange={(e) => setNewPoll({ ...newPoll, endDate: e.target.value })}
                        min={new Date().toISOString().slice(0, 16)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        checked={newPoll.isActive}
                        onChange={(e) => setNewPoll({ ...newPoll, isActive: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                        Active Poll
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsPollFormOpen(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={editingPoll ? handleUpdatePoll : handleCreatePoll}
                      disabled={!newPoll.question || newPoll.options.some(opt => !opt.text.trim()) || newPoll.options.length < 2}
                      className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                        !newPoll.question || newPoll.options.some(opt => !opt.text.trim()) || newPoll.options.length < 2
                          ? 'bg-blue-300 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      }`}
                    >
                      {editingPoll ? 'Update Poll' : 'Create Poll'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
