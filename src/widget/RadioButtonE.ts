import { colors } from "./colors";
import { drawText } from "./common";
import type { WidgetEParameterObject } from "./WidgetE";
import { WidgetE } from "./WidgetE";

/**
 * ラジオボタンとその隣のラベルの間の余白。
 */
const radioButtonMargin = 2;

/**
 * RadioButtonE コンストラクタパラメータオブジェクト。
 */
export interface RadioButtonEParameterObject extends WidgetEParameterObject {
	height: number;
	valueObject: Object;
	key: string;
	buttonValue: unknown;
	font: g.Font;
}

/**
 * RadioButton E。
 */
export class RadioButtonE extends WidgetE {
	valueObject: any;
	key: string;
	buttonValue: unknown;

	get checked(): boolean {
		return this.valueObject[this.key] === this.buttonValue;
	}

	set checked(v: boolean) {
		if (v) {
			this.valueObject[this.key] = this.buttonValue;
		}
	}

	pressed: boolean;

	private font: g.Font;

	constructor(param: RadioButtonEParameterObject) {
		const radioButtonSize = param.height;
		const desiredWidth = param.width ?? radioButtonSize + radioButtonMargin + param.font.measureText(param.title).width;
		const desiredHeight = param.height;

		param.width = desiredWidth;
		param.desiredWidth = desiredWidth;
		param.desiredHeight = desiredHeight;
		param.minWidth = desiredWidth;
		param.minHeight = desiredHeight;

		super(param);

		this.valueObject = param.valueObject;
		this.key = param.key;
		this.buttonValue = param.buttonValue;
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
		const radioButtonSize = this.height;
		const checkMarkColor = colors.checkMark;
		const radioButtonColor = this.pressed ? colors.checkMark : colors.checkBox;

		// ラジオボタンの描画。
		renderer.fillRect(0, 0, radioButtonSize, radioButtonSize, radioButtonColor);
		if (!this.pressed && this.checked) {
			renderer.fillRect(2, 2, radioButtonSize - 4, radioButtonSize - 4, checkMarkColor);
		}

		// ラベルの描画。
		// "y" のようなベースラインの下に伸びる文字を考慮してやや大きくする。
		const textHeight = this.font.size * 1.2;
		const dx = radioButtonSize + radioButtonMargin;
		const dy = Math.round((radioButtonSize - textHeight) / 2);

		drawText(renderer, this.font, this.title, dx, dy);

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
