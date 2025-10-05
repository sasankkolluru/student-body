import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Users as UsersIcon, 
  Cpu, 
  Wrench, 
  Search, 
  Filter, 
  X,
  MapPin,
  User,
  Mail,
  Phone,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { events as importedEvents } from '../data/mockData';
import { Event } from '../types';

// Event types will be imported from types.ts

interface RegistrationFormData {
  name: string;
  email: string;
  phone: string;
  studentId: string;
  department: string;
  year: string;
  agreeTerms: boolean;
}

interface EventDetailProps {
  event: Event | null;
  onClose: () => void;
  onRegister: (formData: RegistrationFormData) => void;
  isRegistering: boolean;
}

// Event Detail Component
const EventDetailModal: React.FC<EventDetailProps> = ({ 
  event, 
  onClose, 
  onRegister,
  isRegistering 
}) => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    name: '',
    email: '',
    phone: '',
    studentId: '',
    department: '',
    year: '',
    agreeTerms: false
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<RegistrationFormData>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegistrationFormData> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.year) newErrors.year = 'Year is required';
    if (!formData.agreeTerms) newErrors.agreeTerms = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onRegister(formData);
      setIsSubmitted(true);
    }
  };

  if (!event) return null;

  // Generate placeholder text for the event description
  const longDescription = `${event.description} ${Array(50).fill(0).map(() => 
    event.description
  ).join(' ')}`.substring(0, 1000);

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for registering for <span className="font-semibold">{event.title}</span>. 
              We've sent a confirmation email to <span className="font-semibold">{formData.email}</span>.
            </p>
            <div className="mt-6">
              <Button 
                onClick={onClose}
                variant="primary"
                className="w-full sm:w-auto"
              >
                Back to Events
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 overflow-y-auto z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 flex items-center"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Events
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Event Details</h2>
          <div className="w-6"></div> {/* For alignment */}
        </div>
        
        <div className="md:flex">
          {/* Event Details */}
          <div className="p-6 md:w-2/3">
            <div className="flex items-center mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                {event.category}
              </span>
              {event.department && event.department !== 'all' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                  {departmentIcons[event.department]}
                  <span className="ml-1">{event.department}</span>
                </span>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
            
            <div className="flex items-center text-gray-600 mb-6">
              <div className="flex items-center mr-6">
                <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                <span>{new Date(event.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-400" />
                <span>{event.time}</span>
              </div>
            </div>
            
            {event.location && (
              <div className="flex items-center text-gray-600 mb-6">
                <MapPin className="h-5 w-5 mr-2 text-gray-400 flex-shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
            
            <div className="prose max-w-none mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Event</h3>
              <p className="text-gray-700 mb-4">{longDescription}</p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Event Details</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex">
                  <span className="font-medium w-32">Date:</span>
                  <span>{new Date(event.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </li>
                <li className="flex">
                  <span className="font-medium w-32">Time:</span>
                  <span>{event.time}</span>
                </li>
                {event.location && (
                  <li className="flex">
                    <span className="font-medium w-32">Location:</span>
                    <span>{event.location}</span>
                  </li>
                )}
                <li className="flex">
                  <span className="font-medium w-32">Category:</span>
                  <span className="capitalize">{event.category}</span>
                </li>
                {event.department && event.department !== 'all' && (
                  <li className="flex">
                    <span className="font-medium w-32">Department:</span>
                    <span>{event.department}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
          
          {/* Registration Form */}
          <div className="bg-gray-50 p-6 md:w-1/3 border-t md:border-t-0 md:border-l">
            <div className="sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Register for this Event</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`pl-10 block w-full rounded-md shadow-sm sm:text-sm ${errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`pl-10 block w-full rounded-md shadow-sm sm:text-sm ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`pl-10 block w-full rounded-md shadow-sm sm:text-sm ${errors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>
                
                <div>
                  <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="studentId"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    className={`block w-full rounded-md shadow-sm sm:text-sm ${errors.studentId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    placeholder="Enter your student ID"
                  />
                  {errors.studentId && <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className={`block w-full rounded-md shadow-sm sm:text-sm ${errors.department ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    >
                      <option value="">Select Department</option>
                      <option value="CSE">Computer Science</option>
                      <option value="ECE">Electronics</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Civil">Civil</option>
                      <option value="Electrical">Electrical</option>
                    </select>
                    {errors.department && <p className="mt-1 text-sm text-red-600">Please select a department</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className={`block w-full rounded-md shadow-sm sm:text-sm ${errors.year ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                    {errors.year && <p className="mt-1 text-sm text-red-600">Please select a year</p>}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreeTerms"
                      name="agreeTerms"
                      type="checkbox"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      className={`h-4 w-4 rounded ${errors.agreeTerms ? 'border-red-300 text-red-600 focus:ring-red-500' : 'border-gray-300 text-blue-600 focus:ring-blue-500'}`}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="agreeTerms" className="font-medium text-gray-700">
                      I agree to the <a href="#" className="text-blue-600 hover:text-blue-500">terms and conditions</a>
                    </label>
                    {errors.agreeTerms && <p className="mt-1 text-sm text-red-600">You must agree to the terms</p>}
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full justify-center"
                    disabled={isRegistering}
                  >
                    {isRegistering ? 'Registering...' : 'Register Now'}
                  </Button>
                </div>
              </form>
              
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Your information is secure and will only be used for event registration purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Department icons mapping
const departmentIcons: Record<string, React.ReactNode> = {
  'CSE': <Cpu className="h-4 w-4" />,
  'ECE': <Cpu className="h-4 w-4" />,
  'Mechanical': <Wrench className="h-4 w-4" />,
  'all': <UsersIcon className="h-4 w-4" />
};

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  state = { hasError: false, error: undefined as Error | undefined };

  static getDerivedStateFromError(error: Error) {
    console.error('Error caught by boundary:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-red-50 p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
            <p className="text-red-700 mb-4">{this.state.error?.message || 'An unknown error occurred'}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="primary" 
              className="w-full mt-4"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


// Main Events Component
const Events: React.FC = () => {
  console.log('=== Events component mounted ===');
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Load events
  useEffect(() => {
    const loadEvents = () => {
      try {
        console.log('Loading events...');
        
        if (!importedEvents) {
          throw new Error('No events data found');
        }
        
        if (!Array.isArray(importedEvents)) {
          throw new Error('Events data is not an array');
        }
        
        // Basic validation and set events
        const validatedEvents = importedEvents.filter((event): event is Event => {
          return Boolean(
            event && 
            event.id && 
            event.title
          );
        });
        
        console.log(`Loaded ${validatedEvents.length} events`);
        setEvents(validatedEvents);
        setError(null);
      } catch (err) {
        console.error('Error loading events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events');
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEvents();
  }, []);
  
  // Filter events
  const filteredEvents = useMemo(() => {
    if (isLoading) return [];
    return events.filter((event) => {
      const matchesSearch = searchTerm === '' || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        event.category === selectedCategory;
      
      const matchesDepartment = selectedDepartment === 'all' || 
        (event.department && event.department === selectedDepartment);
      
      return matchesSearch && matchesCategory && matchesDepartment;
    });
  }, [events, searchTerm, selectedCategory, selectedDepartment, isLoading]);

  // Get unique categories and departments for filters
  const categories = useMemo(() => {
    if (isLoading) return ['all'];
    const cats = new Set(events.map(event => event.category));
    return ['all', ...Array.from(cats)];
  }, [events, isLoading]);

  const departments = useMemo(() => {
    if (isLoading) return ['all'];
    const depts = new Set(events.flatMap(event => event.department ? [event.department] : []));
    return ['all', ...Array.from(depts)];
  }, [events, isLoading]);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 p-6 rounded-lg max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Events</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleCloseDetails = () => {
    setSelectedEvent(null);
  };

  const handleRegister = async (formData: RegistrationFormData) => {
    try {
      setIsRegistering(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Registration data:', {
        eventId: selectedEvent?.id,
        eventTitle: selectedEvent?.title,
        ...formData
      });
      // In a real app, you would make an API call here
      // await api.registerForEvent(selectedEvent.id, formData);
    } catch (error) {
      console.error('Registration failed:', error);
      // Handle error (show error message, etc.)
    } finally {
      setIsRegistering(false);
    }
  };

  // Render events list
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={handleCloseDetails}
            onRegister={handleRegister}
            isRegistering={isRegistering}
          />
        )}
      </AnimatePresence>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upcoming Events</h1>
          
          {/* Search and Filter Controls */}
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search events..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {(selectedCategory !== 'all' || selectedDepartment !== 'all') && (
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-800 text-xs">
                  {(selectedCategory !== 'all' ? 1 : 0) + (selectedDepartment !== 'all' ? 1 : 0)}
                </span>
              )}
            </Button>
          </div>
        </div>
        
        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  id="department"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    dept !== 'all' && (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    )
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedDepartment('all');
                }}
                className="text-sm"
              >
                <X className="h-4 w-4 mr-1" />
                Reset Filters
              </Button>
            </div>
          </div>
        )}
        
        {/* Active Filters */}
        {(selectedCategory !== 'all' || selectedDepartment !== 'all' || searchTerm) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {selectedCategory}
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className="ml-1.5 flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            
            {selectedDepartment !== 'all' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {selectedDepartment}
                <button 
                  onClick={() => setSelectedDepartment('all')}
                  className="ml-1.5 flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-500 focus:outline-none focus:bg-green-500 focus:text-white"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
            
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Search: {searchTerm}
                <button 
                  onClick={() => setSearchTerm('')}
                  className="ml-1.5 flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-500 focus:outline-none focus:bg-purple-500 focus:text-white"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            )}
          </div>
        )}
        
        {filteredEvents.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                {event.image && (
                  <img 
                    src={event.image} 
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                  
                  <div className="mt-auto">
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                      <span className="mx-2">•</span>
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{event.time}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {event.category}
                      </span>
                      <div className="flex items-center gap-2">
                        {event.department && event.department !== 'all' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                            {departmentIcons[event.department]}
                            <span className="ml-1">{event.department}</span>
                          </span>
                        )}
                        <button 
                          onClick={() => handleViewDetails(event)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 whitespace-nowrap transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Wrap the component with error boundary and animation
const EventsPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <Events />
    </ErrorBoundary>
  );
};

export default EventsPage;
