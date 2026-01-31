/**
 * Progress Tracker for real-time generation preview
 */

import * as db from "./db";

export interface StepProgress {
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  data?: any;
  error?: string;
}

export interface GenerationProgress {
  currentStep: string;
  steps: StepProgress[];
  progress: {
    current: number;
    total: number;
    message: string;
  };
}

/**
 * Update generation history with step progress
 */
export async function updateGenerationProgress(
  historyId: number,
  progress: Partial<GenerationProgress>
): Promise<void> {
  try {
    const history = await db.getGenerationHistoryById(historyId);
    if (!history) {
      console.warn(`[ProgressTracker] History ${historyId} not found`);
      return;
    }

    const currentMetadata = (history.metadata || {}) as GenerationProgress;
    const updatedMetadata: GenerationProgress = {
      currentStep: progress.currentStep || currentMetadata.currentStep || '',
      steps: progress.steps || currentMetadata.steps || [],
      progress: progress.progress || currentMetadata.progress || { current: 0, total: 100, message: '' },
    };

    await db.updateGenerationHistory(historyId, {
      metadata: updatedMetadata,
    });

    console.log(`[ProgressTracker] Updated history ${historyId}:`, updatedMetadata);
  } catch (error) {
    console.error(`[ProgressTracker] Failed to update progress:`, error);
  }
}

/**
 * Initialize generation steps
 */
export function initializeSteps(): StepProgress[] {
  return [
    {
      step: 'analysis',
      status: 'pending',
    },
    {
      step: 'images',
      status: 'pending',
    },
    {
      step: 'website',
      status: 'pending',
    },
    {
      step: 'deployment',
      status: 'pending',
    },
  ];
}

/**
 * Update a specific step's status
 */
export function updateStep(
  steps: StepProgress[],
  stepName: string,
  updates: Partial<StepProgress>
): StepProgress[] {
  return steps.map(s => {
    if (s.step === stepName) {
      return { ...s, ...updates };
    }
    return s;
  });
}
