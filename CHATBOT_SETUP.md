# Vignan University Chatbot Setup Guide

## Overview
This project includes a comprehensive chatbot system for Vignan University with both Node-NLP and Rasa integration for maximum efficiency and accuracy.

## Features
- ✅ **Dual AI System**: Node-NLP as primary, Rasa as advanced fallback
- ✅ **Comprehensive Training**: Extensive training data for Vignan University
- ✅ **Real-time Chat**: WebSocket-based real-time communication
- ✅ **Intent Recognition**: Advanced intent detection and response generation
- ✅ **Context Awareness**: Maintains conversation history and context
- ✅ **Fallback Handling**: Graceful degradation when services are unavailable

## Quick Start

### Windows
```bash
# Run the automated setup script
setup-chatbot.bat
```

### Linux/Mac
```bash
# Make the script executable and run
chmod +x setup-chatbot.sh
./setup-chatbot.sh
```

## Manual Setup

### 1. Server Setup
```bash
cd server
npm install
npm run build
```

### 2. Frontend Setup
```bash
npm install
```

### 3. Rasa Setup (Optional but Recommended)
```bash
cd rasa-chatbot

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Train the model
python train.py

# Start Rasa server
python rasa_server.py
```

## Starting the System

### Option 1: With Rasa (Recommended)
1. **Terminal 1**: Start Rasa server
   ```bash
   cd rasa-chatbot
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   python rasa_server.py
   ```

2. **Terminal 2**: Start Node.js server
   ```bash
   cd server
   npm run dev
   ```

3. **Terminal 3**: Start frontend
   ```bash
   npm run dev
   ```

### Option 2: Node-NLP Only
1. **Terminal 1**: Start Node.js server
   ```bash
   cd server
   npm run dev
   ```

2. **Terminal 2**: Start frontend
   ```bash
   npm run dev
   ```

## Testing the Chatbot

### Automated Testing
```bash
node test-chatbot.js
```

### Manual Testing
1. Open the application in your browser
2. Click the chat icon in the bottom-right corner
3. Test with various messages:
   - "hi" or "hello"
   - "tell me about vignan university"
   - "what is sac"
   - "what student bodies are there"
   - "nirf rankings"
   - "campus life"
   - "what events happen"

## Chatbot Capabilities

### Greetings & Basic Interaction
- Responds to "hi", "hello", "hey", "good morning", etc.
- Handles farewells and thanks
- Provides help and guidance

### University Information
- Vignan University overview and history
- NIRF rankings (Top 70 universities, Top 80 colleges)
- Academic programs and achievements
- Campus life and culture

### Student Bodies
- SAC (Student Activities Council) with 8 verticals
- Entrepreneurship Cell
- Vignan Sports Contingent
- Anti-Ragging Committee
- NCC (National Cadet Corps)
- NSS (National Service Scheme)

### Campus Information
- Famous spots (U Block, MHP Canteen)
- Campus events and activities
- Student life and opportunities
- Benefits of joining Vignan

### SAC Verticals
- Culturals (Dance, Music & Theatre Arts)
- Literary (Readers, Writers & Orators)
- Fine Arts (Arts, Crafts & Ambience)
- Public Relations & Digital Marketing
- Technical Design
- Logistics
- Stage Management
- Photography

## Troubleshooting

### Common Issues

1. **"hi" not working**
   - Check server logs for NLP training status
   - Ensure the chatbot service is properly initialized
   - Try restarting the server

2. **Dependencies not installing**
   - Run `npm install` in both root and server directories
   - Check Node.js version (requires 16+)
   - Clear npm cache: `npm cache clean --force`

3. **Rasa not working**
   - Ensure Python 3.8+ is installed
   - Check virtual environment is activated
   - Verify all Python dependencies are installed
   - Check Rasa server is running on port 5005

4. **Socket connection issues**
   - Check CORS settings in server configuration
   - Verify WebSocket path is correct
   - Ensure ports are not blocked by firewall

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG=chatbot:* npm run dev
```

## Architecture

### Node-NLP Integration
- Primary chatbot service using node-nlp
- Comprehensive training data for Vignan University
- Intent detection and response generation
- Fallback responses for unknown queries

### Rasa Integration
- Advanced conversational AI capabilities
- More sophisticated intent recognition
- Context-aware responses
- HTTP API integration with Node.js backend

### WebSocket Communication
- Real-time message exchange
- Typing indicators
- User presence tracking
- Message history management

## Performance Optimization

### Training Data
- Extensive training examples for all intents
- Multiple variations of common phrases
- Context-aware response generation
- Regular model updates and retraining

### Response Time
- Cached responses for common queries
- Efficient intent detection algorithms
- Optimized database queries
- Connection pooling for external services

## Contributing

### Adding New Intents
1. Update `trainingData.ts` with new examples
2. Add intent keywords to `INTENT_KEYWORDS`
3. Implement response generation in `generateResponse()`
4. Test with various input variations

### Improving Rasa Model
1. Add new training examples to `data/nlu.yml`
2. Update stories in `data/stories.yml`
3. Modify domain configuration in `domain.yml`
4. Retrain the model with `python train.py`

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs for error messages
3. Test individual components separately
4. Verify all dependencies are properly installed

## License

This project is part of the Vignan University Student Body Management System.
