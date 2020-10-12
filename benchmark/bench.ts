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

	return new Suite("Simple Class")
		.add("custom", () => testCustom(code))
		.add("acorn", () => testAcorn(code))
		.run();
}

function bench2() {
	const code = `for (let i = 0; i < 12; i++) {}`;

	return new Suite("Simple for-loop")
		.add("custom", () => testCustom(code))
		.add("acorn", () => testAcorn(code))
		.run();
}

async function run() {
	await bench1();
	await bench2();
}

run();
