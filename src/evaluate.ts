import {
  CallExpression,
  Expression,
  Lambda,
  LambdaExpression,
  LiteralExpression,
  ReferenceExpression,
} from "./expression";

function evaluateLambda<I, O>(
  expression: LambdaExpression<I, O>,
  environment: unknown[],
): Lambda<I, O> {
  return {
    environment,
    argumentKey: expression.argumentKey,
    expression: expression.expression as Expression<unknown>,
  };
}

function evaluateReference<T>(
  expression: ReferenceExpression<T>,
  environment: unknown[],
): T {
  return environment[expression.argumentKey] as T;
}

function evaluateCall<O>(
  expression: CallExpression<O>,
  environment: unknown[],
): O {
  return expression.visit((fnExpression, argExpression) => {
    const fn = evaluate(fnExpression, environment);
    const arg = evaluate(argExpression, environment);
    const newEnvironment = Object.create(fn.environment) as unknown[];
    newEnvironment[fn.argumentKey] = arg;
    return evaluate(fn.expression as Expression<O>, newEnvironment);
  });
}

function evaluateLiteral<T>(expression: LiteralExpression<T>): T {
  return expression.value;
}

function assertNever(x: never): never {
  throw new Error("Unexpected object: " + x);
}

export function evaluate<T>(
  expression: Expression<T>,
  environment?: unknown[],
): T {
  if (environment === undefined) {
    environment = [];
  }

  if (expression.expressionType === "lambda") {
    return evaluateLambda(expression, environment) as unknown as T;
  } else if (expression.expressionType === "reference") {
    return evaluateReference(expression, environment);
  } else if (expression.expressionType === "call") {
    return evaluateCall(expression, environment);
  } else if (expression.expressionType === "literal") {
    return evaluateLiteral<number>(expression) as unknown as T;
  }
  return assertNever(expression);
}
