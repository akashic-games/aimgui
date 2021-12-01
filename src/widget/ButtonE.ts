import { colors } from "./colors";
import { drawText } from "./common";
import { WidgetE, WidgetEParameterObject } from "./WidgetE";

/**
 * ボタン内部のラベル左右のパディング。
 */
const buttonPadding = 4;

/**
 * ButtonE コンストラクタパラメータオブジェクト。
 */
export interface ButtonEParameterObject extends WidgetEParameterObject {
	height: number;
	font: g.Font;
}

/**
 * Button E。
 */
export class ButtonE extends WidgetE {
	isClicked: boolean;

	private pressed: boolean;
	private font: g.Font;

	constructor(param: ButtonEParameterObject) {
		param.desiredWidth = param.desiredWidth ?? param.font.measureText(param.title).width + buttonPadding * 2;
		param.desiredHeight = param.desiredHeight ?? param.height;
		param.minWidth = param.minWidth ?? param.font.size;
		param.minHeight = param.minHeight ?? param.desiredHeight;

		super(param);

		this.isClicked = false;
		this.pressed = false;
		this.font = param.font;

		this.onPointDown.add(this.handlePointDown, this);
		this.onPointUp.add(this.handlePointUp, this);
	}

	postRun(): void {
		this.isClicked = false;
		super.postRun();
	}

	renderSelf(renderer: g.Renderer, _camera?: g.Camera): true {
		const frameColor = colors.buttonFrame;
		const buttonColor = this.pressed ? colors.buttonHighlight : colors.button;

		renderer.fillRect(0, 0, this.width, this.height, buttonColor);

		this.drawLabel(renderer);

		this.drawFrame(renderer, frameColor);

		return true;
	}

	private handlePointDown(_ev: g.PointDownEvent): void {
		this.pressed = true;
		this.modified();
	}

	private handlePointUp(_ev: g.PointUpEvent): void {
		this.pressed = false;
		this.isClicked = true;
		this.modified();
	}

	private drawLabel(renderer: g.Renderer): void {
		const textWidth = this.font.measureText(this.title).width;

		const limitedTextWidth = Math.min(textWidth, this.width - buttonPadding * 2);
		// "y" のようなベースラインの下に伸びる文字を考慮してやや大きくする。
		const textHeight = this.font.size * 1.2;
		const dx = Math.round((this.width - limitedTextWidth) / 2);
		const dy = Math.round((this.height - textHeight) / 2);

		drawText(renderer, this.font, this.title, dx, dy, limitedTextWidth);
	}
}
