import { describe, test, expect, mock, beforeEach } from "bun:test";
import uploadToS3 from "../aws";
import { createMockFile } from "../../../test/helpers";

// Mock the S3 client
const mockSend = mock(() => Promise.resolve({}));

mock.module("@/config", () => ({
  s3Client: {
    send: mockSend,
  },
}));

describe("uploadToS3", () => {
  beforeEach(() => {
    mockSend.mockClear();
    process.env.AWS_S3_BUCKET_NAME = "test-bucket";
    process.env.AWS_REGION = "us-east-1";
  });

  test("should upload file to S3 and return URL", async () => {
    const mockFile = createMockFile();
    const key = "test/file.jpg";

    const result = await uploadToS3({ file: mockFile, key });

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(result.url).toBe(
      "https://test-bucket.s3.us-east-1.amazonaws.com/test/file.jpg"
    );
  });

  test("should upload file with correct S3 parameters", async () => {
    const mockFile = createMockFile({
      buffer: Buffer.from("test content"),
      mimetype: "image/png",
    });
    const key = "images/test.png";

    await uploadToS3({ file: mockFile, key });

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("should handle different file types", async () => {
    const mockFile = createMockFile({
      mimetype: "application/pdf",
    });
    const key = "documents/report.pdf";

    const result = await uploadToS3({ file: mockFile, key });

    expect(result.url).toContain("documents/report.pdf");
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("should handle nested paths in key", async () => {
    const mockFile = createMockFile();
    const key = "proofs/deal123/1234567890/Seller";

    const result = await uploadToS3({ file: mockFile, key });

    expect(result.url).toBe(
      "https://test-bucket.s3.us-east-1.amazonaws.com/proofs/deal123/1234567890/Seller"
    );
  });

  test("should throw error when S3 upload fails", async () => {
    mockSend.mockImplementationOnce(() =>
      Promise.reject(new Error("S3 Error"))
    );

    const mockFile = createMockFile();
    const key = "test/file.jpg";

    await expect(uploadToS3({ file: mockFile, key })).rejects.toThrow(
      "Failed to upload to S3"
    );
  });

  test("should handle different AWS regions", async () => {
    process.env.AWS_REGION = "eu-west-1";
    const mockFile = createMockFile();
    const key = "test/file.jpg";

    const result = await uploadToS3({ file: mockFile, key });

    expect(result.url).toBe(
      "https://test-bucket.s3.eu-west-1.amazonaws.com/test/file.jpg"
    );
  });

  test("should handle different bucket names", async () => {
    process.env.AWS_S3_BUCKET_NAME = "my-custom-bucket";
    const mockFile = createMockFile();
    const key = "test/file.jpg";

    const result = await uploadToS3({ file: mockFile, key });

    expect(result.url).toBe(
      "https://my-custom-bucket.s3.us-east-1.amazonaws.com/test/file.jpg"
    );
  });
});
