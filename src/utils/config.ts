require('dotenv').config();

const CONFIG = {
  MONGODB_STRING: 'mongodb://localhost:27017/goonj',
  BCRYPT_ROUNDS: Number('12'),
  JWT_SECRET:
    'my-jwt-secret-gdslgkmsdlkjdsglkasmdlksajdglskdvmoewkgmowidvjsdokvmeo',
};

export default CONFIG;
