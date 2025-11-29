# AWS S3 Setup Guide

Complete guide to set up AWS S3 for file uploads in the SeatSwap backend.

## Prerequisites

- AWS Account (already created)
- AWS CLI installed (optional but recommended)

## Step 1: Create an S3 Bucket

1. **Log into AWS Console**

   - Go to https://console.aws.amazon.com
   - Navigate to S3 service

2. **Create New Bucket**

   - Click "Create bucket"
   - **Bucket name**: Choose a unique name (e.g., `seatswap-proofs-production`)
     - Must be globally unique across all AWS
     - Use lowercase, hyphens allowed
     - Example: `seatswap-proofs-dev` or `seatswap-proofs-prod`
   - **AWS Region**: Choose closest to your users (e.g., `us-east-1`)
   - **Object Ownership**: ACLs enabled → Bucket owner preferred
   - **Block Public Access**: Uncheck "Block all public access"
     - ⚠️ Warning will appear - acknowledge it
     - We need public read access for uploaded proof images
   - Click "Create bucket"

3. **Configure Bucket Policy for Public Read**
   - Go to your bucket → Permissions tab
   - Scroll to "Bucket policy" → Click "Edit"
   - Paste this policy (replace `YOUR-BUCKET-NAME`):

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

4. **Enable CORS (Cross-Origin Resource Sharing)**
   - Go to Permissions tab → CORS section → Edit
   - Paste this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

## Step 2: Create IAM User for Programmatic Access

1. **Navigate to IAM**

   - Search for "IAM" in AWS Console
   - Go to Users → Add users

2. **Create User**

   - **User name**: `seatswap-backend-user`
   - **Access type**: Select "Access key - Programmatic access"
   - Click "Next: Permissions"

3. **Set Permissions**

   - Choose "Attach existing policies directly"
   - Search for and select: `AmazonS3FullAccess`
     - Or create a custom policy for better security (see below)
   - Click "Next: Tags" → "Next: Review" → "Create user"

4. **Save Credentials** ⚠️ IMPORTANT
   - **Access Key ID**: Copy this
   - **Secret Access Key**: Copy this (shown only once!)
   - Download the CSV file as backup
   - Keep these secure - treat like passwords

### Optional: Custom IAM Policy (More Secure)

Instead of `AmazonS3FullAccess`, create a custom policy with minimal permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
    }
  ]
}
```

## Step 3: Configure Backend Environment Variables

Add these to your `.env` file:

```bash
# AWS S3 Configuration
AWS_REGION=us-east-1                           # Region where you created the bucket
AWS_S3_BUCKET_NAME=seatswap-proofs-production  # Your bucket name
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE         # From IAM user creation
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY  # From IAM user
```

⚠️ **Security Note**: Never commit `.env` to git! Add it to `.gitignore`.

## Step 4: Verify Configuration

The backend code at `src/config/aws.ts` should already be configured:

```typescript
import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
```

## Step 5: Test the Connection

### Option 1: Run the existing tests

```bash
bun test src/utils/__tests__/aws.test.ts
```

### Option 2: Manual test with a simple script

Create `test-s3-upload.ts`:

```typescript
import { uploadToS3 } from "./src/utils/aws";
import fs from "fs";

async function testUpload() {
  // Create a test file
  const testFile = {
    buffer: Buffer.from("Hello from SeatSwap!"),
    mimetype: "text/plain",
    originalname: "test.txt",
    fieldname: "proof",
    encoding: "7bit",
    size: 21,
  } as Express.Multer.File;

  try {
    const result = await uploadToS3({
      file: testFile,
      key: "test-uploads/test.txt",
    });
    console.log("✅ Upload successful!");
    console.log("📎 File URL:", result.url);
    console.log("\nTry accessing:", result.url);
  } catch (error) {
    console.error("❌ Upload failed:", error);
  }
}

testUpload();
```

Run it:

```bash
bun run test-s3-upload.ts
```

## Step 6: Production Best Practices

### 1. Use Different Buckets for Environments

```bash
# Development
AWS_S3_BUCKET_NAME=seatswap-proofs-dev

# Staging
AWS_S3_BUCKET_NAME=seatswap-proofs-staging

# Production
AWS_S3_BUCKET_NAME=seatswap-proofs-prod
```

### 2. Enable Versioning (Recommended)

- Go to bucket → Properties → Versioning → Enable
- Protects against accidental deletions

### 3. Set Lifecycle Rules

- Go to bucket → Management → Lifecycle rules
- Example: Delete files older than 90 days in staging

### 4. Enable Server-Side Encryption

- Go to bucket → Properties → Default encryption
- Choose "Server-side encryption with Amazon S3 managed keys (SSE-S3)"

### 5. CloudFront CDN (Optional - for better performance)

- Create CloudFront distribution pointing to S3 bucket
- Use CloudFront URL instead of direct S3 URL
- Benefits: faster delivery, DDoS protection, HTTPS

### 6. Monitor Costs

- Go to Billing Dashboard
- Set up billing alerts
- S3 costs: ~$0.023/GB/month storage + $0.09/GB data transfer

## Troubleshooting

### Error: "Access Denied"

- Check IAM user has correct permissions
- Verify credentials in `.env` are correct
- Check bucket policy allows public read

### Error: "NoSuchBucket"

- Verify bucket name in `.env` matches exactly
- Check region is correct

### Error: "SignatureDoesNotMatch"

- Check AWS_SECRET_ACCESS_KEY has no extra spaces
- Regenerate access keys if needed

### Files uploaded but not accessible

- Check bucket policy for public read access
- Verify ACL is set to `public-read` in upload code

### CORS errors from frontend

- Check CORS configuration in bucket permissions
- Add your frontend domain to AllowedOrigins if needed

## File Structure on S3

Your uploads will be organized like:

```
seatswap-proofs-production/
├── proofs/
│   ├── deal-id-1/
│   │   ├── 1234567890/
│   │   │   └── Seller
│   │   └── 1234567891/
│   │       └── Buyer
│   └── deal-id-2/
│       └── 1234567892/
│           └── Seller
```

The URL format will be:

```
https://seatswap-proofs-production.s3.us-east-1.amazonaws.com/proofs/deal-id/timestamp/Seller
```

## Cost Estimation

For a typical use case:

- **Storage**: 10 GB of proofs = $0.23/month
- **Requests**: 10,000 uploads = $0.05/month
- **Data Transfer**: 50 GB downloads = $4.50/month
- **Total**: ~$5/month for moderate usage

## Security Checklist

- [x] IAM user created with minimal permissions
- [x] Access keys stored in `.env` (not committed to git)
- [x] Bucket policy allows only public read (not write)
- [x] CORS configured for your domain
- [x] Server-side encryption enabled
- [x] Bucket versioning enabled (optional)
- [x] CloudWatch alarms set for unusual activity (optional)

## Next Steps

1. Test file upload through your API endpoint
2. Verify files are accessible via the returned URL
3. Set up CloudFront if needed for production
4. Configure lifecycle rules to manage storage costs
5. Set up monitoring and alerts

## Support

- AWS S3 Documentation: https://docs.aws.amazon.com/s3/
- AWS SDK for JavaScript: https://docs.aws.amazon.com/sdk-for-javascript/
- Troubleshooting: Check CloudWatch logs in AWS Console
