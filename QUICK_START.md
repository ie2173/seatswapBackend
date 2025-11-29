# Quick Start Guide for MVP Launch

Follow these steps to get your backend production-ready in ~2 hours.

## ⚡ 30-Second Checklist

Before you start, make sure you have:

- [ ] AWS account (for S3)
- [ ] MongoDB Atlas account (or local MongoDB)
- [ ] Base Sepolia wallet with private key
- [ ] Deployed escrow contract address

---

## Step 1: Setup MongoDB (15 minutes)

### Option A: MongoDB Atlas (Recommended for Production)

1. **Create Account & Cluster**

   ```
   Go to: https://cloud.mongodb.com
   → Sign up/Login
   → Create New Project → "SeatSwap"
   → Build a Database → Free Shared (M0)
   → Choose region (closest to users)
   → Create Cluster
   ```

2. **Configure Access**

   ```
   Security → Database Access → Add New User
   Username: seatswap-admin
   Password: [Generate Strong Password]
   Built-in Role: Atlas Admin

   Security → Network Access → Add IP Address
   → Allow Access from Anywhere (0.0.0.0/0)
   ```

3. **Get Connection String**

   ```
   Databases → Connect → Connect Your Application
   → Copy connection string
   → Replace <password> with your actual password

   Example:
   mongodb+srv://seatswap-admin:PASSWORD@cluster0.xxxxx.mongodb.net/seatswap?retryWrites=true&w=majority
   ```

### Option B: Local MongoDB (Development Only)

```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Your connection string:
MONGODB_URI=mongodb://localhost:27017/seatswap
```

---

## Step 2: Setup AWS S3 (20 minutes)

Follow the detailed guide: [AWS_S3_SETUP.md](./AWS_S3_SETUP.md)

**Quick version:**

1. **Create S3 Bucket**

   - Go to S3 console → Create bucket
   - Name: `seatswap-proofs-prod`
   - Region: `us-east-1` (or your choice)
   - Uncheck "Block all public access"
   - Create bucket

2. **Add Bucket Policy**

   - Go to bucket → Permissions → Bucket policy
   - Replace YOUR-BUCKET-NAME with your bucket name:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
       }
     ]
   }
   ```

3. **Create IAM User**
   - IAM → Users → Add user
   - Name: `seatswap-backend`
   - Access type: Programmatic access
   - Permissions: AmazonS3FullAccess (or custom policy)
   - **SAVE ACCESS KEYS** (shown only once!)

---

## Step 3: Configure Environment Variables (10 minutes)

1. **Copy template:**

   ```bash
   cp .env.example .env
   ```

2. **Generate JWT Secret:**

   ```bash
   openssl rand -base64 32
   ```

3. **Edit `.env`:**

   ```bash
   # Server
   NODE_ENV=production
   PORT=3000

   # MongoDB (from Step 1)
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/seatswap

   # JWT (from generated secret)
   JWT_SECRET=your_generated_32_char_secret

   # SIWE
   SIWE_DOMAIN=your-domain.com  # Or localhost for testing

   # AWS S3 (from Step 2)
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=seatswap-proofs-prod
   AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/EXAMPLE

   # Blockchain
   SEATSWAP_EOA_PRIVATE_KEY=0x_your_wallet_private_key
   TRANSPORT_URL=https://sepolia.base.org
   ESCROW_CONTRACT_ADDRESS=0x_your_deployed_contract

   # Frontend (for CORS)
   FRONTEND_URL=https://your-frontend-domain.com
   ```

---

## Step 4: Test Locally (5 minutes)

```bash
# Install dependencies
bun install

# Run all tests
bun test

# Run deployment check script
./deploy-check.sh

# Start server
bun run dev

# Test health endpoint in another terminal
curl http://localhost:3000/health
```

---

## Step 5: Deploy to Hosting (30 minutes)

### Option A: Railway.app (Easiest)

1. **Create Account**

   - Go to: https://railway.app
   - Sign up with GitHub

2. **Create New Project**

   - New Project → Deploy from GitHub repo
   - Select your backend repository
   - Railway auto-detects Bun

3. **Add Environment Variables**

   - Go to Variables tab
   - Add all variables from your `.env` file
   - Click "Deploy"

4. **Get Domain**
   - Settings → Generate Domain
   - Copy the URL: `https://your-app.railway.app`

### Option B: Render.com (Free Tier)

1. **Create Account**

   - Go to: https://render.com
   - Sign up with GitHub

