#!/bin/bash

# SeatSwap Backend Test Runner
# Quick start script for running tests

echo "🧪 SeatSwap Backend Test Suite"
echo "================================"
echo ""

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install it first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "✅ Bun found: $(bun --version)"
echo ""

# Check for required environment variables
if [ -z "$JWT_SECRET" ]; then
    echo "⚠️  Warning: JWT_SECRET not set. Some tests may fail."
    echo "   export JWT_SECRET='your-test-secret'"
fi

echo ""
echo "📊 Test Coverage:"
echo "   - Utils: 31 tests (✅ Complete)"
echo "   - Controllers: 32 tests (⚠️  Database mocking needed)"
echo "   - Middleware: 4 tests (⚠️  JWT validation needs real tokens)"
echo ""

# Parse command line arguments
case "${1}" in
    "utils")
        echo "🔬 Running Utils Tests..."
        bun test src/utils/__tests__/
        ;;
    "controllers")
        echo "🎮 Running Controller Tests..."
        bun test src/controllers/__tests__/
        ;;
    "middleware")
        echo "🛡️  Running Middleware Tests..."
        bun test src/middleware/__tests__/
        ;;
    "watch")
        echo "👀 Running Tests in Watch Mode..."
        bun test --watch
        ;;
    "coverage")
        echo "📈 Running Tests with Coverage..."
        echo "⚠️  Coverage reporting not yet configured"
        bun test
        ;;
    *)
        echo "🚀 Running All Tests..."
        echo ""
        bun test
        ;;
esac

echo ""
echo "================================"
echo "✨ Test run complete!"
echo ""
echo "💡 Tips:"
echo "   - Run specific tests: ./run-tests.sh utils"
echo "   - Watch mode: ./run-tests.sh watch"
echo "   - See TEST_SUMMARY.md for detailed info"
