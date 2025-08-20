import { useEffect, useState } from 'react';
import { useToast } from './use-toast';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: { action: string; title: string }[];
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar suporte a notificações
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Solicitar permissão para notificações
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações push.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "Notificações ativadas!",
          description: "Você receberá alertas sobre seus treinos.",
        });
        return true;
      } else {
        toast({
          title: "Permissão negada",
          description: "Ative as notificações nas configurações do navegador.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast({
        title: "Erro nas notificações",
        description: "Não foi possível configurar as notificações.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Inicializar service worker automaticamente
  useEffect(() => {
    if (isSupported) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          setRegistration(reg);
          console.log('Service Worker registrado automaticamente:', reg);
        })
        .catch((error) => {
          console.error('Erro ao registrar Service Worker:', error);
        });
    }
  }, [isSupported]);

  // Enviar notificação local
  const sendNotification = async (options: NotificationOptions) => {
    if (permission !== 'granted') {
      console.warn('Permissão de notificação não concedida');
      return false;
    }

    try {
      // Verificar se as preferências do usuário permitem notificações
      const userPreferences = localStorage.getItem('userPreferences');
      if (userPreferences) {
        const prefs = JSON.parse(userPreferences);
        if (!prefs.notifications) {
          console.log('Notificações desabilitadas pelo usuário');
          return false;
        }
      }

      // Se temos service worker, usar ele
      if (registration) {
        await registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: options.tag || 'gymseven-notification',
          requireInteraction: options.requireInteraction || false,
          actions: options.actions || [],
          data: { timestamp: Date.now() },
          ...('vibrate' in navigator && { vibrate: [200, 100, 200] })
        } as any);
      } else {
        // Fallback para notificação simples
        new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/favicon.ico',
          tag: options.tag || 'gymseven-notification',
        });
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return false;
    }
  };

  // Notificações específicas do GymSeven
  const notifyRestComplete = () => {
    sendNotification({
      title: '⏰ Descanso finalizado!',
      body: 'Hora de continuar seu treino. Vamos lá!',
      tag: 'rest-complete',
      requireInteraction: true,
    });
  };

  const notifyWorkoutStart = (workoutName: string) => {
    sendNotification({
      title: '💪 Treino iniciado!',
      body: `Bom treino de ${workoutName}. Foque e dê o seu melhor!`,
      tag: 'workout-start',
    });
  };

  const notifyWorkoutComplete = (workoutName: string, duration: string) => {
    sendNotification({
      title: '🎉 Treino concluído!',
      body: `Parabéns! Você finalizou ${workoutName} em ${duration}.`,
      tag: 'workout-complete',
      requireInteraction: true,
    });
  };

  const notifyPersonalRecord = (exercise: string) => {
    sendNotification({
      title: '🔥 Novo recorde pessoal!',
      body: `Você quebrou seu recorde em ${exercise}. Incrível!`,
      tag: 'personal-record',
      requireInteraction: true,
    });
  };

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    notifyRestComplete,
    notifyWorkoutStart,
    notifyWorkoutComplete,
    notifyPersonalRecord,
  };
}