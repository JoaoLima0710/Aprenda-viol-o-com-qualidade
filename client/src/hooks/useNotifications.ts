import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export type NotificationType = 
  | 'practice_reminder'
  | 'achievement_unlocked'
  | 'new_song'
  | 'streak_milestone'
  | 'daily_goal';

interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Notificações não suportadas neste navegador');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast.success('Notificações ativadas! 🔔', {
          description: 'Você receberá lembretes de prática',
        });
        
        // Subscribe to push notifications
        await subscribeToPush();
        return true;
      } else if (result === 'denied') {
        toast.error('Notificações bloqueadas', {
          description: 'Ative nas configurações do navegador',
        });
        return false;
      }
    } catch (error) {
      console.error('[Notifications] Permission request failed:', error);
      toast.error('Erro ao solicitar permissão');
      return false;
    }

    return false;
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let sub = await registration.pushManager.getSubscription();
      
      if (!sub) {
        // Create new subscription
        // Note: In production, you need a VAPID public key from your backend
        // For now, we'll use a mock key (this won't work for real push, but enables local notifications)
        const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xQmrPcBBnWDFIMwCGAMpKexJsvQETYWmsmkAiAIdGwdYrUYI1xRXM';
        
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        console.log('[Notifications] Push subscription created:', sub);
      }

      setSubscription(sub);

      // In production, send subscription to backend
      // await sendSubscriptionToBackend(sub);

      return sub;
    } catch (error) {
      console.error('[Notifications] Push subscription failed:', error);
      return null;
    }
  };

  const unsubscribe = async () => {
    if (subscription) {
      try {
        await subscription.unsubscribe();
        setSubscription(null);
        toast.info('Notificações desativadas');
        return true;
      } catch (error) {
        console.error('[Notifications] Unsubscribe failed:', error);
        return false;
      }
    }
    return false;
  };

  const sendLocalNotification = async (payload: NotificationPayload) => {
    if (permission !== 'granted') {
      console.warn('[Notifications] Permission not granted');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/icon-96x96.png',
        tag: payload.type,
        requireInteraction: false,
        data: {
          type: payload.type,
          ...payload.data,
          timestamp: Date.now(),
        },
        actions: getActionsForType(payload.type),
      } as NotificationOptions);

      console.log('[Notifications] Local notification sent:', payload.type);
    } catch (error) {
      console.error('[Notifications] Failed to send notification:', error);
    }
  };

  const scheduleDailyReminder = (hour: number = 19, minute: number = 0) => {
    // Calculate time until next reminder
    const now = new Date();
    const reminder = new Date();
    reminder.setHours(hour, minute, 0, 0);

    if (reminder <= now) {
      reminder.setDate(reminder.getDate() + 1);
    }

    const timeUntilReminder = reminder.getTime() - now.getTime();

    setTimeout(() => {
      sendLocalNotification({
        type: 'practice_reminder',
        title: '🎸 Hora de praticar!',
        body: 'Que tal tocar um pouco hoje? Sua meta diária te espera!',
      });

      // Schedule next day
      scheduleDailyReminder(hour, minute);
    }, timeUntilReminder);

    console.log('[Notifications] Daily reminder scheduled for', reminder.toLocaleString());
  };

  const notifyAchievement = (achievementName: string, xp: number) => {
    sendLocalNotification({
      type: 'achievement_unlocked',
      title: '🏆 Conquista Desbloqueada!',
      body: `${achievementName} (+${xp} XP)`,
      data: { achievementName, xp },
    });
  };

  const notifyNewSong = (songName: string) => {
    sendLocalNotification({
      type: 'new_song',
      title: '🎵 Nova Música Disponível!',
      body: `"${songName}" foi adicionada ao catálogo`,
      data: { songName },
    });
  };

  const notifyStreakMilestone = (days: number) => {
    sendLocalNotification({
      type: 'streak_milestone',
      title: `🔥 ${days} dias de sequência!`,
      body: `Parabéns! Continue assim para manter sua sequência`,
      data: { days },
    });
  };

  const notifyDailyGoalComplete = (minutes: number) => {
    sendLocalNotification({
      type: 'daily_goal',
      title: '✅ Meta Diária Completa!',
      body: `Você praticou ${minutes} minutos hoje. Excelente trabalho!`,
      data: { minutes },
    });
  };

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    unsubscribe,
    sendLocalNotification,
    scheduleDailyReminder,
    notifyAchievement,
    notifyNewSong,
    notifyStreakMilestone,
    notifyDailyGoalComplete,
  };
}

// Helper functions

function getActionsForType(type: NotificationType) {
  switch (type) {
    case 'practice_reminder':
      return [
        { action: 'practice', title: 'Praticar Agora', icon: '/icons/icon-96x96.png' },
        { action: 'dismiss', title: 'Depois', icon: '/icons/icon-96x96.png' },
      ];
    case 'achievement_unlocked':
      return [
        { action: 'view', title: 'Ver Conquista', icon: '/icons/icon-96x96.png' },
        { action: 'dismiss', title: 'OK', icon: '/icons/icon-96x96.png' },
      ];
    case 'new_song':
      return [
        { action: 'view', title: 'Ver Música', icon: '/icons/icon-96x96.png' },
        { action: 'dismiss', title: 'Depois', icon: '/icons/icon-96x96.png' },
      ];
    default:
      return [
        { action: 'dismiss', title: 'OK', icon: '/icons/icon-96x96.png' },
      ];
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
