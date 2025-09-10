import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ApiCall {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  requestData?: any;
  responseData?: any;
  status: number;
  error?: string;
  duration: number;
}

interface DebugContextType {
  isDebugMode: boolean;
  apiCalls: ApiCall[];
  toggleDebugMode: () => void;
  addApiCall: (call: ApiCall) => void;
  clearApiCalls: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export function DebugProvider({ children }: { children: ReactNode }) {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);

  const toggleDebugMode = () => {
    setIsDebugMode(!isDebugMode);
  };

  const addApiCall = (call: ApiCall) => {
    setApiCalls(prev => [call, ...prev].slice(0, 50)); // Keep last 50 calls
  };

  const clearApiCalls = () => {
    setApiCalls([]);
  };

  return (
    <DebugContext.Provider value={{
      isDebugMode,
      apiCalls,
      toggleDebugMode,
      addApiCall,
      clearApiCalls
    }}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
}