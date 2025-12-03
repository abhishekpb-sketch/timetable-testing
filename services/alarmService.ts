// Alarm service to handle scheduling and notifications with persistent storage

export interface AlarmInfo {
  id: string;
  time: string; // Class start time in HH:MM format
  subject: string;
  date: Date;
  alarmTime: Date; // 10 minutes before class
  enabled: boolean;
}

// IndexedDB database name and version
const DB_NAME = 'TimetableAlarms';
const DB_VERSION = 1;
const STORE_NAME = 'alarms';

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('alarmTime', 'alarmTime', { unique: false });
      }
    };
  });
};

// Store active alarms in memory (for immediate cancellation)
const activeAlarms: Map<string, NodeJS.Timeout> = new Map();

/**
 * Parse time string (HH:MM format) and return Date object for today
 */
export const parseTimeString = (timeStr: string, date: Date): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const alarmDate = new Date(date);
  alarmDate.setHours(hours, minutes, 0, 0);
  return alarmDate;
};

/**
 * Calculate alarm time (10 minutes before class)
 */
export const calculateAlarmTime = (classTime: Date): Date => {
  const alarmTime = new Date(classTime);
  alarmTime.setMinutes(alarmTime.getMinutes() - 10);
  return alarmTime;
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Show notification
 */
export const showNotification = (subject: string, time: string) => {
  if (Notification.permission === 'granted') {
    new Notification('Class Reminder', {
      body: `${subject} starts in 10 minutes (at ${time})`,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: `alarm-${subject}-${time}`,
      requireInteraction: false,
    });
  }
};

/**
 * Save alarm to IndexedDB (persistent storage)
 */
export const saveAlarmToDB = async (alarmInfo: AlarmInfo): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Store alarm with serializable date
    const alarmData = {
      ...alarmInfo,
      date: alarmInfo.date.toISOString(),
      alarmTime: alarmInfo.alarmTime.toISOString(),
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(alarmData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Notify service worker about new alarm
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'ALARM_UPDATED',
        alarm: alarmData,
      });
    }
  } catch (error) {
    console.error('Failed to save alarm to IndexedDB:', error);
  }
};

/**
 * Remove alarm from IndexedDB
 */
export const removeAlarmFromDB = async (alarmId: string): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(alarmId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Notify service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'ALARM_REMOVED',
        alarmId,
      });
    }
  } catch (error) {
    console.error('Failed to remove alarm from IndexedDB:', error);
  }
};

/**
 * Get all alarms from IndexedDB
 */
export const getAllAlarmsFromDB = async (): Promise<AlarmInfo[]> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const alarms = request.result.map((alarm: any) => ({
          ...alarm,
          date: new Date(alarm.date),
          alarmTime: new Date(alarm.alarmTime),
        }));
        resolve(alarms);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get alarms from IndexedDB:', error);
    return [];
  }
};

/**
 * Schedule an alarm (both in memory and IndexedDB)
 */
export const scheduleAlarm = async (alarmInfo: AlarmInfo): Promise<boolean> => {
  const alarmId = alarmInfo.id;
  
  // Clear existing alarm if any
  if (activeAlarms.has(alarmId)) {
    clearTimeout(activeAlarms.get(alarmId)!);
  }

  const now = new Date();
  const timeUntilAlarm = alarmInfo.alarmTime.getTime() - now.getTime();

  // Save to IndexedDB for persistence (even if in the past, service worker will handle it)
  await saveAlarmToDB({ ...alarmInfo, enabled: true });

  // Only schedule in-memory if alarm is in the future (at least 1 second)
  // Note: The service worker will handle showing notifications and playing sounds
  // This timeout is just for immediate feedback if the app is open
  if (timeUntilAlarm > 1000) {
    const timeoutId = setTimeout(() => {
      // Service worker will handle the notification, but we can trigger a check
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CHECK_ALARMS',
        });
      }
      activeAlarms.delete(alarmId);
      // Don't remove from DB - let service worker handle it until dismissed
    }, timeUntilAlarm);

    activeAlarms.set(alarmId, timeoutId);
    return true;
  }

  // Even if in the past, save to DB - service worker will check periodically
  return true;
};

/**
 * Cancel an alarm (both in memory and IndexedDB)
 */
export const cancelAlarm = async (alarmId: string): Promise<void> => {
  // Cancel in-memory alarm
  if (activeAlarms.has(alarmId)) {
    clearTimeout(activeAlarms.get(alarmId)!);
    activeAlarms.delete(alarmId);
  }
  
  // Remove from IndexedDB
  await removeAlarmFromDB(alarmId);
};

/**
 * Cancel all alarms (both in memory and IndexedDB)
 */
export const cancelAllAlarms = async (): Promise<void> => {
  // Cancel all in-memory alarms
  activeAlarms.forEach((timeout) => clearTimeout(timeout));
  activeAlarms.clear();
  
  // Clear all from IndexedDB
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Notify service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'ALARMS_CLEARED',
      });
    }
  } catch (error) {
    console.error('Failed to clear alarms from IndexedDB:', error);
  }
};

/**
 * Generate unique alarm ID
 */
export const generateAlarmId = (date: Date, time: string, subject: string): string => {
  const dateStr = date.toISOString().split('T')[0];
  return `${dateStr}-${time}-${subject}`;
};

