import type { AssignableKeys, ValueObject } from "../generics";
import { colors } from "./colors";
import { drawText } from "./common";
import type { WidgetEParameterObject } from "./WidgetE";
import { WidgetE } from "./WidgetE";

/**
 * チェックボックスとその隣のラベルの間の余白。
 */
const checkBoxMargin = 2;

/**
 * CheckBoxE コンストラクタパラメータオブジェクト。
 */
export interface CheckboxEParameterObject<T extends ValueObject> extends WidgetEParameterObject {
	height: number;
	valueObject: T;
	key: AssignableKeys<T, boolean>;
	font: g.Font;
}

/**
 * CheckBox E。
 */
export class CheckboxE extends WidgetE {
	valueObject: ValueObject;
	key: string;

	get checked(): boolean {
		return this.valueObject[this.key] as boolean;
	}

	set checked(v: boolean) {
		this.valueObject[this.key] = v;
	}

	pressed: boolean;

	private font: g.Font;

	constructor(param: CheckboxEParameterObject<any>) {
		const checkBoxSize = param.height;
		const desiredWidth = param.width ?? checkBoxSize + checkBoxMargin + param.font.measureText(param.title).width;
		const desiredHeight = param.height;

		param.width = desiredWidth;
		param.desiredWidth = desiredWidth;
		param.desiredHeight = desiredHeight;
		param.minWidth = desiredWidth;
		param.minHeight = desiredHeight;

		super(param);

		this.valueObject = param.valueObject;
		this.key = param.key;
		this.pressed = false;
		this.font = param.font;

		this.onPointDown.add(this.handlePointDown, this);
		this.onPointUp.add(this.handlePointUp, this);
	}

	postRun(): void {
		this.pressed = false;
		super.postRun();
	}

	renderSelf(renderer: g.Renderer, _camera?: g.Camera): true {
		const checkBoxSize = this.height;
		const checkMarkColor = colors.checkMark;
		const checkBoxColor = this.pressed ? colors.checkMark : colors.checkBox;

		// チェックボックスの描画。
		renderer.fillRect(0, 0, checkBoxSize, checkBoxSize, checkBoxColor);
		if (!this.pressed && this.checked) {
			renderer.fillRect(2, 2, checkBoxSize - 4, checkBoxSize - 4, checkMarkColor);
		}

		// ラベルの描画。
		// "y" のようなベースラインの下に伸びる文字を考慮してやや大きくする。
		const textHeight = this.font.size * 1.2;
		const dx = checkBoxSize + checkBoxMargin;
		const dy = Math.round((checkBoxSize - textHeight) / 2);

		drawText(renderer, this.font, this.title, dx, dy);

		// DEBUG: レイアウトに関する領域を描画する。
		// this.drawLayout(renderer);

		return true;
	}

	private handlePointDown(_ev: g.PointDownEvent): void {
		this.pressed = true;
		this.checked = !this.checked;
		this.modified();
	}

	private handlePointUp(_ev: g.PointUpEvent): void {
		this.pressed = false;
		this.modified();
	}
}
