import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

// Tipos para sistema de áudio móvel-compatível
export interface MobileAudioCapabilities {
  isSupported: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isPWA: boolean;
  hasWebAudio: boolean;
  hasHTMLAudio: boolean;
  hasVibration: boolean;
  canPlayMultiple: boolean;
  requiresInteraction: boolean;
  isSilentMode: boolean | null;
  detectionComplete: boolean;
}

export interface SoundEffectsHook {
  isSupported: boolean;
  isEnabled: boolean;
  capabilities: MobileAudioCapabilities;
  isInitialized: boolean;
  playRestComplete: () => void;
  playWorkoutComplete: () => void;
  playPersonalRecord: () => void;
  playWorkoutStart: () => void;
  playButtonClick: () => void;
  testSound: () => void;
  initializeAudio: () => Promise<boolean>;
  refreshCapabilities: () => void;
}

// Mapeamento de audio sprites
export interface AudioSprite {
  [key: string]: {
    start: number;
    duration: number;
  };
}

// Configuração de sons do app
const SOUND_SPRITES: AudioSprite = {
  restComplete: { start: 1, duration: 0.8 },
  workoutComplete: { start: 2.5, duration: 1.2 },
  personalRecord: { start: 4.5, duration: 1.5 },
  workoutStart: { start: 7, duration: 0.8 },
  buttonClick: { start: 8.5, duration: 0.2 },
  testSound: { start: 9.5, duration: 1.0 },
};

