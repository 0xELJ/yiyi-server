import { Injectable } from '@nestjs/common';
import { User } from './user';
import * as Redis from 'ioredis';
import { RedisService } from 'nestjs-redis';

@Injectable()
export class UserService {
    private redis: Redis.Redis;

    constructor(private redisService: RedisService) {
        this.initRedis();
    }

    private async initRedis() {
        this.redis = await this.redisService.getClient();
    }

    async addUser({ id, username, room }: User): Promise<{ error: string, user?: User }> {
        username = this.sanitizeString(username);
        room = this.sanitizeString(room);

        const existingUser = await this.hasExistingUser(username, room);
        if (existingUser) {
            return { error: 'User is in use!' };
        }

        const userKey = `user:${id}`;
        const roomKey = `room:${room}`;
        await this.redis.hmset(userKey, 'username', username, 'room', room);
        await this.redis.sadd(roomKey, username);

        const user: User = { id, username, room };
        return { error: '', user };
    }

    async getUser(id: string): Promise<User> {
        const userKey = `user:${id}`;
        const user = await this.redis.hgetall(userKey);
        return Object.keys(user).length ? { id, username: user.username, room: user.room } : undefined;
    }

    async getUsersInRoom(room: string): Promise<string[]> {
        const roomKey = `room:${this.sanitizeString(room)}`;
        return await this.redis.smembers(roomKey);
    }

    async removeUser(id: string): Promise<User> {
        const user = await this.getUser(id);

        if (!user) {
            return undefined;
        }

        await this.redis.srem(`room:${user.room}`, user.username);
        await this.redis.del(`user:${id}`);
        return user;
    }

    private sanitizeString(str: string): string {
        return str.trim().toLowerCase();
    }

    private async hasExistingUser(username: string, room: string): Promise<boolean> {
        const roomKey = `room:${room}`;
        const isMember = await this.redis.sismember(roomKey, username);
        return !!isMember;
    }
}
