import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Users, 
  Trophy, 
  MapPin,
  Flag,
  Target,
  Activity,
  Award as AwardIcon,
  ChevronDown,
  CheckCircle2,
  FileCheck,
  FileText,
  X,
  Medal,
  Star,
  ShieldCheck,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { apiFetchForm } from '../lib/api';

const Achievements: React.FC = () => {
  interface FormData {
    // Student Details
    studentName: string;
    registrationNumber: string;
    branch: string;
    course: string;
    
    // Event Details
    eventName: string;
    eventType: string;
    eventClassification: string;
    venue: string;
    dateOfParticipation: string;
    
    // Achievement Details
    meritPosition: string;
    description: string;
    certificate: File | null;
    certificatePreview: string;
    
    // Sports Specific
    sportsCategory: string;
    sportsType: string;
    teamEventType: string;
    individualEventType: string;
    trackAndFieldEvent: string;
  }

  const [formData, setFormData] = useState<FormData>({
    // Student Details
    studentName: '',
    registrationNumber: '',
    branch: '',
    course: '',
    
    // Event Details
    eventName: '',
    eventType: '',
    eventClassification: '',
    venue: '',
    dateOfParticipation: '',
    
    // Achievement Details
    meritPosition: '',
    description: '',
    certificate: null,
    certificatePreview: '',
    
    // Sports Specific
    sportsCategory: '',
    sportsType: '',
    teamEventType: '',
    individualEventType: '',
    trackAndFieldEvent: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  interface FormErrors {
    studentName?: string;
    registrationNumber?: string;
    branch?: string;
    course?: string;
    eventName?: string;
    eventType?: string;
    eventClassification?: string;
    venue?: string;
    dateOfParticipation?: string;
    meritPosition?: string;
    description?: string;
    [key: string]: string | undefined;
  }

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    
    if (type === 'file') {
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            certificate: file,
            certificatePreview: reader.result as string
          }));
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user types
    if (name in errors) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const removeCertificate = (e: React.MouseEvent) => {
    e.preventDefault();
    setFormData(prev => ({
      ...prev,
      certificate: null,
      certificatePreview: ''
    }));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};
    
    if (step === 1) {
      if (!formData.studentName.trim()) newErrors.studentName = 'Student name is required';
      if (!formData.registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is required';
      if (!formData.branch) newErrors.branch = 'Branch is required';
      if (!formData.course) newErrors.course = 'Course is required';
    } else if (step === 2) {
      if (!formData.eventName.trim()) newErrors.eventName = 'Event name is required';
      if (!formData.eventType) newErrors.eventType = 'Event type is required';
      if (!formData.eventClassification) newErrors.eventClassification = 'Event classification is required';
      if (!formData.venue.trim()) newErrors.venue = 'Venue is required';
      if (!formData.dateOfParticipation) newErrors.dateOfParticipation = 'Date of participation is required';
    } else if (step === 3) {
      if (!formData.meritPosition) newErrors.meritPosition = 'Merit position is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      
      if (formData.eventType === 'sports') {
        if (!formData.sportsCategory) newErrors.sportsCategory = 'Sports category is required';
        if (formData.sportsCategory === 'team' && !formData.teamEventType) {
          newErrors.teamEventType = 'Team event type is required';
        } else if (formData.sportsCategory === 'individual' && !formData.individualEventType) {
          newErrors.individualEventType = 'Individual event type is required';
        } else if (formData.sportsCategory === 'trackAndField' && !formData.trackAndFieldEvent) {
          newErrors.trackAndFieldEvent = 'Track and field event is required';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = async () => {
    if (validateStep(currentStep)) {
      // If moving to step 3 (achievement details), ensure event type is selected
      if (currentStep === 2 && !formData.eventType) {
        setErrors(prev => ({ ...prev, eventType: 'Please select an event type' }));
        return;
      }
      
      // Save form data to localStorage before moving to next step
      localStorage.setItem('achievementForm', JSON.stringify(formData));
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    // Save form data to localStorage when going back
    localStorage.setItem('achievementForm', JSON.stringify(formData));
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      try {
        const fd = new FormData();
        // Student Details
        fd.append('studentName', formData.studentName);
        fd.append('registrationNumber', formData.registrationNumber);
        fd.append('branch', formData.branch);
        fd.append('course', formData.course);
        // Event Details
        fd.append('eventName', formData.eventName);
        fd.append('eventType', formData.eventType);
        fd.append('eventClassification', formData.eventClassification);
        fd.append('venue', formData.venue);
        fd.append('dateOfParticipation', formData.dateOfParticipation);
        // Achievement Details
        fd.append('meritPosition', formData.meritPosition);
        fd.append('description', formData.description);
        if (formData.certificate) {
          fd.append('certificate', formData.certificate);
        }
        // Sports Specific
        if (formData.sportsCategory) fd.append('sportsCategory', formData.sportsCategory);
        if (formData.teamEventType) fd.append('teamEventType', formData.teamEventType);
        if (formData.individualEventType) fd.append('individualEventType', formData.individualEventType);
        if (formData.trackAndFieldEvent) fd.append('trackAndFieldEvent', formData.trackAndFieldEvent);

        await apiFetchForm('/achievements', fd);

        // Clear form and show success
        localStorage.removeItem('achievementForm');
        setIsSubmitted(true);
        setCurrentStep(4);
        
      } catch (error) {
        console.error('Error submitting achievement:', error);
        // Handle error state
      }
    }
  };

  // Event type options with icons and colors
  const eventTypes = [
    { name: 'Technical', icon: '💻', className: 'bg-blue-100 text-blue-800' },
    { name: 'Cultural', icon: '🎭', className: 'bg-purple-100 text-purple-800' },
    { name: 'Sports', icon: '⚽', className: 'bg-green-100 text-green-800' },
    { name: 'Departmental', icon: '🏛️', className: 'bg-indigo-100 text-indigo-800' },
    { name: 'Academic', icon: '📚', className: 'bg-yellow-100 text-yellow-800' },
    { name: 'Other', icon: '✨', className: 'bg-gray-100 text-gray-800' }
  ];

  // Event classification options with icons
  const eventClassifications = [
    { name: 'Intra-University', icon: '🏫' },
    { name: 'South Zone', icon: '📍' },
    { name: 'Inter-University', icon: '🎓' },
    { name: 'Outside College', icon: '🌍' },
    { name: 'Inter-College', icon: '🎯' }
  ];

  // Sports categories with icons and descriptions
  const sportsCategories = [
    { 
      value: 'team', 
      label: 'Team Event', 
      icon: '🏐',
      description: 'Sports played in teams like Volleyball, Basketball, etc.'
    },
    { 
      value: 'individual', 
      label: 'Individual Event', 
      icon: '🏅',
      description: 'Individual sports like Chess, Table Tennis, etc.'
    },
    { 
      value: 'trackAndField', 
      label: 'Track & Field', 
      icon: '🏃',
      description: 'Athletics events like running, jumping, throwing, etc.'
    }
  ];

  // Team event types with icons
  const teamEventTypes = [
    'Volleyball 🏐',
    'Throwball 🤾',
    'Kabaddi 🤼',
    'Hockey 🏑',
    'Basketball 🏀',
    'Cricket 🏏',
    'Football ⚽',
    'Badminton (Team) 🏸',
    'Table Tennis (Team) 🏓',
    'Kho-Kho 🏃'
  ];

  // Individual event types with icons
  const individualEventTypes = [
    'Yoga 🧘',
    'Chess ♟️',
    'Carroms 🎱',
    'Table Tennis 🏓',
    'Taekwondo 🥋',
    'Badminton 🏸',
    'Swimming 🏊',
    'Boxing 🥊',
    'Wrestling 🤼',
    'Weightlifting 🏋️',
    'Shooting 🎯',
    'Archery 🏹'
  ];

  // Track and field events with categories
  const trackAndFieldEvents = [
    'Sprints',
    'Middle & Long Distance',
    'Jumps',
    'Throws',
    'Combined Events',
    '100 Meters',
    '200 Meters',
    '400 Meters',
    '800 Meters',
    '1500 Meters',
    '5000 Meters',
    '10000 Meters',
    '110m Hurdles',
    '400m Hurdles',
    '3000m Steeplechase',
    '4x100m Relay',
    '4x400m Relay',
    'Long Jump',
    'High Jump',
    'Triple Jump',
    'Pole Vault',
    'Shot Put',
    'Discus Throw',
    'Javelin Throw',
    'Hammer Throw',
    'Decathlon',
    'Heptathlon',
    'Pentathlon',
    'Marathon',
    'Race Walk',
    '3000m Race Walk',
    '5000m Race Walk',
    '10000m Race Walk'
  ];

  // Course options
  const courses = [
    'B.Tech',
    'BBA',
    'MBA',
    'MCA',
    'B.Sc',
    'M.Tech',
    'Other'
  ];

  // Branch options
  const branches = [
    'CSE',
    'ECE',
    'EEE',
    'MECH',
    'CIVIL',
    'IT',
    'AIML',
    'DS',
    'CSBS'
  ];

  // Merit position options with medals
  const meritPositions = [
    { value: '1st Place', emoji: '🥇' },
    { value: '2nd Place', emoji: '🥈' },
    { value: '3rd Place', emoji: '🥉' },
    { value: '4th Place', emoji: '🏅' },
    { value: '5th Place', emoji: '🎖️' },
    { value: 'Participated', emoji: '🎗️' },
    { value: 'Special Recognition', emoji: '🏆' },
    { value: 'Best Player', emoji: '👑' },
    { value: 'Emerging Player', emoji: '⭐' },
    { value: 'Fair Play', emoji: '🤝' }
  ];

  const renderMeritPosition = (position: { value: string; emoji: string }) => {
    return (
      <button
        key={position.value}
        type="button"
        onClick={() => {
          setFormData(prev => ({ ...prev, meritPosition: position.value }));
          if (errors.meritPosition) {
            setErrors(prev => ({ ...prev, meritPosition: '' }));
          }
        }}
        className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all w-full h-full ${
          formData.meritPosition === position.value
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}
      >
        <span className="text-3xl mb-2">{position.emoji}</span>
        <span className="text-sm font-medium">{position.value}</span>
      </button>
    );
  };

  // Load saved form data on component mount
  useEffect(() => {
    const savedForm = localStorage.getItem('achievementForm');
    if (savedForm) {
      try {
        const parsedForm = JSON.parse(savedForm);
        setFormData(parsedForm);
      } catch (error) {
        console.error('Error loading saved form:', error);
      }
    }
  }, []);

  // Form sections
  const renderStep = (): JSX.Element => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6 border border-blue-100">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                Student Details
              </h2>
              <p className="text-gray-600 mt-2">Please provide your academic information to get started.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="studentName"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.studentName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.studentName && (
                  <p className="mt-1 text-sm text-red-600">{errors.studentName}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="registrationNumber"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.registrationNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your registration number"
                />
                {errors.registrationNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.registrationNumber}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  id="course"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.course ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Course</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
                {errors.course && (
                  <p className="mt-1 text-sm text-red-600">{errors.course}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
                  Branch <span className="text-red-500">*</span>
                </label>
                <select
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.branch ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
                {errors.branch && (
                  <p className="mt-1 text-sm text-red-600">{errors.branch}</p>
                )}
              </div>
            </div>
          </motion.div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6 border border-blue-100">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <AwardIcon className="h-6 w-6 text-blue-600" />
                </div>
                Event Details
              </h2>
              <p className="text-gray-600 mt-2">Tell us about the event where you achieved success.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="eventName"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.eventName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter event name"
                />
                {errors.eventName && (
                  <p className="mt-1 text-sm text-red-600">{errors.eventName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {eventTypes.map((type) => (
                    <button
                      key={type.name}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, eventType: type.name }));
                        if (errors.eventType) {
                          setErrors(prev => ({ ...prev, eventType: '' }));
                        }
                      }}
                      className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.eventType === type.name
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="mr-2 text-lg">{type.icon}</span>
                      <span>{type.name}</span>
                    </button>
                  ))}
                </div>
                {errors.eventType && (
                  <p className="mt-1 text-sm text-red-600">{errors.eventType}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Classification <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {eventClassifications.map((classification) => (
                    <button
                      key={classification.name}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, eventClassification: classification.name }));
                        if (errors.eventClassification) {
                          setErrors(prev => ({ ...prev, eventClassification: '' }));
                        }
                      }}
                      className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.eventClassification === classification.name
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="mr-2 text-lg">{classification.icon}</span>
                      <span>{classification.name}</span>
                    </button>
                  ))}
                </div>
                {errors.eventClassification && (
                  <p className="mt-1 text-sm text-red-600">{errors.eventClassification}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">
                  Venue <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="venue"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.venue ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter event venue"
                />
                {errors.venue && (
                  <p className="mt-1 text-sm text-red-600">{errors.venue}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="dateOfParticipation" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Participation <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="dateOfParticipation"
                  name="dateOfParticipation"
                  value={formData.dateOfParticipation}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.dateOfParticipation ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.dateOfParticipation && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfParticipation}</p>
                )}
              </div>
              
              {formData.eventType === 'Sports' && (
                <div className="col-span-full">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Sports Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sports Category <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      {sportsCategories.map((category) => (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ 
                              ...prev, 
                              sportsCategory: category.value,
                              teamEventType: '',
                              individualEventType: '',
                              trackAndFieldEvent: ''
                            }));
                          }}
                          className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                            formData.sportsCategory === category.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <span className="text-2xl mb-2">{category.icon}</span>
                          <span className="font-medium">{category.label}</span>
                          <span className="text-xs text-gray-500 text-center mt-1">{category.description}</span>
                        </button>
                      ))}
                    </div>
                    
                    {formData.sportsCategory === 'team' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Team Event Type <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                          {teamEventTypes.map((eventType) => (
                            <button
                              key={eventType}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, teamEventType: eventType }));
                              }}
                              className={`px-3 py-2 text-sm rounded-md border ${
                                formData.teamEventType === eventType
                                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                                  : 'bg-white border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {eventType}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {formData.sportsCategory === 'individual' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Individual Event Type <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {individualEventTypes.map((eventType) => (
                            <button
                              key={eventType}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, individualEventType: eventType }));
                              }}
                              className={`px-3 py-2 text-sm rounded-md border ${
                                formData.individualEventType === eventType
                                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                                  : 'bg-white border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {eventType}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {formData.sportsCategory === 'trackAndField' && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Track & Field Event <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.trackAndFieldEvent}
                          onChange={(e) => setFormData(prev => ({ ...prev, trackAndFieldEvent: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select an event</option>
                          {trackAndFieldEvents.map((event) => (
                            <option key={event} value={event}>
                              {event}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6 border border-blue-100">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
                Achievement Details
              </h2>
              <p className="text-gray-600 mt-2">Share the details of your achievement.</p>
            </div>

            <div className="space-y-6">
              {/* Merit Position Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merit Position <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {meritPositions.map((position, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, meritPosition: position.value }));
                        if (errors.meritPosition) {
                          setErrors(prev => ({ ...prev, meritPosition: '' }));
                        }
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all h-full ${
                        formData.meritPosition === position.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="text-2xl">{position.emoji}</span>
                      <span className="text-xs font-medium mt-1 text-center">{position.value}</span>
                    </button>
                  ))}
                </div>
                {errors.meritPosition && (
                  <p className="mt-1 text-sm text-red-600">{errors.meritPosition}</p>
                )}
              </div>

              {/* Achievement Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Achievement Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe your achievement in detail, including any challenges you overcame and what you learned..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Certificate Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Certificate (Optional)
                </label>
                <div className="mt-1 flex items-center">
                  <label
                    htmlFor="certificate-upload"
                    className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span>Upload File</span>
                    <input
                      id="certificate-upload"
                      name="certificate-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData(prev => ({
                              ...prev,
                              certificate: file,
                              certificatePreview: reader.result as string
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      ref={fileInputRef}
                    />
                  </label>
                  
                  {formData.certificatePreview ? (
                    <div className="ml-4 flex items-center">
                      <div className="flex-shrink-0">
                        {formData.certificatePreview.startsWith('data:image/') ? (
                          <img
                            src={formData.certificatePreview}
                            alt="Certificate preview"
                            className="h-12 w-12 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center">
                            <FileCheck className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formData.certificate?.name || 'Certificate'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(formData.certificate?.size || 0) > 0 
                            ? `${(formData.certificate!.size / 1024).toFixed(1)} KB` 
                            : 'Size not available'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeCertificate}
                        className="ml-4 text-gray-400 hover:text-gray-500"
                      >
                        <span className="sr-only">Remove</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <p className="ml-4 text-sm text-gray-500">
                      No file selected
                    </p>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Upload a scanned copy or photo of your certificate (JPG, PNG, or PDF, max 5MB)
                </p>
              </div>

              {/* Terms and Conditions */}
              <div className="pt-2">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      required
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="font-medium text-gray-700">
                      I certify that all the information provided is accurate and true to the best of my knowledge.
                    </label>
                    <p className="text-gray-500">
                      Any false information may result in disqualification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Achievement Submitted Successfully!</h2>
            <p className="mt-2 text-gray-600">
              Thank you for sharing your achievement. Your submission is under review.
            </p>
            <div className="mt-8">
              <Button
                type="button"
                onClick={() => {
                  setFormData({
                    studentName: '',
                    registrationNumber: '',
                    branch: '',
                    course: '',
                    eventName: '',
                    eventType: '',
                    eventClassification: '',
                    venue: '',
                    dateOfParticipation: '',
                    meritPosition: '',
                    description: '',
                    sportsCategory: '',
                    sportsType: '',
                    teamEventType: '',
                    individualEventType: '',
                    trackAndFieldEvent: ''
                  });
                  setCurrentStep(1);
                  setIsSubmitted(false);
                }}
                className="px-6 py-3 text-base"
              >
                Submit Another Achievement
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden p-8 text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div className="bg-green-50 p-6 rounded-xl mb-8">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              >
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </motion.div>
            </div>
            <motion.h2 
              className="text-3xl font-bold text-gray-900 mb-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Achievement Submitted! 🎉
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-600"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Thank you for sharing your achievement with us!
            </motion.p>
            
            <motion.div 
              className="mt-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="bg-white p-4 rounded-lg border border-green-100 inline-flex items-center shadow-sm">
                <div className="bg-green-50 p-3 rounded-lg mr-4">
                  <FileCheck className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Submission ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
                  <p className="text-sm text-gray-500">Your achievement is under review</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="mt-8 flex flex-col sm:flex-row justify-center gap-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={() => {
                  setFormData({
                    studentName: '',
                    registrationNumber: '',
                    branch: '',
                    course: '',
                    eventName: '',
                    eventType: '',
                    eventClassification: '',
                    venue: '',
                    dateOfParticipation: '',
                    meritPosition: '',
                    description: '',
                    certificate: null,
                    certificatePreview: '',
                    sportsCategory: '',
                    sportsType: '',
                    teamEventType: '',
                    individualEventType: '',
                    trackAndFieldEvent: ''
                  });
                  setCurrentStep(1);
                  setIsSubmitted(false);
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                Submit Another Achievement
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="px-6 py-3 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
              >
                Back to Home
              </Button>
            </motion.div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Need help? <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">Contact support</a>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg mb-4">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent sm:text-5xl">
            Student Achievement Portal
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Showcase your accomplishments and be recognized by the university community
          </p>
        </motion.div>
        
        {/* Enhanced Progress Bar */}
        <motion.div 
          className="mb-12 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-200 -translate-y-1/2 -z-10 rounded-full">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${((currentStep - 1) / 2) * 100}%`,
                  transition: { duration: 0.5, ease: 'easeInOut' }
                }}
              />
            </div>
            
            {[1, 2, 3].map((step) => {
              const isActive = currentStep >= step;
              const isCurrent = currentStep === step;
              
              return (
                <div key={step} className="flex flex-col items-center relative z-10">
                  <motion.div
                    className={`flex items-center justify-center w-12 h-12 rounded-full ${
                      isActive
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg'
                        : 'bg-white text-gray-400 border-2 border-gray-200'
                    } font-semibold relative`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isActive ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="text-sm">{step}</span>
                    )}
                    {isCurrent && (
                      <motion.div 
                        className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          type: 'spring',
                          stiffness: 500,
                          damping: 30
                        }}
                      />
                    )}
                  </motion.div>
                  <span className={`mt-3 text-sm font-medium ${
                    isCurrent ? 'text-blue-600 font-semibold' : 'text-gray-500'
                  }`}>
                    {step === 1 ? 'Your Info' : step === 2 ? 'Event Details' : 'Achievement'}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              type: 'spring',
              stiffness: 300,
              damping: 30
            }}
            className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100"
          >
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 md:p-10">
              {renderStep()}
              
              {currentStep <= 3 && (
                <motion.div 
                  className="mt-12 pt-6 flex justify-between border-t border-gray-100"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    variant="outline"
                    className={`px-8 py-3 rounded-xl transition-all ${
                      currentStep === 1 ? 'opacity-0 pointer-events-none' : 'hover:shadow-md'
                    }`}
                  >
                    <ChevronDown className="h-5 w-5 mr-2 transform rotate-90" />
                    Back
                  </Button>
                  
                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                    >
                      Continue
                      <ChevronDown className="h-5 w-5 ml-2 transform -rotate-90" />
                    </Button>
                  ) : (
                    <motion.div 
                      className="relative group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="submit" 
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        <span className="relative z-10 flex items-center">
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                          Submit Achievement
                        </span>
                        <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </form>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Achievements;
