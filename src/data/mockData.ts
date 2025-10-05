import { CouncilMember, Event, Poll, Idea, Achievement, FAQ, User } from '../types';

export const currentUser: User = {
  id: '1',
  name: 'Alex Johnson',
  email: 'alex.johnson@college.edu',
  studentId: 'ST2024001',
  role: 'student',
  department: 'Computer Science',
  year: 3,
  avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
};

export const councilMembers: CouncilMember[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    position: 'President',
    department: 'Business Administration',
    year: 4,
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
    bio: 'Leading student initiatives and fostering campus community engagement.',
    contact: 'president@studentcouncil.edu'
  },
  {
    id: '2',
    name: 'Marcus Rodriguez',
    position: 'Vice President',
    department: 'Engineering',
    year: 3,
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
    bio: 'Supporting presidential initiatives and managing student affairs.',
    contact: 'vp@studentcouncil.edu'
  },
  {
    id: '3',
    name: 'Emily Watson',
    position: 'Secretary',
    department: 'Liberal Arts',
    year: 2,
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
    bio: 'Maintaining records and facilitating communication between students and administration.',
    contact: 'secretary@studentcouncil.edu'
  },
  {
    id: '4',
    name: 'David Kim',
    position: 'Treasurer',
    department: 'Finance',
    year: 4,
    avatar: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
    bio: 'Managing council finances and budget allocation for student activities.',
    contact: 'treasurer@studentcouncil.edu'
  }
];

