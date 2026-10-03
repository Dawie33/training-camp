import * as Joi from 'joi'

export const envValidationSchema = Joi.object({
  // Database - either DATABASE_URL (production) or individual fields (development)
  DATABASE_URL: Joi.string().optional(),
  DATABASE_HOST: Joi.string().optional(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().optional(),
  DATABASE_PASSWORD: Joi.string().optional(),
  DATABASE_NAME: Joi.string().optional(),

  // OpenAI
  OPENAI_API_KEY: Joi.string().required(),
  OPENAI_MODEL: Joi.string().default('gpt-4.1'),

  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  // Même défaut que main.ts : 3000 est le port du frontend Next.js
  PORT: Joi.number().default(3001),
  // Nombre de proxys de confiance devant l'API (Express 'trust proxy').
  // Détermine quelle IP de X-Forwarded-For est utilisée comme req.ip (rate limiting).
  // 0 = l'IP de la connexion TCP. Trop grand = IP falsifiable par le client.
  TRUST_PROXY: Joi.number().integer().min(0).default(0),
  // Secret partagé avec le frontend (proxy.ts) : s'il est défini, les requêtes sans
  // l'en-tête x-origin-secret correspondant sont refusées (verrou d'origine).
  ORIGIN_SECRET: Joi.string().min(32).optional(),

  // JWT
  JWT_SECRET: Joi.string().required(),

  // Google Calendar
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_REDIRECT_URI: Joi.string().optional(),
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
}).or('DATABASE_URL', 'DATABASE_HOST') // Au moins l'un des deux doit être présent