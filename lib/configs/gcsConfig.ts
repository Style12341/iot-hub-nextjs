import { Storage } from '@google-cloud/storage';

// Initialize storage with credentials (service account)
const storage = new Storage();

const bucketName = process.env.GCS_BUCKET_NAME;
if (!bucketName) {
    throw new Error('GCS_BUCKET_NAME is not defined in environment variables');
}
const bucket = storage.bucket(bucketName);

export { storage, bucket, bucketName };