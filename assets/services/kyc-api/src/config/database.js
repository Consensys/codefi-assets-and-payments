const dotenv = require('dotenv');
const isTest = process.env.APP_ENV === 'test';

if (isTest) {
  dotenv.config({ path: './test/.test.functional.env' });
}

dotenv.config();

module.exports = {
  dialect: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT, 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
};

// Add SSL option if it is set in the environment variable.
if (process.env.POSTGRES_SSL == "true") {
  module.exports['dialectOptions'] = {
    ssl: {
      require: true
    }
  }
}
