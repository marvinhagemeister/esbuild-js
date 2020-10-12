import expect from "expect";
import { parse } from "./parser";
import { serialize } from "./serialize";

export function expectPrinted(source: string, expected: string) {
	const ast = parse(source);
	const out = serialize(ast, { newLineChar: "\n", indentChar: "  " });
	expect(out).toBe(expected);
}
