import { Module } from '@nestjs/common';
import { ChatModule } from './modules/chat/chat.module';
import { RedisModule } from 'nestjs-redis';
import { AppConfigModule } from './modules/config/app-config.module';
import { AppConfigService } from './modules/config/app-config.service';

@Module({
    imports: [
        ChatModule,
        RedisModule.forRootAsync({
            imports: [AppConfigModule],
            useFactory: (appConfigService: AppConfigService) => appConfigService.redisConfig,
            inject: [AppConfigService],
        }),
    ],
})
export class AppModule {}
