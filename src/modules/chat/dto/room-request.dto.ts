import { IsNotEmpty, IsString } from 'class-validator';

export class RoomRequestDto {
    @IsNotEmpty()
    @IsString()
    username: string;

    @IsNotEmpty()
    @IsString()
    room: string;
}
