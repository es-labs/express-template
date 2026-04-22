// TODO not used yet
import { paginateListObjectsV2, S3Client, S3ServiceException } from '@aws-sdk/client-s3';

interface ListObjectsParams {
  bucketName: string;
  pageSize: string;
}

/**
 * Log all object keys in an S3 bucket, paginating through results.
 *
 * @param bucketName - The S3 bucket name.
 * @param pageSize - Max items per page (as a string, parsed to int internally).
 */
export const main = async ({ bucketName, pageSize }: ListObjectsParams): Promise<void> => {
  const client = new S3Client({});
  const objects: string[][] = [];
  try {
    const paginator = paginateListObjectsV2({ client, pageSize: Number.parseInt(pageSize) }, { Bucket: bucketName });

    for await (const page of paginator) {
      objects.push((page.Contents ?? []).map(o => o.Key ?? ''));
    }
    objects.forEach((objectList, pageNum) => {
      logger.info(`Page ${pageNum + 1}\n------\n${objectList.map(o => `• ${o}`).join('\n')}\n`);
    });
  } catch (caught) {
    if (caught instanceof S3ServiceException && caught.name === 'NoSuchBucket') {
      logger.error(`Error from S3 while listing objects for "${bucketName}". The bucket doesn't exist.`);
    } else if (caught instanceof S3ServiceException) {
      logger.error(`Error from S3 while listing objects for "${bucketName}".  ${caught.name}: ${caught.message}`);
    } else {
      throw caught;
    }
  }
};
