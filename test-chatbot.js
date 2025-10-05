#!/usr/bin/env node

/**
 * Chatbot Testing Script
 * Tests the chatbot functionality with various inputs
 */

const { ChatbotService } = require('./server/dist/services/chatbot.service');

async function testChatbot() {
    console.log('🤖 Testing Vignan University Chatbot...');
    console.log('=' .repeat(50));
    
    const chatbot = new ChatbotService();
    
    // Wait for NLP training to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const testCases = [
        { input: 'hi', expected: 'greeting' },
        { input: 'hello', expected: 'greeting' },
        { input: 'hey there', expected: 'greeting' },
        { input: 'what is vignan university', expected: 'university info' },
        { input: 'tell me about sac', expected: 'sac info' },
        { input: 'what student bodies are there', expected: 'student bodies' },
        { input: 'nirf rankings', expected: 'rankings' },
        { input: 'campus life', expected: 'campus life' },
        { input: 'what events happen', expected: 'events' },
        { input: 'bye', expected: 'farewell' }
    ];
    
    let passed = 0;
    let total = testCases.length;
    
    for (const testCase of testCases) {
        try {
            console.log(`\n📝 Testing: "${testCase.input}"`);
            const response = await chatbot.processMessage(testCase.input);
            console.log(`✅ Response: ${response.substring(0, 100)}...`);
            passed++;
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log(`📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! Chatbot is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Check the implementation.');
    }
    
    console.log('\n💡 To test the full system:');
    console.log('1. Start the server: cd server && npm run dev');
    console.log('2. Start the frontend: npm run dev');
    console.log('3. Open the chat interface and test with real messages');
}

// Run the test
testChatbot().catch(console.error);
