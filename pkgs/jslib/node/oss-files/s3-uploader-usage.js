/**
 * Usage example — drop this in your frontend
 * Works with vanilla JS, React, Vue, etc.
 */
import S3Uploader from './s3-uploader-client.js';

// ─── Setup ────────────────────────────────────────────────────────────────────

const uploader = new S3Uploader({
  getSignedUrlEndpoint: '/api/s3/sign', // your backend
  chunkSize: 10 * 1024 * 1024,         // 10MB parts
  maxConcurrent: 3,                    // 3 parallel part uploads
});

// ─── Basic upload ─────────────────────────────────────────────────────────────

async function uploadFile(file) {
  try {
    const result = await uploader.upload(file, {
      key: `uploads/${Date.now()}-${file.name}`, // custom S3 key (optional)
      onProgress: (pct) => {
        console.log(`Upload progress: ${pct}%`);
        document.getElementById('progress').value = pct;
      },
    });

    console.log('Upload complete!', result);
    // result = { key: 'uploads/...', location: 'https://bucket.s3.amazonaws.com/...' }
  } catch (err) {
    console.error('Upload failed:', err.message);
  }
}

// ─── With cancellation support ────────────────────────────────────────────────

let controller;

async function uploadWithCancel(file) {
  controller = new AbortController();

  try {
    const result = await uploader.upload(file, {
      onProgress: (pct) => console.log(`${pct}%`),
      signal: controller.signal,
    });
    console.log('Done:', result);
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Upload cancelled by user');
      // Optionally call your backend to abort the multipart upload in S3
      // to avoid storage costs for incomplete uploads
    } else {
      console.error('Error:', err);
    }
  }
}

function cancelUpload() {
  controller?.abort();
}

// ─── Wire up to a file input ──────────────────────────────────────────────────

document.getElementById('fileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) uploadWithCancel(file);
});

document.getElementById('cancelBtn').addEventListener('click', cancelUpload);

/*
  Minimal HTML to go with this:

  <input type="file" id="fileInput" />
  <progress id="progress" max="100" value="0"></progress>
  <button id="cancelBtn">Cancel</button>
*/
