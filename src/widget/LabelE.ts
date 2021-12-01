import { drawText } from "./common";
import { WidgetE, WidgetEParameterObject } from "./WidgetE";

/**
 * StaticTextE コンストラクタパラメータオブジェクト。
 */
export interface LabelEParameterObject extends WidgetEParameterObject {
	font: g.Font;
}

/**
 * StaticText E。
 */
export class LabelE extends WidgetE {
	private font: g.Font;

	constructor(param: LabelEParameterObject) {
		param.desiredWidth = param.desiredWidth ?? param.font.measureText(param.title).width;
		param.desiredHeight = param.desiredHeight ?? param.height;
		param.minWidth = param.minWidth ?? param.desiredWidth;
		param.minHeight = param.minHeight ?? param.desiredHeight;

		super(param);

		this.font = param.font;
	}

	renderSelf(renderer: g.Renderer, _camera?: g.Camera): true {
		const fontHeight = this.font.size;
		const dx = 0;
		const dy = Math.round((this.height - fontHeight) / 2);

		drawText(renderer, this.font, this.title, dx, dy);

		return true;
	}
}
