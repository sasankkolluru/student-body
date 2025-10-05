#!/usr/bin/env python3
"""
Training script for Rasa chatbot
"""

import subprocess
import sys
import os

def run_command(command):
    """Run a command and return the result"""
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✓ {command}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ {command}")
        print(f"Error: {e.stderr}")
        return False

def main():
    """Main training function"""
    print("🤖 Training Rasa Chatbot for Vignan University...")
    print("=" * 50)
    
    # Check if rasa is installed
    if not run_command("rasa --version"):
        print("❌ Rasa is not installed. Please install it first:")
        print("pip install -r requirements.txt")
        return False
    
    # Train the model
    print("\n📚 Training the model...")
    if not run_command("rasa train"):
        print("❌ Training failed!")
        return False
    
    print("\n✅ Training completed successfully!")
    print("\nTo start the server, run:")
    print("python rasa_server.py")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
