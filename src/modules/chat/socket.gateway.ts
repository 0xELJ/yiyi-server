import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RedisService } from 'nestjs-redis';
import * as Redis from 'ioredis';
import { v4 as uuid } from 'uuid';
import { RoomRequestDto } from './dto/room-request.dto';
import { UserService } from '../user/user.service';
import { Message } from './types/message';
import { ResponseMessage } from './types/response-message';
import { User } from '../user/user';
import { LeaveRoomDto } from './dto/leave-room.dto';
import { ChatEvent } from './types/chat-event';

@WebSocketGateway({ path: '/socket.io' })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() private server: Server;
    private redis: Redis.Redis;
    private adminUser: User = { id: 'adminUser-' + uuid(), username: 'ADMIN' , room: 'any' };
    private logger: Logger = new Logger('SocketGateway');

    constructor(private userService: UserService, private redisService: RedisService) {
        this.initRedis();
    }

    private async initRedis() {
        // TODO: Include redis operations to get persistence
        this.redis = await this.redisService.getClient();
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        const user = this.userService.removeUser(client.id);

        if (user) {
            this.server.to(user.room).emit(
                ChatEvent.MESSAGE,
                this.generateMessage(this.adminUser, `${user.username} has left!`),
            );
            this.server.to(user.room).emit(
                ChatEvent.ROOM_DATA,
                { room: user.room, users: this.userService.getUsersInRoom(user.room) },
            );
        }
    }

    @SubscribeMessage(ChatEvent.JOIN_ROOM)
    handleJoinToRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() request: RoomRequestDto,
    ): ResponseMessage<User> {
        const { username, room } = request;
        const { error, user } = this.userService.addUser({ id: client.id, username, room });
        const response: ResponseMessage<User> = { error, data: user };

        if (response.error.length) {
            return response;
        }

        client.join(user.room);
        client.emit(ChatEvent.MESSAGE, this.generateMessage(this.adminUser, 'Welcome!'));
        client.broadcast.to(user.room).emit(
            ChatEvent.MESSAGE,
            this.generateMessage(this.adminUser, `${user.username} has joined!`),
        );
        this.server.to(user.room).emit(
            ChatEvent.ROOM_DATA,
            { room: user.room, users: this.userService.getUsersInRoom(user.room) },
        );

        return response;
    }

    @SubscribeMessage(ChatEvent.SEND_MESSAGE)
    handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() message: string,
    ): ResponseMessage<string> {
        const user = this.userService.getUser(client.id);
        const response: ResponseMessage<string> = { error: '', data: '' };

        if (user) {
            this.server.in(user.room).emit(ChatEvent.MESSAGE, this.generateMessage(user, message));
            response.data = 'Message delivered';
        } else {
            response.error = 'User not found';
        }

        return response;
    }

    @SubscribeMessage(ChatEvent.LEAVE_ROOM)
    handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: LeaveRoomDto,
    ): ResponseMessage<string> {
        const { room } = body;
        const user = this.userService.removeUser(client.id);
        const response: ResponseMessage<string> = { error: '', data: '' };

        if (user) {
            client.leave(room, error => {
                if (error) {
                    response.error = error;
                }
                this.server.to(room).emit(
                    ChatEvent.MESSAGE,
                    this.generateMessage(this.adminUser, `${user.username} has left!`),
                );
                this.server.to(room).emit(
                    ChatEvent.ROOM_DATA,
                    { room, users: this.userService.getUsersInRoom(room) },
                );
                response.data = 'Room leaved';
            });
        } else {
            response.error = 'User not found';
        }

        return response;
    }

    private generateMessage({ id: userId, username }: User, message: string): Message {
        return { id: uuid(), userId, username, message, createdAt: new Date().getTime() };
    }
}
