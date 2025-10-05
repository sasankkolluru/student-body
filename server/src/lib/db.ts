import mongoose from 'mongoose';

const DEFAULT_URI = 'mongodb://localhost:27017/studentbdy';

// Lazy import to avoid bundling in environments that don't need it
let memoryServer: any = null;

export const connectDB = async () => {
  const wantMemory = String(process.env.USE_IN_MEMORY_DB || '').toLowerCase() === 'true';
  const allowFallback = String(process.env.ALLOW_MEMORY_FALLBACK || '').toLowerCase() === 'true';
  let mongoUri = process.env.MONGO_URI || DEFAULT_URI;

  mongoose.set('strictQuery', true);

  // Helper to start in-memory server
  const startMemory = async () => {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memUri = memoryServer.getUri();
    await mongoose.connect(memUri);
    console.log('[DB] Connected to in-memory MongoDB:', memUri);
  };

  try {
    if (wantMemory) {
      console.log('[DB] USE_IN_MEMORY_DB=true, starting in-memory MongoDB...');
      await startMemory();
      return;
    }

    // Try real Mongo first
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);
  } catch (err) {
    console.warn('[DB] Failed to connect to MongoDB at', mongoUri, '->', (err as Error).message);
    if (allowFallback) {
      console.warn('[DB] ALLOW_MEMORY_FALLBACK=true. Falling back to in-memory MongoDB...');
      try {
        await startMemory();
        return;
      } catch (memErr) {
        console.error('[DB] Failed to start in-memory MongoDB:', (memErr as Error).message);
        throw memErr;
      }
    }
    // Do not fall back; bubble up so logs clearly show DB must be fixed
    console.error('[DB] Memory fallback disabled. Please ensure MongoDB is running and MONGO_URI is correct.');
    throw err;
  }
};
