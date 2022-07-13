import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";

const { fieldsList } = require("graphql-fields-list");

export const Fields = createParamDecorator(
    (_data: unknown, context: ExecutionContext) => fieldsList(GqlExecutionContext.create(context).getInfo()),
);
