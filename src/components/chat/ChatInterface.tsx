import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, MessageSquare, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { API_BASE } from '../../lib/api';

interface Message {
  text: string;
  username?: string;
  timestamp: Date;
  type: 'user' | 'bot';
}

const ChatInterface: React.FC = () => {
  const USE_MOCK = (import.meta.env.VITE_USE_MOCK || '').toString().toLowerCase() === 'true';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Campus Info Bot: local intent/rule-based responder (component scope)
  const getCampusInfoReply = (qRaw: string): string | null => {
    const q = (qRaw || '').toLowerCase().trim();
    if (!q) return null;

    // Normalize common references
    const mentions = {
      greet: /\b(hi|hello|hey|good\s*(morning|afternoon|evening))\b/i,
      a: /\b(a\s*block|\ba\b block|\ba\b)\b/i,
      h: /\b(h\s*block|\bh\b block|\bh\b)\b/i,
      n: /\b(n\s*block|\bn\b block|\bn\b)\b/i,
      u: /\b(u\s*block|\bu\b block|\bu\b)\b/i,
      pharmacy: /\b(pharmacy\s*block|pharmacy)\b/i,
      blocksList: /(what\s+blocks|blocks\s+in\s+vignan|list\s+blocks|which\s+blocks)/i,
      overview: /(how\s+is\s+college|about\s+college|campus\s+overview|tell\s+me\s+about\s+college)/i,
      directions: /(how\s+to\s+reach|directions|way\s+to\s+|route\s+to\s+)/i,
    } as const;

    // Greetings handled locally for instant feedback
    if (mentions.greet.test(qRaw)) {
      return "Hello! I'm your campus assistant. Ask me about A/H/N/U/Pharmacy blocks or say 'How is college?' for an overview. For other topics I'll connect to the server.";
    }

    // Exact block responses
    if (mentions.h.test(qRaw)) {
      return 'H Block houses the departments of ECE, EEE, and Bio-Medical Engineering. It includes various labs such as the APSSDC lab, and faculty cabins are also located here.';
    }
    if (mentions.a.test(qRaw)) {
      return 'A Block contains the Department of Science and Humanities, Department of Social Studies, Department of English and Foreign Languages. It also includes the Finance Office, Admission Office, Chairman’s Cabin, Vice Chancellor’s Cabin, Vice Chairman’s Cabin, and the First Year Freshers’ Building.';
    }
    if (mentions.n.test(qRaw)) {
      return 'N Block includes Lara Oxy Zone and is home to students from CSE and ASE departments. It features well-equipped labs, digital systems, a Sports Department, TBI Office, Drone Lab, and Agriculture Department. Coding creators also reside here. There are 2 seminar halls in this block.';
    }
    if (mentions.u.test(qRaw)) {
      return 'U Block hosts departments such as Law, IT, MBA, BBA, Bio-Tech, Mech-Bio Informatics.';
    }
    if (mentions.pharmacy.test(qRaw)) {
      return 'Pharmacy Block is dedicated to pharmacy students and offers excellent infrastructure.';
    }

    // Blocks list
    if (mentions.blocksList.test(qRaw)) {
      return [
        '**Campus Blocks:**',
        '- A Block',
        '- H Block',
        '- N Block',
        '- U Block',
        '- Pharmacy Block',
        '',
        'Ask about any block for details.',
      ].join('\n');
    }

    // Overview
    if (mentions.overview.test(qRaw)) {
      return 'The college has a diverse and well-structured campus with multiple blocks catering to various departments. It offers modern infrastructure, specialized labs, administrative offices, and vibrant student zones.';
    }

    // Directions: give generic guidance
    if (mentions.directions.test(qRaw)) {
      return [
        '**Directions:**',
        '- From the main gate, follow campus signage towards the central corridor.',
        '- Look for block name boards (A, H, N, U, Pharmacy).',
        '- For precise directions, check campus maps on-site or ask the helpdesk near Admissions.',
      ].join('\n');
    }

    return null;
  };

  // Initialize socket connection with fallback candidates
  useEffect(() => {
    // In a real app, you would get the username from your auth context
    const user = localStorage.getItem('user');
    const userData = user ? JSON.parse(user) : null;
    const userDisplayName = userData?.name || 'Guest';
    setUsername(userDisplayName);

    // In mock mode, inform user but still attempt websocket connection.
    if (USE_MOCK) {
      addMessage({
        text: 'Running in mock mode. I will still try to connect to the chat server. If it is not running, I will answer locally for campus info.',
        timestamp: new Date(),
        type: 'bot',
      });
    }

    // Derive socket base from API_BASE (which may be like http://localhost:4000/api)
    const socketBase = (import.meta.env.VITE_API_BASE as string || '').replace(/\/api\/?$/, '');
    const SOCKET_OVERRIDE = (import.meta.env as any).VITE_SOCKET_HOST as string | undefined;
    // Prefer last successful URL if present
    const lastUrl = typeof window !== 'undefined' ? localStorage.getItem('chat_last_socket_url') || '' : '';
    // Build dynamic LAN candidate; if page is https and override/base are http, browsers may block. Prefer matching protocol.
    const dynHost = (typeof window !== 'undefined' && window.location && window.location.hostname)
      ? `${window.location.protocol}//${window.location.hostname}:4000`
      : '';
    // If VITE_SOCKET_HOST is provided, use it exclusively as the primary target
    let baseCandidates = [
      SOCKET_OVERRIDE || '',
      socketBase,
      dynHost,
      'http://localhost:4000',
      'http://127.0.0.1:4000',
    ].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i);

    // Align protocol: if page is https and any candidate is http to same host, prefer https version
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      baseCandidates = baseCandidates.map((u) => u.startsWith('http://') && u.includes(window.location.hostname)
        ? u.replace('http://', 'https://')
        : u
      );
    }
    const candidates = (
      lastUrl && baseCandidates.includes(lastUrl)
        ? [lastUrl, ...baseCandidates.filter((u) => u !== lastUrl)]
        : baseCandidates
    );

    let activeSocket: Socket | null = null;
    let candidateIndex = 0;
    let healthTimer: any = null;
    let announcedDisconnect = false;

    const tryConnect = (url: string) => {
      const s = io(url, {
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      // Attach listeners once per socket instance
      s.on('connect', () => {
        console.log('✅ Connected to WebSocket server at', url);
        setIsConnected(true);
        s.emit('user_join', userDisplayName);
        // Test connection after join
        s.emit('test_connection');
        try { localStorage.setItem('chat_last_socket_url', url); } catch {}
      });

      s.on('disconnect', () => {
        console.log('❌ Disconnected from WebSocket server');
        setIsConnected(false);
        if (!announcedDisconnect) {
          announcedDisconnect = true;
          addMessage({ text: 'Disconnected from chat server. Attempting to reconnect…', timestamp: new Date(), type: 'bot' });
        }
      });

      let notifiedExhausted = false;
      s.on('connect_error', (error) => {
        console.error('❌ Connection error:', error.message || error);
        setIsConnected(false);
        // Move to next candidate
        if (candidateIndex < candidates.length - 1) {
          candidateIndex += 1;
          const nextUrl = candidates[candidateIndex];
          // Inform once when switching candidates
          addMessage({ text: `Reconnecting chat… trying ${nextUrl}`, timestamp: new Date(), type: 'bot' });
          s.removeAllListeners();
          s.disconnect();
          // Force a fresh connection to the next candidate
          setTimeout(() => tryConnect(nextUrl), 250);
        } else {
          // Do not spam messages; allow Socket.IO to keep retrying on the last URL indefinitely
          if (!notifiedExhausted) {
            notifiedExhausted = true;
            addMessage({ text: 'Chat is waiting for the server to come online… will auto-connect when available.', timestamp: new Date(), type: 'bot' });
          }
        }
      });

      // Shared listeners
      s.on('bot_message', (data: { text: string; timestamp: string }) => {
        console.log('📥 Received bot message:', data.text);
        const ts = new Date((data as any).timestamp);
        const safeTs = isNaN(ts.getTime()) ? new Date() : ts;
        addMessage({
          text: data.text,
          timestamp: safeTs,
          type: 'bot',
        });
        // Once we receive a message, we are connected; reset disconnect notice flag
        announcedDisconnect = false;
      });

      // Events updated real-time -> fetch upcoming and post
      s.on('events:updated', async () => {
        console.log('📡 Received events:updated');
        const text = await fetchAndFormatUpcomingEvents();
        if (text) {
          addMessage({ text, timestamp: new Date(), type: 'bot' });
        }
      });

      s.on('user_typing', (typingUsername: string) => {
        if (typingUsername !== userDisplayName) {
          setIsTyping(true);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 2000);
        }
      });

      s.on('user_joined', (joinedUsername: string) => {
        if (joinedUsername !== userDisplayName) {
          addMessage({
            text: `${joinedUsername} joined the chat`,
            timestamp: new Date(),
            type: 'bot',
          });
        }
      });

      s.on('user_left', (leftUsername: string) => {
        if (leftUsername !== userDisplayName) {
          addMessage({
            text: `${leftUsername} left the chat`,
            timestamp: new Date(),
            type: 'bot',
          });
        }
      });
      activeSocket = s;
      setSocket(s);
    };

  // Campus Info Bot: local intent/rule-based responder
  const getCampusInfoReply = (qRaw: string): string | null => {
    const q = (qRaw || '').toLowerCase().trim();
    if (!q) return null;

    // Normalize common references
    const mentions = {
      greet: /\b(hi|hello|hey|good\s*(morning|afternoon|evening))\b/i,
      a: /\b(a\s*block|\ba\b block|\ba\b)\b/i,
      h: /\b(h\s*block|\bh\b block|\bh\b)\b/i,
      n: /\b(n\s*block|\bn\b block|\bn\b)\b/i,
      u: /\b(u\s*block|\bu\b block|\bu\b)\b/i,
      pharmacy: /\b(pharmacy\s*block|pharmacy)\b/i,
      blocksList: /(what\s+blocks|blocks\s+in\s+vignan|list\s+blocks|which\s+blocks)/i,
      overview: /(how\s+is\s+college|about\s+college|campus\s+overview|tell\s+me\s+about\s+college)/i,
      directions: /(how\s+to\s+reach|directions|way\s+to\s+|route\s+to\s+)/i,
    } as const;

    // Greetings handled locally for instant feedback
    if (mentions.greet.test(qRaw)) {
      return "Hello! I'm your campus assistant. Ask me about A/H/N/U/Pharmacy blocks or say 'How is college?' for an overview. For other topics I'll connect to the server.";
    }

    // Exact block responses
    if (mentions.h.test(qRaw)) {
      return 'H Block houses the departments of ECE, EEE, and Bio-Medical Engineering. It includes various labs such as the APSSDC lab, and faculty cabins are also located here.';
    }
    if (mentions.a.test(qRaw)) {
      return 'A Block contains the Department of Science and Humanities, Department of Social Studies, Department of English and Foreign Languages. It also includes the Finance Office, Admission Office, Chairman’s Cabin, Vice Chancellor’s Cabin, Vice Chairman’s Cabin, and the First Year Freshers’ Building.';
    }
    if (mentions.n.test(qRaw)) {
      return 'N Block includes Lara Oxy Zone and is home to students from CSE and ASE departments. It features well-equipped labs, digital systems, a Sports Department, TBI Office, Drone Lab, and Agriculture Department. Coding creators also reside here. There are 2 seminar halls in this block.';
    }
    if (mentions.u.test(qRaw)) {
      return 'U Block hosts departments such as Law, IT, MBA, BBA, Bio-Tech, Mech-Bio Informatics.';
    }
    if (mentions.pharmacy.test(qRaw)) {
      return 'Pharmacy Block is dedicated to pharmacy students and offers excellent infrastructure.';
    }

    // Blocks list
    if (mentions.blocksList.test(qRaw)) {
      return [
        '**Campus Blocks:**',
        '- A Block',
        '- H Block',
        '- N Block',
        '- U Block',
        '- Pharmacy Block',
        '',
        'Ask about any block for details.',
      ].join('\n');
    }

    // Overview
    if (mentions.overview.test(qRaw)) {
      return 'The college has a diverse and well-structured campus with multiple blocks catering to various departments. It offers modern infrastructure, specialized labs, administrative offices, and vibrant student zones.';
    }

    // Directions: give generic guidance
    if (mentions.directions.test(qRaw)) {
      return [
        '**Directions:**',
        '- From the main gate, follow campus signage towards the central corridor.',
        '- Look for block name boards (A, H, N, U, Pharmacy).',
        '- For precise directions, check campus maps on-site or ask the helpdesk near Admissions.',
      ].join('\n');
    }

    return null;
  };

    // Kick off first candidate
    tryConnect(candidates[candidateIndex]);

    // Background health check: find a live backend and (re)connect silently
    const checkHealth = async () => {
      if (isConnected) return; // already connected
      for (const base of candidates) {
        try {
          const res = await fetch(`${base}/api/health`, { method: 'GET' });
          if (res.ok) {
            // Found a live server; if no socket or disconnected, try reconnecting to this base
            if (!activeSocket || activeSocket.disconnected) {
              console.log('[Chat] Health check found server at', base, 'reconnecting…');
              candidateIndex = candidates.indexOf(base);
              tryConnect(base);
            }
            break;
          }
        } catch {}
      }
    };
    healthTimer = setInterval(checkHealth, 5000);

    // Clean up on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (healthTimer) clearInterval(healthTimer);
      activeSocket?.removeAllListeners();
      activeSocket?.disconnect();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (message: Omit<Message, 'id'>) => {
    setMessages((prev) => [...prev, { ...message }]);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) {
      console.log('❌ Cannot send message: empty input');
      return;
    }

    console.log('📤 Sending message:', inputMessage);

    // Add user message to UI immediately
    const newMessage: Message = {
      text: inputMessage,
      username,
      timestamp: new Date(),
      type: 'user',
    };
    
    setMessages((prev) => [...prev, newMessage]);
    const userText = inputMessage;
    setInputMessage('');

    // Local Campus Info Bot handling
    const localReply = getCampusInfoReply(userText);
    if (localReply) {
      console.log('[Chatbot] Local intent matched. Replying locally.');
      addMessage({ text: localReply, timestamp: new Date(), type: 'bot' });
    } else {
      // Fallback: send to server if available, otherwise guaranteed local response
      if (socket) {
        console.log('[Chatbot] No local match. Emitting to server.');
        socket.emit('user_message', userText);
        console.log('📤 Message emitted to server');
      } else {
        console.warn('[Chatbot] No local match and no socket. Responding locally and continuing to reconnect.');
        // Immediate local fallback so user always gets a response
        const fallback = [
          "I'm currently running in local mode and trying to reconnect to the server.",
          'Here are some things I can help with right now:',
          '- Ask about A/H/N/U/Pharmacy blocks',
          '- Ask for a campus overview or directions',
          '',
          'Meanwhile, you can use the News & Live Scores, Voting, and Messages pages. I will auto-connect when the server is available.'
        ].join('\n');
        addMessage({ text: fallback, timestamp: new Date(), type: 'bot' });
      }
    }
    
    // Focus input again
    inputRef.current?.focus();
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing');
    }
  };

  // Helper: fetch upcoming events and format as markdown
  const fetchAndFormatUpcomingEvents = async (): Promise<string | null> => {
    try {
      // API_BASE already includes '/api'
      const res = await fetch(`${API_BASE}/events/upcoming?days=14`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to load events (${res.status})`);
      const events: Array<{ title: string; startAt: string; endAt?: string; location?: string }>= await res.json();
      if (!events.length) return 'No upcoming events in the next 14 days.';
      const lines: string[] = ['**Upcoming Events (next 14 days):**', ''];
      events.forEach((e, i) => {
        const when = `${new Date(e.startAt).toLocaleString()}${e.endAt ? ' – ' + new Date(e.endAt).toLocaleString() : ''}`;
        lines.push(`${i + 1}. **${e.title}** — ${when}${e.location ? ' @ ' + e.location : ''}`);
      });
      return lines.join('\n');
    } catch (err) {
      console.error('fetchAndFormatUpcomingEvents error', err);
      return null;
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Focus input when opening chat
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      // Local welcome to confirm UI works
      addMessage({
        text: 'Hi! You can ask about A/H/N/U/Pharmacy blocks or a campus overview. I\'ll answer instantly. For other topics I\'ll connect to the server.',
        timestamp: new Date(),
        type: 'bot',
      });
    }
  };

  // Format time as HH:MM
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden flex flex-col"
            style={{ height: '600px' }}
          >
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className={cn('inline-block w-2 h-2 rounded-full', isConnected ? 'bg-green-400' : 'bg-yellow-300 animate-pulse')} />
                <h2 className="text-lg font-semibold">College Assistant</h2>
              </div>
              <button
                onClick={toggleChat}
                className="text-white hover:text-gray-200 focus:outline-none"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
              {!isConnected && (
                <button
                  onClick={() => window.location.reload()}
                  className="ml-2 text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded"
                >
                  Reconnect
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex',
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-xs md:max-w-md rounded-lg px-4 py-2 text-sm',
                        message.type === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow'
                      )}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                      <div className="text-xs opacity-70 mt-1 text-right">
                        {formatTime(new Date(message.timestamp))}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Ask about student bodies, events, or college information
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat toggle button */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleChat}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Open chat"
        >
          <MessageSquare size={24} />
        </motion.button>
      )}
    </div>
  );
};

export default ChatInterface;
