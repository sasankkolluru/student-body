#!/usr/bin/env python3
"""
Rasa Chatbot Server for Vignan University
Integrates with the Node.js backend via HTTP API
"""

import asyncio
import json
import logging
from typing import Dict, Any
import aiohttp
from aiohttp import web
import socketio
from rasa.core.agent import Agent
from rasa.core.utils import EndpointConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RasaChatbotServer:
    def __init__(self):
        self.agent = None
        self.sio = socketio.AsyncServer(cors_allowed_origins="*")
        self.app = web.Application()
        self.sio.attach(self.app)
        self.setup_routes()
        self.setup_socket_events()

    async def load_agent(self):
        """Load the trained Rasa agent"""
        try:
            # Load the trained model
            self.agent = Agent.load("models")
            logger.info("Rasa agent loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Rasa agent: {e}")
            # Create a fallback agent
            self.agent = None

    def setup_routes(self):
        """Setup HTTP routes"""
        self.app.router.add_post('/webhook', self.webhook_handler)
        self.app.router.add_get('/health', self.health_check)

    def setup_socket_events(self):
        """Setup Socket.IO events"""
        
        @self.sio.event
        async def connect(sid, environ):
            logger.info(f"Client connected: {sid}")

        @self.sio.event
        async def disconnect(sid):
            logger.info(f"Client disconnected: {sid}")

        @self.sio.event
        async def user_message(sid, data):
            """Handle incoming user messages"""
            try:
                message = data.get('message', '')
                logger.info(f"Received message from {sid}: {message}")
                
                if self.agent:
                    # Process with Rasa
                    response = await self.agent.handle_text(message)
                    bot_message = response[0]['text'] if response else "I'm sorry, I didn't understand that. Can you please rephrase?"
                else:
                    # Fallback response
                    bot_message = "I'm currently unavailable. Please try again later."
                
                # Send response back to client
                await self.sio.emit('bot_message', {
                    'text': bot_message,
                    'timestamp': str(asyncio.get_event_loop().time())
                }, room=sid)
                
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                await self.sio.emit('bot_message', {
                    'text': "I'm sorry, I encountered an error. Please try again.",
                    'timestamp': str(asyncio.get_event_loop().time())
                }, room=sid)

    async def webhook_handler(self, request):
        """Handle webhook requests from Node.js backend"""
        try:
            data = await request.json()
            message = data.get('message', '')
            user_id = data.get('user_id', 'unknown')
            
            logger.info(f"Webhook received from {user_id}: {message}")
            
            if self.agent:
                # Process with Rasa
                response = await self.agent.handle_text(message)
                bot_message = response[0]['text'] if response else "I'm sorry, I didn't understand that. Can you please rephrase?"
            else:
                # Fallback response
                bot_message = "I'm currently unavailable. Please try again later."
            
            return web.json_response({
                'response': bot_message,
                'user_id': user_id,
                'timestamp': str(asyncio.get_event_loop().time())
            })
            
        except Exception as e:
            logger.error(f"Error in webhook handler: {e}")
            return web.json_response({
                'error': 'Internal server error',
                'response': "I'm sorry, I encountered an error. Please try again."
            }, status=500)

    async def health_check(self, request):
        """Health check endpoint"""
        return web.json_response({
            'status': 'healthy',
            'agent_loaded': self.agent is not None,
            'timestamp': str(asyncio.get_event_loop().time())
        })

    async def start_server(self, host='localhost', port=5005):
        """Start the server"""
        await self.load_agent()
        
        logger.info(f"Starting Rasa chatbot server on {host}:{port}")
        web.run_app(self.app, host=host, port=port)

if __name__ == '__main__':
    server = RasaChatbotServer()
    asyncio.run(server.start_server())
