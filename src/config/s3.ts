import { S3Client } from "@aws-sdk/client-s3";

// Validate required AWS credentials
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error("❌ Missing AWS credentials:");
  console.error("  AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "✓ Set" : "✗ Missing");
  console.error("  AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "✓ Set" : "✗ Missing");
  console.error("  AWS_REGION:", process.env.AWS_REGION || "✗ Missing");
  console.error("  AWS_S3_BUCKET_NAME:", process.env.AWS_S3_BUCKET_NAME || "✗ Missing");
  throw new Error("AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.");
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default s3Client;
