import { DecoratorUtils } from "src/utils/decorator.utils";

export class NoCacheOptions { }

export const NoCache = DecoratorUtils.registerMethodDecorator(NoCacheOptions);
