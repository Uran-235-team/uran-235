import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(3, 'Минимум 3 символа').max(64),
  password: z.string().min(6, 'Минимум 6 символов').max(128),
})

export const registerSchema = z
  .object({
    username: z.string().min(3, 'Минимум 3 символа').max(64),
    password: z.string().min(6, 'Минимум 6 символов').max(128),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Пароли не совпадают',
  })
