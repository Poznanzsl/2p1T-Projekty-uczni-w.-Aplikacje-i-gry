import "dotenv/config";
import { createClient, RedisClientType } from "redis";

const prefix = "nudge";

// Redis client instance
let client: RedisClientType;

// Initialize Redis client
async function initRedis(): Promise<RedisClientType> {
  console.log(process.env.REDIS_URL);
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
      // Add additional config if needed
      socket: {
        connectTimeout: 60000,
        lazyConnect: true,
      },
    });

    client.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    client.on("connect", () => {
      console.log("Connected to Redis");
    });

    await client.connect();
  }

  return client;
}

// Get Redis client instance
async function getRedisClient(): Promise<RedisClientType> {
  if (!client || !client.isOpen) {
    return await initRedis();
  }
  return client;
}

// Get user's favourites from Redis
export async function getUserFavourites(
  userId: string
): Promise<string[] | null> {
  try {
    const redis = await getRedisClient();
    const key = `${prefix}:user:${userId}:favourites`;

    const favouritesJson = await redis.get(key);

    if (!favouritesJson) {
      return null;
    }

    return JSON.parse(favouritesJson);
  } catch (error) {
    console.error("Error getting user favourites:", error);
    throw error;
  }
}

// Set user's favourites in Redis
export async function setUserFavourites(
  userId: string,
  favourites: string[]
): Promise<void> {
  try {
    const redis = await getRedisClient();
    const key = `${prefix}:user:${userId}:favourites`;

    await redis.set(key, JSON.stringify(favourites));
  } catch (error) {
    console.error("Error setting user favourites:", error);
    throw error;
  }
}

// Add a single game to user's favourites
export async function addToFavourites(
  userId: string,
  gameId: string
): Promise<string[]> {
  try {
    const currentFavourites = (await getUserFavourites(userId)) || [];

    // Check if game is already in favourites
    if (!currentFavourites.includes(gameId)) {
      currentFavourites.push(gameId);
      await setUserFavourites(userId, currentFavourites);
    }

    return currentFavourites;
  } catch (error) {
    console.error("Error adding to favourites:", error);
    throw error;
  }
}

// Remove a single game from user's favourites
export async function removeFromFavourites(
  userId: string,
  gameId: string
): Promise<string[]> {
  try {
    const currentFavourites = (await getUserFavourites(userId)) || [];

    const updatedFavourites = currentFavourites.filter((id) => id !== gameId);
    await setUserFavourites(userId, updatedFavourites);

    return updatedFavourites;
  } catch (error) {
    console.error("Error removing from favourites:", error);
    throw error;
  }
}

// Check if a game is in user's favourites
export async function isGameFavourited(
  userId: string,
  gameId: string
): Promise<boolean> {
  try {
    const favourites = (await getUserFavourites(userId)) || [];
    return favourites.includes(gameId);
  } catch (error) {
    console.error("Error checking if game is favourited:", error);
    throw error;
  }
}

// Get user data (you can extend this for other user properties)
export async function getUserData(userId: string): Promise<any> {
  try {
    const redis = await getRedisClient();
    const key = `${prefix}:user:${userId}:data`;

    const userData = await redis.get(key);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error getting user data:", error);
    throw error;
  }
}

// Set user data
export async function setUserData(userId: string, data: any): Promise<void> {
  try {
    const redis = await getRedisClient();
    const key = `${prefix}:user:${userId}:data`;

    await redis.set(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error setting user data:", error);
    throw error;
  }
}

// Game Data Storage Functions

// Get specific game data for a user
export async function getUserGameData(userId: string, gameId: string, key: string): Promise<any> {
  try {
    const redis = await getRedisClient();
    const redisKey = `user:${userId}:game:${gameId}:data`;
    
    const value = await redis.hGet(redisKey, key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error getting user game data:', error);
    throw error;
  }
}

// Set specific game data for a user
export async function setUserGameData(userId: string, gameId: string, key: string, value: any): Promise<void> {
  try {
    const redis = await getRedisClient();
    const redisKey = `user:${userId}:game:${gameId}:data`;
    
    await redis.hSet(redisKey, key, JSON.stringify(value));
  } catch (error) {
    console.error('Error setting user game data:', error);
    throw error;
  }
}

// Delete specific game data for a user
export async function deleteUserGameData(userId: string, gameId: string, key: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    const redisKey = `user:${userId}:game:${gameId}:data`;
    
    await redis.hDel(redisKey, key);
  } catch (error) {
    console.error('Error deleting user game data:', error);
    throw error;
  }
}

// Get all game data keys for a user and game
export async function getUserGameKeys(userId: string, gameId: string): Promise<Record<string, any>> {
  try {
    const redis = await getRedisClient();
    const redisKey = `user:${userId}:game:${gameId}:data`;
    
    const allData = await redis.hGetAll(redisKey);
    
    // Parse all JSON values
    const parsedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(allData)) {
      try {
        parsedData[key] = JSON.parse(value);
      } catch {
        parsedData[key] = value; // fallback to raw value if JSON parse fails
      }
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error getting user game keys:', error);
    throw error;
  }
}

// Delete all game data for a user and game
export async function deleteAllUserGameData(userId: string, gameId: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    const redisKey = `user:${userId}:game:${gameId}:data`;
    
    await redis.del(redisKey);
  } catch (error) {
    console.error('Error deleting all user game data:', error);
    throw error;
  }
}

// Graceful shutdown
export async function closeRedisConnection(): Promise<void> {
  if (client && client.isOpen) {
    await client.quit();
  }
}