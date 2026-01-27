#!/bin/bash

echo "🏥 Health Check"
echo "================"

# Check backend
echo -n "Backend...  "
if curl -s http://localhost:8000/health | grep -q "ok"; then
    echo "✓"
else
    echo "✗"
fi

# Check frontend
echo -n "Frontend... "
if curl -s http://localhost:5173 > /dev/null; then
    echo "✓"
else
    echo "✗"
fi

# Check database
echo -n "Database... "
if nc -z localhost 5432 2>/dev/null; then
    echo "✓"
else
    echo "✗"
fi

# Check Code-LLaMA 34B
echo -n "Code-LLaMA 34B... "
if curl -s http://localhost:8002/health > /dev/null; then
    echo "✓"
else
    echo "✗"
fi

# Check ChromaDB
echo -n "ChromaDB... "
if curl -s http://localhost:8001 > /dev/null; then
    echo "✓"
else
    echo "✗"
fi

echo ""
echo "Done!"