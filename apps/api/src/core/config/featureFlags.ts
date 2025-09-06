// Feature flags for gradual migration
export interface FeatureFlags {
  useNewAuthModule: boolean;
  useNewExerciseModule: boolean;
  useNewWorkoutModule: boolean;
  useNewProgressModule: boolean;
  enableAdvancedFeatures: boolean;
}

export const getFeatureFlags = (): FeatureFlags => {
  return {
    useNewAuthModule: process.env.FEATURE_NEW_AUTH === 'true',
    useNewExerciseModule: process.env.FEATURE_NEW_EXERCISES === 'true',
    useNewWorkoutModule: process.env.FEATURE_NEW_WORKOUTS === 'true',
    useNewProgressModule: process.env.FEATURE_NEW_PROGRESS === 'true',
    enableAdvancedFeatures: process.env.FEATURE_ADVANCED === 'true',
  };
};

export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  const flags = getFeatureFlags();
  return flags[feature];
};