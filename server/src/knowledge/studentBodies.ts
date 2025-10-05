// Knowledge base for student bodies and related information
export interface StudentBody {
  id: string;
  name: string;
  description: string;
  verticles: {
    name: string;
    description: string;
  }[];
  achievements: string[];
  contact?: {
    email?: string;
    socialMedia?: {
      platform: string;
      url: string;
    }[];
  };
}

export const studentBodies: StudentBody[] = [
  {
    id: 'vsc',
    name: 'Vignan Sports Contingent',
    description: 'The Vignan Sports Contingent is the heartbeat of athletic spirit on campus. It promotes physical fitness, teamwork, and sportsmanship among students through regular training, inter-departmental competitions, and participation in inter-college tournaments. Whether it\'s cricket, volleyball, athletics, or chess, the contingent nurtures talent and encourages students to pursue excellence in both individual and team sports. Coaches and mentors guide students in skill development, while the contingent also fosters leadership and discipline through competitive exposure. Representing Vignan at external events, the team brings pride to the institution and inspires a culture of healthy living and active engagement.',
    verticles: [
      { name: 'Athletics', description: 'Track and field teams, training, and competitions.' },
      { name: 'Team Sports', description: 'Cricket, Football, Basketball, Volleyball squads.' },
      { name: 'Indoor Games', description: 'Badminton, Table Tennis, Chess, etc.' }
    ],
    achievements: [
      'Regular podium finishes at inter-university championships',
      'Organizes annual Sports Meet at Vignan',
      'Student athletes with state and national representation'
    ]
  },
  {
    id: 'sac',
    name: 'Student Activities Council (SAC)',
    description: 'The Student Activities Council (SAC) is the central hub for student-led initiatives at Vignan. It oversees eight dynamic verticals — including cultural, technical, literary, and social wings — that shape campus life and leadership. SAC empowers students to organize events, festivals, workshops, and outreach programs, fostering creativity, collaboration, and responsibility. It acts as a bridge between the administration and student community, ensuring that voices are heard and ideas are implemented. Through SAC, students gain hands-on experience in planning, budgeting, and team management, making it a launchpad for future leaders and changemakers.',
    verticles: [
      { name: 'Culturals', description: 'Dance, Music & Theatre Arts' },
      { name: 'Literary', description: 'Readers, Writers & Orators' },
      { name: 'Fine Arts', description: 'Arts, Crafts & Ambience' },
      { name: 'Public Relations & Digital Marketing', description: 'Branding and communication' },
      { name: 'Technical Design', description: 'Innovation and technical production' },
      { name: 'Logistics', description: 'Planning, resources, coordination' },
      { name: 'Stage Management', description: 'Show flow, sound and lights' },
      { name: 'Photography', description: 'Photography/Videography and archives' }
    ],
    achievements: [
      'Leads Annual Cultural Fest, Tech Fest, and major campus events',
      'Trains hundreds of students in event leadership each year'
    ]
  },
  {
    id: 'anti_ragging',
    name: 'Anti-Ragging Committee',
    description: 'The Anti-Ragging Committee at Vignan is committed to creating a safe, inclusive, and welcoming environment for all students. It enforces strict anti-ragging policies in line with UGC guidelines and conducts regular awareness campaigns, workshops, and orientation sessions. The committee comprises faculty members, student representatives, and administrative staff who work together to monitor campus behavior and respond swiftly to any complaints. By promoting mutual respect and zero tolerance for harassment, the committee ensures that every student feels secure and supported from day one. It plays a vital role in upholding the values of dignity, equality, and community.',
    verticles: [
      { name: 'Awareness', description: 'Campaigns and orientation for freshers' },
      { name: 'Counseling', description: 'Support and guidance channels' }
    ],
    achievements: [
      'Maintained safe and inclusive campus culture',
      'Multiple counseling and awareness drives annually'
    ]
  },
  {
    id: 'ncc',
    name: 'National Cadet Corps (NCC)',
    description: 'Vignan’s NCC unit instills discipline, patriotism, and leadership among students through structured military-style training and civic engagement. Cadets participate in drills, camps, adventure activities, and social service programs that build physical endurance and mental resilience. NCC also offers exposure to national-level events and opportunities for selection into defense services. Beyond uniform and parade, the program cultivates a sense of duty, teamwork, and national pride. Cadets often take part in disaster relief, blood donation drives, and awareness campaigns, making NCC not just a training ground but a platform for responsible citizenship.',
    verticles: [
      { name: 'Drills & Training', description: 'Military drills and camps' },
      { name: 'Community Service', description: 'Relief work and civic duties' }
    ],
    achievements: [
      'Cadets participating in national camps',
      'Recognitions for service and leadership'
    ]
  },
  {
    id: 'nss',
    name: 'National Service Scheme (NSS)',
    description: 'The NSS wing at Vignan encourages students to engage in meaningful community service and rural outreach. Through activities like village adoption, cleanliness drives, health camps, and literacy programs, NSS volunteers learn the value of empathy, social responsibility, and grassroots impact. The scheme promotes the motto “Not Me, But You,” inspiring students to contribute selflessly to society. NSS also collaborates with NGOs and government bodies for larger initiatives, giving students real-world exposure to civic challenges. It’s a transformative experience that blends service with learning, shaping socially conscious and proactive graduates.',
    verticles: [
      { name: 'Rural Outreach', description: 'Village adoption and development' },
      { name: 'Health & Hygiene', description: 'Awareness and camps' },
      { name: 'Environment', description: 'Conservation and cleanliness drives' }
    ],
    achievements: [
      'Significant impact in rural development projects',
      'Regular health, hygiene, and environment campaigns'
    ]
  },
  {
    id: 'alumni',
    name: 'Alumni Connects',
    description: 'Alumni Connects is Vignan’s initiative to build lasting bridges between current students and graduates. Through mentorship programs, career talks, networking events, and alumni panels, students gain insights into industry trends, career paths, and life beyond college. Alumni share their journeys, offer guidance, and sometimes even open doors to internships and job opportunities. The platform also celebrates alumni achievements and fosters a sense of belonging across generations. For students, it’s a chance to learn from real-world experiences and build meaningful connections that extend far beyond campus.',
    verticles: [
      { name: 'Mentorship', description: '1:1 and group mentoring' },
      { name: 'Careers', description: 'Talks, referrals, networking' }
    ],
    achievements: [
      'Active alumni mentor network with regular sessions',
    ]
  },
  {
    id: 'e_cell',
    name: 'Entrepreneurship Cell',
    description: 'The Entrepreneurship Cell at Vignan is a launchpad for innovation, creativity, and startup culture. It nurtures aspiring entrepreneurs through ideation workshops, pitch competitions, mentorship sessions, and incubation support. Students learn how to identify problems, build solutions, and turn ideas into viable ventures. The cell also connects students with industry experts, investors, and successful founders, creating a vibrant ecosystem for business learning. Whether it’s a tech startup, social enterprise, or campus-based initiative, the E-Cell empowers students to think big, take risks, and shape the future with confidence and skill.',
  
  verticles: [
      { name: 'Incubation', description: 'Pre-incubation and incubation support' },
      { name: 'Biz Plan', description: 'Business plan competitions' },
      { name: 'Funding', description: 'Investor connects and guidance' }
    ],
    achievements: [
      'Hosted innovation challenges and startup bootcamps',
      'Multiple student startups and pitch recognitions'
    ]
  }
];

// College information
export const collegeInfo = {
  name: 'Vignan University, Vadlamudi',
  location: 'Vadlamudi, Guntur, Andhra Pradesh',
  established: 2008,
  about: 'Vignan University, Vadlamudi is a prestigious private university known for academic excellence, strong placements, vibrant student life, research opportunities, and an inclusive campus culture. It consistently ranks among the Top 70 universities and Top 80 colleges in India (NIRF).',
  notableSpots: [
    'U Block',
    'MHP Canteen'
  ],
  contact: {
    email: 'info@vignan.ac.in',
    phone: '+91 XXXXXXXXXX',
    address: 'Vadlamudi, Guntur, Andhra Pradesh'
  }
};

// Common queries and responses
export const commonQueries: Record<string, string> = {
  'greeting': 'Hello! How can I help you with information about our college and student bodies?',
  'goodbye': 'Goodbye! Feel free to ask if you have more questions.',
  'thanks': 'You\'re welcome! Is there anything else you\'d like to know?',
  'help': 'I can provide information about student bodies, their verticles, achievements, and college facilities. What would you like to know?'
};
