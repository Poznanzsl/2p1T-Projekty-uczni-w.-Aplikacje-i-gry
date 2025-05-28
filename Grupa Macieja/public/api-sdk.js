/**
 * Check if the user is currently logged in
 * @returns {Promise<boolean>}
 */
async function isUserLoggedIn() {
    try {
        // Try to make a simple authenticated request
        const response = await fetch("/api/favourites");

        // If we get a 401, user is not logged in
        if (response.status === 401) {
            return false;
        }

        // If we get any other response (including 200), user is logged in
        return response.ok || response.status !== 401;
    } catch (error) {
        // Network error or other issues - assume not logged in
        console.warn("Failed to check authentication status:", error);
        return false;
    }
}

/**
 * GameStorage - Cloud-based key-value storage for games with sessionStorage fallback
 * A localStorage-like API that syncs with your cloud backend when logged in,
 * or falls back to sessionStorage when not logged in
 */
class GameStorage {
    constructor(gameId) {
        if (!gameId || typeof gameId !== "string") {
            throw new Error("GameStorage requires a valid gameId string");
        }
        this.gameId = gameId;
        this.cache = new Map(); // Local cache for performance
        this.isLoaded = false;
        this.isLoggedIn = null; // Will be determined on first use
        this.sessionStoragePrefix = `gameStorage_${gameId}_`;
    }

    /**
     * Check authentication status and determine storage mode
     * @returns {Promise<boolean>}
     */
    async _checkAuth() {
        if (this.isLoggedIn === null) {
            this.isLoggedIn = await isUserLoggedIn();
        }
        return this.isLoggedIn;
    }

    /**
     * Get sessionStorage key with prefix
     * @param {string} key
     * @returns {string}
     */
    _getSessionKey(key) {
        return this.sessionStoragePrefix + key;
    }

    /**
     * Get value from sessionStorage
     * @param {string} key
     * @returns {any}
     */
    _getFromSession(key) {
        try {
            const value = sessionStorage.getItem(this._getSessionKey(key));
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.warn("Failed to parse sessionStorage value:", error);
            return null;
        }
    }

    /**
     * Set value in sessionStorage
     * @param {string} key
     * @param {any} value
     */
    _setToSession(key, value) {
        try {
            sessionStorage.setItem(
                this._getSessionKey(key),
                JSON.stringify(value)
            );
        } catch (error) {
            console.warn("Failed to set sessionStorage value:", error);
        }
    }

    /**
     * Remove value from sessionStorage
     * @param {string} key
     */
    _removeFromSession(key) {
        sessionStorage.removeItem(this._getSessionKey(key));
    }

