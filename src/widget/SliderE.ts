import { colors } from "./colors";
import { drawText, limitText } from "./common";
import type { WidgetEParameterObject } from "./WidgetE";
import { WidgetE } from "./WidgetE";

/**
 * スライダーとその隣のラベルの間の余白。
 */
const sliderMargin = 2;
const sliderWidth = 100;

/**
 * SliderE コンストラクタパラメータオブジェクト。
 */
export interface SliderEParameterObject extends WidgetEParameterObject {
	height: number;
	valueObject: Object;
	key: string;
	min: number;
	max: number;
	font: g.Font;
}

/**
 * Slider E。
 */
export class SliderE extends WidgetE {
	valueObject: Object;
	key: string;
	min: number;
	max: number;
	changed: boolean;

	get value(): number {
		const valueObject = this.valueObject as { [key: string]: number };
		return valueObject[this.key];
	}

	set value(v: number) {
		const valueObject = this.valueObject as { [key: string]: number };
		valueObject[this.key] = v;
		this.changed = true;
	}

	private font: g.Font;

	constructor(param: SliderEParameterObject) {
		const desiredWidth = param.width ?? sliderWidth + sliderMargin + param.font.measureText(param.title).width;
		const desiredHeight = param.height;

		param.width = desiredWidth;
		param.desiredWidth = desiredWidth;
		param.desiredHeight = desiredHeight;
		param.minWidth = desiredWidth;
		param.minHeight = desiredHeight;

		super(param);

		this.valueObject = param.valueObject;
		this.key = param.key;
		this.min = param.min;
		this.max = param.max;
		this.changed = false;
		this.font = param.font;

		this.onPointDown.add(this.handlePointDown, this);
		this.onPointMove.add(this.handlePointMove, this);
	}

	renderSelf(renderer: g.Renderer, _camera?: g.Camera): boolean {
		this.drawSliderBackAndTitle(renderer);
		this.drawNumber(renderer);
		this.drawSliderFrameAndCursor(renderer);

		// DEBUG: レイアウトに関する領域を描画する。
		// this.drawLayout(renderer);

		return true;
	}

	postRun(): void {
		this.changed = false;
		super.postRun();
	}

	private drawSliderBackAndTitle(renderer: g.Renderer): void {
		const textHeight = this.font.size * 1.2;
		const dx = sliderWidth + sliderMargin;
		const dy = Math.round((this.height - textHeight) / 2);

		renderer.fillRect(0, 0, sliderWidth, this.height, colors.sliderBg);

		drawText(renderer, this.font, this.title, dx, dy);
	}

	private drawNumber(renderer: g.Renderer): void {
		const valueText = limitText(this.font, `${this.value}`, sliderWidth - 8, "");
		const textWidth = this.font.measureText(valueText).width;
		const textHeight = this.font.size * 1.2;
		const dx = Math.round((sliderWidth - textWidth) / 2);
		const dy = Math.round((this.height - textHeight) / 2);

		renderer.save();

		renderer.setOpacity(0.75);

		drawText(renderer, this.font, valueText, dx, dy);

		renderer.restore();
	}

	private drawSliderFrameAndCursor(renderer: g.Renderer): void {
		const frameColor = colors.sliderFrame;
		const cursorWidth = 2;
		const t = (this.value - this.min) / (this.max - this.min);
		const x = 1 + Math.floor(((sliderWidth - 2) - cursorWidth) * t);

		renderer.fillRect(x, 0, cursorWidth, this.height, "white");
		this.drawFrame(renderer, frameColor, sliderWidth, this.height);
	}

	private handlePointDown(ev: g.PointDownEvent): void {
		if (ev.point.x > sliderWidth) {
			return;
		}

		const t = ev.point.x / sliderWidth;
		this.value = this.min + (this.max - this.min) * t;
		this.modified();
	}

	private handlePointMove(ev: g.PointMoveEvent): void {
		if (ev.point.x > sliderWidth) {
			return;
		}

		const t = (ev.point.x + ev.startDelta.x) / sliderWidth;
		const v = this.min + (this.max - this.min) * t;
		this.value = Math.min(this.max, Math.max(this.min, v));
		this.modified();
	}
}
