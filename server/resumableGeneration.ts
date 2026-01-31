/**
 * Resumable generation logic with module-level checkpointing
 */
import * as db from "./db";

export type GenerationModule = 'analysis' | 'images' | 'website_code';

export interface ModuleProgress {
  completedModules: GenerationModule[];
  failedModule: GenerationModule | null;
  retryCount: number;
}

/**
 * Check if a module should be skipped (already completed)
 */
export function shouldSkipModule(
  module: GenerationModule,
  progress: ModuleProgress | null | undefined
): boolean {
  if (!progress || !progress.completedModules) {
    return false;
  }
  return progress.completedModules.includes(module);
}

/**
 * Mark a module as completed
 */
export async function markModuleCompleted(
  projectId: number,
  module: GenerationModule
): Promise<void> {
  const project = await db.getProjectById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const currentProgress = project.generationProgress as ModuleProgress | null | undefined;
  const completedModules = currentProgress?.completedModules || [];
  
  // Add module if not already in the list
  if (!completedModules.includes(module)) {
    completedModules.push(module);
  }

  await db.updateProject(projectId, {
    generationProgress: {
      completedModules,
      failedModule: null,
      retryCount: currentProgress?.retryCount || 0,
    } as any,
  });

  console.log(`[ResumableGeneration] Module '${module}' marked as completed for project ${projectId}`);
}

/**
 * Mark a module as failed
 */
export async function markModuleFailed(
  projectId: number,
  module: GenerationModule
): Promise<void> {
  const project = await db.getProjectById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const currentProgress = project.generationProgress as ModuleProgress | null | undefined;

  await db.updateProject(projectId, {
    generationProgress: {
      completedModules: currentProgress?.completedModules || [],
      failedModule: module,
      retryCount: (currentProgress?.retryCount || 0) + 1,
    } as any,
  });

  console.log(`[ResumableGeneration] Module '${module}' marked as failed for project ${projectId}`);
}

/**
 * Reset generation progress (for full retry)
 */
export async function resetGenerationProgress(projectId: number): Promise<void> {
  await db.updateProject(projectId, {
    generationProgress: {
      completedModules: [],
      failedModule: null,
      retryCount: 0,
    } as any,
  });

  console.log(`[ResumableGeneration] Generation progress reset for project ${projectId}`);
}

/**
 * Get current generation progress
 */
export async function getGenerationProgress(projectId: number): Promise<ModuleProgress | null> {
  const project = await db.getProjectById(projectId);
  if (!project) {
    return null;
  }

  return project.generationProgress as ModuleProgress | null;
}
