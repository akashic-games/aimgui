import { Gui } from "..";
import { Placer } from "../Placer";
import { WidgetE, WidgetEParameterObject } from "./WidgetE";

/**
 * HorizonE コンストラクタパラメータオブジェクト。
 */
export interface HorizonEParameterObject extends WidgetEParameterObject { }

/**
 * Horizon E。
 *
 * 子ウィジェットを水平に配置するウィジェット。
 */
export class HorizonE extends WidgetE {
	constructor(param: HorizonEParameterObject) {
		super(param);
	}

	place(ui: Gui, addContents: (ui: Gui) => void): void {
		const parentPlacer = ui.currentPlacer!;

		const desiredSize = {
			x: parentPlacer.availableWidth(),
			y: this.height
		};
		const size = parentPlacer.requireSize(desiredSize);

		this.moveTo(
			parentPlacer.cursorPosition.x,
			parentPlacer.cursorPosition.y
		);
		this.resizeTo(
			size.x,
			size.y
		);

		ui.attach(this);

		const bounds = {
			min: {
				x: this.x,
				y: this.y
			},
			max: {
				x: this.x + this.width,
				y: this.y + this.height
			}
		};

		const placer = new Placer(
			{ x: 0, y: 0, },
			{
				min: { x: 0, y: 0 },
				max: {
					x: this.width,
					y: this.height
				}
			},
			"horizontal"
		);

		ui.pushWidget(this);
		ui.pushPlacer(placer);
		ui.pushWid(this.title);

		addContents(ui);

		ui.popWid();
		ui.popPlacer();
		ui.popWidget();

		parentPlacer.advance(bounds);
	}

	renderSelf(_renderer: g.Renderer, _camera?: g.Camera): boolean {
		// DEBUG: レイアウトに関する領域を描画する。
		// this.drawLayout(renderer);
		return true;
	}
}
