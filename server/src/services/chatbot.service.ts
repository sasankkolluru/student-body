import natural from 'natural';
import { NlpManager } from 'node-nlp';
import { studentBodies, collegeInfo, commonQueries, StudentBody } from '../knowledge/studentBodies';
import { 
  VIGNAN_OVERVIEW, 
  CAMPUS_SPOTS, 
  STUDENT_BODIES, 
  SAC_VERTICALS, 
  ACHIEVEMENTS, 
  CAMPUS_LIFE, 
  BENEFITS_OF_JOINING 
} from '../knowledge/vignanUniversity';
import { TRAINING_EXAMPLES, CONVERSATION_STARTERS, RESPONSE_TEMPLATES } from '../knowledge/trainingData';
import { RasaService } from './rasa.service';
import Event from '../models/Event';
import Poll from '../models/Poll';
import User from '../models/User';
import Registration from '../models/Registration';
import Achievement from '../models/Achievement';

// Initialize tokenizer and stemmer
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Initialize NLP Manager
const nlpManager = new NlpManager({ languages: ['en'], forceNER: true });

// Keywords for intent detection
const INTENT_KEYWORDS = {
  GREETING: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
  FAREWELL: ['bye', 'goodbye', 'see you', 'take care', 'farewell'],
  THANKS: ['thank', 'thanks', 'appreciate', 'grateful'],
  HELP: ['help', 'what can you do', 'options', 'assist'],
  LIST_BODIES: ['list student bodies', 'what student bodies are there', 'show all student bodies', 'student organizations', 'student bodies in vignan', 'student bodys', 'student bodies', 'all student bodies'],
  BODY_INFO: ['tell me about', 'what is', 'information about', 'details of', 'explain'],
  VERTICES: ['verticles', 'clubs', 'teams', 'subgroups', 'verticals'],
  ACHIEVEMENTS: ['achievements', 'awards', 'wins', 'accomplishments', 'success'],
  COLLEGE_INFO: ['college', 'campus', 'about college', 'college information', 'university', 'vignan'],
  CONTACT: ['contact', 'how to reach', 'email', 'phone', 'address'],
  CAMPUS_SPOTS: ['famous spots', 'u block', 'mhp canteen', 'campus landmarks', 'places'],
  SAC_INFO: ['sac', 'student activities council', 'student council'],
  NIRF_RANKINGS: ['nirf', 'ranking', 'rankings', 'top', '70', '80'],
  CAMPUS_LIFE: ['campus life', 'student life', 'life at vignan', 'activities'],
  EVENTS: ['events', 'fests', 'festivals', 'competitions', 'programs'],
  BENEFITS: ['benefits', 'why choose', 'advantages', 'why vignan', 'reasons'],
  EVENTS_NOW: ['events now', 'now happening', 'current events', 'ongoing events', 'what are the events now happening'],
  UPCOMING_EVENTS: ['upcoming', 'upcoming events', 'future events', 'what events are coming', 'coming up events', 'next events'],
  REG_OPEN_EVENTS: ['registrations open', 'open registrations', 'events open for registration', 'currently accepting registrations', 'registration open', 'open for registrations'],
  POLLS_NOW: ['polls', 'active polls', 'polls now', 'polls available', 'vote now', 'what are the polls are there available now to vote'],
  MY_PROFILE: ['my profile', 'show my profile', 'profile details'],
  MY_IDEAS: ['my ideas', 'idea submission status', 'my idea submission status', 'status of my idea'],
  MY_ACHIEVEMENTS: ['my achievements', 'achievements list i submitted', 'my achievements list'],
  ADMISSIONS: ['admission', 'admissions', 'apply', 'application', 'enroll'],
  // Campus blocks and general overview
  H_BLOCK: ['h block', 'hblock'],
  A_BLOCK: ['a block', 'ablock'],
  N_BLOCK: ['n block', 'nblock'],
  U_BLOCK: ['u block', 'ublock'],
  PHARMACY_BLOCK: ['pharmacy block', 'pharmacy'],
  COLLEGE_OVERVIEW_GENERAL: ['how is college', 'how is the college', 'how is campus', 'how is your college']
};

// Aliases/acronyms for Vignan student bodies
const BODY_ALIASES: Record<string, string[]> = {
  vsc: ['vsc', 'sports contingent', 'vignan sports', 'sports body', 'sports council'],
  sac: ['sac', 'student activities council', 'activities council', 'student council'],
  ncc: ['ncc', 'national cadet corps'],
  nss: ['nss', 'national service scheme'],
  e_cell: ['e cell', 'e-cell', 'ecell', 'entrepreneurship cell', 'entrepreneurship'],
  alumni: ['alumni', 'alumni connects', 'alumni association', 'alma connects', 'almuni', 'almini linkages'],
  anti_ragging: ['anti ragging', 'anti-ragging', 'anti ragging committee']
};

interface ChatMessage {
  text: string;
  timestamp: Date;
  sender: 'user' | 'bot';
}

export class ChatbotService {
  private chatHistory: ChatMessage[] = [];
  private maxHistory = 10;
  private nlpManager: NlpManager;
  private isNlpTrained = false;
  private rasaService: RasaService;

  // Small helper to render Roman numerals for 1..10
  private toRoman(n: number): string {
    const map = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
    return map[n - 1] || `${n}`;
  }

  private async handleUpcomingEvents(days: number = 7): Promise<string> {
    try {
      const now = new Date();
      const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const events = await Event.find({
        isActive: true,
        startAt: { $gte: now, $lte: until }
      }).sort({ startAt: 1 });

      if (!events.length) return `No upcoming events in the next ${days} day(s).`;

      const lines = ["**Upcoming Events:**", ""];
      events.forEach((e, i) => {
        const when = `${e.startAt?.toLocaleString()}${e.endAt ? ' – ' + e.endAt.toLocaleString() : ''}`;
        lines.push(`${i + 1}. **${e.title}** — ${when}${e.location ? ' @ ' + e.location : ''}`);
      });
      return lines.join('\n');
    } catch (err) {
      console.error('handleUpcomingEvents error', err);
      return 'Sorry, I could not fetch upcoming events right now.';
    }
  }

