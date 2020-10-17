import * as kl from "kolorist";
import { CustomSyntaxError } from "../lexer/index";
import { Char } from "../lexer_helpers";

export function indexToLoc(source: string, n: number) {
	let line = 0;
	let column = 0;

	for (let i = 0; i < n; i++) {
		const ch = source.charCodeAt(i);
		if (ch === Char.NewLine) {
			line++;
			column = 0;
		} else {
			column++;
		}
	}

	return { line, column };
}

export function newCodeFrame(source: string, lineNum: number, colNum: number) {
	const start = Math.max(0, lineNum - 5);

	const lines = source.split(/\n/);

	const end = Math.min(lines.length, lineNum + 5);
	const numLen = Math.max(String(start + 1).length, String(end + 1).length);

	const out = lines.slice(start, end).map((line, i) => {
		let tabCount = 0;
		line = line.replace(/^\t+/g, m => {
			tabCount = m.length;
			return "  ".repeat(tabCount);
		});

		const num = String(start + i + 1).padStart(numLen, " ");
		let part = `${num} | ${line}`;

		if (start + i === lineNum) {
			const marker = kl.red(" ".padStart(numLen, " "));
			const indent = " ".repeat(colNum + tabCount);
			const sep = kl.dim("|");
			part += `\n${marker} ${sep} ${indent}${kl.bold(kl.red("⯅"))}`;
		}
		return part;
	});

	return out.join("\n") + "\n";
}

export function indent(str: string, n: number) {
	return str
		.split(/\n/g)
		.map(l => " ".repeat(n) + l)
		.join("\n");
}

export function newCodeFrameFromErr(err: CustomSyntaxError) {
	if (err.source) {
		const frame = newCodeFrame(err.source, err.line, err.column);
		return (
			"\n" +
			kl.inverse(kl.bold(kl.red(` ERROR `))) +
			" " +
			err.constructor.name +
			": " +
			err.message +
			"\n\n" +
			indent(frame, 2)
		);
	}
	return err;
}
