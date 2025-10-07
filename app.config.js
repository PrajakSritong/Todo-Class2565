import 'dotenv/config';

export default {
  expo: {
    // ...existing config...
    extra: {
      API_KEY: process.env.API_KEY,
        TOKEN: process.env.TOKEN,
    },
  },
};