// Mock events data
export const events: Event[] = [
  // Cultural Events
  {
    id: 'cul-1',
    title: 'Annual Cultural Festival',
    description: 'A vibrant celebration of diverse cultures with performances, food, and exhibitions from around the world.',
    date: '2025-03-15',
    time: '10:00 AM',
    location: 'Main Auditorium',
    category: 'cultural',
    organizer: 'Cultural Committee',
    registrationOpen: true,
    maxParticipants: 500,
    currentParticipants: 247,
    image: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'all'
  },
  {
    id: 'cul-2',
    title: 'Music & Dance Competition',
    description: 'Showcase your talent in solo or group performances across various music and dance forms.',
    date: '2025-04-05',
    time: '3:00 PM',
    location: 'Open Air Theater',
    category: 'cultural',
    organizer: 'Fine Arts Club',
    registrationOpen: true,
    maxParticipants: 100,
    currentParticipants: 42,
    image: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'all'
  },
  {
    id: 'cul-3',
    title: 'Drama Night: Shakespeare in the Park',
    description: 'Experience classic Shakespearean plays performed by our talented drama club members.',
    date: '2025-03-22',
    time: '6:30 PM',
    location: 'Central Park Amphitheater',
    category: 'cultural',
    organizer: 'Dramatics Society',
    registrationOpen: true,
    maxParticipants: 200,
    currentParticipants: 187,
    image: 'https://images.pexels.com/photos/274192/pexels-photo-274192.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'all'
  },
  {
    id: 'cul-4',
    title: 'International Food Festival',
    description: 'A culinary journey around the world with dishes prepared by our international student community.',
    date: '2025-04-10',
    time: '12:00 PM',
    location: 'Student Center Plaza',
    category: 'cultural',
    organizer: 'International Students Association',
    registrationOpen: true,
    maxParticipants: 300,
    currentParticipants: 210,
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'all'
  },
  {
    id: 'cul-5',
    title: 'Art & Photography Exhibition',
    description: 'Showcasing creative works from our talented student artists and photographers.',
    date: '2025-03-28',
    time: '9:00 AM - 5:00 PM',
    location: 'Art Gallery',
    category: 'cultural',
    organizer: 'Fine Arts Department',
    registrationOpen: false,
    maxParticipants: 150,
    currentParticipants: 150,
    image: 'https://images.pexels.com/photos/102127/pexels-photo-102127.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'all'
  },

  // Sports Events
  {
    id: 'spt-1',
    title: 'Inter-Department Sports Meet',
    description: 'Annual sports competition featuring basketball, soccer, volleyball, and track events.',
    date: '2025-02-28',
    time: '8:00 AM',
    location: 'Sports Complex',
    category: 'sports',
    organizer: 'Sports Committee',
    registrationOpen: true,
    maxParticipants: 200,
    currentParticipants: 156,
    image: 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'all'
  },
  {
    id: 'spt-2',
    title: 'Cricket Premier League',
    description: 'Inter-departmental T20 cricket tournament with exciting matches and prizes.',
    date: '2025-04-05',
    time: '7:30 AM',
    location: 'University Cricket Ground',
    category: 'sports',
    organizer: 'Sports Department',
    registrationOpen: true,
    maxParticipants: 120,
    currentParticipants: 89,
    image: 'https://images.pexels.com/photos/6295895/pexels-photo-6295895.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'all'
  },
  {
    id: 'spt-3',
    title: 'Marathon for Charity',
    description: '5K/10K run to raise funds for underprivileged children\'s education.',
    date: '2025-03-10',
    time: '6:00 AM',
    location: 'University Main Gate',
    category: 'sports',
    organizer: 'NSS Unit',
    registrationOpen: true,
    maxParticipants: 500,
    currentParticipants: 324,
    image: 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'all'
  },
  {
    id: 'spt-4',
    title: 'Badminton Championship',
    description: 'Singles and doubles badminton tournament for all skill levels.',
    date: '2025-04-15',
    time: '9:00 AM',
    location: 'Indoor Stadium',
    category: 'sports',
    organizer: 'Sports Committee',
    registrationOpen: true,
    maxParticipants: 64,
    currentParticipants: 42,
    image: 'https://images.pexels.com/photos/1432039/pexels-photo-1432039.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'all'
  },
  {
    id: 'spt-5',
    title: 'Swimming Gala',
    description: 'Annual swimming competition featuring various strokes and relay events.',
    date: '2025-04-20',
    time: '8:00 AM',
    location: 'University Swimming Pool',
    category: 'sports',
    organizer: 'Aquatics Club',
    registrationOpen: true,
    maxParticipants: 80,
    currentParticipants: 56,
    image: 'https://images.pexels.com/photos/1263348/pexels-photo-1263348.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'all'
  },

  // CSE Department Events
  {
    id: 'cse-1',
    title: 'Hackathon 2025',
    description: '24-hour coding competition to solve real-world problems using technology.',
    date: '2025-03-18',
    time: '9:00 AM',
    location: 'CSE Department Labs',
    category: 'departmental',
    organizer: 'CSE Department',
    registrationOpen: true,
    maxParticipants: 100,
    currentParticipants: 78,
    image: 'https://images.pexels.com/photos/3861959/pexels-photo-3861959.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'CSE'
  },
  {
    id: 'cse-2',
    title: 'Ideathon: Future of AI',
    description: 'Pitch your innovative AI ideas to industry experts and win exciting prizes.',
    date: '2025-03-25',
    time: '2:00 PM',
    location: 'CSE Seminar Hall',
    category: 'departmental',
    organizer: 'CSE Department',
    registrationOpen: true,
    maxParticipants: 50,
    currentParticipants: 32,
    image: 'https://images.pexels.com/photos/3861966/pexels-photo-3861966.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'CSE'
  },
  {
    id: 'cse-3',
    title: 'Coding Competition',
    description: 'Test your programming skills in this algorithmic coding challenge.',
    date: '2025-04-05',
    time: '10:00 AM',
    location: 'Computer Center',
    category: 'departmental',
    organizer: 'Coding Club',
    registrationOpen: true,
    maxParticipants: 80,
    currentParticipants: 64,
    image: 'https://images.pexels.com/photos/3861972/pexels-photo-3861972.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'CSE'
  },
  {
    id: 'cse-4',
    title: 'Tech Talk: Blockchain Revolution',
    description: 'Expert talk on blockchain technology and its applications in various industries.',
    date: '2025-04-12',
    time: '3:00 PM',
    location: 'CSE Auditorium',
    category: 'departmental',
    organizer: 'CSE Department',
    registrationOpen: true,
    maxParticipants: 150,
    currentParticipants: 112,
    image: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'CSE'
  },
  {
    id: 'cse-5',
    title: 'Project Expo',
    description: 'Showcase your innovative projects to faculty and industry professionals.',
    date: '2025-04-20',
    time: '9:30 AM',
    location: 'CSE Department',
    category: 'departmental',
    organizer: 'CSE Department',
    registrationOpen: true,
    maxParticipants: 40,
    currentParticipants: 28,
    image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'CSE'
  },

  // ECE Department Events
  {
    id: 'ece-1',
    title: 'Robotics Workshop',
    description: 'Hands-on workshop on building and programming robots.',
    date: '2025-03-17',
    time: '10:00 AM',
    location: 'ECE Labs',
    category: 'departmental',
    organizer: 'ECE Department',
    registrationOpen: true,
    maxParticipants: 40,
    currentParticipants: 35,
    image: 'https://images.pexels.com/photos/3862632/pexels-photo-3862632.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'ECE'
  },
  {
    id: 'ece-2',
    title: 'Circuit Design Challenge',
    description: 'Test your circuit design skills in this exciting competition.',
    date: '2025-03-24',
    time: '9:00 AM',
    location: 'Electronics Lab',
    category: 'departmental',
    organizer: 'ECE Department',
    registrationOpen: true,
    maxParticipants: 30,
    currentParticipants: 24,
    image: 'https://images.pexels.com/photos/3862628/pexels-photo-3862628.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'ECE'
  },
  {
    id: 'ece-3',
    title: 'Embedded Systems Workshop',
    description: 'Learn to develop embedded systems with hands-on training.',
    date: '2025-04-07',
    time: '11:00 AM',
    location: 'Embedded Systems Lab',
    category: 'departmental',
    organizer: 'ECE Department',
    registrationOpen: true,
    maxParticipants: 25,
    currentParticipants: 18,
    image: 'https://images.pexels.com/photos/3862625/pexels-photo-3862625.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'ECE'
  },
  {
    id: 'ece-4',
    title: 'VLSI Design Competition',
    description: 'Showcase your VLSI design skills in this technical competition.',
    date: '2025-04-14',
    time: '10:00 AM',
    location: 'VLSI Lab',
    category: 'departmental',
    organizer: 'ECE Department',
    registrationOpen: true,
    maxParticipants: 35,
    currentParticipants: 29,
    image: 'https://images.pexels.com/photos/3862631/pexels-photo-3862631.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'ECE'
  },
  {
    id: 'ece-5',
    title: 'Tech Talk: IoT Innovations',
    description: 'Explore the latest trends in Internet of Things technology.',
    date: '2025-04-21',
    time: '2:30 PM',
    location: 'ECE Seminar Hall',
    category: 'departmental',
    organizer: 'ECE Department',
    registrationOpen: true,
    maxParticipants: 100,
    currentParticipants: 76,
    image: 'https://images.pexels.com/photos/3862629/pexels-photo-3862629.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'ECE'
  },

  // Mechanical Department Events
  {
    id: 'mech-1',
    title: 'Robo Race',
    description: 'Design and race your own autonomous robot through challenging tracks.',
    date: '2025-03-19',
    time: '10:00 AM',
    location: 'Mechanical Workshop',
    category: 'departmental',
    organizer: 'Mechanical Department',
    registrationOpen: true,
    maxParticipants: 30,
    currentParticipants: 25,
    image: 'https://images.pexels.com/photos/3862634/pexels-photo-3862634.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'Mechanical'
  },
  {
    id: 'mech-2',
    title: 'CAD Modeling Competition',
    description: 'Showcase your 3D modeling skills in this design competition.',
    date: '2025-03-26',
    time: '9:30 AM',
    location: 'CAD Lab',
    category: 'departmental',
    organizer: 'Mechanical Department',
    registrationOpen: true,
    maxParticipants: 40,
    currentParticipants: 32,
    image: 'https://images.pexels.com/photos/3862635/pexels-photo-3862635.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'Mechanical'
  },
  {
    id: 'mech-3',
    title: 'Automobile Workshop',
    description: 'Hands-on workshop on automobile engineering and maintenance.',
    date: '2025-04-09',
    time: '11:00 AM',
    location: 'Automobile Lab',
    category: 'departmental',
    organizer: 'Mechanical Department',
    registrationOpen: true,
    maxParticipants: 25,
    currentParticipants: 20,
    image: 'https://images.pexels.com/photos/3862637/pexels-photo-3862637.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'Mechanical'
  },
  {
    id: 'mech-4',
    title: 'Technical Paper Presentation',
    description: 'Present your research papers on mechanical engineering topics.',
    date: '2025-04-16',
    time: '10:00 AM',
    location: 'Department Seminar Hall',
    category: 'departmental',
    organizer: 'Mechanical Department',
    registrationOpen: true,
    maxParticipants: 50,
    currentParticipants: 38,
    image: 'https://images.pexels.com/photos/3862638/pexels-photo-3862638.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'Mechanical'
  },
  {
    id: 'mech-5',
    title: 'Industry Visit: Automobile Plant',
    description: 'Educational visit to a leading automobile manufacturing plant.',
    date: '2025-04-23',
    time: '8:00 AM',
    location: 'To be announced',
    category: 'departmental',
    organizer: 'Mechanical Department',
    registrationOpen: true,
    maxParticipants: 45,
    currentParticipants: 42,
    image: 'https://images.pexels.com/photos/3862639/pexels-photo-3862639.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&fit=crop',
    department: 'Mechanical'
  }
];

