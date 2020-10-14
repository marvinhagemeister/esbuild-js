import Suite from "benchmarkjs-pretty";
import fs from "fs/promises";
import path from "path";
import { parse } from "../src/parser";
import { serialize } from "../src/serialize";
import * as acorn from "acorn";
// @ts-ignore
import * as astring from "astring";
// @ts-ignore
import babelGen from "@babel/generator";
import * as babelParse from "@babel/parser";
import * as esbuild from "esbuild";
import * as escaya from "escaya";
import * as escayaCodegen from "escaya-codegen";

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

function testEscaya(source: string) {
	const ast = escaya.parseModule(source);
	return escayaCodegen.generate(ast, {
		minify: false,
		tabs: false,
		bracketSpacing: false,
	});
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
		.add("escaya", () => testEscaya(code))
		.add("babel", () => testBabel(code))
		.run();
}

async function runPhaseBenchmark(name: string, code: string) {
	let customAst: any = null;
	let acornAst: any = null;
	let babelAst: any = null;
	let escayaAst: any = null;
	await new Suite(name + " parsing")
		.add("custom parse", () => {
			customAst = parse(code);
		})
		.add("acorn parse", () => {
			acornAst = acorn.parse(code);
		})
		.add("babel parse", () => {
			babelAst = babelParse.parse(code);
		})
		.add("escaya parse", () => {
			escayaAst = escaya.parseModule(code);
		})
		.run();

	await new Suite(name + " serializing")
		.add("custom serialize", () => {
			return serialize(customAst);
		})
		.add("acorn serialize", () => {
			return astring.generate(acornAst);
		})
		.add("babel serialize", () => {
			return babelGen(babelAst);
		})
		.add("escaya serialize", () => {
			return escayaCodegen.generate(escayaAst, {
				minify: false,
				bracketSpacing: false,
				tabs: false,
			});
		})
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

async function benchPreact() {
	const code = await fs.readFile(path.join(__dirname, "preact.js"), "utf-8");
	await runBenchmark("Preact", code);
	await runPhaseBenchmark("Preact", code);
}

async function run() {
	esbuildService = await esbuild.startService();

	// await bench1();
	// await bench2();
	await benchPreact();

	esbuildService.stop();
}

run()
	.then(() => process.exit(0))
	.catch(err => {
		console.log(err);
		process.exit(1);
	});
