import { Injectable } from '@nestjs/common';
import { User } from './user';

@Injectable()
export class UserService {
    private users: User[] = [];

    addUser({ id, username, room }: User): { error: string, user?: User } {
        username = this.sanitizeString(username);
        room = this.sanitizeString(room);

        const existingUser = this.hasExistingUser(username, room);
        if (existingUser) {
            return { error: 'User is in use!' };
        }

        const user: User = { id, username, room };
        this.users.push(user);

        return { error: '', user };
    }

    getUser(id: string): User {
        return this.users.find(user => user.id === id);
    }

    getUsersInRoom(room: string): User[] {
        room = this.sanitizeString(room);
        return this.users.filter(user => user.room === room);
    }

    removeUser(id: string): User {
        const index = this.users.findIndex(user => user.id === id);

        if (index !== -1) {
            const [ deletedUser ] = this.users.splice(index, 1);
            return deletedUser;
        }
    }

    private sanitizeString(str: string): string {
        return str.trim().toLowerCase();
    }

    private hasExistingUser(username: string, room: string): boolean {
        return this.users.some(user => user.room === room && user.username === username);
    }
}
