import { useEffect, useState } from 'react';
import { useToast } from './use-toast';
import { useSoundEffects } from './use-sound-effects';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: { action: string; title: string }[];
}

export interface NotificationSupportStatus {
  isSupported: boolean;
  isIOS: boolean;
  isPWA: boolean;
  hasPushManager: boolean;
  hasServiceWorker: boolean;
  hasNotificationAPI: boolean;
  iOSVersion?: number;
  reason?: string;
  instructions?: string[];
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supportStatus, setSupportStatus] = useState<NotificationSupportStatus>({
    isSupported: false,
    isIOS: false,
    isPWA: false,
    hasPushManager: false,
    hasServiceWorker: false,
    hasNotificationAPI: false
  });
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { toast } = useToast();
  const soundEffects = useSoundEffects();

  // Função avançada de detecção de suporte para iOS/PWA
  const detectNotificationSupport = (): NotificationSupportStatus => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as any).standalone === true ||
                  document.referrer.includes('android-app://');
    const hasPushManager = 'PushManager' in window;
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasNotificationAPI = 'Notification' in window;
    
    let iOSVersion: number | undefined;
    if (isIOS) {
      const match = userAgent.match(/OS (\d+)_/);
      if (match) {
        iOSVersion = parseInt(match[1]);
      }
    }
    
    let reason = '';
    let instructions: string[] = [];
    let isSupported = false;
    
    if (isIOS) {
      // iOS específico - precisa ser PWA instalada
      if (!iOSVersion || iOSVersion < 16) {
        reason = 'iOS muito antigo. É necessário iOS 16.4 ou superior.';
        instructions = ['Atualize seu iPhone para iOS 16.4 ou superior'];
      } else if (!isPWA) {
        reason = 'App não está instalado como PWA.';
        instructions = [
          'No Safari, toque no botão Compartilhar (quadrado com seta)',
          'Selecione "Adicionar à Tela de Início"',
          'Confirme a instalação',
          'Abra o app pela tela inicial (não pelo Safari)',
          'Volte aqui e ative as notificações'
        ];
      } else if (!hasPushManager) {
        reason = 'Push API não está habilitada no Safari.';
        instructions = [
          'Abra Configurações do iPhone',
          'Vá em Safari > Avançado > Recursos Experimentais', 
          'Ative "Push API"',
          'Volte ao app e tente novamente'
        ];
      } else if (!hasServiceWorker || !hasNotificationAPI) {
        reason = 'Recursos necessários não disponíveis.';
        instructions = ['Verifique se está usando a versão mais recente do Safari'];
      } else {
        isSupported = true;
      }
    } else {
      // Android/Desktop - verificação padrão
      if (!hasNotificationAPI) {
        reason = 'Seu navegador não suporta notificações.';
        instructions = ['Use um navegador moderno como Chrome, Firefox ou Edge'];
      } else if (!hasServiceWorker) {
        reason = 'Service Worker não suportado.';
        instructions = ['Atualize seu navegador para uma versão mais recente'];
      } else {
        isSupported = true;
      }
    }
    
    return {
      isSupported,
      isIOS,
      isPWA,
      hasPushManager,
      hasServiceWorker,
      hasNotificationAPI,
      iOSVersion,
      reason,
      instructions
    };
  };

  useEffect(() => {
    // Detectar suporte avançado a notificações
    const status = detectNotificationSupport();
    setSupportStatus(status);
    
    if (status.hasNotificationAPI) {
      setPermission(Notification.permission);
    }
    
    console.log('🔍 [NOTIFICATION SUPPORT]', status);
  }, []);

  // Solicitar permissão para notificações
  const requestPermission = async (): Promise<boolean> => {
    if (!supportStatus.isSupported) {
      toast({
        title: "Notificações não suportadas",
        description: supportStatus.reason || "Seu navegador não suporta notificações push.",
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
    if (supportStatus.isSupported && supportStatus.hasServiceWorker) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          setRegistration(reg);
          console.log('Service Worker registrado automaticamente:', reg);
        })
        .catch((error) => {
          console.error('Erro ao registrar Service Worker:', error);
        });
    }
  }, [supportStatus.isSupported, supportStatus.hasServiceWorker]);

  // Enviar notificação local
  const sendNotification = async (options: NotificationOptions) => {
    if (permission !== 'granted') {
      console.warn('⚠️ [NOTIFICATION] Permissão de notificação não concedida');
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
      console.error('❌ [NOTIFICATION ERROR] Erro ao enviar notificação:', error);
      return false;
    }
  };

  // Notificações específicas do GymSeven
  const notifyRestComplete = () => {
    soundEffects.playRestComplete();
    sendNotification({
      title: '⏰ Descanso finalizado!',
      body: 'Hora de continuar seu treino. Vamos lá!',
      tag: 'rest-complete',
      requireInteraction: true,
    });
  };

  const notifyWorkoutStart = (workoutName: string) => {
    soundEffects.playWorkoutStart();
    sendNotification({
      title: '💪 Treino iniciado!',
      body: `Bom treino de ${workoutName}. Foque e dê o seu melhor!`,
      tag: 'workout-start',
    });
  };

  const notifyWorkoutComplete = (workoutName: string, duration: string) => {
    soundEffects.playWorkoutComplete();
    sendNotification({
      title: '🎉 Treino concluído!',
      body: `Parabéns! Você finalizou ${workoutName} em ${duration}.`,
      tag: 'workout-complete',
      requireInteraction: true,
    });
  };

  const notifyPersonalRecord = (exercise: string) => {
    soundEffects.playPersonalRecord();
    sendNotification({
      title: '🔥 Novo recorde pessoal!',
      body: `Você quebrou seu recorde em ${exercise}. Incrível!`,
      tag: 'personal-record',
      requireInteraction: true,
    });
  };

  // Função para recarregar detecção de suporte
  const refreshSupport = () => {
    console.log('🔄 [REFRESH] Recarregando detecção de suporte...');
    const newStatus = detectNotificationSupport();
    setSupportStatus(newStatus);
    
    if (newStatus.hasNotificationAPI) {
      setPermission(Notification.permission);
    }
    
    console.log('✅ [REFRESH] Detecção atualizada:', newStatus);
  };

  return {
    permission,
    isSupported: supportStatus.isSupported,
    supportStatus,
    requestPermission,
    sendNotification,
    notifyRestComplete,
    notifyWorkoutStart,
    notifyWorkoutComplete,
    notifyPersonalRecord,
    soundEffects,
    refreshSupport,
  };
}