  // ===== Real-time handlers (DB-backed) =====
  private async handleEventsNow(): Promise<string> {
    try {
      const now = new Date();
      const events = await Event.find({
        $and: [
          { isActive: true },
          { startAt: { $lte: now } },
          { $or: [{ endAt: { $gte: now } }, { endAt: null }] }
        ]
      }).sort({ startAt: 1 });

      if (!events.length) return 'No active events at the moment.';

      const lines = ['**Current/Ongoing Events:**', ''];
      events.forEach((e, i) => {
        const when = `${e.startAt?.toLocaleString()}${e.endAt ? ' – ' + e.endAt.toLocaleString() : ''}`;
        lines.push(`${i + 1}. **${e.title}** — ${when}${e.location ? ' @ ' + e.location : ''}`);
      });
      return lines.join('\n');
    } catch (err) {
      console.error('handleEventsNow error', err);
      return 'Sorry, I could not fetch events right now.';
    }
  }

  private async handlePollsNow(): Promise<string> {
    try {
      const now = new Date();
      const polls = await Poll.find({ $or: [{ endDate: { $gte: now } }, { endDate: null }] }).sort({ createdAt: -1 });
      if (!polls.length) return 'No active polls available right now.';
      const lines = ['**Active Polls:**', ''];
      polls.forEach((p, i) => {
        lines.push(`${i + 1}. **${p.title}**`);
        (p.options as any[]).forEach((opt: any, idx: number) => {
          const roman = this.toRoman(idx + 1);
          lines.push(`   ${roman}. ${opt.text}`);
        });
      });
      return lines.join('\n');
    } catch (err) {
      console.error('handlePollsNow error', err);
      return 'Sorry, I could not fetch polls right now.';
    }
  }

  private async handleMyProfile(userId: string): Promise<string> {
    try {
      const user = await User.findById(userId).select('-passwordHash');
      if (!user) return 'Profile not found.';
      return [
        '**Your Profile**',
        '',
        `Name: **${user.name}**`,
        `Email: ${user.email}`,
        user.regdNo ? `Regd No: ${user.regdNo}` : '',
        user.branch ? `Branch: ${user.branch}` : '',
        user.stream ? `Stream: ${user.stream}` : '',
        user.year ? `Year: ${user.year}` : '',
      ].filter(Boolean).join('\n');
    } catch (err) {
      console.error('handleMyProfile error', err);
      return 'Sorry, I could not fetch your profile right now.';
    }
  }

  private async handleMyIdeas(userId: string): Promise<string> {
    try {
      const ideas = await Registration.find({ userId, formType: 'idea' }).sort({ createdAt: -1 });
      if (!ideas.length) return 'You have no idea submissions yet.';
      const lines = ['**Your Idea Submissions:**', ''];
      ideas.forEach((it: any, i: number) => {
        const status = it.data?.status || 'submitted';
        const title = it.data?.title || it.data?.ideaTitle || 'Idea';
        lines.push(`${i + 1}. **${title}** — Status: ${status}`);
      });
      return lines.join('\n');
    } catch (err) {
      console.error('handleMyIdeas error', err);
      return 'Sorry, I could not fetch your idea submissions right now.';
    }
  }

  private async handleMyAchievements(userId: string): Promise<string> {
    try {
      const items = await Achievement.find({ createdBy: userId }).sort({ createdAt: -1 });
      if (!items.length) return 'No achievements submitted yet.';
      const lines = ['**Your Achievements:**', ''];
      items.forEach((a: any, i: number) => {
        const when = a.dateOfParticipation ? new Date(a.dateOfParticipation).toLocaleDateString() : '';
        lines.push(`${i + 1}. **${a.eventName || a.title}** — ${a.eventType || ''} ${when}`.trim());
      });
      return lines.join('\n');
    } catch (err) {
      console.error('handleMyAchievements error', err);
      return 'Sorry, I could not fetch your achievements right now.';
    }
  }

  constructor() {
    this.nlpManager = new NlpManager({ languages: ['en'], forceNER: true });
    this.rasaService = new RasaService();
    this.trainNLP();
  }

