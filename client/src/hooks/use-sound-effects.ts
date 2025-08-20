import { useEffect, useState } from 'react';

export interface SoundEffectsHook {
  isSupported: boolean;
  isEnabled: boolean;
  playRestComplete: () => void;
  playWorkoutComplete: () => void;
  playPersonalRecord: () => void;
  playWorkoutStart: () => void;
  playButtonClick: () => void;
  testSound: () => void;
}

export function useSoundEffects(): SoundEffectsHook {
  const [isSupported, setIsSupported] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // Verificar suporte a Web Audio API
    const supported = 'AudioContext' in window || 'webkitAudioContext' in window;
    setIsSupported(supported);

    if (supported) {
      // Criar contexto de áudio (será inicializado após interação do usuário)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      setAudioContext(ctx);
    }

    // Carregar preferências do usuário
    const preferences = localStorage.getItem('userPreferences');
    if (preferences) {
      const prefs = JSON.parse(preferences);
      setIsEnabled(prefs.soundEffects !== false);
    }
  }, []);

  // Função para criar e tocar um beep
  const playBeep = (frequency: number, duration: number, volume: number = 0.3) => {
    if (!audioContext || !isSupported || !isEnabled) return;

    try {
      // Garantir que o contexto está rodando
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

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
      console.warn('Erro ao reproduzir som:', error);
    }
  };

  // Função para tocar múltiplos beeps (melodia)
  const playMelody = (notes: { frequency: number; duration: number; delay: number }[], volume: number = 0.3) => {
    if (!audioContext || !isSupported || !isEnabled) return;

    notes.forEach((note, index) => {
      setTimeout(() => {
        playBeep(note.frequency, note.duration, volume);
      }, note.delay);
    });
  };

  // Sons específicos para cada evento
  const playRestComplete = () => {
    // Som de alerta - três beeps rápidos
    playMelody([
      { frequency: 800, duration: 0.15, delay: 0 },
      { frequency: 800, duration: 0.15, delay: 200 },
      { frequency: 800, duration: 0.15, delay: 400 }
    ], 0.4);
  };

  const playWorkoutComplete = () => {
    // Som de sucesso - melodia ascendente
    playMelody([
      { frequency: 523, duration: 0.2, delay: 0 },    // C5
      { frequency: 659, duration: 0.2, delay: 150 },  // E5
      { frequency: 784, duration: 0.2, delay: 300 },  // G5
      { frequency: 1047, duration: 0.4, delay: 450 }  // C6
    ], 0.3);
  };

  const playPersonalRecord = () => {
    // Som épico - fanfarra
    playMelody([
      { frequency: 440, duration: 0.1, delay: 0 },
      { frequency: 554, duration: 0.1, delay: 100 },
      { frequency: 659, duration: 0.1, delay: 200 },
      { frequency: 880, duration: 0.3, delay: 300 },
      { frequency: 1108, duration: 0.2, delay: 500 },
      { frequency: 880, duration: 0.4, delay: 650 }
    ], 0.35);
  };

  const playWorkoutStart = () => {
    // Som de início - dois beeps motivacionais
    playMelody([
      { frequency: 660, duration: 0.2, delay: 0 },
      { frequency: 880, duration: 0.3, delay: 250 }
    ], 0.3);
  };

  const playButtonClick = () => {
    // Som sutil de click
    playBeep(1000, 0.05, 0.1);
  };

  const testSound = () => {
    // Som de teste - escala simples
    playMelody([
      { frequency: 523, duration: 0.2, delay: 0 },
      { frequency: 587, duration: 0.2, delay: 200 },
      { frequency: 659, duration: 0.2, delay: 400 },
      { frequency: 698, duration: 0.3, delay: 600 }
    ], 0.3);
  };

  return {
    isSupported,
    isEnabled,
    playRestComplete,
    playWorkoutComplete,
    playPersonalRecord,
    playWorkoutStart,
    playButtonClick,
    testSound,
  };
}