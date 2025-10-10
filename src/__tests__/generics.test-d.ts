import { describe, test, expectTypeOf } from "vitest";
import type { AssignableKeys } from "../generics";

class ClassA { };

class ClassB {
	n: number = 100;
}

const mySymbol1 = Symbol("mySymbol1");
const mySymbol2 = Symbol("mySymbol2");

interface MyObject {
	0: boolean;
	400: string;

	a: boolean;
	b?: boolean;
	c: boolean | string;
	d: boolean | null;
	e: boolean | undefined;

	i: any;
	j: unknown;

	o: null;
	p: undefined;

	s: object;
	t: {};
	u: Object;
	v: ClassA;
	w: ClassB;
	x: object | boolean;

	withSymbol: {
		[key: symbol]: boolean;
		a: boolean;
		b: undefined;
	};

	symbols: {
		[mySymbol1]: boolean;
		[mySymbol2]: string;
	};
};

describe("AssignableKeys<T, U>", () => {
	test("Extract assignable keys from MyObject", () => {
		// 直感に反するが t, u, v に boolean 型の値を代入可能であることに注意。
		expectTypeOf<AssignableKeys<MyObject, boolean>>()
			.toEqualTypeOf<0 | "a" | "b" | "c" | "d" | "e" | "i" | "j" | "t" | "u" | "v" | "x">();

		expectTypeOf<AssignableKeys<MyObject["withSymbol"], boolean>>()
			.toEqualTypeOf<symbol | "a">();

		expectTypeOf<AssignableKeys<MyObject["symbols"], boolean>>()
			.toEqualTypeOf<typeof mySymbol1>();

		expectTypeOf<AssignableKeys<MyObject, null>>()
			.toEqualTypeOf<"d" | "i" | "j" | "o">();

		expectTypeOf<AssignableKeys<MyObject, undefined>>()
			.toEqualTypeOf<"b" | "e" | "i" | "j" | "p">();

		expectTypeOf<AssignableKeys<MyObject["withSymbol"], undefined>>()
			.toEqualTypeOf<"b">();

		expectTypeOf<AssignableKeys<MyObject, ClassA>>()
			.toEqualTypeOf<"i" | "j" | "s" | "t" | "u" | "v" | "x">();

		expectTypeOf<AssignableKeys<MyObject, ClassB>>()
			.toEqualTypeOf<"i" | "j" | "s" | "t" | "u" | "v" | "w" | "x">();
	});
});