  private async trainNLP(): Promise<void> {
    try {
      // Train greetings with more variations
      this.nlpManager.addDocument('en', 'hello', 'greeting');
      this.nlpManager.addDocument('en', 'hi', 'greeting');
      this.nlpManager.addDocument('en', 'hey', 'greeting');
      this.nlpManager.addDocument('en', 'good morning', 'greeting');
      this.nlpManager.addDocument('en', 'good afternoon', 'greeting');
      this.nlpManager.addDocument('en', 'good evening', 'greeting');
      this.nlpManager.addDocument('en', 'greetings', 'greeting');
      this.nlpManager.addDocument('en', 'hi there', 'greeting');
      this.nlpManager.addDocument('en', 'hello there', 'greeting');
      this.nlpManager.addDocument('en', 'hey there', 'greeting');
      this.nlpManager.addDocument('en', 'hiya', 'greeting');
      this.nlpManager.addDocument('en', 'howdy', 'greeting');
      this.nlpManager.addDocument('en', 'sup', 'greeting');
      this.nlpManager.addDocument('en', 'whats up', 'greeting');
      this.nlpManager.addDocument('en', 'what\'s up', 'greeting');
      this.nlpManager.addDocument('en', 'yo', 'greeting');
      this.nlpManager.addDocument('en', 'good day', 'greeting');
      this.nlpManager.addDocument('en', 'good night', 'greeting');
      this.nlpManager.addDocument('en', 'morning', 'greeting');
      this.nlpManager.addDocument('en', 'afternoon', 'greeting');
      this.nlpManager.addDocument('en', 'evening', 'greeting');

      // Train farewells
      this.nlpManager.addDocument('en', 'bye', 'farewell');
      this.nlpManager.addDocument('en', 'goodbye', 'farewell');
      this.nlpManager.addDocument('en', 'see you', 'farewell');
      this.nlpManager.addDocument('en', 'take care', 'farewell');
      this.nlpManager.addDocument('en', 'farewell', 'farewell');

      // Train thanks
      this.nlpManager.addDocument('en', 'thank you', 'thanks');
      this.nlpManager.addDocument('en', 'thanks', 'thanks');
      this.nlpManager.addDocument('en', 'thank you very much', 'thanks');
      this.nlpManager.addDocument('en', 'appreciate it', 'thanks');

      // Train help requests
      this.nlpManager.addDocument('en', 'help', 'help');
      this.nlpManager.addDocument('en', 'what can you do', 'help');
      this.nlpManager.addDocument('en', 'options', 'help');
      this.nlpManager.addDocument('en', 'assist', 'help');
      this.nlpManager.addDocument('en', 'how can you help', 'help');

      // Train student body queries
      this.nlpManager.addDocument('en', 'student bodies', 'list_bodies');
      this.nlpManager.addDocument('en', 'what student bodies are there', 'list_bodies');
      this.nlpManager.addDocument('en', 'show all student bodies', 'list_bodies');
      this.nlpManager.addDocument('en', 'student organizations', 'list_bodies');

      // Train college info queries
      this.nlpManager.addDocument('en', 'about college', 'college_info');
      this.nlpManager.addDocument('en', 'college information', 'college_info');
      this.nlpManager.addDocument('en', 'about vignan', 'college_info');
      this.nlpManager.addDocument('en', 'university info', 'college_info');

      // Train campus spots queries
      this.nlpManager.addDocument('en', 'campus spots', 'campus_spots');
      this.nlpManager.addDocument('en', 'famous spots', 'campus_spots');
      this.nlpManager.addDocument('en', 'u block', 'campus_spots');
      this.nlpManager.addDocument('en', 'mhp canteen', 'campus_spots');

      // Train SAC queries
      this.nlpManager.addDocument('en', 'sac', 'sac_info');
      this.nlpManager.addDocument('en', 'student activities council', 'sac_info');
      this.nlpManager.addDocument('en', 'student council', 'sac_info');

      // Train NIRF queries
      this.nlpManager.addDocument('en', 'nirf', 'nirf_rankings');
      this.nlpManager.addDocument('en', 'ranking', 'nirf_rankings');
      this.nlpManager.addDocument('en', 'rankings', 'nirf_rankings');

      // Add responses with more variety
      this.nlpManager.addAnswer('en', 'greeting', 'Hello! I\'m your Vignan University assistant. I can help you with information about student bodies, campus life, events, academic programs, and much more. What would you like to know?');
      this.nlpManager.addAnswer('en', 'farewell', 'Goodbye! Feel free to ask if you need any help later. Have a great day!');
      this.nlpManager.addAnswer('en', 'thanks', 'You\'re welcome! Is there anything else I can help you with about Vignan University?');
      this.nlpManager.addAnswer('en', 'help', 'I can help you with information about:\n\n• Student bodies and organizations (SAC, Entrepreneurship Cell, etc.)\n• Campus life and famous spots (U Block, MHP Canteen)\n• Academic programs and NIRF rankings\n• Events and activities\n• Admissions and benefits\n\nWhat would you like to know?');
      this.nlpManager.addAnswer('en', 'list_bodies', 'Here are the main student bodies at Vignan University:\n\n• Student Activities Council (SAC)\n• Entrepreneurship Cell\n• Vignan Sports Contingent (VSC)\n• Anti-Ragging Committee\n• NCC (National Cadet Corps)\n• NSS (National Service Scheme)\n• Alumni Connects\n\nAsk about any one to get details, activities, and benefits.');
      this.nlpManager.addAnswer('en', 'college_info', 'Vignan University is a prestigious private university established in 2008, located in Vadlamudi, Guntur, Andhra Pradesh. We are ranked among the top 70 universities and top 80 colleges in India according to NIRF rankings. Our university offers excellent academic programs, vibrant campus life, and holistic development opportunities.');
      this.nlpManager.addAnswer('en', 'campus_spots', 'Vignan University has several iconic spots including:\n\n• U Block - The central hub for student activities\n• MHP Canteen - Heart of campus social life\n• Various academic blocks and facilities\n\nWould you like to know about specific locations?');
      this.nlpManager.addAnswer('en', 'sac_info', 'SAC (Student Activities Council) is the umbrella body that coordinates all student-led initiatives and events. It has 8 verticals: Culturals, Literary, Fine Arts, Public Relations, Technical Design, Logistics, Stage Management, and Photography. I can tell you about any specific vertical!');
      this.nlpManager.addAnswer('en', 'nirf_rankings', 'Vignan University has excellent NIRF rankings:\n\n🏆 Top 70 Universities in India\n🏆 Top 80 Colleges in India\n\nThese rankings reflect our commitment to academic excellence, quality infrastructure, experienced faculty, and outstanding student outcomes.');

      // Ingest curated training examples into NLP with mapped intents
      const mapCategoryToIntent = (category: string): string => {
        const key = category.toLowerCase();
        if (key.includes('general')) return 'college_info';
        if (key.includes('ranking')) return 'nirf_rankings';
        if (key.includes('campus life')) return 'campus_life';
        if (key.includes('benefit')) return 'benefits';
        if (key.includes('sac vertical')) return 'sac_info';
        if (key.includes('student bodies')) return 'sac_info';
        if (key.includes('campus spots') || key.includes('campus')) return 'campus_spots';
        if (key.includes('achievements')) return 'achievements';
        return 'unknown';
      };

      for (const ex of TRAINING_EXAMPLES) {
        const intent = mapCategoryToIntent(ex.category);
        // Add the example as a training utterance for the mapped intent
        this.nlpManager.addDocument('en', ex.question, intent);
        // Prefer structured generator for known intents; otherwise store exemplar answer
        this.nlpManager.addAnswer('en', intent, ex.answer);
      }

      // Add documents for student bodies listing variations
      ['student bodies', 'student bodys', 'student bodies in vignan', 'all student bodies', 'what are the student bodies'].forEach(q => {
        this.nlpManager.addDocument('en', q, 'list_bodies');
      });

      // Add documents for each student body alias to map to body_info_<id>
      Object.entries(BODY_ALIASES).forEach(([id, aliases]) => {
        // Also include the id and name tokens as fallbacks
        aliases.forEach(alias => this.nlpManager.addDocument('en', alias, `body_info_${id}`));
        this.nlpManager.addDocument('en', id, `body_info_${id}`);
      });

      // Train the model
      await this.nlpManager.train();
      this.isNlpTrained = true;
      console.log('NLP model trained successfully');
    } catch (error) {
      console.error('Error training NLP model:', error);
      this.isNlpTrained = false;
    }
  }

