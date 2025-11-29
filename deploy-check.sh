#!/bin/bash

# SeatSwap Backend - Production Deployment Script
# This script helps prepare your backend for production deployment

set -e

echo "🚀 SeatSwap Backend - Production Deployment Checker"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check environment variable
check_env_var() {
  local var_name=$1
  local is_required=$2
  
  if grep -q "^${var_name}=" .env 2>/dev/null; then
    value=$(grep "^${var_name}=" .env | cut -d '=' -f2)
    if [[ -z "$value" ]] || [[ "$value" == *"your_"* ]] || [[ "$value" == *"EXAMPLE"* ]]; then
      if [[ "$is_required" == "true" ]]; then
        echo -e "${RED}✗${NC} $var_name is not configured"
        ((ERRORS++))
      else
        echo -e "${YELLOW}⚠${NC} $var_name is not configured (optional)"
        ((WARNINGS++))
      fi
    else
      echo -e "${GREEN}✓${NC} $var_name is configured"
    fi
  else
    if [[ "$is_required" == "true" ]]; then
      echo -e "${RED}✗${NC} $var_name is missing"
      ((ERRORS++))
    else
      echo -e "${YELLOW}⚠${NC} $var_name is missing (optional)"
      ((WARNINGS++))
    fi
  fi
}

# Check if .env exists
echo "Checking environment configuration..."
if [ ! -f .env ]; then
  echo -e "${RED}✗ .env file not found!${NC}"
  echo "  Run: cp .env.example .env"
  exit 1
fi

# Check required environment variables
echo ""
echo "Checking required environment variables:"
check_env_var "MONGODB_URI" "true"
check_env_var "JWT_SECRET" "true"
check_env_var "AWS_REGION" "true"
check_env_var "AWS_S3_BUCKET_NAME" "true"
check_env_var "AWS_ACCESS_KEY_ID" "true"
check_env_var "AWS_SECRET_ACCESS_KEY" "true"
check_env_var "SEATSWAP_EOA_PRIVATE_KEY" "true"
check_env_var "ESCROW_CONTRACT_ADDRESS" "true"
check_env_var "FRONTEND_URL" "true"

# Check optional environment variables
echo ""
echo "Checking optional environment variables:"
check_env_var "NODE_ENV" "false"
check_env_var "PORT" "false"
check_env_var "SIWE_DOMAIN" "false"
check_env_var "TRANSPORT_URL" "false"

# Check JWT_SECRET strength
echo ""
echo "Checking JWT_SECRET strength..."
if grep -q "^JWT_SECRET=" .env 2>/dev/null; then
  JWT_SECRET=$(grep "^JWT_SECRET=" .env | cut -d '=' -f2)
  if [ ${#JWT_SECRET} -lt 32 ]; then
    echo -e "${YELLOW}⚠${NC} JWT_SECRET is less than 32 characters (current: ${#JWT_SECRET})"
    echo "  Generate a stronger secret: openssl rand -base64 32"
    ((WARNINGS++))
  else
    echo -e "${GREEN}✓${NC} JWT_SECRET is strong (${#JWT_SECRET} characters)"
  fi
fi

# Check if MongoDB is accessible (optional, only for local)
echo ""
echo "Checking MongoDB connection..."
if [[ "$MONGODB_URI" == *"localhost"* ]] || [[ "$MONGODB_URI" == *"127.0.0.1"* ]]; then
  if command -v mongod &> /dev/null; then
    if pgrep -x "mongod" > /dev/null; then
      echo -e "${GREEN}✓${NC} MongoDB is running locally"
    else
      echo -e "${YELLOW}⚠${NC} MongoDB is not running locally"
      echo "  Start it with: brew services start mongodb-community"
      ((WARNINGS++))
    fi
  fi
else
  echo -e "${GREEN}✓${NC} Using remote MongoDB (Atlas or other)"
fi

# Run tests
echo ""
echo "Running tests..."
if bun test > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} All tests passed"
else
  echo -e "${RED}✗${NC} Some tests failed"
  echo "  Run 'bun test' to see details"
  ((ERRORS++))
fi

# Check for common security issues
echo ""
echo "Checking security..."

# Check if .env is in .gitignore
if grep -q "^\.env$" .gitignore 2>/dev/null; then
  echo -e "${GREEN}✓${NC} .env is in .gitignore"
else
  echo -e "${RED}✗${NC} .env is NOT in .gitignore"
  echo "  Add it to prevent committing secrets!"
  ((ERRORS++))
fi

# Check if node_modules is in .gitignore
if grep -q "node_modules" .gitignore 2>/dev/null; then
  echo -e "${GREEN}✓${NC} node_modules is in .gitignore"
else
  echo -e "${YELLOW}⚠${NC} node_modules should be in .gitignore"
  ((WARNINGS++))
fi

# Check CORS configuration
echo ""
echo "Checking CORS configuration..."
if grep -q "FRONTEND_URL" src/server.ts; then
  echo -e "${GREEN}✓${NC} CORS is configured to use FRONTEND_URL"
else
  echo -e "${YELLOW}⚠${NC} CORS might not be properly configured"
  ((WARNINGS++))
fi

# Summary
echo ""
echo "=================================================="
echo "Summary:"
echo ""
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed! Ready for production deployment.${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Deploy to your hosting platform (Railway, Render, etc.)"
  echo "2. Set environment variables on the hosting platform"
  echo "3. Verify the /health endpoint after deployment"
  echo "4. Test authentication and file upload"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
  echo "  Review warnings above, but you can proceed with deployment"
  exit 0
else
  echo -e "${RED}✗ $ERRORS error(s) and $WARNINGS warning(s) found${NC}"
  echo "  Fix the errors above before deploying to production"
  exit 1
fi
