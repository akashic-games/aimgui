import { separator } from "./gwid";

/**
 * メモリデータ。
 *
 * グローバルウィジェット ID をキーとする連想配列。
 */
export type MemoryData = Record<string, unknown>;

/**
 * ウィジェットの状態を保持するためのメモリ。
 */
export interface Memory {
	data: MemoryData;
}

/**
 * ユーザーメモリ。
 */
export interface UserMemory<T> {
	get(): T;
	set(newValue: T): void;
}

/**
 * ユーザーメモリの取得。
 *
 * @param memory メモリ
 * @param gwid メモリのグローバルウィジェットID
 * @param initialValue 初期値。メモリが初期化済みの時、使用しない。
 * @returns ユーザーメモリ。
 */
export function useMemory<T>(memory: Memory, gwid: string, initialValue: T): UserMemory<T> {
	if (Object.prototype.hasOwnProperty.call(memory.data, gwid) === false) {
		memory.data[gwid] = initialValue;
	}

	const data = memory.data;
	const userMemory: UserMemory<T> = {
		get: () => data[gwid] as T,
		set: (newValue: T) => {
			data[gwid] = newValue;
		}
	};

	return userMemory;
}

/**
 * gwid または gwid で始まるキーを持つメモリを解放する。
 *
 * gwidが "foo::bar" の場合、"foo::bar", "foo::bar::baz" などが対象になる。
 *
 * @param memory メモリ
 * @param gwid メモリのグローバルウィジェットID
 */
export function releaseMemoryHierarchy(memory: Memory, gwid: string): void {
	Object
		.keys(memory.data)
		.filter(key => key === gwid || key.startsWith(gwid + separator))
		.forEach(key => {
			console.log(`delete memory '${key}', value: ${JSON.stringify(memory.data[key])}`);
			delete memory.data[key];
		});
}
