export type Lambda<I, O> = {
  inputBrand?: I;
  outputBrand?: O;
  environment: unknown[];
  argumentKey: number;
  // Making this type Expression<O> (which it should be) seems to cause TypeScript (v3.9.2)
  // to give up and start assigning types of 'any' - something to do with recursion?.
  expression: Expression<unknown>;
}

export type LambdaExpression<I, O> = {
  (input: Expression<I>): CallExpression<I, O>;

  expressionType: "lambda";
  inputBrand?: I;
  argumentKey: number;
  expression: Expression<O>;
}

export type ReferenceExpression<T> = {
  expressionType: "reference";
  argumentKey: number;
}

export type CallExpression<I, O> = {
  expressionType: "call";
  fnExpression: Expression<Lambda<I, O>>;
  argExpression: Expression<I>;
}

export type LiteralExpression<T> = {
  expressionType: 'literal';
  value: T;
}

export type Expression<T> =
    (T extends Lambda<infer I, infer O> ? LambdaExpression<I, O> : never) |
    ReferenceExpression<T> |
    (T extends number ? LiteralExpression<number> : never) |
    CallExpression<unknown, T>;

let nextArgumentKey = 100;

export function lambda<I, O>(bodyFn: (input: Expression<I>) => Expression<O>)
      : LambdaExpression<I, O> {
  const argumentKey = nextArgumentKey++;
  const referenceExpression: ReferenceExpression<I> = {
    expressionType: "reference",
    argumentKey,
  };
  const expression: Expression<O> = bodyFn(referenceExpression);

  const result = (input: Expression<I>) => ({
    expressionType: 'call' as 'call',
    fnExpression: result,
    argExpression: input,
  });

  result.expressionType = 'lambda' as 'lambda';
  result.argumentKey = argumentKey;
  result.expression = expression;
  return result;
}

export function call<I, O>(fnExpression: Expression<Lambda<I, O>>, argExpression: Expression<I>)
      : CallExpression<I, O> {
  return {
    expressionType: 'call',
    fnExpression,
    argExpression,
  };
}

export function literal(value: number): LiteralExpression<number> {
  return {
    expressionType: 'literal',
    value,
  };
}
