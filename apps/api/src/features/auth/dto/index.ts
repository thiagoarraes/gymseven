import { z } from 'zod';

// Login DTOs
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginDto = z.infer<typeof loginSchema>;

// Register DTOs
export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  username: z.string()
    .min(3, "Nome de usuário deve ter pelo menos 3 caracteres")
    .max(20, "Nome de usuário deve ter no máximo 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Nome de usuário deve conter apenas letras, números e underscore"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export type RegisterDto = z.infer<typeof registerSchema>;

// Change Password DTOs
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

// Update Profile DTOs
export const updateProfileSchema = z.object({
  email: z.string().email("Email inválido").optional(),
  username: z.string()
    .min(3, "Nome de usuário deve ter pelo menos 3 caracteres")
    .max(20, "Nome de usuário deve ter no máximo 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Nome de usuário deve conter apenas letras, números e underscore")
    .optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  height: z.union([
    z.number().min(100, "Altura deve ser entre 100 e 250cm").max(250, "Altura deve ser entre 100 e 250cm"),
    z.null()
  ]).optional(),
  weight: z.union([
    z.number().min(30, "Peso deve ser entre 30 e 300kg").max(300, "Peso deve ser entre 30 e 300kg"),
    z.null()
  ]).optional(),
  profileImageUrl: z.string().optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

// Auth Response DTOs
export interface AuthResponseDto {
  user: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  token: string;
}