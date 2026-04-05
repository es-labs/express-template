// Aliyun OSS interface - https://github.com/ali-sdk/ali-oss
// suitable for files that are not large... limit to 10Mb file size
//
// res.status = 204 no content but still success
// res.status = 200
// res.statusMessage = 200
// TDB signatureUrlV4 & usage

import OSS from 'ali-oss';

const { OSS_AK_ID, OSS_AK_SECRET, OSS_REGION, OSS_BUCKET } = process.env;

const store =
  OSS_AK_ID && OSS_AK_SECRET && OSS_REGION
    ? new OSS({
        region: OSS_REGION,
        accessKeyId: OSS_AK_ID,
        accessKeySecret: OSS_AK_SECRET,
        bucket: OSS_BUCKET,
      })
    : null;

/**
 * get count of objects in a bucket.
 * @param {{ bucketName: string }}
 * @returns {{ status: Number, count: Number }}
 */
const countBucketObjects = async (bucketName = null) => {
  try {
    const result = await store.getBucketStat(bucketName);
    return { status: 200, count: result?.stat?.ObjectCount };
  } catch (e) {
    // status 404, code: NoSuchBucket
    return { status: e.status, count: 0 };
  }
};

/**
 * A point on a two dimensional plane.
 * @typedef {Object} ListV2Object
 * @property {string} name - e.g. arco/a5.wav
 * @property {string} url - e.g. http://my-bucket.oss-ap-southeast-1.aliyuncs.com/test/a5.wav
 * @property {string} lastModified - e.g. 2024-09-03T02:34:24.000Z
 * @property {string} etag - e.g. "3A627F876FD033F4B5CB81F063F9F883"
 * @property {string} type - e.g. Normal
 * @property {Number} size - e.g. 948328
 * @property {string} storageClass - e.g. Standard
 * @property {string} owner - e.g. null
 */

/**
 * get count of objects in a bucket.
 * @param {{ prefix: string, maxKeys: Number }}
 * @returns {{ status: Number, statusMessage: string, [objects]: ListV2Object[] }}
 */
const listObjects = async ({ prefix = '', maxKeys = 10 } = {}) => {
  logger.info(prefix, maxKeys);
  try {
    const result = await store.listV2({
      prefix,
      'max-keys': maxKeys,
    });
    logger.info(result.res);
    const { status, statusMessage } = result.res;
    return {
      status,
      statusMessage,
      objects: result.objects,
    };
  } catch (e) {
    logger.info('ali - listObjects', e);
    return { status: 500, statusMessage: e.toString() };
  }
};

/**
 * put object in a bucket.
 * @param {string} key - the object key - e.g. test/hello.txt
 * @param {string|Buffer|ReadableStream} payload - file data
 * @returns {{ status: Number, statusMessage: string }}
 */
const putObject = async (key, payload) => {
  // if (!store) return null
  try {
    const result = await store.put(key, payload); //
    logger.info(result);
    const { status, statusMessage } = result.res;
    return { status, statusMessage };
  } catch (e) {
    logger.info('ali - putObject', e);
    return { status: 500, statusMessage: e.toString() };
  }
};

/**
 * get object.
 * @param {string} key - the object key - e.g. test/hello.txt
 * @param {string|Buffer|ReadableStream} payload - file data
 * @returns {{ status: Number, statusMessage: string, [buffer]: Buffer }}
 */
const getObject = async key => {
  // if (!store) return null
  try {
    const result = await store.get(key);
    logger.info(typeof result.content, result.content.toString('utf-8')); // content is Buffer object
    logger.info(Buffer.isBuffer(result.content));
    logger.info(result);
    const { status, statusMessage } = result?.res || {};
    return {
      status,
      statusMessage,
      buffer: result?.content,
    };
  } catch (e) {
    logger.info('ali - getObject', e);
    return { status: 500, statusMessage: e.toString() };
  }
};

/**
 * get object.
 * @param {string[]} keys - the object keys - e.g. ['test/hello.txt','abc/d123.txt']
 * @returns {{ status: Number, statusMessage: string, [deleted]: { Key: string }[] }}
 */
const deleteObjects = async keys => {
  // if (!store) return null
  try {
    const result = await store.deleteMulti(keys, {});
    logger.info(result);
    const { status, statusMessage } = result?.res || {};
    return {
      status,
      statusMessage,
      deleted: result.deleted,
    };
  } catch (e) {
    logger.info('ali - deleteObjects', e);
    return { status: 500, statusMessage: e.toString() };
  }
};

