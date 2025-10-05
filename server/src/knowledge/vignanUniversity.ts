/**
 * Vignan University Knowledge Base
 * Comprehensive information about Vignan University, Vadlamudi
 */

export interface StudentBody {
  name: string;
  description: string;
  purpose: string;
  activities: string[];
  benefits: string[];
  contactInfo?: string;
}

export interface CampusSpot {
  name: string;
  description: string;
  significance: string;
  activities: string[];
  atmosphere: string;
}

export interface SACVertical {
  name: string;
  description: string;
  activities: string[];
  skills: string[];
  events: string[];
}

export interface Achievement {
  category: string;
  title: string;
  description: string;
  year?: string;
  significance: string;
}

export const VIGNAN_OVERVIEW = {
  name: "Vignan University, Vadlamudi",
  established: "2008",
  location: "Vadlamudi, Guntur, Andhra Pradesh",
  type: "Private University",
  nirfRanking: {
    universities: "Top 70 among universities in India",
    colleges: "Top 80 among colleges in India"
  },
  vision: "To be a globally recognized university that provides quality education and fosters innovation",
  mission: "To impart quality education, promote research, and develop students into responsible citizens",
  strengths: [
    "Strong academic programs across multiple disciplines",
    "Experienced and qualified faculty",
    "State-of-the-art infrastructure",
    "Vibrant student life and campus culture",
    "Excellent placement record",
    "Research opportunities",
    "Inclusive and safe campus environment"
  ]
};

export const CAMPUS_SPOTS: CampusSpot[] = [
  {
    name: "U Block",
    description: "The iconic U Block is one of the most recognizable landmarks on campus, serving as a central hub for student activities and gatherings.",
    significance: "Symbol of student unity and campus spirit",
    activities: [
      "Student meetings and discussions",
      "Cultural events and performances",
      "Study groups and collaborative learning",
      "Photo sessions and memories",
      "Informal gatherings and socializing"
    ],
    atmosphere: "Energetic, collaborative, and inspiring - a place where ideas are born and friendships are forged"
  },
  {
    name: "MHP Canteen",
    description: "The MHP (Multi-Purpose Hall) Canteen is the heart of campus social life, where students gather for meals, conversations, and relaxation.",
    significance: "Central social hub and cultural melting pot",
    activities: [
      "Daily meals and refreshments",
      "Group discussions and debates",
      "Cultural exchange and networking",
      "Informal meetings and planning sessions",
      "Relaxation and stress relief"
    ],
    atmosphere: "Warm, welcoming, and bustling with energy - where diverse students come together to share experiences and build lasting friendships"
  }
];

