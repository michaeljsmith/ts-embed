import { expect } from "chai";
import { evaluate } from "./evaluate";
import { literal, lambda, Expression, Lambda, LambdaExpression } from "./embedded-language";

describe('evaluate', function() {
  it('evaluates literal', function() {
    expect(evaluate<number>(literal(3))).equals(3);
  });

  it('evaluates simple call', function() {
    const fn = lambda((input: Expression<number>) => input);
    const resultExpression = fn(literal(5));
    const result = evaluate<number>(resultExpression);
    expect(result).equals(5);
  });

  it('evaluates closure', function() {
    const fnReturningFn =
      lambda(
        (outer: Expression<number>) =>
          lambda((inner: Expression<number>) => outer));
    const expected = 6;
    const ignored = 9;
    const fn = fnReturningFn(literal(expected));
    const resultExpression = fn(literal(ignored));
    const result = evaluate(resultExpression);
    expect(result).equals(expected);
  });

  it('handles passing function as argument', function() {
    const identityFn = lambda((x: Expression<number>) => x);
    const higherOrderFn =
        lambda((fn: Expression<Lambda<number, number>>) => fn(literal(5)));
    const result = evaluate(higherOrderFn(identityFn));
    expect(result).equals(5);
  });
});
