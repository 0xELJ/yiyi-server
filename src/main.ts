import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppConfigService } from './modules/config/app-config.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const port = app.get(AppConfigService).appPort;

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(port);
  logger.log('API running on port ' + port);
}
bootstrap();