export const activePolls: Poll[] = [
  {
    id: '1',
    title: 'Campus Dining Preferences',
    description: 'Help us improve campus dining by voting for your preferred meal options.',
    options: [
      { id: '1', text: 'More vegetarian options', votes: 234 },
      { id: '2', text: 'Extended dining hours', votes: 187 },
      { id: '3', text: 'International cuisine', votes: 156 },
      { id: '4', text: 'Healthier meal choices', votes: 203 }
    ],
    endDate: '2025-02-28',
    totalVotes: 780,
    isActive: true,
    createdBy: 'Student Council'
  },
  {
    id: '2',
    title: 'Next Student Body President',
    description: 'Vote for your preferred candidate for the upcoming student body elections.',
    options: [
      { id: '1', text: 'Jordan Martinez', votes: 456 },
      { id: '2', text: 'Taylor Brooks', votes: 389 },
      { id: '3', text: 'Riley Chen', votes: 302 }
    ],
    endDate: '2025-03-10',
    totalVotes: 1147,
    isActive: true,
    createdBy: 'Election Committee'
  },
  {
    id: '3',
    title: 'Library Hours Extension',
    description: 'Should the library extend its operating hours during exam periods?',
    options: [
      { id: '1', text: 'Yes, 24/7 during exams', votes: 342 },
      { id: '2', text: 'Extended hours but not 24/7', votes: 278 },
      { id: '3', text: 'Current hours are sufficient', votes: 156 },
      { id: '4', text: 'Need different hours', votes: 89 }
    ],
    endDate: '2025-03-15',
    totalVotes: 865,
    isActive: true,
    createdBy: 'Library Committee'
  },
  {
    id: '4',
    title: 'Campus Transportation',
    description: 'How can we improve campus transportation services?',
    options: [
      { id: '1', text: 'More shuttle frequency', votes: 421 },
      { id: '2', text: 'Extended operating hours', votes: 298 },
      { id: '3', text: 'Bike-sharing program', votes: 187 },
      { id: '4', text: 'Better route coverage', votes: 254 }
    ],
    endDate: '2025-03-20',
    totalVotes: 1160,
    isActive: true,
    createdBy: 'Transportation Dept'
  },
  {
    id: '5',
    title: 'Preferred Event Types',
    description: 'What type of events would you like to see more on campus?',
    options: [
      { id: '1', text: 'Career Fairs', votes: 312 },
      { id: '2', text: 'Tech Workshops', votes: 278 },
      { id: '3', text: 'Cultural Festivals', votes: 198 },
      { id: '4', text: 'Sports Tournaments', votes: 167 },
      { id: '5', text: 'Music Concerts', votes: 223 }
    ],
    endDate: '2025-03-25',
    totalVotes: 1178,
    isActive: true,
    createdBy: 'Events Committee'
  },
  {
    id: '6',
    title: 'Campus WiFi Improvement',
    description: 'What WiFi improvements would you like to see?',
    options: [
      { id: '1', text: 'Faster speeds', votes: 478 },
      { id: '2', text: 'Better coverage', votes: 342 },
      { id: '3', text: 'More reliable connection', votes: 412 },
      { id: '4', text: 'Higher device limit', votes: 198 }
    ],
    endDate: '2025-04-01',
    totalVotes: 1430,
    isActive: true,
    createdBy: 'IT Services'
  },
  {
    id: '7',
    title: 'Campus Sustainability',
    description: 'Which sustainability initiative should we prioritize?',
    options: [
      { id: '1', text: 'Solar panel installation', votes: 287 },
      { id: '2', text: 'Plastic reduction program', votes: 345 },
      { id: '3', text: 'Campus garden expansion', votes: 198 },
      { id: '4', text: 'Water conservation', votes: 176 },
      { id: '5', text: 'Recycling program', votes: 254 }
    ],
    endDate: '2025-04-05',
    totalVotes: 1260,
    isActive: true,
    createdBy: 'Green Campus Initiative'
  },
  {
    id: '8',
    title: 'Study Spaces',
    description: 'What improvements would you like to see in study spaces?',
    options: [
      { id: '1', text: 'More quiet zones', votes: 412 },
      { id: '2', text: 'Better lighting', votes: 287 },
      { id: '3', text: 'More power outlets', votes: 365 },
      { id: '4', text: 'Comfortable seating', votes: 298 },
      { id: '5', text: 'Group study rooms', votes: 321 }
    ],
    endDate: '2025-04-10',
    totalVotes: 1683,
    isActive: true,
    createdBy: 'Facilities Management'
  },
  {
    id: '9',
    title: 'Campus Safety',
    description: 'What safety improvements would you like to see on campus?',
    options: [
      { id: '1', text: 'More emergency phones', votes: 321 },
      { id: '2', text: 'Better lighting at night', votes: 412 },
      { id: '3', text: 'Security patrols', votes: 287 },
      { id: '4', text: 'Safety workshops', votes: 198 },
      { id: '5', text: 'Mobile safety app', votes: 254 }
    ],
    endDate: '2025-04-15',
    totalVotes: 1472,
    isActive: true,
    createdBy: 'Campus Security'
  },
  {
    id: '10',
    title: 'Student Discounts',
    description: 'Where would you like to see student discounts?',
    options: [
      { id: '1', text: 'Local restaurants', votes: 456 },
      { id: '2', text: 'Public transportation', votes: 389 },
      { id: '3', text: 'Tech stores', votes: 312 },
      { id: '4', text: 'Bookstores', votes: 278 },
      { id: '5', text: 'Fitness centers', votes: 198 }
    ],
    endDate: '2025-04-20',
    totalVotes: 1633,
    isActive: true,
    createdBy: 'Student Union'
  },
  {
    id: '11',
    title: 'Campus Food Trucks',
    description: 'What type of food trucks would you like to see on campus?',
    options: [
      { id: '1', text: 'Taco/Burrito', votes: 321 },
      { id: '2', text: 'Burgers', votes: 287 },
      { id: '3', text: 'Asian Fusion', votes: 345 },
      { id: '4', text: 'Mediterranean', votes: 254 },
      { id: '5', text: 'Dessert', votes: 198 }
    ],
    endDate: '2025-04-25',
    totalVotes: 1405,
    isActive: true,
    createdBy: 'Food Services'
  },
  {
    id: '12',
    title: 'Fitness Center Equipment',
    description: 'What new equipment should we add to the campus fitness center?',
    options: [
      { id: '1', text: 'More cardio machines', votes: 287 },
      { id: '2', text: 'Free weights', votes: 321 },
      { id: '3', text: 'Resistance machines', votes: 254 },
      { id: '4', text: 'Functional training area', votes: 198 },
      { id: '5', text: 'Group exercise equipment', votes: 176 }
    ],
    endDate: '2025-04-30',
    totalVotes: 1236,
    isActive: true,
    createdBy: 'Athletics Department'
  },
  {
    id: '13',
    title: 'Campus Parking',
    description: 'What parking improvements would you like to see?',
    options: [
      { id: '1', text: 'More parking spaces', votes: 412 },
      { id: '2', text: 'Better lighting', votes: 287 },
      { id: '3', text: 'Electric vehicle charging', votes: 198 },
      { id: '4', text: 'Bike parking', votes: 176 },
      { id: '5', text: 'Shuttle service', votes: 254 }
    ],
    endDate: '2025-05-05',
    totalVotes: 1327,
    isActive: true,
    createdBy: 'Transportation Dept'
  },
  {
    id: '14',
    title: 'Campus Art Installations',
    description: 'What type of public art would you like to see on campus?',
    options: [
      { id: '1', text: 'Sculptures', votes: 198 },
      { id: '2', text: 'Murals', votes: 254 },
      { id: '3', text: 'Interactive art', votes: 321 },
      { id: '4', text: 'Student art displays', votes: 287 },
      { id: '5', text: 'Digital art', votes: 176 }
    ],
    endDate: '2025-05-10',
    totalVotes: 1236,
    isActive: true,
    createdBy: 'Arts Committee'
  },
  {
    id: '15',
    title: 'Campus Merchandise',
    description: 'What new campus merchandise would you like to see in the bookstore?',
    options: [
      { id: '1', text: 'Hoodies', votes: 412 },
      { id: '2', text: 'T-shirts', votes: 365 },
      { id: '3', text: 'Water bottles', votes: 287 },
      { id: '4', text: 'Laptop sleeves', votes: 198 },
      { id: '5', text: 'Phone cases', votes: 254 }
    ],
    endDate: '2025-05-15',
    totalVotes: 1516,
    isActive: true,
    createdBy: 'Bookstore'
  }
];

