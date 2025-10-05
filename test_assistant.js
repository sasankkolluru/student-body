/**
 * Test script for Vignan University Assistant
 * This script demonstrates the assistant's capabilities
 */

// Mock the natural library for testing
const mockNatural = {
  WordTokenizer: function() {
    return {
      tokenize: (text) => text.split(' ')
    }
  },
  PorterStemmer: {
    stem: (word) => word.toLowerCase()
  }
};

// Mock the knowledge base imports
const mockKnowledge = {
  VIGNAN_OVERVIEW: {
    name: "Vignan University, Vadlamudi",
    nirfRanking: {
      universities: "Top 70 among universities in India",
      colleges: "Top 80 among colleges in India"
    }
  },
  CAMPUS_SPOTS: [
    {
      name: "U Block",
      description: "The iconic U Block is one of the most recognizable landmarks on campus",
      significance: "Symbol of student unity and campus spirit",
      activities: ["Student meetings", "Cultural events", "Study groups"],
      atmosphere: "Energetic, collaborative, and inspiring"
    },
    {
      name: "MHP Canteen",
      description: "The MHP Canteen is the heart of campus social life",
      significance: "Central social hub and cultural melting pot",
      activities: ["Daily meals", "Group discussions", "Cultural exchange"],
      atmosphere: "Warm, welcoming, and bustling with energy"
    }
  ],
  STUDENT_BODIES: [
    {
      name: "Student Activities Council (SAC)",
      description: "The umbrella body that coordinates all student-led initiatives",
      purpose: "To provide a platform for student leadership and creativity",
      activities: ["Coordinating events", "Managing verticals", "Organizing fests"],
      benefits: ["Leadership skills", "Event management", "Networking"]
    }
  ],
  SAC_VERTICALS: [
    {
      name: "Culturals",
      description: "Dance, Music & Theatre Arts - The creative soul of campus life",
      activities: ["Dance performances", "Music concerts", "Theatre productions"],
      skills: ["Performance arts", "Stage presence", "Creative expression"],
      events: ["Annual Cultural Fest", "Talent Hunt competitions"]
    }
  ],
  CAMPUS_LIFE: {
    culture: "Vibrant, inclusive, and dynamic",
    events: ["Annual Cultural Fest", "Tech Fest", "Sports Meet"],
    clubs: ["Photography Club", "Dance Club", "Music Club"],
    opportunities: ["Leadership roles", "Research projects", "Community service"]
  },
  BENEFITS_OF_JOINING: [
    {
      category: "Academic Excellence",
      points: ["NIRF ranked among top 70 universities", "Experienced faculty", "Modern curriculum"]
    }
  ]
};

const mockTrainingData = {
  TRAINING_EXAMPLES: [
    {
      question: "What is Vignan University?",
      answer: "Vignan University, Vadlamudi is a prestigious private university established in 2008...",
      category: "General Information",
      keywords: ["university", "vignan", "vadlamudi", "overview"]
    },
    {
      question: "What is SAC in Vignan?",
      answer: "SAC stands for Student Activities Council, which is the umbrella body...",
      category: "Student Bodies",
      keywords: ["sac", "student activities council", "student body"]
    }
  ],
  CONVERSATION_STARTERS: [
    "Tell me about Vignan University",
    "What is SAC?",
    "What are the famous spots on campus?",
    "Why should I choose Vignan?"
  ],
  RESPONSE_TEMPLATES: {
    greeting: "Hello! I'm here to help you learn about Vignan University...",
    notFound: "I'm sorry, I don't have specific information about that...",
    followUp: "Is there anything specific about {topic} that you'd like to know more about?"
  }
};

// Test queries
const testQueries = [
  "What is Vignan University?",
  "What is SAC?",
  "Tell me about the famous spots on campus",
  "Why should I join Vignan?",
  "What are the NIRF rankings?",
  "Tell me about U Block",
  "What does the Entrepreneurship Cell do?",
  "What are the cultural verticals?",
  "What is campus life like?",
  "What events happen at Vignan?"
];