2. **Create Web Service**

   - New → Web Service
   - Connect your GitHub repository
   - Name: `seatswap-backend`
   - Runtime: Node
   - Build Command: `bun install`
   - Start Command: `bun start`
   - Instance Type: Free

3. **Add Environment Variables**

   - Environment → Add each variable from `.env`
   - Save changes (auto-deploys)

4. **Get Domain**
   - Copy URL: `https://seatswap-backend.onrender.com`

---

## Step 6: Verify Deployment (5 minutes)

1. **Check Health Endpoint**

   ```bash
   curl https://your-deployment-url.com/health
   ```

   Should return:

   ```json
   {
     "message": "Healthy",
     "timestamp": "2025-11-22T...",
     "version": "1.0.0"
   }
   ```

2. **Test Nonce Generation**

   ```bash
   curl "https://your-deployment-url.com/auth/nonce?address=0x1234567890123456789012345678901234567890"
   ```

   Should return a nonce

3. **Check Logs**
   - Railway: Project → Deployments → View Logs
   - Render: Logs tab
   - Look for:
     - "MongoDB connected successfully"
     - "Server running on port 3000"
     - No error messages

---

## Step 7: Connect Frontend (5 minutes)

Update your frontend `.env`:

```bash
VITE_API_URL=https://your-deployment-url.com
```

Test authentication flow:

1. Connect wallet
2. Get nonce from `/auth/nonce`
3. Sign SIWE message
4. Verify at `/auth/verify`
5. Use JWT token for authenticated requests

---

## Troubleshooting

### "Cannot connect to MongoDB"

- Check connection string format
- Verify network access allows 0.0.0.0/0
- Test connection locally first

### "S3 Access Denied"

- Verify IAM user has S3 permissions
- Check AWS credentials are correct
- Verify bucket name matches exactly

### "JWT verification failed"

- Ensure JWT_SECRET is the same on all instances
- Check token hasn't expired (1 hour default)

### "CORS error from frontend"

- Verify FRONTEND_URL in .env matches your frontend domain
- Check frontend is sending credentials

### "Tests failing"

- Run `bun test` locally first
- Check MongoDB_URI points to test database
- Ensure all dependencies installed

---

## Post-Deployment Monitoring

### Set Up Uptime Monitoring (Free)

**UptimeRobot:**

1. Go to: https://uptimerobot.com
2. Add New Monitor
3. Type: HTTP(s)
4. URL: `https://your-deployment-url.com/health`
5. Interval: 5 minutes
6. Get alerts via email if down

### Monitor Costs

**AWS S3:**

- Go to AWS Billing Dashboard
- Set budget alert for $10/month
- Expected: $1-5/month for MVP

**Hosting:**

- Railway: Check usage dashboard
- Render: Monitor build minutes
- Expected: $5-10/month

### Check Logs Daily (First Week)

Look for:

- Authentication failures
- S3 upload errors
- MongoDB connection issues
- Unexpected errors

---

## Cost Summary

| Service           | Cost/Month | Notes          |
| ----------------- | ---------- | -------------- |
| MongoDB Atlas     | $0         | Free tier (M0) |
| AWS S3            | $1-5       | Pay per use    |
| Railway/Render    | $5-10      | Or free tier   |
| Domain (optional) | $1         | Namecheap      |
| **Total**         | **$7-16**  | MVP scale      |

---

## Security Checklist

Before going live:

- [ ] JWT_SECRET is 32+ random characters
- [ ] `.env` is in `.gitignore`
- [ ] Private keys never committed
- [ ] CORS restricted to frontend domain
- [ ] MongoDB user has strong password
- [ ] AWS IAM user has minimal permissions
- [ ] All tests passing
- [ ] Health endpoint responding
- [ ] HTTPS enabled (handled by hosting)

---

## What's Next?

After MVP launch:

1. Monitor error rates and response times
2. Set up proper logging (Sentry, Datadog)
3. Add rate limiting
4. Implement caching (Redis)
5. Add email notifications
6. Create admin dashboard
7. Set up CI/CD pipeline
8. Scale infrastructure as needed

---

## Support

- Deployment issues: Check PRODUCTION_CHECKLIST.md
- AWS S3 setup: See AWS_S3_SETUP.md
- API usage: See API_ENDPOINTS.md
- General questions: Check README.md

---

## Time Breakdown

- MongoDB setup: 15 min
- AWS S3 setup: 20 min
- Environment config: 10 min
- Local testing: 5 min
- Deployment: 30 min
- Verification: 5 min
- Frontend connection: 5 min

**Total: ~90 minutes** (1.5 hours)

🚀 **You're ready to launch!**
