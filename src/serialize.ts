import { Node } from "estree";
import { AstNode } from "./ast";

export interface SerializeOptions {
	indentChar: string;
	newLineChar: string;
}

export function serialize(node: AstNode, options: SerializeOptions): string {
	const { indentChar, newLineChar } = options;
	let out = "";

	switch (node.type) {
		case "Identifier":
			out += node.name;
			break;
		case "Literal":
			out += node.raw;
			break;
		case "ObjectPattern": {
			out += "{";
			for (let i = 0; i < node.properties.length; i++) {
				out += serialize(node.properties[i], options);
				if (i + 1 < node.properties.length) {
					out += ", ";
				}
			}
			out += "}";
			break;
		}
		case "ObjectProperty": {
			break;
		}
		case "VariableDeclaration": {
			out += node.kind + " ";
			for (let i = 0; i < node.declarations.length; i++) {
				out += serialize(node.declarations[i], options);
				if (i + 1 < node.declarations.length) {
					out += ", ";
				}
				out += ";";
				if (newLineChar) {
					out += newLineChar;
				}
			}
			break;
		}
		case "VariableDeclarator": {
			out += serialize(node.id, options);
			if (node.init) {
				out += " = " + serialize(node.init, options);
			}
			break;
		}
		case "ForStatement": {
			out += "for (";
			if (node.init) out += serialize(node.init, options);
			out += ";";
			if (node.test) out += serialize(node.test, options);
			out += ";";
			if (node.update) out += serialize(node.update, options);
			out += ")";
			out += serialize(node.body, options);
			return out;
		}
		case "ForOfStatement": {
			return (
				"for (" +
				serialize(node.left, options) +
				" of " +
				serialize(node.right, options) +
				")" +
				serialize(node.body, options)
			);
		}
		case "EmptyStatement": {
			out += ";";
			if (options.newLineChar) {
				out += options.newLineChar;
			}
			return out;
		}
		case "Program": {
			if (node.hashbang) {
				out += node.hashbang + "\n";
			}
			for (let i = 0; i < node.body.length; i++) {
				out += serialize(node.body[i], options);
			}

			return out;
		}

		default:
			console.log(node);
			throw new Error(`No serializer found`);
	}

	return out;
}
