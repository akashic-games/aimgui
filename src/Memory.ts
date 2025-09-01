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
 * ユーザーデータの取得。
 *
 * @param memory メモリ
 * @param gwid メモリのグローバルウィジェットID
 * @param initialValue ユーザーデータの初期値。オブジェクトでなければならない。メモリが初期化済みの時、使用しない。
 * @returns メモリに上のユーザーデータ。
 */
export function useMemory<T extends NonNullable<object>>(memory: Memory, gwid: string, initialValue: T): T {
	if (!Object.prototype.hasOwnProperty.call(memory.data, gwid)) {
		memory.data[gwid] = initialValue;
	}

	return memory.data[gwid] as T;
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
