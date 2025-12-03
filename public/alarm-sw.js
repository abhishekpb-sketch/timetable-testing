// Service worker with alarm functionality and PWA caching
// Workbox manifest will be injected by vite-plugin-pwa

// Import workbox for PWA caching
try {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');
  
  // Precache assets (manifest will be injected by vite-plugin-pwa)
  // self.__WB_MANIFEST will be replaced during build
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);
  
  // Cache Google Sheets with NetworkFirst
  workbox.routing.registerRoute(
    ({ url }) => url.href.startsWith('https://docs.google.com/spreadsheets/'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'google-sheets-cache',
      plugins: [
        {
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      ],
    })
  );
  
  // Cache icons with CacheFirst
  workbox.routing.registerRoute(
    ({ url }) => url.href.includes('cdn-icons-png.flaticon.com'),
    new workbox.strategies.CacheFirst({
      cacheName: 'icon-cache',
    })
  );
} catch (e) {
  console.log('Workbox not available, continuing without caching');
}

// ========== ALARM FUNCTIONALITY ==========

const DB_NAME = 'TimetableAlarms';
const DB_VERSION = 1;
const STORE_NAME = 'alarms';

// Initialize IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('alarmTime', 'alarmTime', { unique: false });
      }
    };
  });
};

// Store active ringing alarms
const activeRingingAlarms = new Map();

// Start ringing alarm
const startRingingAlarm = (alarmId, alarm, isNew = true) => {
  // Create persistent notification with action buttons
  const notificationOptions = {
    body: `${alarm.subject} starts in 10 minutes (at ${alarm.time})`,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: `alarm-${alarm.id}`,
    requireInteraction: true, // Requires user interaction to dismiss
    vibrate: [200, 100, 200, 100, 200, 100, 200, 100, 200], // Continuous vibration pattern
    renotify: true,
    silent: false, // Ensure sound plays
    actions: [
      {
        action: 'snooze',
        title: 'Snooze (5 min)',
        icon: '/icon.svg'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon.svg'
      }
    ],
    data: {
      alarmId: alarm.id,
      subject: alarm.subject,
      time: alarm.time,
      isRinging: true,
    },
  };
  
  // Close existing notification and show new one
  self.registration.getNotifications({ tag: `alarm-${alarm.id}` }).then((notifications) => {
    notifications.forEach((notification) => notification.close());
    self.registration.showNotification('⏰ Class Alarm', notificationOptions);
  });
  
  // Store alarm as active (or update if already active)
  if (isNew || !activeRingingAlarms.has(alarmId)) {
    activeRingingAlarms.set(alarmId, {
      alarm,
      startTime: Date.now(),
      snoozeCount: 0,
      lastNotificationTime: Date.now(),
    });
    
    // Notify all clients to start playing alarm sound
    clients.matchAll().then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({
          type: 'ALARM_RINGING',
          alarmId,
          alarm,
        });
      });
    });
  } else {
    // Update last notification time
    const ringingAlarm = activeRingingAlarms.get(alarmId);
    if (ringingAlarm) {
      ringingAlarm.lastNotificationTime = Date.now();
    }
  }
};

// Stop ringing alarm
const stopRingingAlarm = (alarmId) => {
  activeRingingAlarms.delete(alarmId);
  
  // Close notification
  self.registration.getNotifications({ tag: `alarm-${alarmId}` }).then((notifications) => {
    notifications.forEach((notification) => notification.close());
  });
  
  // Notify clients to stop alarm
  clients.matchAll().then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage({
        type: 'ALARM_STOPPED',
        alarmId,
      });
    });
  });
};

