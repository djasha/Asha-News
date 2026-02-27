#!/bin/bash

echo "🔄 Stopping all existing servers..."
killall -9 node 2>/dev/null
lsof -ti:3001 3000 | xargs kill -9 2>/dev/null
sleep 3

echo "🚀 Starting backend server on port 3001..."
cd /Users/Djasha/CascadeProjects/Asha\ News/server
PORT=3001 node server.js > /tmp/backend-final.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
sleep 5

echo "✅ Checking backend health..."
HEALTH=$(curl -s http://localhost:3001/api/health | jq -r '.status' 2>/dev/null)
if [ "$HEALTH" = "healthy" ]; then
  echo "   ✅ Backend is healthy"
else
  echo "   ❌ Backend failed to start"
  tail -20 /tmp/backend-final.log
  exit 1
fi

echo ""
echo "🚀 Starting frontend server on port 3000..."
cd /Users/Djasha/CascadeProjects/Asha\ News
PORT=3000 npm start > /tmp/frontend-final.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
sleep 10

echo ""
echo "✅ Checking frontend..."
RESPONSE=$(curl -s http://localhost:3000 2>&1 | head -1)
if [[ "$RESPONSE" == *"DOCTYPE"* ]]; then
  echo "   ✅ Frontend is running"
else
  echo "   ⚠️  Frontend may still be starting..."
fi

echo ""
echo "======================================"
echo "🎉 SERVERS RUNNING"
echo "======================================"
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo "Stories:  http://localhost:3000/stories"
echo "Admin:    http://localhost:3000/admin"
echo ""
echo "Backend  PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Logs:"
echo "  Backend:  tail -f /tmp/backend-final.log"
echo "  Frontend: tail -f /tmp/frontend-final.log"
echo ""
echo "To stop: killall -9 node"
echo "======================================"
