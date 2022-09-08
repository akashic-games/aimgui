import type { WidgetEParameterObject } from "./WidgetE";
import { WidgetE } from "./WidgetE";

/**
 * MarginE コンストラクタパラメータオブジェクト。
 */
export interface MarginEParameterObject extends WidgetEParameterObject { }

/**
 * Margin E。
 *
 * 空白の領域を確保するウィジェット。
 */
export class MarginE extends WidgetE {
	constructor(param: MarginEParameterObject) {
		super(param);
	}
}
