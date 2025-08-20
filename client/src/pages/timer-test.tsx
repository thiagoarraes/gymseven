import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Zap, Trophy, Timer } from 'lucide-react';
import { RestTimer } from '@/components/rest-timer';
import { useWorkout } from '@/contexts/workout-context';
import { useNotifications } from '@/hooks/use-notifications';

export default function TimerTest() {
  const { startWorkout, endWorkout, isWorkoutActive, currentWorkout, notifyPersonalRecord } = useWorkout();
  const { sendNotification, permission, isSupported } = useNotifications();

  const testNotifications = [
    {
      title: '💪 Treino iniciado!',
      body: 'Bom treino de Push A. Foque e dê o seu melhor!',
      action: () => startWorkout('Push A')
    },
    {
      title: '🔥 Novo recorde pessoal!',
      body: 'Você quebrou seu recorde em Supino Reto. Incrível!',
      action: () => notifyPersonalRecord('Supino Reto')
    },
    {
      title: '🎉 Treino concluído!',
      body: 'Parabéns! Você finalizou Push A em 45 min.',
      action: () => endWorkout()
    },
    {
      title: '⏰ Lembrete',
      body: 'Que tal treinar hoje? Seus músculos estão prontos!',
      action: () => sendNotification({
        title: '⏰ Lembrete',
        body: 'Que tal treinar hoje? Seus músculos estão prontos!',
        tag: 'workout-reminder'
      })
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-24">
      <div className="container mx-auto px-4 max-w-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground flex items-center justify-center">
            <Timer className="mr-2 h-6 w-6" />
            Teste de Notificações
          </h1>
          <p className="text-muted-foreground">
            Teste as notificações push e o timer de descanso
          </p>
        </div>

        {/* Status das notificações */}
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Status das Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Suporte do navegador:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  isSupported ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                }`}>
                  {isSupported ? '✅ Suportado' : '❌ Não suportado'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Permissão:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  permission === 'granted' ? 'bg-green-500/20 text-green-500' :
                  permission === 'denied' ? 'bg-red-500/20 text-red-500' :
                  'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {permission === 'granted' ? '✅ Concedida' :
                   permission === 'denied' ? '❌ Negada' : '⏳ Pendente'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Treino ativo:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  isWorkoutActive ? 'bg-blue-500/20 text-blue-500' : 'bg-gray-500/20 text-gray-500'
                }`}>
                  {isWorkoutActive ? `🏃‍♂️ ${currentWorkout}` : '💤 Inativo'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timer de descanso */}
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle>Timer de Descanso</CardTitle>
          </CardHeader>
          <CardContent>
            <RestTimer 
              defaultTime={10}
              onComplete={() => {
                console.log('Timer de descanso concluído!');
              }}
            />
            <p className="text-sm text-muted-foreground text-center mt-4">
              O timer está configurado para 10 segundos para testes.
              Quando terminar, você receberá uma notificação.
            </p>
          </CardContent>
        </Card>

        {/* Botões de teste */}
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              Testar Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {testNotifications.map((test, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={test.action}
                  disabled={!isSupported || permission !== 'granted'}
                  className="justify-start text-left"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{test.title}</span>
                    <span className="text-xs text-muted-foreground">{test.body}</span>
                  </div>
                </Button>
              ))}
            </div>
            
            {(!isSupported || permission !== 'granted') && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                {!isSupported 
                  ? 'Seu navegador não suporta notificações push.'
                  : 'Ative as notificações nas configurações para testar.'
                }
              </p>
            )}
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="mr-2 h-5 w-5" />
              Como testar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Vá para <strong>Configurações</strong> e ative as notificações</li>
              <li>Volte aqui e teste as notificações com os botões acima</li>
              <li>Inicie o timer de descanso para testar notificação automática</li>
              <li>As notificações também funcionam em background</li>
              <li>No celular, adicione o app à tela inicial para melhor experiência</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}