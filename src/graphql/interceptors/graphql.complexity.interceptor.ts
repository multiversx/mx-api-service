import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";

import { ApplyComplexityOptions, ComplexityExceededException, ComplexityUtils, DecoratorUtils } from "@elrondnetwork/erdnest";

import { fieldsList } from "graphql-fields-list";
import { Observable } from "rxjs";

@Injectable()
export class GraphqlComplexityInterceptor implements NestInterceptor {
  private readonly complexityThreshold: number = 10000;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const complexityMetadata = DecoratorUtils.getMethodDecorator<ApplyComplexityOptions>(ApplyComplexityOptions, context.getHandler());
    if (!complexityMetadata) {
      return next.handle();
    }

    const contextType: string = context.getType();

    if (["graphql"].includes(contextType)) {
      this.handleGraphQlRequest(complexityMetadata.target, context);
    }

    return next.handle();
  }

  private handleGraphQlRequest(target: any, context: ExecutionContext) {
    const fields: string[] = fieldsList(GqlExecutionContext.create(context).getInfo());
    const size: number = context.getArgByIndex(1).input.size ?? 1;

    const previousComplexity = GqlExecutionContext.create(context).getInfo().variableValues?.complexity;
    const processed = previousComplexity?.processed ?? [];

    if (processed.find((name: string) => name === `${target.name}-${size}-${fields.toString()}`)) {
      // special case for resolvers since they get called a bunch of times for one given query.
      return;
    }

    const complexityTree = ComplexityUtils.updateComplexityTree(previousComplexity, target, fields, size);

    const complexity = complexityTree.getComplexity();
    if (complexity > this.complexityThreshold) {
      throw new ComplexityExceededException(complexity, this.complexityThreshold);
    }

    processed.push(`${target.name}-${size}-${fields.toString()}`);

    GqlExecutionContext.create(context).getInfo().variableValues.complexity = {
      processed: processed,
      tree: complexityTree,
    };

    context.switchToHttp().getNext().req.res.set("X-Request-Complexity", complexity);
  }
}
