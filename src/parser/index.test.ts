import { newCodeFrameFromErr } from "../diagnostics/code-frame";
import { parse } from "./index";
import path from "path";
import fs from "fs";
import expect from "expect";
import { serialize } from "../serialize";

export async function expectFixture(name: string) {
	const m = await import(path.join(__dirname, "fixtures", name + ".ts"));
	try {
		const ast = parse(m.source);
		const str = serialize(ast);
		expect(str).toEqual(m.serialized);
		expect(ast).toEqual(m.ast);
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
			await expectFixture("assign-simple");
		});

		it("should parse simple identifier assign", async () => {
			await expectFixture("assign-identifier");
		});

		it("should parse multiple identifier assign", async () => {
			await expectFixture("assign-identifier-multiple");
		});

		it("should parse simple string assign", async () => {
			await expectFixture("assign-string");
			await expectFixture("assign-string-double-quote");
		});
	});
});
