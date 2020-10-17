import { newCodeFrameFromErr } from "../diagnostics/code-frame";
import { parse } from "./index";
import path from "path";
import fs from "fs";
import expect from "expect";
import { serialize } from "../serialize";

export async function expectFixture(name: string) {
	const m = await import(path.join(__dirname, "fixtures", name + ".ts"));
	expect(serialize(parse(m.source))).toEqual(m.serialized);
	expect(parse(m.source)).toEqual(m.ast);
}

describe.only("Parser", () => {
	describe("Assignment", () => {
		it("should parse simple assign", async () => {
			await expectFixture("assign-simple");
		});
	});
});
