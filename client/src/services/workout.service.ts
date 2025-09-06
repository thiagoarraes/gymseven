import { supabasePromise } from '@/lib/supabase';
import type { WorkoutTemplate, WorkoutTemplateExercise, Exercise } from '@shared/schema';

interface WorkoutTemplateWithExercises extends WorkoutTemplate {
  exercises: Array<WorkoutTemplateExercise & { exercise: Exercise }>;
}

export class WorkoutService {
  
  /**
   * Busca todos os templates de treino do usuário
   */
  async getWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]> {
    const supabase = await supabasePromise;
    if (!supabase) {
      throw new Error('Supabase não está disponível');
    }

    const { data, error } = await supabase
      .from('workoutTemplates')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar templates: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca um template específico com seus exercícios
   */
  async getWorkoutTemplateWithExercises(templateId: string, userId: string): Promise<WorkoutTemplateWithExercises | null> {
    const supabase = await supabasePromise;
    if (!supabase) {
      throw new Error('Supabase não está disponível');
    }

    // Buscar o template
    const { data: template, error: templateError } = await supabase
      .from('workoutTemplates')
      .select('*')
      .eq('id', templateId)
      .eq('userId', userId)
      .single();

    if (templateError) {
      throw new Error(`Erro ao buscar template: ${templateError.message}`);
    }

    if (!template) {
      return null;
    }

    // Buscar exercícios do template
    const { data: templateExercises, error: exercisesError } = await supabase
      .from('workoutTemplateExercises')
      .select(`
        *,
        exercise:exercises (*)
      `)
      .eq('templateId', templateId)
      .order('order', { ascending: true });

    if (exercisesError) {
      throw new Error(`Erro ao buscar exercícios: ${exercisesError.message}`);
    }

    return {
      ...template,
      exercises: templateExercises || []
    };
  }

  /**
   * Busca todos os templates com seus exercícios
   */
  async getWorkoutTemplatesWithExercises(userId: string): Promise<WorkoutTemplateWithExercises[]> {
    const templates = await this.getWorkoutTemplates(userId);
    
    const templatesWithExercises = await Promise.all(
      templates.map(async (template) => {
        const fullTemplate = await this.getWorkoutTemplateWithExercises(template.id, userId);
        return fullTemplate || { ...template, exercises: [] };
      })
    );

    return templatesWithExercises;
  }

  /**
   * Cria um novo template de treino
   */
  async createWorkoutTemplate(template: { name: string; description?: string }, userId: string): Promise<WorkoutTemplate> {
    const supabase = await supabasePromise;
    if (!supabase) {
      throw new Error('Supabase não está disponível');
    }

    const { data, error } = await supabase
      .from('workoutTemplates')
      .insert({
        ...template,
        userId
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar template: ${error.message}`);
    }

    return data;
  }

  /**
   * Atualiza um template de treino
   */
  async updateWorkoutTemplate(templateId: string, updates: { name?: string; description?: string }, userId: string): Promise<WorkoutTemplate> {
    const supabase = await supabasePromise;
    if (!supabase) {
      throw new Error('Supabase não está disponível');
    }

    const { data, error } = await supabase
      .from('workoutTemplates')
      .update(updates)
      .eq('id', templateId)
      .eq('userId', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar template: ${error.message}`);
    }

    return data;
  }

  /**
   * Exclui um template de treino
   */
  async deleteWorkoutTemplate(templateId: string, userId: string): Promise<void> {
    const supabase = await supabasePromise;
    if (!supabase) {
      throw new Error('Supabase não está disponível');
    }

    const { error } = await supabase
      .from('workoutTemplates')
      .delete()
      .eq('id', templateId)
      .eq('userId', userId);

    if (error) {
      throw new Error(`Erro ao excluir template: ${error.message}`);
    }
  }

  /**
   * Cria um log de treino
   */
  async createWorkoutLog(data: { templateId: string; name: string; userId: string }): Promise<any> {
    const supabase = await supabasePromise;
    if (!supabase) {
      throw new Error('Supabase não está disponível');
    }

    const { data: log, error } = await supabase
      .from('workoutLogs')
      .insert({
        templateId: data.templateId,
        name: data.name,
        userId: data.userId,
        startTime: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar log de treino: ${error.message}`);
    }

    return log;
  }
}

export const workoutService = new WorkoutService();