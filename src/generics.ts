export type ValueObject = Record<keyof any, any>;

/**
 * オブジェクト型 T の各プロパティについて、型 U が代入可能なら
 * そのプロパティキーをプロパティ値の型とし、代入不能なら never を
 * プロパティ値の型とするプロパティに置き換えます。
 *
 * 例） ConditionalKeyMirror<{ a: string, b: number }, string>
 *     => { a: "a", b: never }
 */
type ConditionalKeyMirror<T extends object, U> = {
	[K in keyof T]: U extends T[K] ? K : never;
};

/**
 * 指定された型の値を代入可能なプロパティのキーを得る。
 */
export type AssignableKeys<T extends object, U> =
	// オプショナルなプロパティはundefined型を結果に含めてしまうので除去する
	// 例） ConditionalKeyMirror<{ b?: boolean }> -> { b?: "b" | undefined }
	Exclude<
		ConditionalKeyMirror<T, U>[keyof T],
		undefined
	>;

/**
 * コンストラクタ型。
 */
export type Constructor<T extends object> = new (...args: any[]) => T;

/**
 * 指定された型の値を代入可能なプロパティのキーを得る。
 *
 * @deprecated AssignableKeysを使用してください。
 */
export type ExtractPropertyNames<T, U> =
	{ [K in keyof T]: T[K] extends U ? K : never }[keyof T] &
	(string | number);