// Check and fire alarms
const checkAlarms = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('alarmTime');
    
    const now = new Date().toISOString();
    
    return new Promise((resolve) => {
      // Get all alarms that should have fired (alarmTime <= now + 1 minute buffer)
      const upperBound = new Date(Date.now() + 60000).toISOString();
      const request = index.getAll(IDBKeyRange.upperBound(upperBound));
      
      request.onsuccess = async () => {
        const alarms = request.result;
        const nowTime = new Date();
        
        for (const alarm of alarms) {
          if (!alarm.enabled) continue;
          
          const alarmTime = new Date(alarm.alarmTime);
          const timeDiff = nowTime.getTime() - alarmTime.getTime();
          
          // Fire if alarm time has passed (within 2 minute window)
          // Keep ringing if already started (don't remove from DB until dismissed)
          if (timeDiff >= -60000 && timeDiff < 120000) {
            const isNew = !activeRingingAlarms.has(alarm.id);
            const ringingAlarm = activeRingingAlarms.get(alarm.id);
            
            // Start ringing if not already ringing
            if (isNew) {
              startRingingAlarm(alarm.id, alarm, true);
            } else {
              // Keep notification alive - re-show it every 30 seconds to keep it persistent
              const timeSinceLastNotification = Date.now() - (ringingAlarm.lastNotificationTime || ringingAlarm.startTime);
              if (timeSinceLastNotification > 30000) {
                startRingingAlarm(alarm.id, alarm, false);
              }
              
              // Keep notifying clients to continue playing sound
              clients.matchAll().then((clientList) => {
                clientList.forEach((client) => {
                  client.postMessage({
                    type: 'ALARM_RINGING',
                    alarmId: alarm.id,
                    alarm,
                  });
                });
              });
            }
          }
        }
        
        resolve();
      };
      
      request.onerror = () => resolve();
    });
  } catch (error) {
    console.error('Error checking alarms:', error);
  }
};

// Check alarms every minute
let alarmCheckInterval = null;

// Start alarm checking
const startAlarmChecking = () => {
  // Clear any existing interval
  if (alarmCheckInterval) {
    clearInterval(alarmCheckInterval);
  }
  
  // Check alarms immediately
  checkAlarms();
  
  // Then check every minute
  alarmCheckInterval = setInterval(() => {
    checkAlarms();
  }, 60000);
};

// Service worker lifecycle events
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(checkAlarms());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      startAlarmChecking();
    })()
  );
});

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ALARM_UPDATED') {
    checkAlarms();
  } else if (event.data && event.data.type === 'CHECK_ALARMS') {
    checkAlarms();
  }
});

// Notification click handler with snooze/dismiss actions
self.addEventListener('notificationclick', async (event) => {
  const action = event.action;
  const notificationData = event.notification.data;
  const alarmId = notificationData?.alarmId;
  
  event.notification.close();
  
  if (action === 'dismiss') {
    // Dismiss alarm - remove from DB and stop ringing
    if (alarmId) {
      stopRingingAlarm(alarmId);
      
      // Remove from IndexedDB
      try {
        const db = await initDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(alarmId);
      } catch (error) {
        console.error('Error removing alarm:', error);
      }
    }
  } else if (action === 'snooze') {
    // Snooze for 5 minutes
    if (alarmId && notificationData) {
      stopRingingAlarm(alarmId);
      
      // Update alarm time to 5 minutes from now
      try {
        const db = await initDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const getRequest = store.get(alarmId);
        getRequest.onsuccess = () => {
          const alarm = getRequest.result;
          if (alarm) {
            const newAlarmTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
            alarm.alarmTime = newAlarmTime.toISOString();
            alarm.enabled = true; // Keep enabled
            
            // Remove from active ringing alarms (will be re-added when it fires again)
            activeRingingAlarms.delete(alarmId);
            
            store.put(alarm);
            
            // Show snooze confirmation
            self.registration.showNotification('Alarm Snoozed', {
              body: `Alarm will ring again in 5 minutes`,
              icon: '/icon.svg',
              tag: 'snooze-confirmation',
            });
          }
        };
      } catch (error) {
        console.error('Error snoozing alarm:', error);
      }
    }
  } else {
    // Default click - open/focus app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Start checking on load
startAlarmChecking();

