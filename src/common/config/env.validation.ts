import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_LOGGING: Joi.boolean().default(false),

  // Auth
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  // Server
  PORT: Joi.number().default(3000),
  CORS_ORIGINS: Joi.string().default('http://localhost:4200'),

  // Optional — seed admin
  ADMIN_EMAIL: Joi.string().optional(),
  ADMIN_PASSWORD: Joi.string().optional(),

  // Optional — MercadoPago
  MERCADOPAGO_ACCESS_TOKEN: Joi.string().optional(),
  MERCADOPAGO_PUBLIC_KEY: Joi.string().optional(),
  MERCADOPAGO_WEBHOOK_SECRET: Joi.string().optional(),

  // Optional — business info
  BUSINESS_NAME: Joi.string().optional(),
  BUSINESS_ADDRESS: Joi.string().optional(),
  BUSINESS_PHONE: Joi.string().optional(),
  BUSINESS_EMAIL: Joi.string().optional(),

  // Optional — ARCA/AFIP
  ARCA_CUIT: Joi.string().optional(),
  ARCA_POINT_OF_SALE: Joi.number().optional(),
  ARCA_CERT_PATH: Joi.string().optional(),
  ARCA_KEY_PATH: Joi.string().optional(),
  ARCA_ENVIRONMENT: Joi.string()
    .valid('homologacion', 'produccion')
    .optional(),

  // Optional — PGAdmin
  PGADMIN_EMAIL: Joi.string().optional(),
  PGADMIN_PASSWORD: Joi.string().optional(),
  PGADMIN_PORT: Joi.number().optional(),
});
