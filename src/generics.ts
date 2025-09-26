export type ValueObject = Record<keyof any, any>;

/**
 * 型 U の値を代入可能なプロパティを、キーを型とするプロパティに置き換える。
 *
 * 代入不能な時、キーの型は never となる。
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
