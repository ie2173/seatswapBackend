# S3 Integration Testing Guide

## Overview

The S3 integration tests (`test/s3.integration.test.ts`) test **real uploads to your AWS S3 bucket**. These tests verify the complete upload flow including file upload, public accessibility, and proper URL generation.

## Prerequisites

Before running S3 tests, ensure:

1. **AWS credentials configured in `.env`:**

   ```bash
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=seatswap-proofs-dev
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   ```

2. **S3 bucket exists and is configured:**

   - Bucket created in AWS console
   - Public read access enabled
   - CORS configured
   - See [AWS_S3_SETUP.md](./AWS_S3_SETUP.md) for complete setup

3. **IAM user has S3 permissions:**
   - `s3:PutObject`
   - `s3:PutObjectAcl`
   - `s3:GetObject`
   - `s3:DeleteObject`
   - `s3:HeadObject`

## Running S3 Tests

```bash
# Run only S3 integration tests
bun run test:s3

# Run all tests (includes S3)
bun test

# Run S3 tests in watch mode
bun test test/s3.integration.test.ts --watch
```

## What Gets Tested

### Basic Upload Tests

- ✅ Text file upload
- ✅ Image file upload (PNG, JPEG)
- ✅ PDF file upload
- ✅ Nested path structures
- ✅ Special characters in filenames
- ✅ File metadata verification

### Accessibility Tests

- ✅ Public read access (files accessible via HTTP)
- ✅ Correct content-type headers
- ✅ Proper URL generation

### Real-World Scenarios

- ✅ Complete proof upload flow (matches deal controller)
- ✅ Seller proof upload
- ✅ Buyer proof upload
- ✅ Multiple file uploads
- ✅ Large file upload (1MB+)

### Verification

- ✅ File exists in S3 after upload
- ✅ File is publicly accessible via generated URL
- ✅ Metadata is correct (content-type, size)

## Test Files

All test files are:

- **Prefixed with:** `test-uploads/`
- **Automatically cleaned up** after tests complete
- **Not committed to git**

Example file structure in S3:

```
seatswap-proofs-dev/
├── test-uploads/
│   ├── integration-test-1234567890.txt
│   ├── integration-test-image-1234567891.png
│   ├── deals/
│   │   └── deal-123/
│   │       └── proof-1234567892/
│   │           └── Seller
│   └── public-test-1234567893.txt
└── proofs/
    └── test-deal-1234567894/
        └── 1234567895/
            └── Seller
```

## Cleanup

Tests automatically clean up uploaded files in `afterAll()`:

- Tracks all uploaded file keys
- Deletes each file after tests complete
- Logs cleanup progress

**Manual cleanup** (if tests fail):

```bash
# List test files in S3
aws s3 ls s3://seatswap-proofs-dev/test-uploads/ --recursive

# Delete all test files
aws s3 rm s3://seatswap-proofs-dev/test-uploads/ --recursive
```

## Cost Considerations

**S3 Costs for Testing:**

- **PUT requests:** $0.005 per 1,000 requests
- **GET requests:** $0.0004 per 1,000 requests
- **Storage:** $0.023 per GB/month (cleaned up immediately)
- **Data transfer:** $0.09 per GB (minimal for tests)

**Running tests 100 times:**

- ~13 files per run = 1,300 PUT requests
- ~10 GET requests per run = 1,000 GET requests
- Cost: ~$0.007 per 100 test runs
- **Negligible cost** for regular testing

## Development vs Production

### Development Testing

```bash
# Use dev bucket
AWS_S3_BUCKET_NAME=seatswap-proofs-dev
```

### Production

```bash
# NEVER run tests against production bucket!
# AWS_S3_BUCKET_NAME=seatswap-proofs-prod  # DON'T DO THIS
```

**Best Practice:**

- Always use a separate dev/test bucket
- Never run integration tests against production
- Consider using `NODE_ENV` to enforce this

## Troubleshooting

### Error: "AWS environment variables not configured"

**Solution:** Add AWS credentials to `.env`

