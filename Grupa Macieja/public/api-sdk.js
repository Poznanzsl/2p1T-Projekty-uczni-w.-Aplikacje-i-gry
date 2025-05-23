/**
 * GameStorage - Cloud-based key-value storage for games
 * A localStorage-like API that syncs with your cloud backend
 */
class GameStorage {
  constructor(gameId) {
    if (!gameId || typeof gameId !== "string") {
      throw new Error("GameStorage requires a valid gameId string");
    }
    this.gameId = gameId;
    this.cache = new Map(); // Local cache for performance
    this.isLoaded = false;
  }

  /**
   * Initialize and load all game data from server
   * @returns {Promise<void>}
   */
  async init() {
    try {
      const response = await fetch(
        `/api/game-data?gameId=${encodeURIComponent(this.gameId)}`
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("User not authenticated");
        }
        throw new Error(`Failed to initialize GameStorage: ${response.status}`);
      }

      const result = await response.json();

      // Load data into cache
      this.cache.clear();
      if (result.data) {
        for (const [key, value] of Object.entries(result.data)) {
          this.cache.set(key, value);
        }
      }

      this.isLoaded = true;
    } catch (error) {
      console.error("GameStorage initialization failed:", error);
      throw error;
    }
  }

  /**
   * Get a value by key (localStorage-like API)
   * @param {string} key
   * @returns {Promise<any>}
   */
  async getItem(key) {
    if (typeof key !== "string") {
      throw new Error("Key must be a string");
    }

    // Return from cache if available
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Fetch from server if not in cache
    try {
      const response = await fetch(
        `/api/game-data?gameId=${encodeURIComponent(
          this.gameId
        )}&key=${encodeURIComponent(key)}`
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("User not authenticated");
        }
        throw new Error(`Failed to get item: ${response.status}`);
      }

      const result = await response.json();
      const value = result.value;

      // Update cache
      this.cache.set(key, value);

      return value;
    } catch (error) {
      console.error("Failed to get item:", error);
      throw error;
    }
  }

  /**
   * Set a value by key (localStorage-like API)
   * @param {string} key
   * @param {any} value
   * @returns {Promise<void>}
   */
  async setItem(key, value) {
    if (typeof key !== "string") {
      throw new Error("Key must be a string");
    }

    try {
      const response = await fetch("/api/game-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId: this.gameId,
          key,
          value,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("User not authenticated");
        }
        throw new Error(`Failed to set item: ${response.status}`);
      }

      // Update cache
      this.cache.set(key, value);
    } catch (error) {
      console.error("Failed to set item:", error);
      throw error;
    }
  }

  /**
   * Remove a value by key (localStorage-like API)
   * @param {string} key
   * @returns {Promise<void>}
   */
  async removeItem(key) {
    if (typeof key !== "string") {
      throw new Error("Key must be a string");
    }

    try {
      const response = await fetch(
        `/api/game-data?gameId=${encodeURIComponent(
          this.gameId
        )}&key=${encodeURIComponent(key)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("User not authenticated");
        }
        throw new Error(`Failed to remove item: ${response.status}`);
      }

      // Update cache
      this.cache.delete(key);
    } catch (error) {
      console.error("Failed to remove item:", error);
      throw error;
    }
  }

  /**
   * Get all keys for this game
   * @returns {Promise<string[]>}
   */
  async keys() {
    if (this.isLoaded) {
      return Array.from(this.cache.keys());
    }

    try {
      const response = await fetch(
        `/api/game-data?gameId=${encodeURIComponent(this.gameId)}`
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("User not authenticated");
        }
        throw new Error(`Failed to get keys: ${response.status}`);
      }

      const result = await response.json();
      return Object.keys(result.data || {});
    } catch (error) {
      console.error("Failed to get keys:", error);
      throw error;
    }
  }

  /**
   * Get all data for this game
   * @returns {Promise<Object>}
   */
  async getAll() {
    if (this.isLoaded) {
      return Object.fromEntries(this.cache);
    }

    try {
      const response = await fetch(
        `/api/game-data?gameId=${encodeURIComponent(this.gameId)}`
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("User not authenticated");
        }
        throw new Error(`Failed to get all data: ${response.status}`);
      }

      const result = await response.json();

      // Update cache
      this.cache.clear();
      if (result.data) {
        for (const [key, value] of Object.entries(result.data)) {
          this.cache.set(key, value);
        }
      }

      return result.data || {};
    } catch (error) {
      console.error("Failed to get all data:", error);
      throw error;
    }
  }

  /**
   * Clear all data for this game
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      const keys = await this.keys();

      // Delete all keys
      await Promise.all(keys.map((key) => this.removeItem(key)));

      this.cache.clear();
    } catch (error) {
      console.error("Failed to clear data:", error);
      throw error;
    }
  }

  /**
   * Get the number of items stored for this game
   * @returns {Promise<number>}
   */
  async length() {
    const keys = await this.keys();
    return keys.length;
  }

  /**
   * Check if a key exists
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async hasItem(key) {
    if (typeof key !== "string") {
      throw new Error("Key must be a string");
    }

    const value = await this.getItem(key);
    return value !== null;
  }

  /**
   * Batch set multiple items
   * @param {Object} items - Object with key-value pairs
   * @returns {Promise<void>}
   */
  async setItems(items) {
    if (typeof items !== "object" || items === null) {
      throw new Error("Items must be an object");
    }

    const promises = Object.entries(items).map(([key, value]) =>
      this.setItem(key, value)
    );

    await Promise.all(promises);
  }

  /**
   * Batch get multiple items
   * @param {string[]} keys - Array of keys to retrieve
   * @returns {Promise<Object>} - Object with key-value pairs
   */
  async getItems(keys) {
    if (!Array.isArray(keys)) {
      throw new Error("Keys must be an array");
    }

    const promises = keys.map(async (key) => {
      const value = await this.getItem(key);
      return [key, value];
    });

    const results = await Promise.all(promises);
    return Object.fromEntries(results);
  }
}

// Export for different module systems
if (typeof module !== "undefined" && module.exports) {
  // Node.js
  module.exports = GameStorage;
} else if (typeof window !== "undefined") {
  // Browser
  window.GameStorage = GameStorage;
}

// Usage Examples:
/*
// Initialize storage for a specific game
const storage = new GameStorage('my-puzzle-game');

// Optional: Pre-load all data (recommended for better performance)
await storage.init();

// Use like localStorage
await storage.setItem('playerName', 'John Doe');
await storage.setItem('highScore', 1250);
await storage.setItem('level', 5);
await storage.setItem('settings', { sound: true, difficulty: 'hard' });

const playerName = await storage.getItem('playerName'); // 'John Doe'
const highScore = await storage.getItem('highScore'); // 1250

// Check if key exists
const hasName = await storage.hasItem('playerName'); // true

// Get all keys
const allKeys = await storage.keys(); // ['playerName', 'highScore', 'level', 'settings']

// Get all data
const allData = await storage.getAll(); // { playerName: 'John Doe', highScore: 1250, ... }

// Batch operations
await storage.setItems({
  'stat1': 100,
  'stat2': 200,
  'stat3': 300
});

const stats = await storage.getItems(['stat1', 'stat2', 'stat3']);

// Remove item
await storage.removeItem('oldData');

// Clear everything
await storage.clear();
*/