  private preprocessText(text: string): string[] {
    // Convert to lowercase and tokenize
    const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
    // Remove stopwords and stem words
    return tokens.map((token: string) => stemmer.stem(token));
  }

  private async detectIntent(text: string): Promise<string> {
    const lowerText = text.toLowerCase().trim();
    
    // First try NLP model if trained
    if (this.isNlpTrained) {
      try {
        const result = await this.nlpManager.process('en', text);
        if (result.intent && result.score > 0.5) {
          console.log(`NLP detected intent: ${result.intent} with score: ${result.score}`);
          return result.intent;
        }
      } catch (error) {
        console.error('NLP processing error:', error);
      }
    }
    // Quick checks for student bodies listing
    if (INTENT_KEYWORDS.LIST_BODIES.some(word => lowerText.includes(word))) {
      return 'list_bodies';
    }

    // Real-time queries
    if (INTENT_KEYWORDS.EVENTS_NOW.some(w => lowerText.includes(w))) return 'events_now';
    if (INTENT_KEYWORDS.UPCOMING_EVENTS.some(w => lowerText.includes(w))) return 'upcoming_events';
    if (INTENT_KEYWORDS.REG_OPEN_EVENTS.some(w => lowerText.includes(w))) return 'upcoming_events';
    if (INTENT_KEYWORDS.POLLS_NOW.some(w => lowerText.includes(w))) return 'polls_now';
    if (INTENT_KEYWORDS.MY_PROFILE.some(w => lowerText.includes(w))) return 'my_profile';
    if (INTENT_KEYWORDS.MY_IDEAS.some(w => lowerText.includes(w))) return 'my_ideas';
    if (INTENT_KEYWORDS.MY_ACHIEVEMENTS.some(w => lowerText.includes(w))) return 'my_achievements';

    // Alias-based body detection (e.g., vsc, sac, ncc, nss, e-cell, alumni, anti-ragging)
    for (const [bodyId, aliases] of Object.entries(BODY_ALIASES)) {
      if (aliases.some(a => lowerText.includes(a))) {
        // Further refine to vertices or achievements if asked
        if (INTENT_KEYWORDS.VERTICES.some(word => lowerText.includes(word))) {
          return `body_vertices_${bodyId}`;
        }
        if (INTENT_KEYWORDS.ACHIEVEMENTS.some(word => lowerText.includes(word))) {
          return `body_achievements_${bodyId}`;
        }
        return `body_info_${bodyId}`;
      }
    }

    // Fallback to keyword-based detection
    // Check for common queries first
    if (INTENT_KEYWORDS.GREETING.some(word => lowerText.includes(word))) {
      console.log(`Keyword detected greeting: ${lowerText}`);
      return 'greeting';
    }
    if (INTENT_KEYWORDS.FAREWELL.some(word => lowerText.includes(word))) {
      return 'farewell';
    }
    if (INTENT_KEYWORDS.THANKS.some(word => lowerText.includes(word))) {
      return 'thanks';
    }
    if (INTENT_KEYWORDS.HELP.some(word => lowerText.includes(word))) {
      return 'help';
    }
    
    // Check for Vignan-specific intents
    if (INTENT_KEYWORDS.NIRF_RANKINGS.some(word => lowerText.includes(word))) {
      return 'nirf_rankings';
    }
    if (INTENT_KEYWORDS.CAMPUS_SPOTS.some(word => lowerText.includes(word))) {
      return 'campus_spots';
    }
    // Campus block specific intents
    if (INTENT_KEYWORDS.H_BLOCK.some(word => lowerText.includes(word))) return 'h_block';
    if (INTENT_KEYWORDS.A_BLOCK.some(word => lowerText.includes(word))) return 'a_block';
    if (INTENT_KEYWORDS.N_BLOCK.some(word => lowerText.includes(word))) return 'n_block';
    if (INTENT_KEYWORDS.U_BLOCK.some(word => lowerText.includes(word))) return 'u_block';
    if (INTENT_KEYWORDS.PHARMACY_BLOCK.some(word => lowerText.includes(word))) return 'pharmacy_block';
    if (INTENT_KEYWORDS.COLLEGE_OVERVIEW_GENERAL.some(word => lowerText.includes(word))) return 'college_overview_general';
    if (INTENT_KEYWORDS.SAC_INFO.some(word => lowerText.includes(word))) {
      return 'sac_info';
    }
    if (INTENT_KEYWORDS.CAMPUS_LIFE.some(word => lowerText.includes(word))) {
      return 'campus_life';
    }
    if (INTENT_KEYWORDS.EVENTS.some(word => lowerText.includes(word))) {
      return 'events';
    }
    if (INTENT_KEYWORDS.BENEFITS.some(word => lowerText.includes(word))) {
      return 'benefits';
    }
    if (INTENT_KEYWORDS.ADMISSIONS.some(word => lowerText.includes(word))) {
      return 'admissions';
    }
    
    // Check for SAC verticals
    for (const vertical of SAC_VERTICALS) {
      if (lowerText.includes(vertical.name.toLowerCase())) {
        return `vertical_${vertical.name.toLowerCase().replace(/\s+/g, '_')}`;
      }
    }
    
    // Check for student bodies
    for (const body of STUDENT_BODIES) {
      if (lowerText.includes(body.name.toLowerCase())) {
        if (INTENT_KEYWORDS.VERTICES.some(word => lowerText.includes(word))) {
          return `body_vertices_${body.name.toLowerCase().replace(/\s+/g, '_')}`;
        }
        if (INTENT_KEYWORDS.ACHIEVEMENTS.some(word => lowerText.includes(word))) {
          return `body_achievements_${body.name.toLowerCase().replace(/\s+/g, '_')}`;
        }
        return `body_info_${body.name.toLowerCase().replace(/\s+/g, '_')}`;
      }
    }
    
    // Check for campus spots
    for (const spot of CAMPUS_SPOTS) {
      if (lowerText.includes(spot.name.toLowerCase())) {
        return `spot_${spot.name.toLowerCase().replace(/\s+/g, '_')}`;
      }
    }
    
    // Check for training examples
    const bestMatch = this.findBestTrainingMatch(text);
    if (bestMatch) {
      return `training_${bestMatch.category.toLowerCase().replace(/\s+/g, '_')}`;
    }
    
    // Check for legacy student bodies
    if (INTENT_KEYWORDS.LIST_BODIES.some(phrase => lowerText.includes(phrase))) {
      return 'list_bodies';
    }
    
    // Check for specific body information (legacy)
    for (const body of studentBodies) {
      if (lowerText.includes(body.name.toLowerCase()) || 
          lowerText.includes(body.id.toLowerCase())) {
        if (INTENT_KEYWORDS.VERTICES.some(word => lowerText.includes(word))) {
          return `body_vertices_${body.id}`;
        }
        if (INTENT_KEYWORDS.ACHIEVEMENTS.some(word => lowerText.includes(word))) {
          return `body_achievements_${body.id}`;
        }
        return `body_info_${body.id}`;
      }
    }
    
    // Check for college information
    if (INTENT_KEYWORDS.COLLEGE_INFO.some(word => lowerText.includes(word))) {
      return 'college_info';
    }
    
    // Check for contact information
    if (INTENT_KEYWORDS.CONTACT.some(word => lowerText.includes(word))) {
      return 'contact_info';
    }
    // If user mentions generic phrase "student body" without listing keywords, return list
    if (lowerText.includes('student body') || lowerText.includes('student bodies') || lowerText.includes('student bodys')) {
      return 'list_bodies';
    }
    return 'unknown';
  }

