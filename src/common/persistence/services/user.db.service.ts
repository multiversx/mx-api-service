import { OriginLogger } from "@multiversx/sdk-nestjs";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UserDb as User } from "../entities/user.db";

@Injectable()
export class UserDbService {
    private readonly logger = new OriginLogger(UserDbService.name);

    constructor(
        @InjectRepository(User)
        private readonly userDbRepository: Repository<User>,
    ) { }

    // eslint-disable-next-line require-await
    async createUser(user: User) {
        this.logger.log(`Creating new user: ${user.address}`);
        await this.userDbRepository.save(user);
    }

    async findUser(address: string): Promise<User | null> {
        return await this.userDbRepository.findOneBy({ address: address });
    }

    async updateUserexpiryDate(
        address: string,
        expiryDate: number,
    ) {
        const user: User = new User();
        user.address = address;
        user.expiryDate = expiryDate;
        await this.userDbRepository
            .save(user);
    }

    async findAllUsers(): Promise<User[]> {
        return await this.userDbRepository.find();
    }
}
