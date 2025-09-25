export default{
  development: {
    client: 'postgresql',
    connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5434', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: './src/database/migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
  },
};