    /**
     * Get all keys from sessionStorage for this game
     * @returns {string[]}
     */
    _getSessionKeys() {
        const keys = [];
        const prefix = this.sessionStoragePrefix;

        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keys.push(key.substring(prefix.length));
            }
        }

        return keys;
    }

    /**
     * Clear all sessionStorage data for this game
     */
    _clearSession() {
        const keys = this._getSessionKeys();
        keys.forEach((key) => this._removeFromSession(key));
    }

    /**
     * Initialize and load all game data from server (if logged in)
     * @returns {Promise<void>}
     */
    async init() {
        const loggedIn = await this._checkAuth();

        if (!loggedIn) {
            // Load from sessionStorage into cache
            this.cache.clear();
            const keys = this._getSessionKeys();
            keys.forEach((key) => {
                const value = this._getFromSession(key);
                if (value !== null) {
                    this.cache.set(key, value);
                }
            });
            this.isLoaded = true;
            return;
        }

        try {
            const response = await fetch(
                `/api/game-data?gameId=${encodeURIComponent(this.gameId)}`
            );

            if (!response.ok) {
                if (response.status === 401) {
                    // Auth status changed, fall back to sessionStorage
                    this.isLoggedIn = false;
                    return this.init();
                }
                throw new Error(
                    `Failed to initialize GameStorage: ${response.status}`
                );
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
            console.warn(
                "GameStorage cloud initialization failed, using sessionStorage:",
                error
            );
            // Fall back to sessionStorage on any error
            this.isLoggedIn = false;
            return this.init();
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

        const loggedIn = await this._checkAuth();

        if (!loggedIn) {
            // Use sessionStorage
            return this._getFromSession(key);
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
                    // Auth status changed, fall back to sessionStorage
                    this.isLoggedIn = false;
                    return this._getFromSession(key);
                }
                throw new Error(`Failed to get item: ${response.status}`);
            }

            const result = await response.json();
            const value = result.value;

            // Update cache
            this.cache.set(key, value);

            return value;
        } catch (error) {
            console.warn(
                "Failed to get item from cloud, falling back to sessionStorage:",
                error
            );
            this.isLoggedIn = false;
            return this._getFromSession(key);
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

        const loggedIn = await this._checkAuth();

        if (!loggedIn) {
            // Use sessionStorage
            this._setToSession(key, value);
            this.cache.set(key, value);
            return;
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
                    // Auth status changed, fall back to sessionStorage
                    this.isLoggedIn = false;
                    this._setToSession(key, value);
                    this.cache.set(key, value);
                    return;
                }
                throw new Error(`Failed to set item: ${response.status}`);
            }

            // Update cache
            this.cache.set(key, value);
        } catch (error) {
            console.warn(
                "Failed to set item in cloud, falling back to sessionStorage:",
                error
            );
            this.isLoggedIn = false;
            this._setToSession(key, value);
            this.cache.set(key, value);
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

        const loggedIn = await this._checkAuth();

        if (!loggedIn) {
            // Use sessionStorage
            this._removeFromSession(key);
            this.cache.delete(key);
            return;
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
                    // Auth status changed, fall back to sessionStorage
                    this.isLoggedIn = false;
                    this._removeFromSession(key);
                    this.cache.delete(key);
                    return;
                }
                throw new Error(`Failed to remove item: ${response.status}`);
            }

            // Update cache
            this.cache.delete(key);
        } catch (error) {
            console.warn(
                "Failed to remove item from cloud, falling back to sessionStorage:",
                error
            );
            this.isLoggedIn = false;
            this._removeFromSession(key);
            this.cache.delete(key);
        }
    }

    /**
     * Get all keys for this game
     * @returns {Promise<string[]>}
     */
    async keys() {
        const loggedIn = await this._checkAuth();

        if (!loggedIn) {
            return this._getSessionKeys();
        }

        if (this.isLoaded) {
            return Array.from(this.cache.keys());
        }

        try {
            const response = await fetch(
                `/api/game-data?gameId=${encodeURIComponent(this.gameId)}`
            );

            if (!response.ok) {
                if (response.status === 401) {
                    this.isLoggedIn = false;
                    return this._getSessionKeys();
                }
                throw new Error(`Failed to get keys: ${response.status}`);
            }

            const result = await response.json();
            return Object.keys(result.data || {});
        } catch (error) {
            console.warn(
                "Failed to get keys from cloud, falling back to sessionStorage:",
                error
            );
            this.isLoggedIn = false;
            return this._getSessionKeys();
        }
    }

    /**
     * Get all data for this game
     * @returns {Promise<Object>}
     */
    async getAll() {
        const loggedIn = await this._checkAuth();

        if (!loggedIn) {
            const keys = this._getSessionKeys();
            const result = {};
            keys.forEach((key) => {
                const value = this._getFromSession(key);
                if (value !== null) {
                    result[key] = value;
                }
            });
            return result;
        }

        if (this.isLoaded) {
            return Object.fromEntries(this.cache);
        }

        try {
            const response = await fetch(
                `/api/game-data?gameId=${encodeURIComponent(this.gameId)}`
            );

            if (!response.ok) {
                if (response.status === 401) {
                    this.isLoggedIn = false;
                    return this.getAll();
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
            console.warn(
                "Failed to get all data from cloud, falling back to sessionStorage:",
                error
            );
            this.isLoggedIn = false;
            return this.getAll();
        }
    }

    /**
     * Clear all data for this game
     * @returns {Promise<void>}
     */
    async clear() {
        const loggedIn = await this._checkAuth();

        if (!loggedIn) {
            this._clearSession();
            this.cache.clear();
            return;
        }

        try {
            const keys = await this.keys();

            // Delete all keys
            await Promise.all(keys.map((key) => this.removeItem(key)));

            this.cache.clear();
        } catch (error) {
            console.warn(
                "Failed to clear cloud data, clearing sessionStorage:",
                error
            );
            this.isLoggedIn = false;
            this._clearSession();
            this.cache.clear();
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
        return value !== null && value !== undefined;
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

    /**
     * Get current storage mode
     * @returns {Promise<string>} 'cloud' or 'session'
     */
    async getStorageMode() {
        const loggedIn = await this._checkAuth();
        return loggedIn ? "cloud" : "session";
    }

    /**
     * Migrate data from sessionStorage to cloud when user logs in
     * @returns {Promise<boolean>} Success status
     */
    async migrateToCloud() {
        // Force auth check
        this.isLoggedIn = null;
        const loggedIn = await this._checkAuth();

        if (!loggedIn) {
            console.warn("Cannot migrate to cloud: user not logged in");
            return false;
        }

        try {
            // Get all data from sessionStorage
            const sessionKeys = this._getSessionKeys();
            const sessionData = {};

            sessionKeys.forEach((key) => {
                const value = this._getFromSession(key);
                if (value !== null) {
                    sessionData[key] = value;
                }
            });

            // If there's session data, upload it to cloud
            if (Object.keys(sessionData).length > 0) {
                await this.setItems(sessionData);

                // Clear sessionStorage after successful migration
                this._clearSession();

                console.log(
                    `Migrated ${
                        Object.keys(sessionData).length
                    } items from session to cloud`
                );
            }

            return true;
        } catch (error) {
            console.error("Failed to migrate data to cloud:", error);
            return false;
        }
    }
}

// Export for different module systems
if (typeof module !== "undefined" && module.exports) {
    // Node.js
    module.exports = { GameStorage, isUserLoggedIn };
} else if (typeof window !== "undefined") {
    // Browser
    window.GameStorage = GameStorage;
    window.isUserLoggedIn = isUserLoggedIn;
}

// Usage Examples:
/*
// Basic usage - no need to check login status, it handles it automatically
const storage = new GameStorage('my-puzzle-game');

// Use normally - it will use cloud if logged in, sessionStorage if not
await storage.setItem('playerName', 'John Doe');
await storage.setItem('highScore', 1250);

const playerName = await storage.getItem('playerName'); // Works regardless of login status

// Check current storage mode
const mode = await storage.getStorageMode(); // 'cloud' or 'session'
console.log(`Currently using ${mode} storage`);

// Migrate session data to cloud when user logs in
const loginSuccess = await userLogin(); // Your login function
if (loginSuccess) {
    const migrated = await storage.migrateToCloud();
    if (migrated) {
        console.log('Game data successfully synced to cloud!');
    }
}

// Example: Seamless game save/load
async function saveGame(gameState) {
    const storage = new GameStorage('my-game');
    
    // No need to check login - it will save to cloud or session automatically
    await storage.setItems({
        'currentLevel': gameState.level,
        'playerStats': gameState.stats,
        'inventory': gameState.inventory,
        'settings': gameState.settings
    });
    
    const mode = await storage.getStorageMode();
    console.log(`Game saved to ${mode} storage`);
}

async function loadGame() {
    const storage = new GameStorage('my-game');
    
    // Load all game data
    const gameData = await storage.getAll();
    
    return {
        level: gameData.currentLevel || 1,
        stats: gameData.playerStats || {},
        inventory: gameData.inventory || [],
        settings: gameData.settings || { sound: true }
    };
}
*/
