import { MongoClient } from 'mongodb';
import { config } from './config';

const sessions = new Map<string, { client: MongoClient; timestamp: number }>();

// Cleanup idle sessions
setInterval(() => {
  const now = Date.now();
  for (const [key, { client, timestamp }] of sessions) {
    if (now - timestamp > config.sessionTimeoutMs) {
      client.close();
      sessions.delete(key);
      console.log(`Cleaned up expired session: ${key}`);
    }
  }
}, config.sessionTimeoutMs / 12); // Check every 2 hours

// Graceful shutdown
process.on('SIGTERM', async () => {
  for (const { client } of sessions.values()) {
    await client.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  for (const { client } of sessions.values()) {
    await client.close();
  }
  process.exit(0);
});

export const getSession = (key: string): { client: MongoClient; timestamp: number } | undefined => {
  return sessions.get(key);
};

export const setSession = (key: string, client: MongoClient) => {
  sessions.set(key, { client, timestamp: Date.now() });
};

export const updateSessionTimestamp = (key: string) => {
  const session = sessions.get(key);
  if (session) {
    session.timestamp = Date.now();
    sessions.set(key, session);
  }
};

export const deleteSession = (key: string) => {
  const session = sessions.get(key);
  if (session) {
    session.client.close();
    sessions.delete(key);
  }
};