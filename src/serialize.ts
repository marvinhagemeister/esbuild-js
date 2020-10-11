import { Node } from "estree";
import { AstNode } from "./ast";

export interface SerializeOptions {
	indentChar?: string;
	newLineChar?: string;
}

export function serialize(
	node: AstNode,
	options: SerializeOptions = {}
): string {
	const { indentChar = "  ", newLineChar = "\n" } = options;
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
				out += serialize(node.properties[i]);
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
				out += serialize(node.declarations[i]);
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
			out += serialize(node.id);
			if (node.init) {
				out += " = " + serialize(node.init);
			}
			break;
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
