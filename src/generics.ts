/**
 * 与えられたオブジェクトの特定の型のプロパティのプロパティ名のユニオン型。
 *
 * 例:
 *
 * `x: ExtractPropertyNames<{ a: number; b: number; c: string }, number>`
 *
 * とすると `x` の型は `"a" | "b"` になる。
 *
 * symbol 型をインデックスに用いることができない設定（？）のため、
 *   `& (string | number)`
 * とすることで symbol 型を排除している。
 *
 * Key words:
 *
 * - Mapped Types
 * - keyof Type Operator
 * - Indexed Access Types
 * - Conditional Types
 *
 * Reference:
 *
 * - https://stackoverflow.com/questions/64229335/how-to-extract-string-property-names-from-an-interface-in-typescript
 * - https://www.typescriptlang.org/docs/handbook/advanced-types.html#distributive-conditional-types
 * - https://zenn.dev/qnighy/articles/dde3d980b5e386
 * - https://www.typescriptlang.org/ja/play#example/mapped-types
 */
export type ExtractPropertyNames<T, U> =
	{ [K in keyof T]: T[K] extends U ? K : never }[keyof T] &
	(string | number);

/**
 * コンストラクタ型。
 */
export type Constructor<T extends {} = {}> = new (...args: any[]) => T;
