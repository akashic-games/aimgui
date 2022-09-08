import type { AABB, Vec2Like } from "@akashic-extension/collision-js";
import { aabbToVec, Vec2 } from "@akashic-extension/collision-js";
import { colors } from "./colors";
import { drawText, limitText } from "./common";
import type { ScrollArea} from "./ScrollBar";
import { ScrollBar } from "./ScrollBar";
import { sizes } from "./sizes";
import type { WidgetEParameterObject } from "./WidgetE";
import { WidgetE } from "./WidgetE";

const minWindowWidth = 64;
const maxWindowHeight = 64;

/**
 * ウインドウスタイル。
 */
export interface WindowStyle {
	position?: Vec2Like;
	size?: Vec2Like;
	titleBar?: boolean;
	resizable?: boolean;
	scrollable?: boolean;
}

/**
 * WindowE コンストラクタパラメータオブジェクト。
 */
export interface WindowEParameterObject extends WidgetEParameterObject {
	font: g.Font;
	margin?: number;
	showTitleBar?: boolean;
	resizable?: boolean;
	scrollable?: boolean;
}

/**
 * Window E。
 */
export class WindowE extends WidgetE {
	resizable: boolean;
	scrollable: boolean;

	/**
	 * ウインドウ描画順位。
	 *
	 * 0から始まり、画面奥に配置されるほど大きくなる整数。
	 *
	 * 読み取り専用。値はウインドウマネージャによって設定される。
	 */
	zOrder: number;

	get cursorPosition(): Vec2Like {
		return {
			x: this.margin,
			y: this.titleBarHeight + this.margin - this.scrollBar.scroll
		};
	}

	get contentArea(): AABB {
		return {
			min: { x: this.margin, y: this.titleBarHeight + this.margin },
			max: {
				x: this.width - (this.scrollable ? sizes.scrollBarW : this.margin),
				y: this.height - this.margin
			}
		};
	}

	/**
	 * 子ウィジェット全体の領域。
	 */
	bounds: AABB;

	private font: g.Font;
	private cache: g.Surface | null;
	private margin: number;
	private tracking: "none" | "moving" | "resizing" | "thumb";
	private startWidth: number;
	private startHeight: number;
	private scrollBar: ScrollBar;

	/**
	 * タイトルバーの高さ。サーフェスの大きさに関係するため、整数でなければならない。
	 */
	private titleBarHeight: number;

	constructor(param: WindowEParameterObject) {
		const style = (param.memory.data[param.gwid] || {}) as WindowStyle;

		param.x = style.position?.x ?? param.x;
		param.y = style.position?.y ?? param.y;
		param.width = style.size?.x ?? param.width ?? 320;
		param.height = style.size?.y ?? param.height ?? 240;
		param.showTitleBar = style.titleBar ?? param.showTitleBar;
		param.resizable = style.resizable ?? param.resizable;
		param.scrollable = style.scrollable ?? param.scrollable;

		super(param);

		this.font = param.font;
		this.resizable = param.resizable ?? true;
		this.scrollable = param.scrollable ?? true;
		this.margin = param.margin ?? 4;
		this.titleBarHeight = (param.showTitleBar ?? true) ? Math.round(this.font.size * 1.25) : 0;
		this.tracking = "none";
		this.zOrder = 0;
		this.cache = null;
		this.startWidth = 0;
		this.startHeight = 0;
		this.scrollBar = new ScrollBar({ avoidsResizeThumb: true });

		this.bounds = {
			min: { x: 0, y: 0 },
			max: { x: 0, y: 0 }
		};

		this.onPointDown.add(this.handlePointDown, this);
		this.onPointMove.add(this.handlePointMove, this);
		this.onPointUp.add(this.handlePointUp, this);
	}

	postRun(): void {
		this.scrollBar.scrollBy(this.getScrollArea(), 0);
		this.getStyle(this.getMemory());
		super.postRun();
	}

	renderSelf(renderer: g.Renderer, _camera?: g.Camera): boolean {
		// タイトル。
		if (this.titleBarHeight > 0) {
			this.drawTitleBar(renderer);
		}

		// ウィンドウ背景。
		renderer.fillRect(
			0, this.titleBarHeight,
			this.width, this.height - this.titleBarHeight,
			colors.windowBg
		);

		// ウィンドウ内の子要素をオフスクリーンに描画。
		this.renderChildren();

		// オフスクリーンをオンスクリーンへ描画。
		this.renderCache(renderer);

		if (this.scrollable) {
			if (this.scrollBar.inspectArea(this.getScrollArea()) || this.tracking === "thumb") {
				this.scrollBar.draw(renderer, this.getScrollArea());
			}
		}

		if (this.resizable) {
			this.drawResizeThumb(renderer);
		}

		// ウィンドウ枠。
		this.drawFrame(renderer, colors.windowFrame);

		// DEBUG: レイアウトに関する領域を描画する。
		// this.drawLayout(renderer);

		// 子要素はオフスクリーンに描画したので、描画をここで止める。
		return false;
	}

	shouldFindChildrenByPoint(point: g.CommonOffset): boolean {
		// 最前面にないウインドウの子要素のタッチを扱わない。
		// これによってウインドウ自体にタッチイベントが伝播し、
		// 背面のウインドウが全面に移動するようになる。
		if (this.zOrder !== 0) {
			return false;
		}

		const insideWindow =
			0 < point.x && point.x < this.width &&
			this.titleBarHeight < point.y && point.y < this.height;
		const insideResizeThumb =
			this.width - 16 < point.x && point.x < this.width &&
			this.height - 16 < point.y && point.y < this.height;
		const insideScrollBar = this.scrollBar.intersectBar(this.getScrollArea(), point);

		return insideWindow && !insideResizeThumb && !insideScrollBar;
	}

