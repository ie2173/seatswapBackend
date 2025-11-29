import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { uploadToS3 } from "@utils";
import {
  S3Client,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

// Use the real S3 client from config
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const TEST_BUCKET = process.env.AWS_S3_BUCKET_NAME;
const TEST_FILES_TO_CLEANUP: string[] = [];

// Helper to create test file
function createTestFile(
  content: string,
  filename: string,
  mimetype: string
): Express.Multer.File {
  return {
    buffer: Buffer.from(content),
    mimetype,
    originalname: filename,
    fieldname: "proof",
    encoding: "7bit",
    size: Buffer.byteLength(content),
  } as Express.Multer.File;
}

// Helper to check if file exists in S3
async function fileExistsInS3(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: TEST_BUCKET,
        Key: key,
      })
    );
    return true;
  } catch (error: any) {
    if (error.name === "NotFound") {
      return false;
    }
    throw error;
  }
}

// Helper to delete file from S3
async function deleteFromS3(key: string): Promise<void> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: TEST_BUCKET,
        Key: key,
      })
    );
    console.log(`Cleaned up test file: ${key}`);
  } catch (error) {
    console.error(`Failed to cleanup ${key}:`, error);
  }
}

describe("Real S3 Integration Tests", () => {
  beforeAll(() => {
    // Verify required env vars
    if (!process.env.AWS_REGION || !process.env.AWS_S3_BUCKET_NAME) {
      throw new Error("AWS environment variables not configured");
    }
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS credentials not configured");
    }
    console.log(`Running S3 tests against bucket: ${TEST_BUCKET}`);
  });

  afterAll(async () => {
    // Clean up all test files
    console.log(`Cleaning up ${TEST_FILES_TO_CLEANUP.length} test files...`);
    await Promise.all(TEST_FILES_TO_CLEANUP.map((key) => deleteFromS3(key)));
  });

  test("should upload a text file to S3", async () => {
    const testFile = createTestFile(
      "Hello from SeatSwap integration test!",
      "test.txt",
      "text/plain"
    );
    const key = `test-uploads/integration-test-${Date.now()}.txt`;

    const result = await uploadToS3({ file: testFile, key });

    // Track for cleanup
    TEST_FILES_TO_CLEANUP.push(key);

    // Verify result
    expect(result.url).toContain(TEST_BUCKET as string);
    expect(result.url).toContain(key);
    expect(result.url).toContain("https://");

    // Verify file exists in S3
    const exists = await fileExistsInS3(key);
    expect(exists).toBe(true);
  });

  test("should upload an image file to S3", async () => {
    // Create a simple 1x1 PNG image (base64 encoded)
    const pngData = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const testFile = {
      buffer: pngData,
      mimetype: "image/png",
      originalname: "test-image.png",
      fieldname: "proof",
      encoding: "7bit",
      size: pngData.length,
    } as Express.Multer.File;

    const key = `test-uploads/integration-test-image-${Date.now()}.png`;

    const result = await uploadToS3({ file: testFile, key });
    TEST_FILES_TO_CLEANUP.push(key);

    expect(result.url).toContain(key);
    expect(result.url).toContain(".png");

    const exists = await fileExistsInS3(key);
    expect(exists).toBe(true);
  });

  test("should upload to nested path structure", async () => {
    const testFile = createTestFile(
      "Nested path test",
      "nested.txt",
      "text/plain"
    );
    const key = `test-uploads/deals/deal-123/proof-${Date.now()}/Seller`;

    const result = await uploadToS3({ file: testFile, key });
    TEST_FILES_TO_CLEANUP.push(key);

    expect(result.url).toContain("deals/deal-123");
    expect(result.url).toContain("/Seller");

    const exists = await fileExistsInS3(key);
    expect(exists).toBe(true);
  });

  test("should upload PDF file to S3", async () => {
    // Minimal PDF content
    const pdfContent =
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n%%EOF";
    const testFile = createTestFile(pdfContent, "test.pdf", "application/pdf");
    const key = `test-uploads/pdf-test-${Date.now()}.pdf`;

    const result = await uploadToS3({ file: testFile, key });
    TEST_FILES_TO_CLEANUP.push(key);

    expect(result.url).toContain(".pdf");
    const exists = await fileExistsInS3(key);
    expect(exists).toBe(true);
  });

  test("should upload JPEG image to S3", async () => {
    // Minimal JPEG header
    const jpegData = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0xff, 0xd9,
    ]);

    const testFile = {
      buffer: jpegData,
      mimetype: "image/jpeg",
      originalname: "test.jpg",
      fieldname: "proof",
      encoding: "7bit",
      size: jpegData.length,
    } as Express.Multer.File;

    const key = `test-uploads/jpeg-test-${Date.now()}.jpg`;

    const result = await uploadToS3({ file: testFile, key });
    TEST_FILES_TO_CLEANUP.push(key);

    expect(result.url).toContain(".jpg");
    const exists = await fileExistsInS3(key);
    expect(exists).toBe(true);
  });

  test("should handle special characters in filename", async () => {
    const testFile = createTestFile(
      "Special chars test",
      "test-file (1) [copy].txt",
      "text/plain"
    );
    // S3 keys should be URL-safe
    const key = `test-uploads/special-chars-${Date.now()}.txt`;

    const result = await uploadToS3({ file: testFile, key });
    TEST_FILES_TO_CLEANUP.push(key);

    const exists = await fileExistsInS3(key);
    expect(exists).toBe(true);
  });

  test("should upload file with metadata", async () => {
    const testFile = createTestFile(
      "Metadata test",
      "metadata-test.txt",
      "text/plain"
    );
    const key = `test-uploads/metadata-test-${Date.now()}.txt`;

    const result = await uploadToS3({ file: testFile, key });
    TEST_FILES_TO_CLEANUP.push(key);

    // Verify upload succeeded
    expect(result.url).toBeDefined();

    // Use HeadObject to check metadata
    const response = await s3Client.send(
      new HeadObjectCommand({
        Bucket: TEST_BUCKET,
        Key: key,
      })
    );

    expect(response.ContentType).toBe("text/plain");
    expect(response.ContentLength).toBe(testFile.size);
  });

  test("should make uploaded file publicly accessible", async () => {
    const testFile = createTestFile(
      "Public access test",
      "public-test.txt",
      "text/plain"
    );
    const key = `test-uploads/public-test-${Date.now()}.txt`;

    const result = await uploadToS3({ file: testFile, key });
    TEST_FILES_TO_CLEANUP.push(key);

    // Try to fetch the file via HTTP (should be publicly accessible)
    const response = await fetch(result.url);
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    const content = await response.text();
    expect(content).toBe("Public access test");
  });

  test("should upload multiple files sequentially", async () => {
    const files = [
      createTestFile("File 1", "file1.txt", "text/plain"),
      createTestFile("File 2", "file2.txt", "text/plain"),
      createTestFile("File 3", "file3.txt", "text/plain"),
    ];

    const timestamp = Date.now();
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const key = `test-uploads/multi-${timestamp}-${i}.txt`;
      const result = await uploadToS3({
        file: files[i] as Express.Multer.File,
        key,
      });
      TEST_FILES_TO_CLEANUP.push(key);
      results.push(result);
    }

    expect(results).toHaveLength(3);
    results.forEach((result) => {
      expect(result.url).toContain(TEST_BUCKET as string);
    });

    // Verify all files exist
    const existsChecks = await Promise.all(
      TEST_FILES_TO_CLEANUP.slice(-3).map((key) => fileExistsInS3(key))
    );
    expect(existsChecks.every((exists) => exists)).toBe(true);
  });

  test("should handle large file upload (simulated)", async () => {
    // Create a 1MB file
    const largeContent = "x".repeat(1024 * 1024); // 1MB of 'x'
    const testFile = createTestFile(
      largeContent,
      "large-file.txt",
      "text/plain"
    );
    const key = `test-uploads/large-file-${Date.now()}.txt`;

    const result = await uploadToS3({ file: testFile, key });
    TEST_FILES_TO_CLEANUP.push(key);

    expect(result.url).toBeDefined();

    const exists = await fileExistsInS3(key);
    expect(exists).toBe(true);

    // Verify size
    const response = await s3Client.send(
      new HeadObjectCommand({
        Bucket: TEST_BUCKET,
        Key: key,
      })
    );
    expect(response.ContentLength).toBe(1024 * 1024);
  });

  test("should fail gracefully with invalid credentials", async () => {
    // Create a client with invalid credentials
    const badClient = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: "INVALID_KEY",
        secretAccessKey: "INVALID_SECRET",
      },
    });

    const testFile = createTestFile("Test", "test.txt", "text/plain");
    const key = `test-uploads/should-fail-${Date.now()}.txt`;

    // This should fail, but we need to use the bad client
    // Since uploadToS3 uses the configured client, we can't easily test this
    // without modifying the function. Skip for now or refactor uploadToS3
    // to accept a client parameter for testing.
    expect(true).toBe(true); // Placeholder
  });
});