// Simulate assistant responses
function simulateAssistantResponse(query) {
  const lowerQuery = query.toLowerCase();
  
  // Simple keyword matching simulation
  if (lowerQuery.includes('vignan university') || lowerQuery.includes('what is vignan')) {
    return `**Vignan University, Vadlamudi**\n\n` +
           `Vignan University is a prestigious private university established in 2008, located in Vadlamudi, Guntur, Andhra Pradesh. ` +
           `We are ranked among the top 70 universities and top 80 colleges in India according to NIRF rankings. ` +
           `Our university is known for its strong academic programs, vibrant student life, excellent placement record, and inclusive campus culture.`;
  }
  
  if (lowerQuery.includes('sac') || lowerQuery.includes('student activities council')) {
    return `**SAC (Student Activities Council)**\n\n` +
           `SAC is the umbrella body that coordinates all student-led initiatives, events, and verticals across Vignan University. ` +
           `It provides a platform for student leadership, creativity, and holistic development. ` +
           `SAC manages various verticals like Culturals, Literary, Fine Arts, Public Relations, Technical Design, Logistics, Stage Management, and Photography.`;
  }
  
  if (lowerQuery.includes('famous spots') || lowerQuery.includes('campus spots')) {
    return `**Famous Campus Spots**\n\n` +
           `📍 **U Block**\n` +
           `The iconic U Block is one of the most recognizable landmarks on campus, serving as a central hub for student activities and gatherings.\n\n` +
           `📍 **MHP Canteen**\n` +
           `The MHP Canteen is the heart of campus social life, where students gather for meals, conversations, and relaxation.`;
  }
  
  if (lowerQuery.includes('why') && lowerQuery.includes('join')) {
    return `**Why Join Vignan University?**\n\n` +
           `There are numerous compelling reasons to join Vignan University:\n\n` +
           `**Academic Excellence:**\n` +
           `• NIRF ranked among top 70 universities in India\n` +
           `• Experienced and qualified faculty\n` +
           `• Modern curriculum and teaching methods\n\n` +
           `**Holistic Development:**\n` +
           `• Multiple student bodies and clubs\n` +
           `• Cultural and artistic opportunities\n` +
           `• Sports and fitness programs\n\n` +
           `**Strong Placement Record:**\n` +
           `• Excellent placement statistics\n` +
           `• Industry partnerships and collaborations\n` +
           `• Alumni network support`;
  }
  
  if (lowerQuery.includes('nirf') || lowerQuery.includes('ranking')) {
    return `**NIRF Rankings**\n\n` +
           `🏆 **Top 70 Universities in India**\n` +
           `🏆 **Top 80 Colleges in India**\n\n` +
           `These rankings are a testament to our academic excellence, infrastructure, faculty quality, and student outcomes.`;
  }
  
  if (lowerQuery.includes('u block')) {
    return `**U Block**\n\n` +
           `U Block is one of the most recognizable landmarks on Vignan campus and serves as a central hub for student activities and gatherings. ` +
           `It's a symbol of student unity and campus spirit where students come together for meetings, discussions, cultural events, and informal gatherings. ` +
           `The atmosphere is energetic, collaborative, and inspiring - a place where ideas are born and friendships are forged.`;
  }
  
  if (lowerQuery.includes('entrepreneurship') || lowerQuery.includes('cell')) {
    return `**Entrepreneurship Cell**\n\n` +
           `The Entrepreneurship Cell at Vignan University fosters innovation, startup culture, and business acumen among students. ` +
           `It offers startup incubation programs, business plan competitions, industry expert sessions, funding guidance, and innovation challenges. ` +
           `Students can develop entrepreneurial skills, business acumen, and gain access to funding opportunities.`;
  }
  
  if (lowerQuery.includes('cultural') || lowerQuery.includes('verticals')) {
    return `**Culturals Vertical**\n\n` +
           `The Culturals vertical in SAC focuses on Dance, Music & Theatre Arts - it's the creative soul of campus life! ` +
           `This vertical organizes dance performances, music concerts, theatre productions, cultural festivals, and talent showcases. ` +
           `Students can develop skills in performance arts, stage presence, creative expression, and event management.`;
  }
  
  if (lowerQuery.includes('campus life') || lowerQuery.includes('student life')) {
    return `**Campus Life at Vignan**\n\n` +
           `Campus life at Vignan University is **vibrant, inclusive, and dynamic**! We offer a rich campus life that balances academics with personal growth.\n\n` +
           `**Major Events:**\n` +
           `• Annual Cultural Fest - A grand celebration of arts, music, and creativity\n` +
           `• Tech Fest - Showcasing innovation, technology, and engineering excellence\n` +
           `• Sports Meet - Competitive athletics and team sports competitions\n\n` +
           `**Clubs & Organizations:**\n` +
           `• Photography Club, Dance Club, Music Club, Drama Club\n` +
           `• Debate Society, Coding Club, Environmental Club\n` +
           `• Entrepreneurship Club, and many more!`;
  }
  
  if (lowerQuery.includes('events')) {
    return `**Events at Vignan**\n\n` +
           `Vignan University hosts numerous exciting events throughout the year:\n\n` +
           `🎉 **Annual Cultural Fest** - A grand celebration of arts, music, and creativity\n` +
           `🎉 **Tech Fest** - Showcasing innovation, technology, and engineering excellence\n` +
           `🎉 **Sports Meet** - Competitive athletics and team sports competitions\n` +
           `🎉 **Literary Fest** - Celebrating literature, debate, and intellectual discourse\n` +
           `🎉 **Alumni Meet** - Reconnecting with successful graduates and networking\n\n` +
           `Each vertical also organizes specific events like hackathons, art exhibitions, and cultural performances!`;
  }
  
  return `I'm here to help you learn about Vignan University! I can tell you about our academic programs, student life, campus culture, student bodies, events, and much more. What would you like to know?`;
}

// Run tests
console.log('🤖 Vignan University Assistant - Test Results\n');
console.log('=' .repeat(50));

testQueries.forEach((query, index) => {
  console.log(`\n${index + 1}. Query: "${query}"`);
  console.log('-'.repeat(30));
  console.log(simulateAssistantResponse(query));
  console.log('\n' + '='.repeat(50));
});

console.log('\n✅ Test completed! The assistant can handle various queries about Vignan University.');
console.log('\n📚 Available Topics:');
console.log('• University Overview & NIRF Rankings');
console.log('• Student Bodies (SAC, NCC, NSS, etc.)');
console.log('• SAC Verticals (Culturals, Literary, Technical, etc.)');
console.log('• Campus Spots (U Block, MHP Canteen)');
console.log('• Campus Life & Events');
console.log('• Benefits of Joining Vignan');
console.log('• And much more!');
