import { expectPrinted } from "./test-helpers";

describe("ES2015", () => {
	it.only("should parse computed property names", () => {
		expectPrinted("{['a']: 1}", "{['a']: 1};\n");
	});
});
