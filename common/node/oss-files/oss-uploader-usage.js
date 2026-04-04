/**
 * Alibaba OSS Uploader — Usage Examples
 */

// ─── 1. Vanilla JS ────────────────────────────────────────────────────────────
import OSSUploader from './oss-uploader-client.js';

const uploader = new OSSUploader({
  signEndpoint: '/api/oss/sign',
  chunkSize: 10 * 1024 * 1024, // 10MB
  maxConcurrent: 3,
});

// Basic upload
async function uploadFile(file) {
  try {
    const result = await uploader.upload(file, {
      key: `uploads/${Date.now()}-${file.name}`,
      onProgress: pct => {
        // TBD console.log(`${pct}%`);
        document.getElementById('progress').value = pct;
      },
    });
    // TBD console.log('Done:', result.location);
  } catch (err) {
    // TBD console.error('Upload failed:', err.message);
  }
}

// With cancel support
let controller = null;

async function uploadWithCancel(file) {
  controller = new AbortController();
  try {
    const result = await uploader.upload(file, {
      key: `uploads/${file.name}`,
      onProgress: pct => {
        // TBD console.log(`${pct}%`)
      },
      signal: controller.signal,
    });
    // TBD console.log('Uploaded to:', result.location);
  } catch (err) {
    if (err.name === 'AbortError') {
      // TBD console.log('Upload cancelled');
      // The client already called /api/oss/sign with type=abort to clean up OSS
    } else {
      // TBD console.error(err);
    }
  }
}

document.getElementById('fileInput').addEventListener('change', e => {
  if (e.target.files[0]) uploadWithCancel(e.target.files[0]);
});
document.getElementById('cancelBtn').addEventListener('click', () => controller?.abort());

// ─── 2. React component ───────────────────────────────────────────────────────
/*
import { useState, useRef } from 'react';
import OSSUploader from './oss-uploader-client.js';

const uploader = new OSSUploader({ signEndpoint: '/api/oss/sign' });

export function OSSFileUpload() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus]     = useState('idle'); // idle | uploading | done | error
  const [location, setLocation] = useState('');
  const controllerRef           = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    controllerRef.current = new AbortController();
    setStatus('uploading');
    setProgress(0);

    try {
      const result = await uploader.upload(file, {
        key: `uploads/${Date.now()}-${file.name}`,
        onProgress: setProgress,
        signal: controllerRef.current.signal,
      });
      setStatus('done');
      setLocation(result.location);
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus('idle');
      } else {
        setStatus('error');
        console.error(err);
      }
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={status === 'uploading'} />
      {status === 'uploading' && (
        <>
          <progress value={progress} max={100} />
          <span>{progress}%</span>
          <button onClick={() => controllerRef.current?.abort()}>Cancel</button>
        </>
      )}
      {status === 'done' && <p>Uploaded: <a href={location}>{location}</a></p>}
      {status === 'error' && <p style={{ color: 'red' }}>Upload failed</p>}
    </div>
  );
}
*/

/*
  Minimal HTML (vanilla):

  <input type="file" id="fileInput" />
  <progress id="progress" max="100" value="0"></progress>
  <button id="cancelBtn">Cancel</button>
*/
