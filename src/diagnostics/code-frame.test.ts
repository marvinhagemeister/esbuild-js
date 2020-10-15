import expect from "expect";
import * as kl from "kolorist";
import { newCodeFrame } from "./code-frame";

export function test(source: string, line: number, col: number) {
	const frame = newCodeFrame(source, line, col);
	return kl.stripColors(frame);
}

describe("Code-Frame", () => {
	it("should render", () => {
		expect(test("foobar", 0, 3)).toEqual("1 | foobar\n  |    ⯅\n");
	});

	it("should convert tabs to spaces", () => {
		expect(test("	foobar", 0, 3)).toEqual("1 |   foobar\n  |     ⯅\n");
	});

	it("should adapt line number width", () => {
		const str = `a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\n`;
		const expected = [
			" 2 | b",
			" 3 | c",
			" 4 | d",
			" 5 | e",
			" 6 | f",
			" 7 | g",
			"   | ⯅",
			" 8 | h",
			" 9 | i",
			"10 | j",
			"11 | k",
		];
		expect(test(str, 6, 0).trimEnd()).toEqual(expected.join("\n"));
	});
});
