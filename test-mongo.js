const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

console.log('MONGODB_URI from env:', process.env.MONGODB_URI);

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
  });