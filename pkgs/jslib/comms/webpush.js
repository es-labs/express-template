import webPush from 'web-push';

// npx web-push generate-vapid-keys
const vapidKeys = webPush.generateVAPIDKeys(); // We use webpush to generate our public and private keys
const { publicKey, privateKey } = vapidKeys;
const { WEBPUSH_VAPID_SUBJ } = process.env;

if (WEBPUSH_VAPID_SUBJ) {
  webPush.setVapidDetails(WEBPUSH_VAPID_SUBJ, publicKey, privateKey); // We are giving webpush the required information to encrypt our data
}

// This function takes a subscription object and a payload as an argument. It will try to encrypt the payload
// then attempt to send a notification via the subscription's endpoint
// will throw exception if error
const send = async (subscription, payload, options = { TTL: 60 }) => {
  // This means we won't resend a notification if the client is offline
  // what if TTL = 0 ?
  // web-push's sendNotification function does all the work for us
  if (!subscription.keys) {
    payload = payload || null;
  }
  return await webPush.sendNotification(subscription, payload, options); // will throw if error
};

const getPubKey = () => vapidKeys.publicKey;

export { send, getPubKey };

// // sw.js
// self.addEventListener('push', (event) => {
//   const data = event.data.json();
//   self.registration.showNotification(data.title, {
//     body: data.body,
//     icon: '/icon.png',
//   });
// });

// // pn.js
// const reg = await navigator.serviceWorker.register('/sw.js');

// const subscription = await reg.pushManager.subscribe({
//   userVisibleOnly: true,
//   applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY), // your public VAPID key
// });

// // Save subscription to your server
// await fetch('/api/subscribe', {
//   method: 'POST',
//   body: JSON.stringify(subscription),
//   headers: { 'Content-Type': 'application/json' },
// });
