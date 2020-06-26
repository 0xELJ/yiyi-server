import * as Joi from '@hapi/joi';

export const validationSchema = {
    APP_ENV: Joi.string().valid('development', 'production'),
    APP_PORT: Joi.number(),
    REDIS_HOST: Joi.string(),
    REDIS_PORT: Joi.number(),
};
