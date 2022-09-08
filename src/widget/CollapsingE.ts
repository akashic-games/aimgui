import { enlargeAABB, Vec2 } from "@akashic-extension/collision-js";
import type { Gui } from "..";
import { Placer } from "../Placer";
import { drawText } from "./common";
import type { WidgetEParameterObject } from "./WidgetE";
import { WidgetE } from "./WidgetE";

/**
 * 折りたたみの下に配置されるウィジェットのインデント[px]。
 */
const collpasingIndent = 4;

/**
 * スタイル。
 */
interface CollapsingStyle {
	isOpen: boolean;
}

/**
 * CollapsingE コンストラクタパラメータオブジェクト。
 */
export interface CollapsingEParameterObject extends WidgetEParameterObject {
	height: number;
	font: g.Font;
}

/**
 * Collapsing E。
 *
 * 子ウィジェットを折り畳んで表示・非表示を行うウィジェット。
 */
export class CollapsingE extends WidgetE {
	isOpen: boolean;

	private font: g.Font;

	constructor(param: CollapsingEParameterObject) {
		super(param);

		const style = this.getMemory();

		this.font = param.font;
		this.isOpen = style.isOpen;

		this.onPointDown.add(this.handlePointDown, this);
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
			{
				x: collpasingIndent,
				y: this.height
			},
			{
				min: { x: 0, y: 0 },
				max: {
					x: this.width,
					y: this.height
				}
			}
		);

		ui.pushWidget(this);
		ui.pushPlacer(placer);
		ui.pushWid(this.title);

		if (this.isOpen) {
			addContents(ui);
		}

		ui.popWid();
		ui.popPlacer();
		ui.popWidget();

		enlargeAABB(bounds, new Vec2(placer.bounds.min).add(this));
		enlargeAABB(bounds, new Vec2(placer.bounds.max).add(this));

		parentPlacer.advance(bounds);
	}

	postRun(): void {
		this.getMemory().isOpen = this.isOpen;
		super.postRun();
	}

	renderSelf(renderer: g.Renderer, _camera?: g.Camera): boolean {
		drawText(renderer, this.font, `${this.isOpen ? "▼" : "▶︎"} ${this.title}`, 0, 0);

		// DEBUG: レイアウトに関する領域を描画する。
		// this.drawLayout(renderer);

		return this.isOpen;
	}

	protected getMemory(): CollapsingStyle {
		const memory = super.getMemory() || { isOpen: true };
		super.setMemory(memory);
		return memory as CollapsingStyle;
	}

	private handlePointDown(_ev: g.PointDownEvent): void {
		this.isOpen = !this.isOpen;
		this.modified();
	}
}
