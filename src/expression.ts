export type Lambda<I, O> = {
  inputBrand?: I;
  outputBrand?: O;
  environment: unknown[];
  argumentKey: number;
  // Making this type Expression<O> (which it should be) seems to cause TypeScript (v3.9.2)
  // to give up and start assigning types of 'any' - something to do with recursion?.
  expression: Expression<unknown>;
};

type MaybeCallableExpression<T> = T extends Lambda<infer I, infer O>
  ? (input: Expression<I>) => Expression<O>
  : unknown;

export type LambdaExpression<I, O> = {
  (input: Expression<I>): CallExpression<O>;
  expressionType: "lambda";
  inputBrand?: I;
  argumentKey: number;
  expression: Expression<O>;
};

export type ReferenceExpression<T> = MaybeCallableExpression<T> & {
  expressionType: "reference";
  argumentKey: number;
};

export type CallExpression<O> = MaybeCallableExpression<O> & {
  expressionType: "call";
  // Ideally we want to use an existential type (or a '?' as in Java) to indicate that there is
  // specific type matching both the input and the argument. There isn't such a concept in
  // Typescript so instead we need to use a visitor pattern to maintain type-safety. An
  // alternative would be to define an interface/class pair, where the class includes the type
  // parameter but it is omitted in the interface.
  visit: <R>(
    visitor: <I>(
      fnExpression: Expression<Lambda<I, O>>,
      argExpression: Expression<I>,
    ) => R,
  ) => R;
};

export type LiteralExpression<T> = {
  expressionType: "literal";
  value: T;
};

export type Expression<T> =
  | (T extends Lambda<infer I, infer O> ? LambdaExpression<I, O> : never)
  | ReferenceExpression<T>
  | (T extends number ? LiteralExpression<number> : never)
  | CallExpression<T>;

let nextArgumentKey = 100;

export function lambda<I, O>(
  bodyFn: (input: Expression<I>) => Expression<O>,
): Expression<Lambda<I, O>> {
  const argumentKey = nextArgumentKey++;

  // Make the reference expression callable in case it is a lambda type.
  const referenceExpression = (input: Expression<I>): Expression<O> =>
    call(referenceExpression, input);
  referenceExpression.expressionType = "reference" as const;
  referenceExpression.argumentKey = argumentKey;
  const expression: Expression<O> = bodyFn(
    referenceExpression as Expression<I>,
  );

  // Make the result callable in case it is a lambda type.
  const result = (input: Expression<I>): Expression<O> =>
    call(result as LambdaExpression<I, O>, input);

  result.expressionType = "lambda" as const;
  result.argumentKey = argumentKey;
  result.expression = expression;
  return result as LambdaExpression<I, O>;
}

export function call<I, O>(
  fnExpression: Expression<Lambda<I, O>>,
  argExpression: Expression<I>,
): Expression<O> {
  function callExpressionHost<I, O>(
    fnExpression: Expression<Lambda<I, O>>,
    argExpression: Expression<I>,
  ): <R>(
    visitor: <I>(
      fnExpression: Expression<Lambda<I, O>>,
      argExpression: Expression<I>,
    ) => R,
  ) => R {
    return (visitor) => visitor(fnExpression, argExpression);
  }

  const result = Object.assign(
    (input: Expression<unknown>): unknown =>
      call(
        result as unknown as LambdaExpression<unknown, unknown>,
        input,
      ) as MaybeCallableExpression<unknown>,
    {
      expressionType: "call" as const,
      visit: callExpressionHost(fnExpression, argExpression),
    },
  );
  return result;
}

export function literal(value: number): Expression<number> {
  return {
    expressionType: "literal",
    value,
  };
}
