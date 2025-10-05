/**
 * Training Data for Vignan University Assistant
 * Q&A pairs and conversation examples for training the chatbot
 */

export interface TrainingExample {
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  followUpQuestions?: string[];
}

export const TRAINING_EXAMPLES: TrainingExample[] = [
  // General University Information
  {
    question: "What is Vignan University?",
    answer: "Vignan University, Vadlamudi is a prestigious private university established in 2008, located in Vadlamudi, Guntur, Andhra Pradesh. We are ranked among the top 70 universities and top 80 colleges in India according to NIRF rankings. Our university is known for its strong academic programs, vibrant student life, excellent placement record, and inclusive campus culture. We offer a perfect blend of academic excellence and holistic development opportunities.",
    category: "General Information",
    keywords: ["university", "vignan", "vadlamudi", "overview", "about"],
    followUpQuestions: [
      "What are the NIRF rankings?",
      "What programs does Vignan offer?",
      "Why should I choose Vignan University?"
    ]
  },
  {
    question: "What are the NIRF rankings of Vignan University?",
    answer: "Vignan University has excellent NIRF rankings that reflect our commitment to quality education. We are ranked among the top 70 universities in India and our constituent colleges rank among the top 80 colleges in India. These rankings are a testament to our academic excellence, infrastructure, faculty quality, and student outcomes.",
    category: "Rankings",
    keywords: ["nirf", "ranking", "top", "70", "80", "universities", "colleges"],
    followUpQuestions: [
      "What does NIRF ranking mean?",
      "How does Vignan maintain these rankings?",
      "What are the benefits of studying at a top-ranked university?"
    ]
  },

  // Student Bodies
  {
    question: "What is SAC in Vignan?",
    answer: "SAC stands for Student Activities Council, which is the umbrella body that coordinates all student-led initiatives, events, and verticals across Vignan University. SAC provides a platform for student leadership, creativity, and holistic development. It manages various verticals like Culturals, Literary, Fine Arts, Public Relations, Technical Design, Logistics, Stage Management, and Photography. SAC organizes major campus events, promotes student leadership, and ensures a vibrant campus culture.",
    category: "Student Bodies",
    keywords: ["sac", "student activities council", "student body", "leadership"],
    followUpQuestions: [
      "What are the verticals under SAC?",
      "How can I join SAC?",
      "What events does SAC organize?"
    ]
  },
  {
    question: "Tell me about the cultural verticals in SAC",
    answer: "The Culturals vertical in SAC focuses on Dance, Music & Theatre Arts - it's the creative soul of campus life! This vertical organizes dance performances, music concerts, theatre productions, cultural festivals, and talent showcases. Students can develop skills in performance arts, stage presence, creative expression, and event management. Major events include the Annual Cultural Fest, Talent Hunt competitions, Inter-college cultural meets, theatre workshops, and music recitals. It's perfect for students who want to express their artistic side and be part of the vibrant cultural scene at Vignan.",
    category: "SAC Verticals",
    keywords: ["culturals", "dance", "music", "theatre", "arts", "cultural"],
    followUpQuestions: [
      "What other verticals are there in SAC?",
      "How can I participate in cultural events?",
      "What skills can I develop in the Culturals vertical?"
    ]
  },
  {
    question: "What does the Entrepreneurship Cell do?",
    answer: "The Entrepreneurship Cell at Vignan University fosters innovation, startup culture, and business acumen among students. It offers startup incubation programs, business plan competitions, industry expert sessions, funding and investment guidance, and innovation challenges. Students can develop entrepreneurial skills, business acumen, market knowledge, and gain access to funding opportunities. The cell provides practical business experience and networking opportunities with successful entrepreneurs, making it perfect for students who want to start their own ventures or develop business skills.",
    category: "Student Bodies",
    keywords: ["entrepreneurship", "cell", "startup", "business", "innovation"],
    followUpQuestions: [
      "How can I join the Entrepreneurship Cell?",
      "What support does the cell provide for startups?",
      "Are there any success stories from the Entrepreneurship Cell?"
    ]
  },

  // Campus Spots
  {
    question: "What are the famous spots in Vignan?",
    answer: "Vignan University has several iconic spots that are central to campus life. The most famous ones are U Block and MHP Canteen. U Block is the iconic landmark that serves as a central hub for student activities, meetings, cultural events, and photo sessions. It symbolizes student unity and campus spirit. MHP Canteen is the heart of campus social life, where students gather for meals, conversations, group discussions, and relaxation. It's a cultural melting pot where diverse students come together to share experiences and build lasting friendships. Both spots are integral to the vibrant campus culture at Vignan.",
    category: "Campus Life",
    keywords: ["famous", "spots", "u block", "mhp canteen", "campus", "landmarks"],
    followUpQuestions: [
      "What activities happen at U Block?",
      "Tell me more about MHP Canteen",
      "Are there other interesting places on campus?"
    ]
  },
  {
    question: "Tell me about U Block",
    answer: "U Block is one of the most recognizable landmarks on Vignan campus and serves as a central hub for student activities and gatherings. It's a symbol of student unity and campus spirit where students come together for meetings, discussions, cultural events, performances, study groups, and informal gatherings. The atmosphere is energetic, collaborative, and inspiring - a place where ideas are born and friendships are forged. It's also a popular spot for photo sessions and creating lasting memories of campus life.",
    category: "Campus Spots",
    keywords: ["u block", "landmark", "student", "activities", "hub"],
    followUpQuestions: [
      "What makes U Block special?",
      "What events happen at U Block?",
      "Is U Block open to all students?"
    ]
  },
  {
    question: "What is MHP Canteen?",
    answer: "MHP Canteen (Multi-Purpose Hall Canteen) is the heart of campus social life at Vignan University. It's where students gather for daily meals, refreshments, group discussions, debates, cultural exchange, networking, informal meetings, and relaxation. The atmosphere is warm, welcoming, and bustling with energy - it's a cultural melting pot where diverse students come together to share experiences and build lasting friendships. It's not just a place to eat, but a central social hub that embodies the inclusive and vibrant campus culture at Vignan.",
    category: "Campus Spots",
    keywords: ["mhp canteen", "canteen", "social", "hub", "meals"],
    followUpQuestions: [
      "What food is available at MHP Canteen?",
      "What makes MHP Canteen special?",
      "When is MHP Canteen open?"
    ]
  },

  // Why Choose Vignan
  {
    question: "Why should I join Vignan University?",
    answer: "There are numerous compelling reasons to join Vignan University! Academically, we're ranked among the top 70 universities and top 80 colleges in India with experienced faculty and modern curriculum. Our campus offers holistic development through multiple student bodies, cultural opportunities, sports programs, and leadership development. We have an excellent placement record with strong industry partnerships and alumni network support. The environment is supportive with anti-ragging measures, inclusive atmosphere, and comprehensive student welfare initiatives. Campus life is vibrant with regular events, festivals, student-led initiatives, and creative expression opportunities. Vignan provides the perfect balance of academic excellence and personal growth.",
    category: "Benefits",
    keywords: ["why", "join", "benefits", "advantages", "choose", "vignan"],
    followUpQuestions: [
      "What are the academic benefits?",
      "Tell me about campus life at Vignan",
      "What support does Vignan provide to students?"
    ]
  },
  {
    question: "What are the benefits of studying at Vignan?",
    answer: "Studying at Vignan University offers numerous benefits across multiple dimensions. Academically, you get quality education from NIRF-ranked institutions with experienced faculty and industry-relevant programs. For holistic development, you can join various student bodies, participate in cultural and artistic activities, engage in sports, and develop leadership skills. The placement support is excellent with strong industry connections and career guidance. The campus environment is safe, inclusive, and supportive with anti-ragging measures and student welfare initiatives. You'll have access to a vibrant campus life with events, festivals, clubs, and creative expression opportunities that make your college years truly memorable and transformative.",
    category: "Benefits",
    keywords: ["benefits", "studying", "advantages", "academic", "development"],
    followUpQuestions: [
      "What student bodies can I join?",
      "How does Vignan support career development?",
      "What makes campus life at Vignan special?"
    ]
  },

  // Student Bodies Details
  {
    question: "What is the Vignan Sports Contingent?",
    answer: "The Vignan Sports Contingent is the premier sports organization that promotes athletics and physical fitness among students. It organizes inter-college tournaments, training sessions for various sports, annual sports meets, and represents the university in external competitions. Students can develop physical fitness, teamwork and leadership skills, competitive spirit, and discipline. The contingent also promotes healthy lifestyle among students and provides opportunities for recognition and awards. It's perfect for students who want to stay active, competitive, and develop their athletic abilities while building strong friendships with fellow sports enthusiasts.",
    category: "Student Bodies",
    keywords: ["sports", "contingent", "athletics", "fitness", "tournaments"],
    followUpQuestions: [
      "What sports are available?",
      "How can I join the Sports Contingent?",
      "What competitions does the university participate in?"
    ]
  },
  {
    question: "Tell me about the Anti-Ragging Committee",
    answer: "The Anti-Ragging Committee at Vignan University is a dedicated committee that ensures student safety and maintains a welcoming, inclusive environment for all students. It monitors campus for ragging incidents, conducts awareness programs, provides counseling and support, maintains strict anti-ragging policies, and ensures student welfare and safety. This committee creates a safe and secure campus environment where students can focus on their studies and personal growth without fear. It provides a support system for new students and maintains an inclusive atmosphere that promotes academic excellence and positive student experiences.",
    category: "Student Bodies",
    keywords: ["anti-ragging", "committee", "safety", "welfare", "support"],
    followUpQuestions: [
      "How does the committee prevent ragging?",
      "What should I do if I face ragging?",
      "How does this committee help new students?"
    ]
  },
  {
    question: "What is NCC in Vignan?",
    answer: "NCC (National Cadet Corps) at Vignan University is a military-style training program that instills discipline, patriotism, and leadership qualities in students. It offers military drills and training, community service projects, leadership development programs, national integration camps, and disaster relief activities. Students develop discipline and time management, leadership and teamwork skills, physical fitness and endurance, patriotism and social responsibility. NCC also provides career opportunities in defense forces and helps students become responsible citizens who contribute to society. It's perfect for students who want to develop strong character, leadership abilities, and serve their nation.",
    category: "Student Bodies",
    keywords: ["ncc", "national cadet corps", "military", "discipline", "leadership"],
    followUpQuestions: [
      "What training does NCC provide?",
      "How can NCC help my career?",
      "What are the benefits of joining NCC?"
    ]
  },
  {
    question: "What does NSS do at Vignan?",
    answer: "NSS (National Service Scheme) at Vignan University is a community service program that encourages social responsibility and rural outreach among students. It organizes rural development projects, health and hygiene awareness campaigns, environmental conservation initiatives, literacy and education programs, and disaster relief activities. Students develop social awareness and empathy, gain community service experience, learn leadership in social causes, experience personal fulfillment and growth, and build networks with social organizations. NSS helps students become socially conscious citizens who contribute to community development and social welfare, making a positive impact on society.",
    category: "Student Bodies",
    keywords: ["nss", "national service scheme", "community", "service", "social"],
    followUpQuestions: [
      "What community projects does NSS undertake?",
      "How can I contribute through NSS?",
      "What skills can I develop in NSS?"
    ]
  },

  // SAC Verticals
  {
    question: "What are all the verticals under SAC?",
    answer: "SAC (Student Activities Council) has eight main verticals: 1) Culturals - Dance, Music & Theatre Arts, 2) Literary - Readers, Writers & Orators, 3) Fine Arts - Arts, Crafts & Ambience, 4) Public Relations & Digital Marketing, 5) Technical Design, 6) Logistics, 7) Stage Management, and 8) Photography. Each vertical focuses on specific skills and activities, from creative arts to technical innovation, event management to digital marketing. Students can join any vertical based on their interests and develop relevant skills while contributing to campus life and events.",
    category: "SAC Verticals",
    keywords: ["verticals", "sac", "all", "list", "student activities"],
    followUpQuestions: [
      "What does each vertical do?",
      "How can I join a vertical?",
      "Can I join multiple verticals?"
    ]
  },
  {
    question: "Tell me about the Literary vertical",
    answer: "The Literary vertical in SAC focuses on Readers, Writers & Orators - the intellectual and creative minds of campus. It organizes debate competitions, creative writing workshops, public speaking events, literary discussions and book clubs, poetry and storytelling sessions. Students can develop critical thinking, communication skills, creative writing, public speaking, and research analysis abilities. Major events include Literary Fest, debate championships, writing competitions, book fairs, and oratory contests. It's perfect for students who love reading, writing, debating, and intellectual discourse, and want to develop their communication and analytical skills.",
    category: "SAC Verticals",
    keywords: ["literary", "debate", "writing", "oratory", "books"],
    followUpQuestions: [
      "What events does the Literary vertical organize?",
      "How can I improve my public speaking?",
      "Are there writing competitions?"
    ]
  },
  {
    question: "What does the Technical Design vertical do?",
    answer: "The Technical Design vertical in SAC focuses on creating technical solutions and innovative designs. It organizes technical competitions and hackathons, innovation challenges, prototype development, technical workshops and training, and research and development projects. Students develop technical problem-solving skills, innovation and creativity, project management, research and development abilities, and technical communication. Major events include Tech Fest, hackathons, innovation competitions, technical workshops, and research symposiums. It's perfect for students interested in technology, innovation, and solving real-world problems through technical solutions.",
    category: "SAC Verticals",
    keywords: ["technical", "design", "hackathon", "innovation", "technology"],
    followUpQuestions: [
      "What hackathons are organized?",
      "How can I participate in technical competitions?",
      "What skills can I develop in Technical Design?"
    ]
  },

  // Campus Life
  {
    question: "What is campus life like at Vignan?",
    answer: "Campus life at Vignan University is vibrant, inclusive, and dynamic! We offer a rich campus life that balances academics with personal growth. Students can participate in various clubs like Photography, Dance, Music, Drama, Debate, Coding, Environmental, and Entrepreneurship clubs. Major events include Annual Cultural Fest, Tech Fest, Sports Meet, Literary Fest, Alumni Meet, Freshers' Welcome, and Farewell Events. Students have opportunities for leadership roles, research projects, internships, international exchange programs, community service, cultural expression, sports development, and professional networking. The campus culture promotes creativity, innovation, collaboration, and holistic development.",
    category: "Campus Life",
    keywords: ["campus", "life", "clubs", "events", "activities"],
    followUpQuestions: [
      "What clubs can I join?",
      "What major events happen on campus?",
      "How can I get involved in campus life?"
    ]
  },
  {
    question: "What events happen at Vignan?",
    answer: "Vignan University hosts numerous exciting events throughout the year! Major events include the Annual Cultural Fest - a grand celebration of arts, music, and creativity; Tech Fest - showcasing innovation, technology, and engineering excellence; Sports Meet - competitive athletics and team sports competitions; Literary Fest - celebrating literature, debate, and intellectual discourse; Alumni Meet - reconnecting with successful graduates and networking; Freshers' Welcome - welcoming new students to the Vignan family; and Farewell Events - celebrating graduating students. Each vertical also organizes specific events like hackathons, art exhibitions, debate competitions, and cultural performances, making campus life exciting and engaging year-round.",
    category: "Campus Life",
    keywords: ["events", "fests", "cultural", "tech", "sports"],
    followUpQuestions: [
      "When do these events happen?",
      "How can I participate in events?",
      "Are there any international events?"
    ]
  },

  // Achievements
  {
    question: "What achievements does Vignan University have?",
    answer: "Vignan University has numerous impressive achievements! We're consistently ranked among the top 70 universities and top 80 colleges in India according to NIRF rankings. Our students regularly win national and international hackathons and coding competitions, showcasing technical excellence and innovative thinking. In cultural competitions, Vignan students consistently win awards in dance, music, drama, and other cultural events. Our sports teams regularly win championships in various sports disciplines. The university's NSS and other student bodies have made significant impact in rural development and social causes, reflecting our commitment to developing socially responsible citizens. These achievements demonstrate the university's excellence across academics, innovation, culture, sports, and social impact.",
    category: "Achievements",
    keywords: ["achievements", "awards", "rankings", "wins", "success"],
    followUpQuestions: [
      "What are the recent achievements?",
      "How do students contribute to these achievements?",
      "What recognition does Vignan receive?"
    ]
  }
];

export const CONVERSATION_STARTERS = [
  "Tell me about Vignan University",
  "What is SAC?",
  "What are the famous spots on campus?",
  "Why should I choose Vignan?",
  "What student bodies can I join?",
  "Tell me about campus life",
  "What events happen at Vignan?",
  "What are the NIRF rankings?",
  "How can I get involved?",
  "What opportunities are available?"
];

export const RESPONSE_TEMPLATES = {
  greeting: "Hello! I'm here to help you learn about Vignan University, Vadlamudi. I can tell you about our academic programs, student life, campus culture, student bodies, events, and much more. What would you like to know?",
  
  notFound: "I'm sorry, I don't have specific information about that. However, I can help you with information about Vignan University's academic programs, student bodies, campus life, events, or any other general questions about our university. What else would you like to know?",
  
  followUp: "Is there anything specific about {topic} that you'd like to know more about? I can also help you with information about other aspects of Vignan University.",
  
  encouragement: "That's a great question! Vignan University offers excellent opportunities in that area. Let me tell you more about it...",
  
  closing: "I hope this information helps! If you have any other questions about Vignan University, our student life, academic programs, or anything else, feel free to ask. I'm here to help!"
};
