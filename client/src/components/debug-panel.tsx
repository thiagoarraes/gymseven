import React, { useState } from 'react';
import { useDebug } from '@/contexts/debug-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Trash2, Bug, X, Copy } from 'lucide-react';

function getStatusColor(status: number) {
  if (status >= 200 && status < 300) return 'bg-green-500';
  if (status >= 400 && status < 500) return 'bg-red-500';
  if (status >= 500) return 'bg-red-700';
  return 'bg-gray-500';
}

function formatTime(timestamp: Date) {
  return timestamp.toLocaleTimeString('pt-BR', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
}

function JsonViewer({ data, label }: { data: any; label: string }) {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-600">{label}:</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-6 px-2"
        >
          <Copy className="h-3 w-3" />
          {copied ? 'Copiado!' : 'Copiar'}
        </Button>
      </div>
      <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-32">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function ApiCallItem({ call }: { call: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="mb-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer p-3 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Badge variant="secondary" className={`${getStatusColor(call.status)} text-white`}>
                  {call.status}
                </Badge>
                <span className="font-mono text-sm font-medium">{call.method}</span>
                <span className="text-sm truncate">{call.url}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">{call.duration}ms</span>
                <span className="text-xs text-gray-500">{formatTime(call.timestamp)}</span>
              </div>
            </div>
            {call.error && (
              <div className="text-sm text-red-600 mt-1">
                ❌ {call.error}
              </div>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 px-3 pb-3">
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">URL completa:</span>
                <div className="bg-gray-100 p-2 rounded text-xs break-all">{call.url}</div>
              </div>
              
              {call.requestData && <JsonViewer data={call.requestData} label="Request Body" />}
              {call.responseData && <JsonViewer data={call.responseData} label="Response Data" />}
              
              <div className="pt-2 border-t">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-medium">Status:</span> {call.status}
                  </div>
                  <div>
                    <span className="font-medium">Duração:</span> {call.duration}ms
                  </div>
                  <div>
                    <span className="font-medium">Timestamp:</span> {call.timestamp.toLocaleString('pt-BR')}
                  </div>
                  <div>
                    <span className="font-medium">ID:</span> {call.id}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function DebugPanel() {
  const { isDebugMode, apiCalls, toggleDebugMode, clearApiCalls } = useDebug();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isDebugMode) {
    return (
      <Button
        onClick={toggleDebugMode}
        className="fixed bottom-20 right-4 z-50 rounded-full p-3"
        variant="outline"
        title="Ativar Debug Mode"
      >
        <Bug className="h-5 w-5" />
      </Button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full p-3"
          variant="outline"
          title="Expandir Debug Panel"
        >
          <Bug className="h-5 w-5" />
          <Badge className="ml-1">{apiCalls.length}</Badge>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 w-96 h-96 z-50">
      <Card className="h-full shadow-lg">
        <CardHeader className="p-3 bg-blue-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center">
              <Bug className="h-4 w-4 mr-2" />
              Debug API ({apiCalls.length} calls)
            </CardTitle>
            <div className="flex space-x-1">
              <Button
                onClick={() => setIsMinimized(true)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
              <Button
                onClick={clearApiCalls}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title="Limpar histórico"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button
                onClick={toggleDebugMode}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title="Fechar debug"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-full">
          <div className="h-full p-3 overflow-y-auto">
            {apiCalls.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <Bug className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma chamada de API ainda</p>
                <p className="text-xs mt-1">As requisições aparecerão aqui</p>
              </div>
            ) : (
              <div className="space-y-2">
                {apiCalls.map((call) => (
                  <ApiCallItem key={call.id} call={call} />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}