export const ideas: Idea[] = [
  {
    id: '1',
    title: 'Green Campus Initiative',
    description: 'Implement solar panels and recycling programs to make our campus more environmentally sustainable.',
    category: 'Environment',
    submittedBy: 'Alex Johnson',
    submittedDate: '2025-01-15',
    status: 'approved',
    votes: 127,
    comments: [
      {
        id: '1',
        text: 'This is exactly what our campus needs! Great idea.',
        author: 'Sarah Chen',
        date: '2025-01-16'
      },
      {
        id: '2',
        text: 'I support this. We should also consider composting.',
        author: 'Marcus Rodriguez',
        date: '2025-01-17'
      }
    ]
  },
  {
    id: '2',
    title: 'Study Spaces Extension',
    description: '24/7 study spaces in the library with better WiFi and charging stations for students.',
    category: 'Academics',
    submittedBy: 'Emily Watson',
    submittedDate: '2025-01-20',
    status: 'pending',
    votes: 89,
    comments: []
  }
];

export const achievements: Achievement[] = [
  {
    id: '1',
    title: 'Outstanding Leadership Award',
    description: 'Recognized for exceptional leadership in organizing campus-wide sustainability initiatives.',
    recipient: 'Sarah Chen',
    date: '2024-12-15',
    category: 'Leadership',
    image: 'https://images.pexels.com/photos/1205651/pexels-photo-1205651.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'
  },
  {
    id: '2',
    title: 'Innovation Excellence',
    description: 'Awarded for developing a mobile app that improved campus dining experience.',
    recipient: 'David Kim',
    date: '2024-11-20',
    category: 'Innovation'
  }
];

