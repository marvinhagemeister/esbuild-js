import Suite from "benchmarkjs-pretty";
import { parse } from "../src/parser";
import { serialize } from "../src/serialize";
import * as acorn from "acorn";
// @ts-ignore
import * as astring from "astring";
// @ts-ignore
import babelGen from "@babel/generator";
import * as babelParse from "@babel/parser";
import * as esbuild from "esbuild";

function testCustom(source: string) {
	const ast = parse(source);
	return serialize(ast, { newLineChar: "\n", indentChar: "  " });
}

function testAcorn(source: string) {
	const ast = acorn.parse(source, {});
	return astring.generate(ast);
}

function testBabel(source: string) {
	const ast = babelParse.parse(source);
	return babelGen(ast);
}

// Esbuild runs very poor without a service for some reason. Not sure why.
let esbuildService: esbuild.Service;
async function testESBuild(source: string) {
	const { js } = await esbuildService.transform(source, {
		minify: false,
		sourcemap: false,
		strict: true,
		target: "es2020",
	});
	return js;
}

function runBenchmark(name: string, code: string) {
	return new Suite(name)
		.add("custom", () => testCustom(code))
		.add("esbuild", () => testESBuild(code))
		.add("acorn", () => testAcorn(code))
		.add("babel", () => testBabel(code))
		.run();
}

function bench1() {
	const code = `
  class Foo {
    foo() {}
  }

  const x = -2;
  `;

	return runBenchmark("Simple Class", code);
}

function bench2() {
	const code = `for (let i = 0; i < 12; i++) {}`;

	return runBenchmark("Simple for-loop", code);
}

async function run() {
	esbuildService = await esbuild.startService();

	await bench1();
	await bench2();

	esbuildService.stop();
}

run()
	.then(() => process.exit(0))
	.catch(() => process.exit(1));
