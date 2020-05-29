import { expect } from "chai";
import { evaluate } from "./evaluate";
import { literal, call, lambda, Expression, Lambda } from "./embedded-language";

describe('evaluate', function() {
  it('evaluates literal', function() {
    expect(evaluate<number>(literal(3))).equals(3);
  });

  it('evaluates simple call', function() {
    const fn = lambda((input: Expression<number>) => input);
    const result = evaluate(fn(literal(5)));
    expect(result).equals(5);
  });

  it('evaluates closure', function() {
    const higherOrderFn =
      lambda<number, Lambda<number, number>>(
        (outer) =>
          lambda<number, number>((inner) => outer));
    const expected = 6;
    const ignored = 9;
    const fn = higherOrderFn(literal(expected));
    const resultExpression = call(fn, literal(ignored));
    const result = evaluate(resultExpression);
    expect(result).equals(expected);
  });
});