export function useSoundEffects(): SoundEffectsHook {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [capabilities, setCapabilities] = useState<MobileAudioCapabilities>({
    isSupported: false,
    isIOS: false,
    isAndroid: false,
    isPWA: false,
    hasWebAudio: false,
    hasHTMLAudio: false,
    hasVibration: false,
    canPlayMultiple: false,
    requiresInteraction: false,
    isSilentMode: null,
    detectionComplete: false,
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioSpriteLoaded = useRef(false);
  const userInteractionReceived = useRef(false);
  const initializationAttempted = useRef(false);

  // Detecção avançada de capacidades móveis
  const detectMobileAudioCapabilities = useCallback((): MobileAudioCapabilities => {
    console.log('🔍 [AUDIO] Detectando capacidades móveis do dispositivo...');
    
    // Detecção básica de plataforma
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = userAgent.includes('android');
    
    // Detecção de PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as any).standalone ||
                  document.referrer.includes('android-app://');
    
    // Detecção de APIs disponíveis
    const hasWebAudio = 'AudioContext' in window || 'webkitAudioContext' in window;
    const hasHTMLAudio = 'Audio' in window;
    const hasVibration = 'vibrate' in navigator;
    
    // iOS só pode tocar um som por vez
    const canPlayMultiple = !isIOS;
    
    // Dispositivos móveis geralmente requerem interação
    const requiresInteraction = isIOS || isAndroid;
    
    const isSupported = hasWebAudio || hasHTMLAudio;
    
    const caps = {
      isSupported,
      isIOS,
      isAndroid,
      isPWA,
      hasWebAudio,
      hasHTMLAudio,
      hasVibration,
      canPlayMultiple,
      requiresInteraction,
      isSilentMode: null, // Será detectado após inicialização
      detectionComplete: true,
    };
    
    console.log('✅ [AUDIO] Capacidades detectadas:', caps);
    return caps;
  }, []);
  
  // Detecção de silent mode no iOS - método simplificado e mais confiável
  const detectIOSSilentMode = useCallback(async (): Promise<boolean> => {
    if (!capabilities.isIOS) return false;
    
    try {
      console.log('🔇 [AUDIO] Detectando silent mode no iOS...');
      
      // Método simplificado: testar se conseguimos reproduzir uma nota silenciosa
      if (!audioContextRef.current) return false;
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Volume quase zero para teste
      gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
      oscillator.frequency.value = 440;
      oscillator.type = 'sine';
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
      
      // Se chegamos até aqui, Web Audio está funcionando
      console.log('🔇 [AUDIO] Silent mode: false (Web Audio funcional)');
      return false;
      
    } catch (error) {
      console.log('🔇 [AUDIO] Silent mode: true (Web Audio falhou)');
      return true;
    }
  }, [capabilities.isIOS]);
  
  // Função para carregar audio sprite
  const loadAudioSprite = useCallback(async (): Promise<boolean> => {
    console.log('🎵 [AUDIO SPRITE] Tentando carregar audio sprite...');
    
    try {
      // Lista de arquivos sprite para tentar (em ordem de preferência)
      const spriteUrls = [
        '/audio/gymseven-sounds.mp3',
        '/audio/gymseven-sounds.ogg',
        '/sounds/sprite.mp3',
        '/sounds/sprite.ogg'
      ];
      
      for (const url of spriteUrls) {
        try {
          console.log(`🔍 [AUDIO SPRITE] Testando: ${url}`);
          
          if (capabilities.hasWebAudio && audioContextRef.current) {
            // Tentar carregar com Web Audio API
            const response = await fetch(url);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
              audioBufferRef.current = audioBuffer;
              audioSpriteLoaded.current = true;
              console.log(`✅ [AUDIO SPRITE] Carregado com sucesso: ${url}`);
              return true;
            }
          } else if (capabilities.hasHTMLAudio) {
            // Fallback para HTML5 Audio
            const audio = new Audio(url);
            audio.preload = 'auto';
            
            await new Promise((resolve, reject) => {
              audio.addEventListener('canplaythrough', resolve, { once: true });
              audio.addEventListener('error', reject, { once: true });
              audio.load();
            });
            
            htmlAudioRef.current = audio;
            audioSpriteLoaded.current = true;
            console.log(`✅ [AUDIO SPRITE] Carregado via HTML5: ${url}`);
            return true;
          }
        } catch (error) {
          console.log(`⚠️ [AUDIO SPRITE] Falha em ${url}:`, error);
          continue;
        }
      }
      
      console.log('📴 [AUDIO SPRITE] Nenhum arquivo encontrado, usando sons sintéticos');
      return false;
      
    } catch (error) {
      console.error('❌ [AUDIO SPRITE] Erro no carregamento:', error);
      return false;
    }
  }, [capabilities]);
  
  // Função para reproduzir parte do audio sprite
  const playSpriteSegment = useCallback(async (soundKey: keyof typeof SOUND_SPRITES): Promise<boolean> => {
    if (!audioSpriteLoaded.current) {
      console.log(`📴 [AUDIO SPRITE] Sprite não carregado para: ${soundKey}`);
      return false;
    }
    
    const sprite = SOUND_SPRITES[soundKey];
    if (!sprite) {
      console.warn(`⚠️ [AUDIO SPRITE] Sprite não encontrado: ${soundKey}`);
      return false;
    }
    
    try {
      console.log(`🎵 [AUDIO SPRITE] Reproduzindo: ${soundKey}`);
      
      if (audioBufferRef.current && audioContextRef.current) {
        // Reproduzir com Web Audio API
        const source = audioContextRef.current.createBufferSource();
        const gainNode = audioContextRef.current.createGain();
        
        source.buffer = audioBufferRef.current;
        source.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        
        // Configurar volume e envelope
        gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioContextRef.current.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + sprite.duration);
        
        // Reproduzir segmento específico
        source.start(audioContextRef.current.currentTime, sprite.start, sprite.duration);
        
        console.log(`✅ [AUDIO SPRITE] Reproduzido via Web Audio: ${soundKey}`);
        return true;
        
      } else if (htmlAudioRef.current) {
        // Fallback para HTML5 Audio
        const audio = htmlAudioRef.current;
        audio.currentTime = sprite.start;
        
        const playPromise = audio.play();
        if (playPromise) {
          await playPromise;
        }
        
        // Parar após a duração do segmento
        setTimeout(() => {
          audio.pause();
        }, sprite.duration * 1000);
        
        console.log(`✅ [AUDIO SPRITE] Reproduzido via HTML5: ${soundKey}`);
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error(`❌ [AUDIO SPRITE] Erro ao reproduzir ${soundKey}:`, error);
      return false;
    }
  }, []);
  
  // Inicialização após interação do usuário
  const initializeAudio = useCallback(async (): Promise<boolean> => {
    if (isInitialized || !capabilities.isSupported) {
      console.log('🔄 [AUDIO] Áudio já inicializado ou não suportado');
      return isInitialized;
    }
    
    console.log('🎵 [AUDIO] Inicializando sistema de áudio...');
    
    try {
      // Marcar que recebemos interação do usuário
      userInteractionReceived.current = true;
      
      // Inicializar Web Audio API se disponível PRIMEIRO
      if (capabilities.hasWebAudio) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        
        // Garantir que o contexto está ativo
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        
        audioContextRef.current = ctx;
        console.log('✅ [AUDIO] Web Audio API inicializada:', ctx.state);
      }
      
      // Detectar silent mode no iOS APÓS inicializar AudioContext
      if (capabilities.isIOS) {
        const isSilent = await detectIOSSilentMode();
        setCapabilities(prev => ({ ...prev, isSilentMode: isSilent }));
        
        if (isSilent) {
          console.log('🔇 [AUDIO] Dispositivo em modo silencioso, usando fallbacks');
          toast({
            title: "Dispositivo silenciado",
            description: "Os sons estão desabilitados. Ative o som para uma melhor experiência.",
            duration: 3000,
          });
        }
      }
      
      // Inicializar HTML5 Audio e tentar carregar audio sprite
      if (capabilities.hasHTMLAudio) {
        try {
          await loadAudioSprite();
        } catch (error) {
          console.warn('⚠️ [AUDIO] Falha ao carregar audio sprite, usando sons sintéticos:', error);
        }
        
        // Criar áudio de teste APENAS se não carregamos sprite
        if (!audioSpriteLoaded.current) {
          const testAudio = new Audio();
          testAudio.volume = 0.01;
          testAudioRef.current = testAudio;
          console.log('✅ [AUDIO] HTML5 Audio de teste inicializado');
        } else {
          console.log('✅ [AUDIO] HTML5 Audio sprite já carregado, usando sprite');
        }
      }
      
      setIsInitialized(true);
      setIsSupported(true);
      
      console.log('🎉 [AUDIO] Sistema de áudio totalmente inicializado!');
      return true;
      
    } catch (error) {
      console.error('❌ [AUDIO] Erro na inicialização:', error);
      toast({
        title: "Erro no áudio",
        description: "Não foi possível inicializar o sistema de áudio.",
        variant: "destructive",
        duration: 3000,
      });
      return false;
    }
  }, [capabilities, isInitialized, detectIOSSilentMode, toast]);
  
  // Refresh das capacidades
  const refreshCapabilities = useCallback(() => {
    console.log('🔄 [AUDIO] Atualizando capacidades do dispositivo...');
    const newCaps = detectMobileAudioCapabilities();
    setCapabilities(newCaps);
    setIsSupported(newCaps.isSupported);
  }, [detectMobileAudioCapabilities]);
  
  // Inicialização na montagem do componente
  useEffect(() => {
    console.log('🚀 [AUDIO] Iniciando hook de efeitos sonoros...');
    
    // Detectar capacidades iniciais
    const caps = detectMobileAudioCapabilities();
    setCapabilities(caps);
    setIsSupported(caps.isSupported);
    
    // Carregar preferências do usuário
    const preferences = localStorage.getItem('userPreferences');
    if (preferences) {
      const prefs = JSON.parse(preferences);
      setIsEnabled(prefs.soundEffects !== false);
    }
    
    // Auto-inicializar se não requer interação - usar um marcador para evitar loop
    if (!caps.requiresInteraction && caps.isSupported && !initializationAttempted.current) {
      initializationAttempted.current = true;
      initializeAudio();
    }
    
  }, [detectMobileAudioCapabilities]); // Remover initializeAudio das dependências
  
  // Listener para primeira interação do usuário
  useEffect(() => {
    if (!capabilities.requiresInteraction || isInitialized) return;
    
    const handleFirstInteraction = () => {
      if (!userInteractionReceived.current) {
        console.log('👆 [AUDIO] Primeira interação detectada, inicializando áudio...');
        initializeAudio();
      }
    };
    
    // Eventos de interação aceitos
    const events = ['touchstart', 'touchend', 'click', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, handleFirstInteraction, { once: true, passive: true });
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction);
      });
    };
  }, [capabilities.requiresInteraction, isInitialized, initializeAudio]);
  
  // Gestão de background/foreground para economia de bateria
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App foi para background - pausar contexto para economizar bateria
        if (audioContextRef.current && audioContextRef.current.state === 'running') {
          console.log('⏸️ [AUDIO] App em background, pausando áudio para economizar bateria');
          audioContextRef.current.suspend();
        }
        
        // Pausar HTML5 audio se estiver tocando
        if (htmlAudioRef.current && !htmlAudioRef.current.paused) {
          htmlAudioRef.current.pause();
        }
        if (testAudioRef.current && !testAudioRef.current.paused) {
          testAudioRef.current.pause();
        }
      } else {
        // App voltou para foreground - reativar se usuário já interagiu
        if (userInteractionReceived.current && audioContextRef.current && audioContextRef.current.state === 'suspended') {
          console.log('▶️ [AUDIO] App em foreground, reativando áudio');
          audioContextRef.current.resume();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Gestão de memória e limpeza de recursos
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('🧹 [AUDIO] Limpando recursos de áudio...');
      
      try {
        // Limpar AudioContext apenas se não estiver fechado
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      } catch (error) {
        console.warn('⚠️ [AUDIO] Erro ao fechar AudioContext:', error);
      }
      
      try {
        // Limpar HTML5 Audio de teste (NÃO limpar o sprite!)
        if (testAudioRef.current) {
          testAudioRef.current.pause();
          testAudioRef.current.src = '';
          testAudioRef.current.load();
        }
      } catch (error) {
        console.warn('⚠️ [AUDIO] Erro ao limpar test audio:', error);
      }
      
      try {
        // Limpar HTML5 audio sprite apenas se não estiver em uso
        if (htmlAudioRef.current && !audioSpriteLoaded.current) {
          htmlAudioRef.current.pause();
          htmlAudioRef.current.src = '';
          htmlAudioRef.current.load();
        }
      } catch (error) {
        console.warn('⚠️ [AUDIO] Erro ao limpar sprite audio:', error);
      }
      
      // Limpar refs
      audioBufferRef.current = null;
      audioSpriteLoaded.current = false;
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup durante desenvolvimento (HMR)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Durante desenvolvimento, limpar recursos para HMR
      if (import.meta.hot) {
        try {
          console.log('🔄 [AUDIO] Limpeza HMR (desenvolvimento)');
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
          }
        } catch (error) {
          // Silenciar erros de HMR em desenvolvimento
        }
      }
    };
  }, []);
  
  // Otimização: liberar recursos quando áudio não é usado por muito tempo
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    
    const resetInactivityTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      
      // Se não houver atividade de áudio por 5 minutos, suspender contexto
      inactivityTimer = setTimeout(() => {
        if (audioContextRef.current && audioContextRef.current.state === 'running') {
          console.log('😴 [AUDIO] Suspendendo contexto por inatividade (economia de bateria)');
          audioContextRef.current.suspend();
        }
      }, 5 * 60 * 1000); // 5 minutos
    };
    
    // Resetar timer sempre que há atividade
    const handleAudioActivity = () => {
      resetInactivityTimer();
    };
    
    // Escutar eventos de áudio para detectar atividade
    if (audioContextRef.current) {
      audioContextRef.current.addEventListener('statechange', handleAudioActivity);
    }
    
    resetInactivityTimer();
    
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      if (audioContextRef.current) {
        audioContextRef.current.removeEventListener('statechange', handleAudioActivity);
      }
    };
  }, [isInitialized]);

  // Sistema de reprodução com fallback em cascata - MELHORADO
  const playSoundWithFallback = useCallback(async (soundKey: keyof typeof SOUND_SPRITES): Promise<boolean> => {
    if (!isEnabled || !capabilities.isSupported) {
      console.log(`🔇 [AUDIO] Som desabilitado ou não suportado: ${soundKey}`);
      return false;
    }
    
    console.log(`🎵 [AUDIO] Reproduzindo som: ${soundKey}`);
    
    // Auto-inicializar se necessário
    if (!isInitialized && capabilities.requiresInteraction && userInteractionReceived.current) {
      await initializeAudio();
    }
    
    // Sempre pular HTML5 no iOS (Web Audio é mais confiável)
    const shouldSkipHTML5 = capabilities.isIOS;
    
    // Fallback 1: Audio Sprites via Web Audio (preferido para iOS)
    if (audioSpriteLoaded.current && audioBufferRef.current && audioContextRef.current && isInitialized) {
      try {
        const success = await playSpriteSegment(soundKey);
        if (success) {
          console.log(`✅ [AUDIO] Som reproduzido via Audio Sprite (Web Audio): ${soundKey}`);
          return true;
        }
      } catch (error) {
        console.warn(`⚠️ [AUDIO] Audio Sprite Web Audio falhou para ${soundKey}:`, error);
      }
    }
    
    // Fallback 2: Audio Sprites via HTML5 (apenas se não iOS em silent mode)
    if (audioSpriteLoaded.current && htmlAudioRef.current && !shouldSkipHTML5 && isInitialized) {
      try {
        const success = await playSpriteSegment(soundKey);
        if (success) {
          console.log(`✅ [AUDIO] Som reproduzido via Audio Sprite (HTML5): ${soundKey}`);
          return true;
        }
      } catch (error) {
        console.warn(`⚠️ [AUDIO] Audio Sprite HTML5 falhou para ${soundKey}:`, error);
      }
    }
    
    // Fallback 3: Web Audio API com sons sintéticos
    if (capabilities.hasWebAudio && audioContextRef.current && isInitialized) {
      try {
        const success = await playBeepSound(soundKey);
        if (success) {
          console.log(`✅ [AUDIO] Som reproduzido via Web Audio Sintético: ${soundKey}`);
          return true;
        }
      } catch (error) {
        console.warn(`⚠️ [AUDIO] Web Audio Sintético falhou para ${soundKey}:`, error);
      }
    }
    
    // Fallback 4: Vibração (importante para iOS silenciado)
    if (capabilities.hasVibration) {
      try {
        const pattern = getVibrationPattern(soundKey);
        navigator.vibrate(pattern);
        console.log(`📳 [AUDIO] Vibração reproduzida: ${soundKey}`);
        return true;
      } catch (error) {
        console.warn(`⚠️ [AUDIO] Vibração falhou para ${soundKey}:`, error);
      }
    }
    
    // Fallback 5: Feedback visual (último recurso)
    showVisualFeedback(soundKey);
    console.log(`👁️ [AUDIO] Feedback visual para: ${soundKey}`);
    return true;
  }, [isEnabled, capabilities, isInitialized, initializeAudio]);
  
  // Função para reproduzir sons sintéticos (mantém a funcionalidade atual)
  const playBeepSound = useCallback(async (soundKey: keyof typeof SOUND_SPRITES): Promise<boolean> => {
    const audioContext = audioContextRef.current;
    if (!audioContext) {
      console.warn('🚫 [AUDIO] AudioContext não disponível');
      return false;
    }
    
    try {
      // Garantir que o contexto está ativo
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Reproduzir sons baseados na configuração atual
      const soundConfig = getSoundConfig(soundKey);
      if (soundConfig.type === 'melody') {
        playMelody(soundConfig.notes, soundConfig.volume);
      } else {
        playBeep(soundConfig.frequency, soundConfig.duration, soundConfig.volume);
      }
      
      return true;
    } catch (error) {
      console.error('❌ [AUDIO] Erro no playBeepSound:', error);
      return false;
    }
  }, []);
  
  // Função para criar e tocar um beep (melhorada)
  const playBeep = useCallback((frequency: number, duration: number, volume: number = 0.3) => {
    const audioContext = audioContextRef.current;
    if (!audioContext || !isSupported || !isEnabled) return;

    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      // Envelope de volume para evitar clicks
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (error) {
      console.warn('⚠️ [AUDIO] Erro ao reproduzir beep:', error);
    }
  }, [isSupported, isEnabled]);

  // Função para tocar múltiplos beeps (melodia) - melhorada
  const playMelody = useCallback((notes: { frequency: number; duration: number; delay: number }[], volume: number = 0.3) => {
    if (!capabilities.canPlayMultiple) {
      // iOS: tocar apenas a primeira nota para evitar conflitos
      if (notes.length > 0) {
        playBeep(notes[0].frequency, notes[0].duration, volume);
      }
      return;
    }
    
    // Outros dispositivos: tocar a melodia completa
    notes.forEach((note) => {
      setTimeout(() => {
        playBeep(note.frequency, note.duration, volume);
      }, note.delay);
    });
  }, [capabilities.canPlayMultiple, playBeep]);
  
  // Configurações de som para cada evento
  const getSoundConfig = useCallback((soundKey: keyof typeof SOUND_SPRITES) => {
    const configs: Record<keyof typeof SOUND_SPRITES, any> = {
      restComplete: {
        type: 'melody' as const,
        notes: [
          { frequency: 800, duration: 0.15, delay: 0 },
          { frequency: 800, duration: 0.15, delay: 200 },
          { frequency: 800, duration: 0.15, delay: 400 }
        ],
        volume: 0.4
      },
      workoutComplete: {
        type: 'melody' as const,
        notes: [
          { frequency: 523, duration: 0.2, delay: 0 },    // C5
          { frequency: 659, duration: 0.2, delay: 150 },  // E5
          { frequency: 784, duration: 0.2, delay: 300 },  // G5
          { frequency: 1047, duration: 0.4, delay: 450 }  // C6
        ],
        volume: 0.3
      },
      personalRecord: {
        type: 'melody' as const,
        notes: [
          { frequency: 440, duration: 0.1, delay: 0 },
          { frequency: 554, duration: 0.1, delay: 100 },
          { frequency: 659, duration: 0.1, delay: 200 },
          { frequency: 880, duration: 0.3, delay: 300 },
          { frequency: 1108, duration: 0.2, delay: 500 },
          { frequency: 880, duration: 0.4, delay: 650 }
        ],
        volume: 0.35
      },
      workoutStart: {
        type: 'melody' as const,
        notes: [
          { frequency: 660, duration: 0.2, delay: 0 },
          { frequency: 880, duration: 0.3, delay: 250 }
        ],
        volume: 0.3
      },
      buttonClick: {
        type: 'beep' as const,
        frequency: 1000,
        duration: 0.05,
        volume: 0.1
      },
      testSound: {
        type: 'melody' as const,
        notes: [
          { frequency: 523, duration: 0.2, delay: 0 },
          { frequency: 587, duration: 0.2, delay: 200 },
          { frequency: 659, duration: 0.2, delay: 400 },
          { frequency: 698, duration: 0.3, delay: 600 }
        ],
        volume: 0.3
      }
    };
    
    return configs[soundKey];
  }, []);
  
  // Padrões de vibração para cada som - OTIMIZADO PARA BATERIA
  const getVibrationPattern = useCallback((soundKey: keyof typeof SOUND_SPRITES): number[] => {
    const patterns: Record<keyof typeof SOUND_SPRITES, number[]> = {
      restComplete: [200, 100, 200], // Duas vibrações curtas (economia de bateria)
      workoutComplete: [100, 50, 200, 50, 300], // Padrão ascendente mais curto
      personalRecord: [300, 100, 400], // Padrão épico otimizado
      workoutStart: [150, 100, 200], // Dois pulsos
      buttonClick: [30], // Vibração muito sutil para economia de bateria
      testSound: [100, 50, 100], // Padrão curto de teste
    };
    
    return patterns[soundKey] || [50]; // Padrão mais curto
  }, []);
  
  // Feedback visual como último fallback
  const showVisualFeedback = useCallback((soundKey: keyof typeof SOUND_SPRITES) => {
    const messages: Record<keyof typeof SOUND_SPRITES, { title: string; description: string }> = {
      restComplete: { title: "⏰ Descanso finalizado!", description: "Hora de continuar o treino" },
      workoutComplete: { title: "🎉 Treino concluído!", description: "Parabéns pelo excelente trabalho" },
      personalRecord: { title: "🏆 Novo recorde!", description: "Você superou seu melhor resultado" },
      workoutStart: { title: "💪 Treino iniciado!", description: "Vamos começar com tudo" },
      buttonClick: { title: "👆 Clique", description: "Ação confirmada" },
      testSound: { title: "🔊 Teste de som", description: "Sistema de áudio funcionando" },
    };
    
    const message = messages[soundKey];
    if (message) {
      toast({
        title: message.title,
        description: message.description,
        duration: 2000,
      });
    }
  }, [toast]);

  // Funções públicas da API (mantém compatibilidade com sistema existente)
  const playRestComplete = useCallback(() => {
    console.log('🔥 [AUDIO] Evento: Descanso finalizado');
    playSoundWithFallback('restComplete');
  }, [playSoundWithFallback]);

  const playWorkoutComplete = useCallback(() => {
    console.log('🎉 [AUDIO] Evento: Treino concluído');
    playSoundWithFallback('workoutComplete');
  }, [playSoundWithFallback]);

  const playPersonalRecord = useCallback(() => {
    console.log('🏆 [AUDIO] Evento: Recorde pessoal');
    playSoundWithFallback('personalRecord');
  }, [playSoundWithFallback]);

  const playWorkoutStart = useCallback(() => {
    console.log('💪 [AUDIO] Evento: Treino iniciado');
    playSoundWithFallback('workoutStart');
  }, [playSoundWithFallback]);

  const playButtonClick = useCallback(() => {
    console.log('👆 [AUDIO] Evento: Clique de botão');
    playSoundWithFallback('buttonClick');
  }, [playSoundWithFallback]);

  const testSound = useCallback(() => {
    console.log('🔊 [AUDIO] Evento: Teste de som');
    playSoundWithFallback('testSound');
  }, [playSoundWithFallback]);

  return {
    isSupported,
    isEnabled,
    capabilities,
    isInitialized,
    playRestComplete,
    playWorkoutComplete,
    playPersonalRecord,
    playWorkoutStart,
    playButtonClick,
    testSound,
    initializeAudio,
    refreshCapabilities,
  };
}