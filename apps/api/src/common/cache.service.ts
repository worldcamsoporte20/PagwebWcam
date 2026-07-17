import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    this.redis = new Redis(config.get<string>("REDIS_URL", "redis://127.0.0.1:6379"), {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 10_000,
      retryStrategy: () => null,
    });
    this.redis.on("error", (error) => this.logger.warn(`Redis cache unavailable: ${error.message}`));
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? (JSON.parse(cached) as T) : null;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown cache read error";
      this.logger.warn(`Cache read failed for ${key}: ${message}`);
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds: number) {
    try {
      await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown cache write error";
      this.logger.warn(`Cache write failed for ${key}: ${message}`);
      return;
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