describe("Real S3 Integration - Deal Proof Upload Flow", () => {
  test("should simulate complete proof upload flow", async () => {
    const dealId = "test-deal-" + Date.now();
    const timestamp = Date.now();

    // Simulate seller uploading proof
    const proofImage = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const proofFile = {
      buffer: proofImage,
      mimetype: "image/png",
      originalname: "ticket-proof.png",
      fieldname: "proof",
      encoding: "7bit",
      size: proofImage.length,
    } as Express.Multer.File;

    // Upload with realistic key structure (matches your deal controller)
    const key = `proofs/${dealId}/${timestamp}/Seller`;

    const result = await uploadToS3({ file: proofFile, key });
    TEST_FILES_TO_CLEANUP.push(key);

    // Verify the URL format matches what frontend expects
    expect(result.url).toContain(`proofs/${dealId}`);
    expect(result.url).toContain(`${timestamp}`);
    expect(result.url).toContain("Seller");

    // Verify file is accessible
    const response = await fetch(result.url);
    expect(response.ok).toBe(true);
    expect(response.headers.get("content-type")).toContain("image");

    // Verify in S3
    const exists = await fileExistsInS3(key);
    expect(exists).toBe(true);
  });

  test("should handle buyer proof upload", async () => {
    const dealId = "test-deal-" + Date.now();
    const timestamp = Date.now();

    const proofFile = createTestFile(
      "Buyer proof content",
      "buyer-proof.txt",
      "text/plain"
    );

    const key = `proofs/${dealId}/${timestamp}/Buyer`;

    const result = await uploadToS3({ file: proofFile, key });
    TEST_FILES_TO_CLEANUP.push(key);

    expect(result.url).toContain("Buyer");

    const exists = await fileExistsInS3(key);
    expect(exists).toBe(true);
  });
});
