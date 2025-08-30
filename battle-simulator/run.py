#!/usr/bin/env python3
"""
Run script for the Fire Emblem Style Battle Simulator
"""

import os
import sys
import subprocess

def main():
    """Main entry point"""
    print("🔥 Fire Emblem Style Battle Simulator 🔥")
    print("Starting Flask development server...")
    print("Open your browser to: http://localhost:5000")
    print("Press Ctrl+C to stop the server")
    print("-" * 50)

    # Check if we're in a virtual environment
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠️  Virtual environment not activated!")
        print("Run: source venv/bin/activate && python run.py")
        return

    # Import and run Flask app
    from app import app
    app.run(debug=True, host='0.0.0.0', port=5000)

if __name__ == '__main__':
    main()
