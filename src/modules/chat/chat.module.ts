import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { UserModule } from '../user/user.module';

@Module({
    imports: [UserModule],
    providers: [SocketGateway],
})
export class ChatModule {
}
