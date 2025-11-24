import * as Joi from 'joi'

export const envValidationSchema = Joi.object({
  // Database - either DATABASE_URL (production) or individual fields (development)
  DATABASE_URL: Joi.string().optional(),
  DATABASE_HOST: Joi.string().optional(),
  DATABASE_PORT: Joi.number().default(5434),
  DATABASE_USER: Joi.string().optional(),
  DATABASE_PASSWORD: Joi.string().optional(),
  DATABASE_NAME: Joi.string().optional(),

  // OpenAI
  OPENAI_API_KEY: Joi.string().required(),

  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // JWT
  JWT_SECRET: Joi.string().required(),
}).or('DATABASE_URL', 'DATABASE_HOST') // Au moins l'un des deux doit être présent