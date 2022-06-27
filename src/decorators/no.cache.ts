import { DecoratorUtils } from "@elrondnetwork/nestjs-microservice-common";

export class NoCacheOptions { }

export const NoCache = DecoratorUtils.registerMethodDecorator(NoCacheOptions);