// (method, expires[, request, objectName, additionalHeaders])
/**
 * get signed URL.
 * @param {string} method - GET or PUT
 * @param {number} expires - expiration in seconds
 * @param {string} key - the object key - e.g. test/hello.txt
 */
const getSignedUrl = async (method, expires, key, headers = null, additional = null) => {
  const signedUrl = await store.signatureUrlV4(method, expires, headers, key, additional);
  logger.info(signedUrl);
  return signedUrl;
};

/**
 * get a signed URL to write a file to OSS.
 * @param {string} directory - the directory in OSS.
 * @param {string} filename - the filename
 * @param {string} contentType - the content type of the file
 * @param {string} [action='write'] - 'write' or 'read'
 * @param {number} [expiration=7200] - the expiration time of the signed URL
 * @param {object} [callbackConfig] - the callback config for write action, example: { callback_url: 'https://example.com', body: { foo: 'bar' } }
 * @returns {{ url: string, error?: string }}
 */
const getUploadURL = async (directory, filename, contentType, action = 'write', expiration = 7200, callbackConfig) => {
  if (!action || !filename) {
    return { error: 'filename and action required' };
  }

  try {
    let url;

    // write / new file action
    if (action === 'write') {
      const arr = filename.split('.');

      arr[0] = crypto
        .createHash('sha256')
        .update(arr[0] + Date.now())
        .digest('hex');

      const newFilename = arr.join('.');

      const fullPath = directory ? `${directory}/${newFilename}` : newFilename;

      url = await store.signatureUrl(fullPath, {
        expires: expiration,
        method: 'PUT',
        'Content-Type': contentType,
        callback: {
          url: callbackConfig?.callback_url,
          body: JSON.stringify({ ...callbackConfig?.body, filename, filepath: fullPath }),
          contentType: 'application/json',
        },
      });
    } else {
      url = await store.signatureUrl(filename);
    }

    return { url };
  } catch (e) {
    return { error: e.toString() };
  }
};

const test = async () => {
  // [bucket count]
  // const bucketObjCount = await countBucketObjects('no-such-bucket') // non-existing bucket, also test with existing bucket
  logger.info('bucketObjCount', bucketObjCount); // -1 if error ?

  // [put] - if put same object name will replace...
  // const testFile1 = new File(['Hello, world 1!'], 'hello.txt', { type: 'text/plain' })
  // const testData1 = await testFile1.arrayBuffer()
  // const putRes1 = await putObject('hello1.txt', Buffer.from(testData1))
  logger.info('putRes1', putRes1);

  // const testFile2 = new File(['Hello, world 2!'], 'hello.txt', { type: 'text/plain' })
  // const testData2 = await testFile2.arrayBuffer()
  // const putRes2 = await putObject('hello2.txt', Buffer.from(testData2))
  logger.info('putRes2', putRes2);

  // [list objects]
  // const listRes = await listObjects({ prefix: 'hello' })
  logger.info(
    'listRes.objects',
    listRes?.objects?.length,
    listRes?.objects?.map(item => item.name),
  );

  // [get object]
  // const data1 = await getObject('hello1.txt')
  logger.info('data1', data1?.buffer?.toString());
  // const data2 = await getObject('hello2.txt')
  logger.info('data2', data2?.buffer?.toString());

  // [delete objects]
  // const deleteRes = await deleteObjects(['ahello1.txt', 'ahello2.txt', 'ahello3.txt'])
  logger.info(deleteRes);

  const url = await getSignedUrl('GET', 60, 'hello1.txt');
  /*
  // -------------------------------------------------
  //  PutObject
  const putObejctUrl = await store.signatureUrlV4('PUT', 60, undefined, 'your obejct name');
  logger.info(putObejctUrl);
  // --------------------------------------------------
  const putObejctUrl = await store.signatureUrlV4(
    'PUT',
    60,
    {
      headers: {
        'Content-Type': 'text/plain',
        'Content-MD5': 'xxx',
        'Content-Length': 1
      }
    },
    'your obejct name',
    ['Content-Length']
  );
  logger.info(putObejctUrl);
  */
};

// test()

// async function listBucketInventory() {
//   const bucket = 'Your Bucket Name'
//   let nextContinuationToken
//   // list all inventory of the bucket
//   do {
//     const result = await store.listBucketInventory(bucket, nextContinuationToken)
//     logger.info(result.inventoryList)
//     nextContinuationToken = result.nextContinuationToken
//   } while (nextContinuationToken)
// }
// listBucketInventory()
export { countBucketObjects, listObjects, putObject, getObject, deleteObjects, getSignedUrl, getUploadURL };