export const STUDENT_BODIES: StudentBody[] = [
  {
    name: "Vignan Sports Contingent",
    description: "The premier sports organization that promotes athletics and physical fitness among students",
    purpose: "To foster a culture of sportsmanship, physical fitness, and competitive spirit",
    activities: [
      "Organizing inter-college tournaments",
      "Training sessions for various sports",
      "Annual sports meet and competitions",
      "Representing university in external competitions",
      "Promoting healthy lifestyle among students"
    ],
    benefits: [
      "Physical fitness and health",
      "Teamwork and leadership skills",
      "Competitive spirit and discipline",
      "Recognition and awards",
      "Networking with sports enthusiasts"
    ]
  },
  {
    name: "Student Activities Council (SAC)",
    description: "The umbrella body that coordinates all student-led initiatives, events, and verticals across the university",
    purpose: "To provide a platform for student leadership, creativity, and holistic development",
    activities: [
      "Coordinating cultural and technical events",
      "Managing student verticals and clubs",
      "Organizing annual fests and competitions",
      "Facilitating student leadership development",
      "Promoting campus culture and traditions"
    ],
    benefits: [
      "Leadership and management skills",
      "Event organization experience",
      "Networking with diverse student groups",
      "Personal and professional growth",
      "Contribution to campus life"
    ]
  },
  {
    name: "Anti-Ragging Committee",
    description: "A dedicated committee that ensures student safety and maintains a welcoming, inclusive environment",
    purpose: "To prevent ragging and create a safe, supportive environment for all students",
    activities: [
      "Monitoring campus for ragging incidents",
      "Conducting awareness programs",
      "Providing counseling and support",
      "Maintaining strict anti-ragging policies",
      "Ensuring student welfare and safety"
    ],
    benefits: [
      "Safe and secure campus environment",
      "Confidence to report issues",
      "Support system for new students",
      "Inclusive and welcoming atmosphere",
      "Focus on academic and personal growth"
    ]
  },
  {
    name: "National Cadet Corps (NCC)",
    description: "A military-style training program that instills discipline, patriotism, and leadership qualities",
    purpose: "To develop character, discipline, and leadership through military training and community service",
    activities: [
      "Military drills and training",
      "Community service projects",
      "Leadership development programs",
      "National integration camps",
      "Disaster relief and social service"
    ],
    benefits: [
      "Discipline and time management",
      "Leadership and teamwork skills",
      "Physical fitness and endurance",
      "Patriotism and social responsibility",
      "Career opportunities in defense forces"
    ]
  },
  {
    name: "National Service Scheme (NSS)",
    description: "A community service program that encourages social responsibility and rural outreach",
    purpose: "To develop social consciousness and community service spirit among students",
    activities: [
      "Rural development projects",
      "Health and hygiene awareness campaigns",
      "Environmental conservation initiatives",
      "Literacy and education programs",
      "Disaster relief and rehabilitation"
    ],
    benefits: [
      "Social awareness and empathy",
      "Community service experience",
      "Leadership in social causes",
      "Personal fulfillment and growth",
      "Networking with social organizations"
    ]
  },
  {
    name: "Alumni Connects",
    description: "A bridge between current students and successful alumni for mentorship and networking",
    purpose: "To facilitate knowledge sharing, mentorship, and career guidance from experienced alumni",
    activities: [
      "Mentorship programs",
      "Career guidance sessions",
      "Industry insights and workshops",
      "Networking events and meetups",
      "Job placement assistance"
    ],
    benefits: [
      "Career guidance and mentorship",
      "Industry insights and trends",
      "Networking opportunities",
      "Job placement support",
      "Long-term professional relationships"
    ]
  },
  {
    name: "Entrepreneurship Cell",
    description: "A platform that fosters innovation, startup culture, and business acumen among students",
    purpose: "To promote entrepreneurial thinking and support students in starting their own ventures",
    activities: [
      "Startup incubation programs",
      "Business plan competitions",
      "Industry expert sessions",
      "Funding and investment guidance",
      "Innovation challenges and hackathons"
    ],
    benefits: [
      "Entrepreneurial skills development",
      "Business acumen and market knowledge",
      "Networking with entrepreneurs",
      "Access to funding opportunities",
      "Practical business experience"
    ]
  }
];

