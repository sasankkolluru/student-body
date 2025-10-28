export interface PollOption {
  _id: string;
  text: string;
  votes: number;
  voters?: string[]; // Track who voted for this option
}

export interface Poll {
  _id: string;
  title: string;
  description?: string;
  options: PollOption[];
  totalVotes: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  hasVoted?: boolean;
  voters?: string[]; // Track all voters for this poll
  status: 'upcoming' | 'active' | 'ended'; // Poll status based on dates
}
