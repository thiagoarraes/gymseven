import React, { createContext, useContext, useState } from 'react';
import { useNotifications } from '@/hooks/use-notifications';

interface WorkoutContextType {
  isWorkoutActive: boolean;
  currentWorkout?: string;
  startWorkout: (workoutName: string) => void;
  endWorkout: () => void;
  notifyRestComplete: () => void;
  notifyPersonalRecord: (exercise: string) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<string>();
  const { notifyWorkoutStart, notifyWorkoutComplete, notifyRestComplete, notifyPersonalRecord } = useNotifications();

  const startWorkout = (workoutName: string) => {
    setIsWorkoutActive(true);
    setCurrentWorkout(workoutName);
    notifyWorkoutStart(workoutName);
  };

  const endWorkout = () => {
    if (currentWorkout) {
      // Calcular duração aproximada (em uma implementação real viria dos dados)
      const duration = "45 min";
      notifyWorkoutComplete(currentWorkout, duration);
    }
    setIsWorkoutActive(false);
    setCurrentWorkout(undefined);
  };

  return (
    <WorkoutContext.Provider value={{
      isWorkoutActive,
      currentWorkout,
      startWorkout,
      endWorkout,
      notifyRestComplete,
      notifyPersonalRecord,
    }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}