export const SAC_VERTICALS: SACVertical[] = [
  {
    name: "Culturals",
    description: "Dance, Music & Theatre Arts - The creative soul of campus life",
    activities: [
      "Dance performances and competitions",
      "Music concerts and shows",
      "Theatre productions and plays",
      "Cultural festivals and events",
      "Talent showcases and auditions"
    ],
    skills: [
      "Performance arts",
      "Stage presence",
      "Creative expression",
      "Team coordination",
      "Event management"
    ],
    events: [
      "Annual Cultural Fest",
      "Talent Hunt competitions",
      "Inter-college cultural meets",
      "Theatre workshops",
      "Music and dance recitals"
    ]
  },
  {
    name: "Literary",
    description: "Readers, Writers & Orators - The intellectual and creative minds",
    activities: [
      "Debate competitions",
      "Creative writing workshops",
      "Public speaking events",
      "Literary discussions and book clubs",
      "Poetry and storytelling sessions"
    ],
    skills: [
      "Critical thinking",
      "Communication skills",
      "Creative writing",
      "Public speaking",
      "Research and analysis"
    ],
    events: [
      "Literary Fest",
      "Debate championships",
      "Writing competitions",
      "Book fairs",
      "Oratory contests"
    ]
  },
  {
    name: "Fine Arts",
    description: "Arts, Crafts & Ambience - Creating visual beauty and artistic expression",
    activities: [
      "Art exhibitions and galleries",
      "Craft workshops and sessions",
      "Campus decoration and ambience",
      "Art competitions and contests",
      "Creative installations and displays"
    ],
    skills: [
      "Visual arts",
      "Craftsmanship",
      "Aesthetic sense",
      "Creative problem solving",
      "Attention to detail"
    ],
    events: [
      "Art Exhibition",
      "Craft fairs",
      "Campus beautification projects",
      "Art workshops",
      "Creative competitions"
    ]
  },
  {
    name: "Public Relations & Digital Marketing",
    description: "Managing communication, branding, and digital presence",
    activities: [
      "Social media management",
      "Event promotion and marketing",
      "Brand building and awareness",
      "Content creation and curation",
      "Public relations and media outreach"
    ],
    skills: [
      "Digital marketing",
      "Content creation",
      "Social media strategy",
      "Brand management",
      "Communication strategy"
    ],
    events: [
      "Marketing campaigns",
      "Social media challenges",
      "Brand awareness events",
      "Digital marketing workshops",
      "PR and media events"
    ]
  },
  {
    name: "Technical Design",
    description: "Creating technical solutions and innovative designs",
    activities: [
      "Technical competitions and hackathons",
      "Innovation challenges",
      "Prototype development",
      "Technical workshops and training",
      "Research and development projects"
    ],
    skills: [
      "Technical problem solving",
      "Innovation and creativity",
      "Project management",
      "Research and development",
      "Technical communication"
    ],
    events: [
      "Tech Fest",
      "Hackathons",
      "Innovation competitions",
      "Technical workshops",
      "Research symposiums"
    ]
  },
  {
    name: "Logistics",
    description: "Managing resources, coordination, and event execution",
    activities: [
      "Event planning and coordination",
      "Resource management",
      "Vendor coordination",
      "Timeline management",
      "Quality assurance and control"
    ],
    skills: [
      "Project management",
      "Resource planning",
      "Coordination and organization",
      "Problem solving",
      "Attention to detail"
    ],
    events: [
      "Major campus events",
      "Conference management",
      "Festival coordination",
      "Resource planning workshops",
      "Management competitions"
    ]
  },
  {
    name: "Stage Management",
    description: "Ensuring smooth execution of events and performances",
    activities: [
      "Stage setup and technical support",
      "Sound and lighting management",
      "Performance coordination",
      "Crew management",
      "Event execution and monitoring"
    ],
    skills: [
      "Technical production",
      "Event management",
      "Team coordination",
      "Problem solving under pressure",
      "Attention to detail"
    ],
    events: [
      "Cultural performances",
      "Technical events",
      "Award ceremonies",
      "Conferences and seminars",
      "Entertainment shows"
    ]
  },
  {
    name: "Photography",
    description: "Capturing moments, memories, and campus life",
    activities: [
      "Event photography and videography",
      "Campus life documentation",
      "Creative photography projects",
      "Photo editing and post-production",
      "Portfolio development"
    ],
    skills: [
      "Photography techniques",
      "Photo editing",
      "Visual storytelling",
      "Equipment handling",
      "Creative composition"
    ],
    events: [
      "Photo exhibitions",
      "Photography contests",
      "Campus documentation",
      "Creative projects",
      "Photography workshops"
    ]
  }
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    category: "NIRF Rankings",
    title: "Top 70 Universities in India",
    description: "Vignan University consistently ranks among the top 70 universities in India according to NIRF rankings",
    significance: "Reflects the university's commitment to academic excellence and quality education"
  },
  {
    category: "NIRF Rankings",
    title: "Top 80 Colleges in India",
    description: "The university's constituent colleges rank among the top 80 colleges in India",
    significance: "Demonstrates consistent quality across all academic programs and departments"
  },
  {
    category: "Student Achievements",
    title: "Hackathon Victories",
    description: "Students regularly win national and international hackathons and coding competitions",
    significance: "Showcases the technical excellence and innovative thinking of Vignan students"
  },
  {
    category: "Cultural Awards",
    title: "Inter-College Cultural Competitions",
    description: "Vignan students consistently win awards in dance, music, drama, and other cultural competitions",
    significance: "Highlights the vibrant cultural scene and artistic talent at the university"
  },
  {
    category: "Sports Victories",
    title: "Inter-University Sports Championships",
    description: "The university's sports teams regularly win championships in various sports disciplines",
    significance: "Demonstrates the university's commitment to physical fitness and sports excellence"
  },
  {
    category: "Community Impact",
    title: "Social Service Initiatives",
    description: "NSS and other student bodies have made significant impact in rural development and social causes",
    significance: "Reflects the university's mission to develop socially responsible citizens"
  }
];

