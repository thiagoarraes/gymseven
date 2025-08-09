import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatação de datas em português brasileiro
export function formatDateBR(dateString: string | Date): string {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return "Data inválida";
    }
    
    const months = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} de ${month}`;
  } catch (error) {
    return "Data inválida";
  }
}

// Calcular tempo relativo em português
export function getRelativeTimeBR(dateString: string | Date): string {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return "Data inválida";
    }
    
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Hoje";
    if (diffDays === 2) return "Ontem";
    if (diffDays <= 7) return `${diffDays - 1} dias atrás`;
    if (diffDays <= 30) {
      const weeks = Math.floor((diffDays - 1) / 7);
      return weeks === 1 ? "1 semana atrás" : `${weeks} semanas atrás`;
    }
    
    // Para datas mais antigas, mostrar o formato "12 de junho"
    return formatDateBR(date);
  } catch (error) {
    return "Data inválida";
  }
}
