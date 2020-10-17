import { newCodeFrameFromErr } from "../diagnostics/code-frame";
import { parse } from "./index";
import path from "path";
import fs from "fs";
import expect from "expect";
import { serialize } from "../serialize";
import * as assignIdentifier from "./fixtures/assign-identifier";
import * as assignIdentifierMultiple from "./fixtures/assign-identifier-multiple";
import * as assignSimple from "./fixtures/assign-simple";
import * as assignString from "./fixtures/assign-string";
import * as assignStringQuote from "./fixtures/assign-string-double-quote";
import * as equalityLoose from "./fixtures/equality-loose";
import * as equalityStrict from "./fixtures/equality-strict";
import * as statementBreak from "./fixtures/statement-break";
import * as statementBreakLabel from "./fixtures/statement-break-label";

export interface Fixture {
	ast: any;
	source: string;
	serialized: string;
}

export async function expectFixture(fixture: Fixture) {
	try {
		const ast = parse(fixture.source);
		const str = serialize(ast);
		// expect(str).toEqual(fixture.serialized);
		expect(ast).toEqual(fixture.ast);
	} catch (err) {
		const frame = newCodeFrameFromErr(err);
		if (typeof frame === "string") {
			console.log(frame);
		}
		throw err;
	}
}

describe.only("Parser", () => {
	describe("Assignment", () => {
		it("should parse simple numeric assign", async () => {
			await expectFixture(assignSimple);
		});

		it("should parse simple identifier assign", async () => {
			await expectFixture(assignIdentifier);
		});

		it("should parse multiple identifier assign", async () => {
			await expectFixture(assignIdentifierMultiple);
		});

		it("should parse simple string assign", async () => {
			await expectFixture(assignString);
			await expectFixture(assignStringQuote);
		});
	});

	describe("Equality", () => {
		it("should parse loose equality (==)", async () => {
			await expectFixture(equalityLoose);
		});

		it("should parse strict equality (===)", async () => {
			await expectFixture(equalityStrict);
		});
	});

	describe("Statement", () => {
		describe("Break", () => {
			it("should parse break", async () => {
				await expectFixture(statementBreak);
			});

			it("should parse break with label", async () => {
				await expectFixture(statementBreakLabel);
			});
		});
	});
});
