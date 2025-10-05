export interface User {
  id: string;
  name: string;
  email: string;
  studentId: string;
  role: 'student' | 'admin' | 'faculty';
  department?: string;
  year?: number;
  avatar?: string;
}

export interface CouncilMember {
  id: string;
  name: string;
  position: string;
  department: string;
  year: number;
  avatar: string;
  bio: string;
  contact: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: 'sports' | 'cultural' | 'academic' | 'departmental';
  organizer: string;
  registrationOpen: boolean;
  maxParticipants?: number;
  currentParticipants: number;
  image: string;
  department?: string;
  
  // New fields
  studentLead1: {
    name: string;
    contact: string;
  };
  studentLead2: {
    name: string;
    contact: string;
  };
  facultyLead1: {
    name: string;
    contact: string;
  };
  facultyLead2: {
    name: string;
    contact: string;
  };
  registrationDeadline: string;
  prizes: string[];
  eventPhoto?: string; // Base64 string or URL
  registrationLink?: string;
  rules?: string[];
  requirements?: string[];
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  endDate: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  submittedBy: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  votes: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  date: string;
  replies?: Comment[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  recipient: string;
  date: string;
  category: string;
  image?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}