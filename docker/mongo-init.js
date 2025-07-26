// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the rodeo database
db = db.getSiblingDB('rodeo');

// Create a user for the application
db.createUser({
  user: 'rodeo_user',
  pwd: 'rodeo_password',
  roles: [
    {
      role: 'readWrite',
      db: 'rodeo'
    }
  ]
});

// Create collections with initial schemas and indexes
// Note: MongoDB will create collections automatically, but we can set up indexes

// Device collection indexes
db.devices.createIndex({ "publicKeyThumbprint": 1 }, { unique: true });
db.devices.createIndex({ "status": 1 });

// Session collection indexes
db.sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
db.sessions.createIndex({ "deviceId": 1, "expiresAt": 1 });

// Challenge collection indexes
db.challenges.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
db.challenges.createIndex({ "deviceId": 1, "expiresAt": 1 });

print('MongoDB initialization completed successfully');