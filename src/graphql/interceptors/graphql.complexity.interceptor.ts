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
    const graphqlContext = GqlExecutionContext.create(context);
    const requestInfo = graphqlContext.getInfo();
    const requestArgs = graphqlContext.getArgs();

    const fields: string[] = fieldsList(requestInfo);
    const size: number = requestArgs.input?.size ?? 1;

    const previousComplexity = requestInfo.variableValues?.complexity;
    const processed = previousComplexity?.processed ?? [];

    const requestPath = `${target.name}-${size}-${context.getHandler().name}-${fields.toString()}`;
    if (processed.find((name: string) => name === requestPath)) {
      // special case for resolvers since they get called a bunch of times for one given query.
      return;
    }

    const complexityTree = ComplexityUtils.updateComplexityTree(previousComplexity, target, fields, size, context.getArgByIndex(0), requestInfo.path.key);

    const complexity = complexityTree.getComplexity();
    if (complexity > this.complexityThreshold) {
      throw new ComplexityExceededException(complexity, this.complexityThreshold);
    }

    processed.push(requestPath);

    graphqlContext.getInfo().variableValues.complexity = {
      processed: processed,
      tree: complexityTree,
    };

    context.switchToHttp().getNext().req.res.set("X-Request-Complexity", complexity);
  }
}
