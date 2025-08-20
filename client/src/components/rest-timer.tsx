import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';

interface RestTimerProps {
  defaultTime?: number; // em segundos
  onComplete?: () => void;
}

export function RestTimer({ defaultTime = 90, onComplete }: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(defaultTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const { notifyRestComplete } = useNotifications();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            notifyRestComplete();
            onComplete?.();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeLeft, notifyRestComplete, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setIsRunning(true);
    setIsCompleted(false);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setTimeLeft(defaultTime);
  };

  const addTime = (seconds: number) => {
    setTimeLeft(prev => Math.max(0, prev + seconds));
  };

  return (
    <Card className="glassmorphism w-full max-w-sm mx-auto">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg flex items-center justify-center">
          <Clock className="mr-2 h-5 w-5" />
          Timer de Descanso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Display do tempo */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${isCompleted ? 'text-green-500' : 'text-foreground'}`}>
            {formatTime(timeLeft)}
          </div>
          {isCompleted && (
            <div className="text-green-500 text-sm mt-1 animate-pulse">
              ✅ Descanso concluído!
            </div>
          )}
        </div>

        {/* Controles principais */}
        <div className="flex justify-center space-x-2">
          {!isRunning ? (
            <Button onClick={startTimer} className="flex items-center space-x-1">
              <Play className="w-4 h-4" />
              <span>Iniciar</span>
            </Button>
          ) : (
            <Button onClick={pauseTimer} variant="outline" className="flex items-center space-x-1">
              <Pause className="w-4 h-4" />
              <span>Pausar</span>
            </Button>
          )}
          
          <Button onClick={resetTimer} variant="outline" size="icon">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Botões de tempo rápido */}
        <div className="flex justify-center space-x-1 text-xs">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => addTime(-15)}
            disabled={timeLeft <= 15}
          >
            -15s
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => addTime(15)}
          >
            +15s
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => addTime(30)}
          >
            +30s
          </Button>
        </div>

        {/* Presets de tempo */}
        <div className="flex justify-center space-x-1 text-xs">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setTimeLeft(60);
              setIsCompleted(false);
            }}
          >
            1min
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setTimeLeft(90);
              setIsCompleted(false);
            }}
          >
            1:30
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setTimeLeft(120);
              setIsCompleted(false);
            }}
          >
            2min
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}