export const CAMPUS_LIFE = {
  culture: "Vibrant, inclusive, and dynamic - Vignan University offers a rich campus life that balances academics with personal growth",
  events: [
    "Annual Cultural Fest - A grand celebration of arts, music, and creativity",
    "Tech Fest - Showcasing innovation, technology, and engineering excellence",
    "Sports Meet - Competitive athletics and team sports competitions",
    "Literary Fest - Celebrating literature, debate, and intellectual discourse",
    "Alumni Meet - Reconnecting with successful graduates and networking",
    "Freshers' Welcome - Welcoming new students to the Vignan family",
    "Farewell Events - Celebrating graduating students and their achievements"
  ],
  clubs: [
    "Photography Club - Capturing campus life and creative expression",
    "Dance Club - Various dance forms and performance opportunities",
    "Music Club - Instrumental and vocal music enthusiasts",
    "Drama Club - Theatre arts and dramatic performances",
    "Debate Society - Public speaking and argumentation skills",
    "Coding Club - Programming, development, and tech innovation",
    "Environmental Club - Sustainability and environmental awareness",
    "Entrepreneurship Club - Business ideas and startup culture"
  ],
  opportunities: [
    "Leadership roles in student bodies and clubs",
    "Research projects and academic publications",
    "Internship and placement opportunities",
    "International exchange programs",
    "Community service and social impact projects",
    "Cultural and artistic expression platforms",
    "Sports and fitness development",
    "Professional networking and mentorship"
  ]
};

export const BENEFITS_OF_JOINING = [
  {
    category: "Academic Excellence",
    points: [
      "NIRF ranked among top 70 universities in India",
      "Experienced and qualified faculty",
      "Modern curriculum and teaching methods",
      "Research opportunities and facilities",
      "Industry-relevant programs"
    ]
  },
  {
    category: "Holistic Development",
    points: [
      "Multiple student bodies and clubs",
      "Cultural and artistic opportunities",
      "Sports and fitness programs",
      "Leadership development",
      "Community service initiatives"
    ]
  },
  {
    category: "Strong Placement Record",
    points: [
      "Excellent placement statistics",
      "Industry partnerships and collaborations",
      "Career guidance and counseling",
      "Alumni network support",
      "Internship opportunities"
    ]
  },
  {
    category: "Supportive Environment",
    points: [
      "Anti-ragging committee for safety",
      "Inclusive and welcoming atmosphere",
      "Mentorship and guidance programs",
      "Student welfare initiatives",
      "Campus support services"
    ]
  },
  {
    category: "Active Student Life",
    points: [
      "Vibrant campus culture",
      "Regular events and festivals",
      "Student-led initiatives",
      "Creative and artistic expression",
      "Sports and recreational activities"
    ]
  }
];
