/**
 * Cache Manager with TTL (Time To Live) support
 */

import { ICacheManager, CacheEntry } from '../types';
import { getLogger } from '../utils/logger';

export class CacheManager implements ICacheManager {
    private interfaceCache: Map<string, CacheEntry<any>>;
    private implementationCache: Map<string, CacheEntry<any>>;
    private methodCache: Map<string, CacheEntry<any>>;
    private filePathIndex: Map<string, Set<string>>;
    private ttl: number;

    constructor(ttl: number = 5 * 60 * 1000) { // Default: 5 minutes
        this.interfaceCache = new Map();
        this.implementationCache = new Map();
        this.methodCache = new Map();
        this.filePathIndex = new Map();
        this.ttl = ttl;
    }

    /**
     * Get cached value by key
     */
    get<T>(key: string): T | null {
        // Try all caches
        const caches = [this.interfaceCache, this.implementationCache, this.methodCache];

        for (const cache of caches) {
            const cached = cache.get(key);
            if (cached) {
                // Check TTL
                if (Date.now() - cached.timestamp > this.ttl) {
                    cache.delete(key);
                    getLogger().debug(`Cache expired for key: ${key}`);
                    return null;
                }
                getLogger().debug(`Cache hit for key: ${key}`);
                return cached.value as T;
            }
        }

        getLogger().debug(`Cache miss for key: ${key}`);
        return null;
    }

    /**
     * Set cache value
     */
    set<T>(key: string, value: T): void {
        const entry: CacheEntry<T> = {
            value,
            timestamp: Date.now()
        };

        // Determine which cache to use based on key prefix
        if (key.startsWith('interface:')) {
            this.interfaceCache.set(key, entry);
        } else if (key.startsWith('method:')) {
            this.methodCache.set(key, entry);
        } else {
            this.implementationCache.set(key, entry);
        }

        getLogger().debug(`Cached value for key: ${key}`);
    }

    /**
     * Set cache value with file path for invalidation
     */
    setWithFile<T>(key: string, value: T, filePath: string): void {
        this.set(key, value);

        // Index this cache key by file path
        if (!this.filePathIndex.has(filePath)) {
            this.filePathIndex.set(filePath, new Set());
        }
        this.filePathIndex.get(filePath)!.add(key);
    }

    /**
     * Invalidate specific cache entry
     */
    invalidate(key: string): void {
        this.interfaceCache.delete(key);
        this.implementationCache.delete(key);
        this.methodCache.delete(key);
        getLogger().debug(`Invalidated cache for key: ${key}`);
    }

    /**
     * Invalidate all cache entries related to a file path
     */
    invalidateByFile(filePath: string): void {
        const keys = this.filePathIndex.get(filePath);
        if (keys) {
            keys.forEach(key => this.invalidate(key));
            this.filePathIndex.delete(filePath);
            getLogger().debug(`Invalidated cache for file: ${filePath} (${keys.size} entries)`);
        }
    }

    /**
     * Clear all caches
     */
    clear(): void {
        this.interfaceCache.clear();
        this.implementationCache.clear();
        this.methodCache.clear();
        this.filePathIndex.clear();
        getLogger().info('All caches cleared');
    }

    /**
     * Get cache statistics
     */
    getStats(): { interfaces: number; implementations: number; methods: number; total: number } {
        return {
            interfaces: this.interfaceCache.size,
            implementations: this.implementationCache.size,
            methods: this.methodCache.size,
            total: this.interfaceCache.size + this.implementationCache.size + this.methodCache.size
        };
    }

    /**
     * Cleanup expired entries
     */
    cleanup(): void {
        const now = Date.now();
        let expiredCount = 0;

        const cleanupCache = (cache: Map<string, CacheEntry<any>>) => {
            for (const [key, entry] of cache.entries()) {
                if (now - entry.timestamp > this.ttl) {
                    cache.delete(key);
                    expiredCount++;
                }
            }
        };

        cleanupCache(this.interfaceCache);
        cleanupCache(this.implementationCache);
        cleanupCache(this.methodCache);

        if (expiredCount > 0) {
            getLogger().debug(`Cleaned up ${expiredCount} expired cache entries`);
        }
    }

    /**
     * Set TTL value
     */
    setTTL(ttl: number): void {
        this.ttl = ttl;
        getLogger().info(`Cache TTL updated to ${ttl}ms`);
    }

    /**
     * Get TTL value
     */
    getTTL(): number {
        return this.ttl;
    }
}

// Global cache instance
let globalCache: CacheManager | null = null;

export function getCacheManager(): CacheManager {
    if (!globalCache) {
        globalCache = new CacheManager();
    }
    return globalCache;
}

export function setCacheManager(cache: CacheManager): void {
    globalCache = cache;
}

/**
 * Start periodic cache cleanup
 */
export function startCacheCleanup(cache: CacheManager, intervalMs: number = 60000): NodeJS.Timeout {
    return setInterval(() => {
        cache.cleanup();
    }, intervalMs);
}
