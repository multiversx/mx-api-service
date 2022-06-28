import { DecoratorUtils } from "@elrondnetwork/nestjs-microservice-common";

export class NoAuthOptions { }

export const NoAuth = DecoratorUtils.registerMethodDecorator(NoAuthOptions);
