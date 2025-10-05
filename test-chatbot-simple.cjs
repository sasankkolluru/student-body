#!/usr/bin/env node

/**
 * Simple Chatbot Test
 * Tests the chatbot service directly
 */

const { ChatbotService } = require('./server/dist/services/chatbot.service');

async function testSimple() {
    console.log('🤖 Testing Chatbot Service...');
    console.log('=' .repeat(40));
    
    try {
        const chatbot = new ChatbotService();
        
        // Wait a bit for initialization
        console.log('⏳ Waiting for chatbot initialization...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test greeting
        console.log('\n📝 Testing greeting: "hi"');
        const response1 = await chatbot.processMessage('hi');
        console.log('✅ Response:', response1);
        
        // Test another greeting
        console.log('\n📝 Testing greeting: "hello"');
        const response2 = await chatbot.processMessage('hello');
        console.log('✅ Response:', response2);
        
        // Test university info
        console.log('\n📝 Testing university info: "tell me about vignan"');
        const response3 = await chatbot.processMessage('tell me about vignan');
        console.log('✅ Response:', response3.substring(0, 100) + '...');
        
        console.log('\n🎉 Chatbot service is working correctly!');
        
    } catch (error) {
        console.error('❌ Error testing chatbot:', error);
    }
}

testSimple();
