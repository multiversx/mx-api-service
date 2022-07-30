import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";

import { fieldsList } from "graphql-fields-list";

export const Fields = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => fieldsList(GqlExecutionContext.create(context).getInfo()),
);