```bash
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Error: "AccessDenied"

**Solutions:**

1. Check IAM user has required permissions
2. Verify credentials in `.env` are correct
3. Check bucket policy allows operations

### Error: "NoSuchBucket"

**Solution:** Create the bucket or verify the name in `.env` matches exactly

### Tests pass but files not cleaned up

**Solution:** Check CloudWatch logs for deletion errors, then manually clean up:

```bash
aws s3 rm s3://your-bucket/test-uploads/ --recursive
```

### Error: "fetch failed" when checking public access

**Solutions:**

1. Verify bucket has public read policy
2. Check CORS configuration
3. Ensure ACL is set to `public-read` in upload code

## CI/CD Considerations

### GitHub Actions Example

```yaml
- name: Run S3 Integration Tests
  env:
    AWS_REGION: ${{ secrets.AWS_REGION }}
    AWS_S3_BUCKET_NAME: ${{ secrets.AWS_S3_BUCKET_NAME }}
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  run: bun run test:s3
```

### Best Practices

- Use separate test bucket for CI/CD
- Store credentials as secrets (never in code)
- Run cleanup even if tests fail
- Monitor S3 costs in test environments

## Skipping S3 Tests

If you want to skip S3 tests (e.g., in CI without AWS credentials):

```bash
# Run only unit tests (no S3)
bun run test:unit

# Run integration tests without S3
bun test test/integration.test.ts test/api.test.ts
```

Or add environment check to tests:

```typescript
describe.skipIf(!process.env.AWS_ACCESS_KEY_ID)(
  "Real S3 Integration Tests",
  () => {
    // tests...
  }
);
```

## Monitoring

### Check S3 Usage

```bash
# List all test files
aws s3 ls s3://seatswap-proofs-dev/test-uploads/ --recursive

# Count test files
aws s3 ls s3://seatswap-proofs-dev/test-uploads/ --recursive | wc -l

# Check bucket size
aws s3 ls s3://seatswap-proofs-dev --recursive --summarize
```

### CloudWatch Metrics

- Go to AWS CloudWatch → S3 → Your bucket
- Monitor: NumberOfObjects, BucketSizeBytes, AllRequests

## Security Notes

⚠️ **Important:**

- Test files are uploaded with `public-read` ACL (required for your app)
- Files are immediately accessible via URL
- Clean up ensures no sensitive test data remains
- Never commit AWS credentials to git
- Use IAM user with minimal required permissions

## Example Test Output

```bash
$ bun run test:s3

Real S3 Integration Tests
  ✓ should upload a text file to S3 [234ms]
  ✓ should upload an image file to S3 [189ms]
  ✓ should upload to nested path structure [201ms]
  ✓ should upload PDF file to S3 [198ms]
  ✓ should upload JPEG image to S3 [192ms]
  ✓ should handle special characters in filename [187ms]
  ✓ should upload file with metadata [203ms]
  ✓ should make uploaded file publicly accessible [256ms]
  ✓ should upload multiple files sequentially [612ms]
  ✓ should handle large file upload (simulated) [487ms]

Real S3 Integration - Deal Proof Upload Flow
  ✓ should simulate complete proof upload flow [223ms]
  ✓ should handle buyer proof upload [198ms]

Cleaning up 13 test files...
Cleaned up test file: test-uploads/integration-test-1732345678901.txt
Cleaned up test file: test-uploads/integration-test-image-1732345678902.png
...

13 pass
0 fail
[3.2s]
```

## Next Steps

After S3 tests pass:

1. ✅ Verify files in S3 console
2. ✅ Check CloudWatch metrics
3. ✅ Test with frontend upload flow
4. ✅ Monitor costs in billing dashboard
5. ✅ Set up CI/CD with S3 tests

## Support

- AWS S3 Docs: https://docs.aws.amazon.com/s3/
- Setup Guide: [AWS_S3_SETUP.md](./AWS_S3_SETUP.md)
- Troubleshooting: Check CloudWatch logs
