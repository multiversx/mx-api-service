import { DecoratorUtils } from "@elrondnetwork/nestjs-microservice-template";

export class NoCacheOptions { }

export const NoCache = DecoratorUtils.registerMethodDecorator(NoCacheOptions);