	protected getMemory(): WindowStyle {
		const memory = super.getMemory() || {};
		super.setMemory(memory);
		return memory as WindowStyle;
	}

	/**
	 * 現在のウインドウのスタイルを取得する。
	 *
	 * @param style 現在のスタイルを反映されるオブジェクト。
	 * @returns スタイル。 引数 style と同一のオブジェクト。
	 */
	private getStyle(style: WindowStyle): WindowStyle {
		style.position = style.position ?? { x: 0, y: 0 };
		Vec2.copy(style.position, this);
		style.resizable = this.resizable;
		style.titleBar = this.titleBarHeight !== 0;
		style.size = style.size ?? { x: 0, y: 0 };
		style.size.x = this.width;
		style.size.y = this.height;
		return style;
	}

	private getScrollArea(): ScrollArea {
		return {
			visibleArea: this.contentArea,
			contentBounds: this.bounds
		};
	}

	private drawTitleBar(renderer: g.Renderer): void {
		// バー。
		renderer.fillRect(0, 0, this.width, this.titleBarHeight, colors.windowTitleBarBg);

		// タイトル。

		drawText(
			renderer,
			this.font,
			limitText(
				this.font,
				this.title,
				this.width - this.margin * 2,
				""
			),
			this.margin,
			0
		);
	}

	private drawResizeThumb(renderer: g.Renderer): void {
		const aabb = this.getResizeAABB();

		const w = 3;
		const h = 3;

		let y = aabb.min.y + 1;
		for (let j = 0; j < 3; j++) {
			let x = aabb.min.x + 1;
			for (let i = 0; i < 3; i++) {
				renderer.fillRect(
					x, y,
					w, h,
					colors.windowResizeThumb
				);
				x += w + 1;
			}
			y += h + 1;
		}
	}

	private renderChildren(): void {
		// クリッピングのためにサーフェスに描画する。
		// ここではウインドウ全体のうち、子要素が配置される領域を vrew area と呼ぶ。
		const viewAreaWidth = this.width;
		const viewAreaHeight = this.height - this.titleBarHeight;
		if (!this.cache ||
			this.cache.width !== viewAreaWidth ||
			this.cache.height !== viewAreaHeight) {
			this.cache?.destroy();
			// widget 配置の目安となる領域は WindowE#contentArea だが、
			// そこからはみ出すことは許される。そのため、contentAreaではなく
			// window 自体の大きさに基づいてサーフェースの大きさを求める。
			this.cache = g.game.resourceFactory.createSurface(
				// 縦横幅は整数出なければならない。ウインドウリサイズで width,height を
				// 整数化しているが、念の為ここでもそうする。
				Math.round(viewAreaWidth),
				Math.round(viewAreaHeight)
			);
		}

		const renderer = this.cache.renderer();

		renderer.begin();

		renderer.clear();

		if (this.children) {
			renderer.save();
			// 子要素はウインドウ左上を原点とする座標系に配置されている。
			// これから描画するサーフェスはタイトルバーの下にある view area に相当する
			// ので、原点がずれないようにタイトルバーの高さだけ高さだけ平行移動する。
			renderer.translate(0, -this.titleBarHeight);
			const children = this.children;
			for (let i = 0; i < children.length; i++) {
				children[i].render(renderer);
			}
			renderer.restore();
		}

		renderer.end();
	}

	private renderCache(renderer: g.Renderer): void {
		if (this.cache) {
			renderer.drawImage(
				this.cache,
				0, 0,
				this.cache.width, this.cache.height,
				0, this.titleBarHeight
			);
		}
	}

	private getResizeAABB(): AABB {
		return {
			min: {
				x: this.width - sizes.resizeThumbW,
				y: this.height - sizes.resizeThumbH
			},
			max: {
				x: this.width,
				y: this.height
			}
		};
	}

	private handlePointDown(ev: g.PointDownEvent): void {
		if (ev.point.y < this.titleBarHeight) {
			this.tracking = "moving";
		} else {
			if (this.scrollBar.intersectThumb(this.getScrollArea(), ev.point)) {
				this.tracking = "thumb";
			} else if (this.resizable && aabbToVec(this.getResizeAABB(), ev.point)) {
				this.tracking = "resizing";
				this.startWidth = this.width;
				this.startHeight = this.height;
			} else {
				this.tracking = "none";
			}
		}
	}

	private handlePointMove(ev: g.PointMoveEvent): void {
		if (this.tracking === "moving") {
			this.handleWindowMove(ev);
		} else if (this.scrollable && this.tracking === "thumb") {
			this.handleThumbMove(ev);
		} else if (this.resizable && this.tracking === "resizing") {
			this.handleResize(ev);
		}
	}

	private handlePointUp(_ev: g.PointUpEvent): void {
		this.tracking = "none";
	}

	private handleWindowMove(ev: g.PointMoveEvent): void {
		Vec2.add(this, ev.prevDelta);

		this.modified();
	}

	private handleThumbMove(ev: g.PointMoveEvent): void {
		this.scrollBar.scrollBy(this.getScrollArea(), ev.prevDelta.y);
		this.modified();
	}

	private handleResize(ev: g.PointMoveEvent): void {
		// 自身の大きさを更新。
		// width, height は surface の生成に用いられる。そのため整数でなければならない。
		this.width = Math.round(Math.max(minWindowWidth, this.startWidth + ev.startDelta.x));
		this.height = Math.round(Math.max(maxWindowHeight, this.startHeight + ev.startDelta.y));

		this.scrollBar.scrollBy(this.getScrollArea(), 0);

		this.modified();
	}
}
