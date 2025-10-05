import { Server as SocketIOServer, Socket } from 'socket.io';
import { ChatbotService } from '../services/chatbot.service';

export class ChatSocket {
  private io: SocketIOServer;
  private chatbot: ChatbotService;
  private activeUsers: Map<string, { socketId: string; username?: string }> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.chatbot = new ChatbotService();
    this.initializeSocket();
  }

  private initializeSocket(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`✅ New client connected: ${socket.id}`);

      // Handle new user joining
      socket.on('user_join', (username: string) => {
        this.activeUsers.set(socket.id, { socketId: socket.id, username });
        console.log(`👤 ${username} joined the chat`);
        socket.broadcast.emit('user_joined', username);
        
        // Send welcome message
        socket.emit('bot_message', {
          text: 'Hello! I\'m your college assistant. How can I help you today?',
          timestamp: new Date()
        });
        console.log(`🤖 Welcome message sent to ${username}`);
      });

      // Handle incoming messages
      socket.on('user_message', async (message: string) => {
        console.log(`📥 Received message from ${socket.id}: ${message}`);
        const user = this.activeUsers.get(socket.id);
        const username = user?.username || 'Anonymous';
        
        // Check if user has joined
        if (!user) {
          console.log('⚠️ User not joined, sending join request...');
          socket.emit('bot_message', {
            text: 'Please wait, connecting you to the chat...',
            timestamp: new Date()
          });
          return;
        }
        
        // Broadcast the user's message to all clients
        this.io.emit('user_message', {
          text: message,
          username,
          timestamp: new Date()
        });

        try {
          console.log('🤖 Processing message with chatbot...');
          // Process the message with the chatbot
          const response = await this.chatbot.processMessage(message);
          console.log(`🤖 Bot response: ${response.substring(0, 100)}...`);
          
          // Send the bot's response
          socket.emit('bot_message', {
            text: response,
            timestamp: new Date()
          });
          console.log('📤 Bot response sent to client');
        } catch (error) {
          console.error('❌ Error processing message:', error);
          socket.emit('bot_message', {
            text: 'Sorry, I encountered an error processing your message. Please try again.',
            timestamp: new Date()
          });
        }
      });

      // Handle typing indicator
      socket.on('typing', () => {
        const user = this.activeUsers.get(socket.id);
        if (user?.username) {
          socket.broadcast.emit('user_typing', user.username);
        }
      });

      // Handle test connection
      socket.on('test_connection', () => {
        console.log(`🧪 Test connection from ${socket.id}`);
        socket.emit('bot_message', {
          text: 'Connection test successful! Chatbot is working.',
          timestamp: new Date()
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        const user = this.activeUsers.get(socket.id);
        if (user?.username) {
          this.io.emit('user_left', user.username);
          console.log(`👋 ${user.username} left the chat`);
        }
        this.activeUsers.delete(socket.id);
      });
    });
  }
}
