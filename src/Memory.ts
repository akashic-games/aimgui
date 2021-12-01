/**
 * メモリデータ。
 *
 * ウィジェット ID をキーとしてアクセスする連想配列。
 */
export type MemoryData = { [wid: string]: unknown };

/**
 * ウィジェットの状態を保持するためのメモリ。
 */
export interface Memory {
	/**
	 * データ。
	 *
	 * ウィジェット ID をキーとしてアクセスする連想配列。
	 */
	data: MemoryData;
}
