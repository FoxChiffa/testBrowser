require('dotenv').config();
/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 19852,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    migrations: {
      tableName: "knex_migrations",
    }
};
