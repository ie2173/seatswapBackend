import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/config";

export type UploadToS3Props = {
  file: Express.Multer.File;
  key: string;
};

export type UploadToS3Response = {
  url: string;
};

export const uploadToS3 = async ({
  file,
  key,
}: UploadToS3Props): Promise<UploadToS3Response> => {
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { url };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error("Failed to upload to S3");
  }
};

export default uploadToS3;
