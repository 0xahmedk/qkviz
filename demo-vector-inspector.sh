#!/bin/bash
# Vector Inspector - Quick Demo Script
# This script starts both backend and frontend for testing the Vector Inspector feature

set -e

echo "════════════════════════════════════════════════════════════════"
echo "🔬 QKViz Vector Inspector - Demo Launcher"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "${BLUE}📋 Pre-flight Checklist:${NC}"
echo ""

# Check Python
if command -v python3 &> /dev/null; then
    echo "  ${GREEN}✓${NC} Python found: $(python3 --version)"
else
    echo "  ❌ Python not found"
    exit 1
fi

# Check Node
if command -v node &> /dev/null; then
    echo "  ${GREEN}✓${NC} Node found: $(node --version)"
else
    echo "  ❌ Node not found"
    exit 1
fi

# Check if backend dependencies are installed
echo ""
echo "${BLUE}📦 Checking Dependencies:${NC}"
echo ""

cd backend
if python3 -c "import torch, fastapi" 2>/dev/null; then
    echo "  ${GREEN}✓${NC} Backend dependencies installed"
else
    echo "  ${YELLOW}⚠${NC}  Backend dependencies missing. Installing..."
    pip install -r requirements.txt
fi
cd ..

cd frontend
if [ -d "node_modules" ]; then
    echo "  ${GREEN}✓${NC} Frontend dependencies installed"
else
    echo "  ${YELLOW}⚠${NC}  Frontend dependencies missing. Installing..."
    npm install
fi
cd ..

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "${GREEN}✅ All checks passed!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "${BLUE}🚀 Starting Services:${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo ""
    echo "${YELLOW}🛑 Shutting down services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "  ${BLUE}→${NC} Starting backend on http://localhost:8000..."
cd backend
python3 main.py > /tmp/qkviz-backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 2

if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "  ${GREEN}✓${NC} Backend running (PID: $BACKEND_PID)"
else
    echo "  ❌ Backend failed to start. Check /tmp/qkviz-backend.log"
    exit 1
fi

# Start frontend
echo "  ${BLUE}→${NC} Starting frontend on http://localhost:5173..."
cd frontend
npm run dev > /tmp/qkviz-frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 3

if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "  ${GREEN}✓${NC} Frontend running (PID: $FRONTEND_PID)"
else
    echo "  ❌ Frontend failed to start. Check /tmp/qkviz-frontend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "${GREEN}🎉 QKViz is running!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "  🌐 Frontend: ${BLUE}http://localhost:5173${NC}"
echo "  🔌 Backend:  ${BLUE}http://localhost:8000${NC}"
echo "  📚 API Docs: ${BLUE}http://localhost:8000/docs${NC}"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "${BLUE}📖 How to Test Vector Inspector:${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "  1. Open http://localhost:5173 in your browser"
echo "  2. Click on the 'Training Lab' tab"
echo "  3. Enter some text (e.g., 'The quick brown fox')"
echo "  4. Set epochs to 10-20 for better results"
echo "  5. Click 'Start Training'"
echo "  6. Wait for training to complete (~10-30 seconds)"
echo "  7. Scroll down to see the Attention Matrix"
echo "  8. ${GREEN}Click any colored cell${NC} in the attention matrix"
echo "  9. ${GREEN}🔬 Vector Inspector modal opens!${NC}"
echo "  10. Explore the Q and K vectors, see the math!"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "${YELLOW}📊 Expected Behavior:${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "  • Modal title: '🔬 Vector Inspector'"
echo "  • Shows two tokens: Query (pink) and Key (cyan)"
echo "  • Displays dot product calculation"
echo "  • Shows side-by-side bar charts"
echo "  • Green bars = aligned dimensions"
echo "  • Red bars = opposite dimensions"
echo "  • Explanation text at bottom"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "${BLUE}🐛 Debugging:${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "  Backend logs: tail -f /tmp/qkviz-backend.log"
echo "  Frontend logs: tail -f /tmp/qkviz-frontend.log"
echo ""
echo "  Common issues:"
echo "  • Port 8000 busy: Kill existing process with 'lsof -ti:8000 | xargs kill'"
echo "  • Port 5173 busy: Kill existing process with 'lsof -ti:5173 | xargs kill'"
echo "  • Backend won't start: Check Python dependencies"
echo "  • Frontend won't start: Run 'cd frontend && npm install'"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "${GREEN}Press Ctrl+C to stop all services${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Wait forever
wait