export const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How do I join the student council?',
    answer: 'Student council elections are held annually in the spring semester. Interested candidates must submit their nomination forms and campaign statements by the specified deadline.',
    category: 'Elections'
  },
  {
    id: '2',
    question: 'How can I submit ideas or suggestions?',
    answer: 'You can submit ideas through our online portal in the "Ideas" section. All submissions are reviewed by the council and updates on their status are provided regularly.',
    category: 'Participation'
  },
  {
    id: '3',
    question: 'How do I register for events?',
    answer: 'Event registration is available through the Events page. Simply click on the event you\'re interested in and follow the registration process.',
    category: 'Events'
  }
];

export const studentBodies = [
  {
    id: 'sac',
    name: 'Student Affairs Council',
    abbreviation: 'SAC',
    description: 'Representing student interests and facilitating communication between students and administration.',
    color: 'from-blue-600 to-blue-800',
    icon: '🏛️'
  },
  {
    id: 'ueac',
    name: 'University Events & Activities Council',
    abbreviation: 'UEAC',
    description: 'Organizing and coordinating campus-wide events and activities.',
    color: 'from-purple-600 to-purple-800',
    icon: '🎭'
  },
  {
    id: 'alma',
    name: 'ALMA Linkages',
    abbreviation: 'ALMA',
    description: 'Connecting current students with alumni for mentorship and networking.',
    color: 'from-green-600 to-green-800',
    icon: '🤝'
  },
  {
    id: 'vsc',
    name: 'Volunteer Service Council',
    abbreviation: 'VSC',
    description: 'Promoting community service and social responsibility among students.',
    color: 'from-orange-600 to-orange-800',
    icon: '❤️'
  },
  {
    id: 'ecell',
    name: 'Entrepreneurship Cell',
    abbreviation: 'E-Cell',
    description: 'Fostering entrepreneurial spirit and innovation among students.',
    color: 'from-red-600 to-red-800',
    icon: '💡'
  },
  {
    id: 'ncc',
    name: 'National Cadet Corps',
    abbreviation: 'NCC',
    description: 'Developing leadership qualities and national service commitment.',
    color: 'from-indigo-600 to-indigo-800',
    icon: '⭐'
  },
  {
    id: 'arc',
    name: 'Academic Resource Council',
    abbreviation: 'ARC',
    description: 'Supporting academic excellence and learning resources for students.',
    color: 'from-teal-600 to-teal-800',
    icon: '📚'
  }
];