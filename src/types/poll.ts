export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  description: string;
  options: PollOption[];
  totalVotes: number;
  createdAt: string;
  createdBy: string;
  isActive: boolean;
  endDate?: string;
}
