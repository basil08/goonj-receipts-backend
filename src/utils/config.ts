require('dotenv').config();

const CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI,
  BCRYPT_ROUNDS: Number('12'),
  JWT_SECRET:
    process.env.JWT_SECRET,
  GMAIL_ID: process.env.GMAIL_ID,
  GMAIL_PASSWORD: process.env.GMAIL_PASSWORD,
  CC_EMAIL: process.env.CC_EMAIL || ''
};

export default CONFIG;