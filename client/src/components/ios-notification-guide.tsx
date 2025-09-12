import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Smartphone, Settings, Download, Zap } from 'lucide-react';
import { NotificationSupportStatus } from '@/hooks/use-notifications';

interface IOSNotificationGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supportStatus: NotificationSupportStatus;
  onRetryDetection: () => void;
}

export function IOSNotificationGuide({ 
  open, 
  onOpenChange, 
  supportStatus,
  onRetryDetection 
}: IOSNotificationGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const getStepIcon = (completed: boolean) => {
    return completed ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <AlertCircle className="h-5 w-5 text-orange-500" />
    );
  };

  const steps = [
    {
      id: 'ios_version',
      title: 'Versão do iOS',
      description: 'iOS 16.4 ou superior é necessário',
      completed: !supportStatus.isIOS || (supportStatus.iOSVersion ? supportStatus.iOSVersion >= 16 : false),
      instructions: supportStatus.iOSVersion && supportStatus.iOSVersion < 16 ? [
        'Vá em Configurações > Geral > Atualização de Software',
        'Atualize para iOS 16.4 ou superior',
        'Reinicie o dispositivo após a atualização'
      ] : [],
      icon: <Smartphone className="h-6 w-6" />
    },
    {
      id: 'pwa_install',
      title: 'Instalar PWA',
      description: 'App deve estar na tela inicial',
      completed: supportStatus.isPWA,
      instructions: !supportStatus.isPWA ? [
        'Abra este site no Safari (não em outros navegadores)',
        'Toque no botão Compartilhar (quadrado com seta para cima)',
        'Role para baixo e selecione "Adicionar à Tela de Início"',
        'Confirme tocando em "Adicionar"',
        'Feche o Safari e abra o app pela tela inicial'
      ] : [],
      icon: <Download className="h-6 w-6" />
    },
    {
      id: 'push_api',
      title: 'Ativar Push API',
      description: 'Push API deve estar habilitada no Safari',
      completed: supportStatus.hasPushManager,
      instructions: !supportStatus.hasPushManager ? [
        'Abra o app Configurações do iPhone',
        'Vá em Safari > Avançado > Recursos Experimentais',
        'Role até encontrar "Push API"',
        'Ative a opção "Push API"',
        'Volte ao app GymSeven'
      ] : [],
      icon: <Zap className="h-6 w-6" />
    },
    {
      id: 'service_worker',
      title: 'Service Worker',
      description: 'Funcionalidade de segundo plano ativa',
      completed: supportStatus.hasServiceWorker,
      instructions: !supportStatus.hasServiceWorker ? [
        'Certifique-se de estar usando Safari atualizado',
        'Tente fechar e reabrir o app',
        'Se o problema persistir, reinstale o PWA'
      ] : [],
      icon: <Settings className="h-6 w-6" />
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const allCompleted = completedSteps === totalSteps;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Configurar Notificações no iOS
          </DialogTitle>
          <DialogDescription>
            Siga os passos abaixo para ativar notificações push no iOS 18
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Overview */}
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso</span>
              <Badge variant={allCompleted ? "default" : "secondary"}>
                {completedSteps}/{totalSteps}
              </Badge>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`border rounded-lg p-4 transition-all ${
                  step.completed 
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
                    : 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStepIcon(step.completed)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {step.icon}
                      <h3 className="font-medium text-sm">{step.title}</h3>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                      {step.description}
                    </p>
                    
                    {!step.completed && step.instructions.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Como corrigir:
                        </p>
                        <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          {step.instructions.map((instruction, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-blue-600 font-medium">{idx + 1}.</span>
                              <span>{instruction}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={onRetryDetection}
              variant="outline" 
              size="sm"
              className="flex-1"
              data-testid="button-retry-detection"
            >
              Verificar Novamente
            </Button>
            {allCompleted && (
              <Button 
                onClick={() => onOpenChange(false)}
                size="sm"
                className="flex-1"
                data-testid="button-close-guide"
              >
                Continuar
              </Button>
            )}
          </div>

          {!allCompleted && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                💡 <strong>Dica:</strong> Após completar cada passo, use "Verificar Novamente" para atualizar o status.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}