  private findBestTrainingMatch(text: string): any {
    const lowerText = text.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;
    
    for (const example of TRAINING_EXAMPLES) {
      let score = 0;
      for (const keyword of example.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = example;
      }
    }
    
    return bestScore > 0 ? bestMatch : null;
  }

  private generateResponse(intent: string): string {
    // Handle NLP-trained intents first
    if (intent === 'greeting') {
      const greetings = [
        "Hello! I'm a helpful assistant for Vignan University, Vadlamudi. Ask me about student life, student bodies (like SAC, NCC, NSS), famous spots (U Block, MHP Canteen), NIRF rankings, achievements, and why Vignan is a great choice. How can I help today?",
        "Hi! I can share detailed, friendly info about Vignan University—its vibrant campus life, SAC verticals, Entrepreneurship Cell, achievements, and more. What would you like to explore?",
        "Hey! Curious about Vignan University’s culture, events, student bodies, or benefits like placements and holistic development? I’m here to help with engaging, informative answers."
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    if (intent === 'farewell') {
      return "Goodbye! Feel free to ask if you need any help later.";
    }
    if (intent === 'thanks') {
      return "You're welcome! Is there anything else I can help you with?";
    }
    if (intent === 'help') {
      return "I can help you with information about student bodies, college information, campus spots, events, and more. What would you like to know?";
    }
    if (intent === 'list_bodies') {
      return this.formatBodyList();
    }
    if (intent === 'college_info') {
      return this.getCollegeInfo();
    }
    if (intent === 'campus_spots') {
      return this.getCampusSpots();
    }
    if (intent === 'sac_info') {
      return this.getSACInfo();
    }
    if (intent === 'nirf_rankings') {
      return this.getNIRFRankings();
    }
    if (intent === 'achievements') {
      return this.getAchievements();
    }
    if (intent === 'list_bodies') {
      return this.formatBodyList();
    }

    // Real-time intents handled via async helpers in processMessage
    if (['events_now','upcoming_events','polls_now','my_profile','my_ideas','my_achievements'].includes(intent)) {
      // These are resolved asynchronously in processMessage
      return '';
    }

    // Dynamic intents for Vignan student bodies (by id suffix)
    if (intent.startsWith('body_info_')) {
      const id = intent.replace('body_info_', '');
      return this.getBodyInfo(id);
    }
    if (intent.startsWith('body_vertices_')) {
      const id = intent.replace('body_vertices_', '');
      return this.getBodyVertices(id);
    }
    if (intent.startsWith('body_achievements_')) {
      const id = intent.replace('body_achievements_', '');
      return this.getBodyAchievements(id);
    }
    
    // Handle common queries
    if (commonQueries[intent as keyof typeof commonQueries]) {
      return commonQueries[intent as keyof typeof commonQueries];
    }
    
    // Handle Vignan-specific intents
    if (intent === 'campus_life') {
      return this.getCampusLife();
    }
    if (intent === 'events') {
      return this.getEvents();
    }
    if (intent === 'benefits') {
      return this.getBenefits();
    }
    if (intent === 'admissions') {
      return this.getAdmissionsInfo();
    }
    // Campus block fixed responses
    if (intent === 'h_block') {
      return "H Block houses the departments of ECE, EEE, and Bio-Medical Engineering. It includes various labs such as the APSSDC lab, and faculty cabins are also located here.";
    }
    if (intent === 'a_block') {
      return "A Block contains the Department of Science and Humanities, Department of Social Studies, Department of English and Foreign Languages. It also includes the Finance Office, Admission Office, Chairman’s Cabin, Vice Chancellor’s Cabin, Vice Chairman’s Cabin, and the First Year Freshers’ Building.";
    }
    if (intent === 'n_block') {
      return "N Block includes Lara Oxy Zone and is home to students from CSE and ASE departments. It features well-equipped labs, digital systems, a Sports Department, TBI Office, Drone Lab, and Agriculture Department. Coding creators also reside here. There are 2 seminar halls in this block.";
    }
    if (intent === 'u_block') {
      return "U Block hosts departments such as Law, IT, MBA, BBA, Bio-Tech, Mech-Bio Informatics.";
    }
    if (intent === 'pharmacy_block') {
      return "Pharmacy Block is dedicated to pharmacy students and offers excellent infrastructure.";
    }
    if (intent === 'college_overview_general') {
      return "The college has a diverse and well-structured campus with multiple blocks catering to various departments. It offers modern infrastructure, specialized labs, administrative offices, and vibrant student zones.";
    }
    
    // Handle SAC verticals
    if (intent.startsWith('vertical_')) {
      const verticalName = intent.replace('vertical_', '').replace(/_/g, ' ');
      return this.getVerticalInfo(verticalName);
    }
    
    // Handle Vignan student bodies
    if (intent.startsWith('body_info_')) {
      const bodyName = intent.replace('body_info_', '').replace(/_/g, ' ');
      return this.getVignanBodyInfo(bodyName);
    }
    if (intent.startsWith('body_vertices_')) {
      const bodyName = intent.replace('body_vertices_', '').replace(/_/g, ' ');
      return this.getVignanBodyVertices(bodyName);
    }
    if (intent.startsWith('body_achievements_')) {
      const bodyName = intent.replace('body_achievements_', '').replace(/_/g, ' ');
      return this.getVignanBodyAchievements(bodyName);
    }
    
    // Handle campus spots
    if (intent.startsWith('spot_')) {
      const spotName = intent.replace('spot_', '').replace(/_/g, ' ');
      return this.getSpotInfo(spotName);
    }
    
    // Handle training examples
    if (intent.startsWith('training_')) {
      const category = intent.replace('training_', '').replace(/_/g, ' ');
      const example = TRAINING_EXAMPLES.find(ex => 
        ex.category.toLowerCase().replace(/\s+/g, '_') === category
      );
      return example ? example.answer : RESPONSE_TEMPLATES.notFound;
    }
    
    // Handle legacy intents
    if (intent === 'list_bodies') {
      return this.formatBodyList();
    }
    
    if (intent.startsWith('body_info_') && !intent.includes('vignan')) {
      const bodyId = intent.split('_')[2];
      return this.getBodyInfo(bodyId);
    }
    
    if (intent.startsWith('body_vertices_') && !intent.includes('vignan')) {
      const bodyId = intent.split('_')[2];
      return this.getBodyVertices(bodyId);
    }
    
    if (intent.startsWith('body_achievements_') && !intent.includes('vignan')) {
      const bodyId = intent.split('_')[2];
      return this.getBodyAchievements(bodyId);
    }
    
    if (intent === 'college_info') {
      return this.getCollegeInfo();
    }
    
    if (intent === 'contact_info') {
      return this.getContactInfo();
    }
    
    // Default response for unknown queries
    return "I'm not sure I understand that. I can help you with information about:\n\n" +
           "• Student bodies and organizations\n" +
           "• College information and NIRF rankings\n" +
           "• Campus spots and facilities\n" +
           "• Events and activities\n" +
           "• SAC verticals and clubs\n" +
           "• Campus life and benefits\n\n" +
           "Could you please rephrase your question or ask about one of these topics?";
  }
  
  private formatBodyList(): string {
    return `**Here are the main student bodies at Vignan University:**\n\n` +
      studentBodies.map((body, idx) => `${idx + 1}. **${body.name}**`).join('\n') +
      `\n\nAsk about a specific body (e.g., "VSC", "SAC", "NSS") for full details.`;
  }
  
  private getBodyInfo(bodyId: string): string {
    const body = studentBodies.find(b => b.id === bodyId);
    if (!body) return "I couldn't find information about that student body.";

    const header = `**${body.name}**`;
    const desc = body.description;

    const verts = (body.verticles && body.verticles.length)
      ? [`**Verticals:**`,
         ...body.verticles.map((v, idx) => `${this.toRoman(idx + 1)}. **${v.name}** — ${v.description}`)
        ].join('\n')
      : '';

    const ach = (body.achievements && body.achievements.length)
      ? [`**Achievements:**`,
         ...body.achievements.map((a, idx) => `${idx + 1}. ${a}`)
        ].join('\n')
      : '';

    const footer = `\n_Ask for "<body> verticals" or "<body> achievements" for more._`;

    return [header, '', desc, '', verts, '', ach, footer].filter(Boolean).join('\n');
  }
  
  private getBodyVertices(bodyId: string): string {
    const body = studentBodies.find(b => b.id === bodyId);
    if (!body || !body.verticles?.length) {
      return "I couldn't find any verticles for that student body.";
    }
    
    return `**Verticals in ${body.name}:**\n\n` +
      body.verticles.map((v, idx) => `${this.toRoman(idx + 1)}. **${v.name}** — ${v.description}`).join('\n');
  }
  
  private getBodyAchievements(bodyId: string): string {
    const body = studentBodies.find(b => b.id === bodyId);
    if (!body || !body.achievements?.length) {
      return "I couldn't find any achievements for that student body.";
    }
    
    return `Here are some achievements of ${body.name}:\n\n` +
      body.achievements.map((a, i) => 
        `${i + 1}. ${a}`
      ).join('\n');
  }
  
  private getCollegeInfo(): string {
    return `About ${collegeInfo.name}:\n\n` +
      `${collegeInfo.about}\n\n` +
      `Established: ${collegeInfo.established}\n` +
      `Location: ${collegeInfo.location}\n\n` +
      `Notable spots on campus include:\n` +
      collegeInfo.notableSpots.map(spot => `• ${spot}`).join('\n');
  }
  
  private getContactInfo(): string {
    return `You can contact the college through the following means:\n\n` +
      `Email: ${collegeInfo.contact.email}\n` +
      `Phone: ${collegeInfo.contact.phone}\n` +
      `Address: ${collegeInfo.contact.address}`;
  }

  // Vignan University specific methods
  private getNIRFRankings(): string {
    return `Vignan University has excellent NIRF rankings that reflect our commitment to quality education:\n\n` +
      `🏆 **Top 70 Universities in India**\n` +
      `🏆 **Top 80 Colleges in India**\n\n` +
      `These rankings are a testament to our academic excellence, infrastructure, faculty quality, and student outcomes. ` +
      `Our consistent performance in NIRF rankings demonstrates our dedication to providing world-class education and ` +
      `maintaining high standards across all academic programs.`;
  }

  private getAchievements(): string {
    return `Here are some highlights of Vignan University's achievements and impact:\n\n` +
      ACHIEVEMENTS.map((a, i) =>
        `${i + 1}. **${a.category} – ${a.title}**\n${a.description}\n` +
        (a.significance ? `Significance: ${a.significance}\n` : '')
      ).join('\n') +
      `\n\nThese reflect excellence across academics, innovation, culture, sports, and social responsibility.`;
  }

  private getCampusSpots(): string {
    return `Vignan University has several iconic spots that are central to campus life:\n\n` +
      CAMPUS_SPOTS.map(spot => 
        `📍 **${spot.name}**\n${spot.description}\n\n` +
        `**Significance:** ${spot.significance}\n` +
        `**Activities:** ${spot.activities.join(', ')}\n` +
        `**Atmosphere:** ${spot.atmosphere}\n`
      ).join('\n');
  }

  private getSACInfo(): string {
    return `**SAC (Student Activities Council)** is the umbrella body that coordinates all student-led initiatives, events, and verticals across Vignan University.\n\n` +
      `**Purpose:** To provide a platform for student leadership, creativity, and holistic development\n\n` +
      `**Activities:**\n` +
      `• Coordinating cultural and technical events\n` +
      `• Managing student verticals and clubs\n` +
      `• Organizing annual fests and competitions\n` +
      `• Facilitating student leadership development\n` +
      `• Promoting campus culture and traditions\n\n` +
      `**Verticals under SAC:**\n` +
      SAC_VERTICALS.map(v => `• ${v.name}`).join('\n') + `\n\n` +
      `SAC is perfect for students who want to develop leadership skills, organize events, and contribute to campus life!`;
  }

  private getCampusLife(): string {
    return `Campus life at Vignan University is **vibrant, inclusive, and dynamic**! We offer a rich campus life that balances academics with personal growth.\n\n` +
      `**Major Events:**\n` +
      CAMPUS_LIFE.events.map(event => `• ${event}`).join('\n') + `\n\n` +
      `**Clubs & Organizations:**\n` +
      CAMPUS_LIFE.clubs.map(club => `• ${club}`).join('\n') + `\n\n` +
      `**Opportunities:**\n` +
      CAMPUS_LIFE.opportunities.map(opp => `• ${opp}`).join('\n') + `\n\n` +
      `The campus culture promotes creativity, innovation, collaboration, and holistic development!`;
  }

  private getEvents(): string {
    return `Vignan University hosts numerous exciting events throughout the year:\n\n` +
      CAMPUS_LIFE.events.map(event => `🎉 **${event}**`).join('\n\n') + `\n\n` +
      `Each vertical also organizes specific events like hackathons, art exhibitions, debate competitions, and cultural performances, ` +
      `making campus life exciting and engaging year-round!`;
  }

  private getBenefits(): string {
    return `There are numerous compelling reasons to join Vignan University:\n\n` +
      BENEFITS_OF_JOINING.map(benefit => 
        `**${benefit.category}:**\n` +
        benefit.points.map(point => `• ${point}`).join('\n')
      ).join('\n\n') + `\n\n` +
      `Vignan provides the perfect balance of academic excellence and personal growth!`;
  }

  private getAdmissionsInfo(): string {
    return `For admission information at Vignan University, I recommend:\n\n` +
      `• Visit our official website for detailed admission procedures\n` +
      `• Contact the admissions office directly\n` +
      `• Check our NIRF rankings and academic programs\n` +
      `• Explore our vibrant campus life and student bodies\n` +
      `• Learn about our excellent placement record\n\n` +
      `Would you like to know more about our academic programs, campus life, or student organizations?`;
  }

  private getVerticalInfo(verticalName: string): string {
    const vertical = SAC_VERTICALS.find(v => 
      v.name.toLowerCase() === verticalName.toLowerCase()
    );
    
    if (!vertical) {
      return RESPONSE_TEMPLATES.notFound;
    }
    
    return `**${vertical.name}** - ${vertical.description}\n\n` +
      `**Activities:**\n` +
      vertical.activities.map(activity => `• ${activity}`).join('\n') + `\n\n` +
      `**Skills You Can Develop:**\n` +
      vertical.skills.map(skill => `• ${skill}`).join('\n') + `\n\n` +
      `**Major Events:**\n` +
      vertical.events.map(event => `• ${event}`).join('\n') + `\n\n` +
      `This vertical is perfect for students interested in ${vertical.name.toLowerCase()}!`;
  }

  private getVignanBodyInfo(bodyName: string): string {
    const body = STUDENT_BODIES.find(b => 
      b.name.toLowerCase() === bodyName.toLowerCase()
    );
    
    if (!body) {
      return RESPONSE_TEMPLATES.notFound;
    }
    
    return `**${body.name}**\n\n${body.description}\n\n` +
      `**Purpose:** ${body.purpose}\n\n` +
      `**Activities:**\n` +
      body.activities.map(activity => `• ${activity}`).join('\n') + `\n\n` +
      `**Benefits:**\n` +
      body.benefits.map(benefit => `• ${benefit}`).join('\n') + `\n\n` +
      `To learn more, you can ask about:\n` +
      `• "What are the activities in ${body.name}?"\n` +
      `• "What are the benefits of joining ${body.name}?"`;
  }

  private getVignanBodyVertices(bodyName: string): string {
    const body = STUDENT_BODIES.find(b => 
      b.name.toLowerCase() === bodyName.toLowerCase()
    );
    
    if (!body) {
      return RESPONSE_TEMPLATES.notFound;
    }
    
    return `**${body.name}** focuses on:\n\n` +
      `**Activities:**\n` +
      body.activities.map(activity => `• ${activity}`).join('\n') + `\n\n` +
      `**Benefits:**\n` +
      body.benefits.map(benefit => `• ${benefit}`).join('\n') + `\n\n` +
      `This organization is perfect for students who want to develop skills in ${body.name.toLowerCase()}!`;
  }

  private getVignanBodyAchievements(bodyName: string): string {
    const body = STUDENT_BODIES.find(b => 
      b.name.toLowerCase() === bodyName.toLowerCase()
    );
    
    if (!body) {
      return RESPONSE_TEMPLATES.notFound;
    }
    
    return `**${body.name}** has made significant contributions to campus life and student development:\n\n` +
      `**Key Activities:**\n` +
      body.activities.map(activity => `• ${activity}`).join('\n') + `\n\n` +
      `**Student Benefits:**\n` +
      body.benefits.map(benefit => `• ${benefit}`).join('\n') + `\n\n` +
      `The organization continues to promote ${body.purpose.toLowerCase()} and create opportunities for student growth!`;
  }

  private getSpotInfo(spotName: string): string {
    const spot = CAMPUS_SPOTS.find(s => 
      s.name.toLowerCase() === spotName.toLowerCase()
    );
    
    if (!spot) {
      return RESPONSE_TEMPLATES.notFound;
    }
    
    return `**${spot.name}**\n\n${spot.description}\n\n` +
      `**Significance:** ${spot.significance}\n\n` +
      `**Activities:**\n` +
      spot.activities.map(activity => `• ${activity}`).join('\n') + `\n\n` +
      `**Atmosphere:** ${spot.atmosphere}`;
  }
  
  public async processMessage(message: string, userId: string = 'default'): Promise<string> {
    console.log(`Processing message: "${message}"`);
    
    // Add user message to history
    this.addToHistory({
      text: message,
      timestamp: new Date(),
      sender: 'user'
    });
    
    try {
      // Try Rasa first if available
      if (this.rasaService.isRasaAvailable()) {
        try {
          const rasaResponse = await this.rasaService.processMessage(message, userId);
          console.log(`Rasa response: ${rasaResponse.substring(0, 100)}...`);
          
          this.addToHistory({
            text: rasaResponse,
            timestamp: new Date(),
            sender: 'bot'
          });
          
          return rasaResponse;
        } catch (rasaError) {
          console.log('Rasa failed, falling back to Node-NLP:', rasaError);
          // Fall through to Node-NLP
        }
      }
      
      // Fallback to Node-NLP
      const intent = await this.detectIntent(message);
      console.log(`Detected intent: ${intent}`);
      let response = this.generateResponse(intent);

      // Real-time intents: fetch live data from DB
      if (!response) {
        switch (intent) {
          case 'events_now':
            response = await this.handleEventsNow();
            break;
          case 'upcoming_events':
            response = await this.handleUpcomingEvents();
            break;
          case 'polls_now':
            response = await this.handlePollsNow();
            break;
          case 'my_profile':
            response = await this.handleMyProfile(userId);
            break;
          case 'my_ideas':
            response = await this.handleMyIdeas(userId);
            break;
          case 'my_achievements':
            response = await this.handleMyAchievements(userId);
            break;
        }
      }
      console.log(`Generated response: ${response.substring(0, 100)}...`);
      
      // Add bot response to history
      this.addToHistory({
        text: await response,
        timestamp: new Date(),
        sender: 'bot'
      });
      
      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      const fallbackResponse = "I'm sorry, I'm having trouble understanding that. Could you please rephrase your question? I can help you with information about student bodies, college information, campus spots, events, and more.";
      
      this.addToHistory({
        text: fallbackResponse,
        timestamp: new Date(),
        sender: 'bot'
      });
      
      return fallbackResponse;
    }
  }
  
  private addToHistory(message: ChatMessage): void {
    this.chatHistory.push(message);
    // Keep only the most recent messages
    if (this.chatHistory.length > this.maxHistory * 2) {
      this.chatHistory = this.chatHistory.slice(-this.maxHistory * 2);
    }
  }
  
  public getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  public getConversationStarters(): string[] {
    return CONVERSATION_STARTERS;
  }

  public getWelcomeMessage(): string {
    return RESPONSE_TEMPLATES.greeting;
  }
}
