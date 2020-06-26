import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
    constructor(private configService: ConfigService) {}

    get appEnv(): string {
        return this.configService.get<string>('APP_ENV');
    }

    get appPort(): number {
        return this.configService.get<number>('APP_PORT');
    }

    get redisConfig(): { host: string, port: number } {
        return {
            host: this.configService.get<string>('REDIS_HOST'),
            port: this.configService.get<number>('REDIS_PORT'),
        };
    }
}
