import Suite from "benchmarkjs-pretty";
import { parse } from "../src/parser";
import { serialize } from "../src/serialize";
import * as acorn from "acorn";
// @ts-ignore
import * as astring from "astring";

function testCustom(source: string) {
	const ast = parse(source);
	return serialize(ast, { newLineChar: "\n", indentChar: "  " });
}

function testAcorn(source: string) {
	const ast = acorn.parse(source, {});
	return astring.generate(ast);
}

function bench1() {
	const code = `
  class Foo {
    foo() {}
  }

  const x = -2;
  `;

	return new Suite("Simple")
		.add("custom", () => testCustom(code))
		.add("acorn", () => testAcorn(code))
		.run();
}

bench1();
