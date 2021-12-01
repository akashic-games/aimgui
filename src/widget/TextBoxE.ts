import { AABB, Vec2, Vec2Like } from "@akashic-extension/collision-js";
import { Gui } from "..";
// import { Placer } from "../Placer";
import { colors } from "./colors";
import { ScrollArea, ScrollBar } from "./ScrollBar";
import { sizes } from "./sizes";
import { WidgetE, WidgetEParameterObject } from "./WidgetE";

/**
 * テキストボックスメモリ。
 */
export interface TextBoxMemory {
	scroll: number;
}

/**
 * 文字列描画。
 *
 * 与えられた文字列、フォント、描画領域などに従って文字列を描画する。
 * この関数は各文字の描画位置を求める、実際の描画をユーザ関数に移譲する。
 *
 * @param text テキスト。
 * @param font フォント。
 * @param lineHeight 行の高さ。
 * @param cursor 初期カーソル位置。
 * @param rightBorder 右境界座標。これをまたぐ文字は次の行へ送られる。
 * @param bottomBorder 下境界座標。カーソルのY座標がこれ以上になる時、描画は打ち切られる。
 * @param callback 描画を行う関数。省略時、何も行わない。
 * @returns 文字列描画後のカーソル位置。
 */
function typeWrite(
	text: string,
	font: g.Font,
	lineHeight: number,
	cursor: Vec2Like,
	rightBorder: number | null,
	bottomBorder: number | null,
	callback?: (curPos: Vec2Like, glyph: g.Glyph) => void
): Vec2Like {
	const newline = 10;

	let x = cursor.x;
	let y = cursor.y;

	for (let i = 0; i < text.length; ++i) {
		if (bottomBorder != null && y >= bottomBorder) {
			break;
		}

		const code = g.Util.charCodeAt(text, i);
		if (!code) {
			continue;
		}

		if (code === newline) {
			y += lineHeight;
			x = cursor.x;
			continue;
		}

		const glyph = font.glyphForCharacter(code);
		if (!glyph) {
			continue;
		}

		// 描画位置が右端に達していれば折り返す。
		if (rightBorder != null && x >= rightBorder) {
			y += lineHeight;
			x = cursor.x;
		}

		// 文字が右からはみ出すなら折り返す。
		if (rightBorder != null && x + glyph.offsetX + glyph.width >= rightBorder) {
			y += lineHeight;
			x = cursor.x;
		}

		if (callback) {
			callback({ x, y }, glyph as g.Glyph);
		}

		// 次の描画位置へ進む。
		x += glyph.advanceWidth;
	}

	return { x, y };
}

/**
 * テキストの高さを求める。
 *
 * @param text テキスト。
 * @param width 表示幅。テキストはこの幅に従って右端で折り返される。
 * @param font フォント。
 * @returns 高さ。
 */
function getTextLinesHeight(text: string, width: number, font: g.Font): number {
	const cursorPos = typeWrite(
		text,
		font,
		font.size,
		{ x: 0, y: 0 },
		width,
		null
	);
	return cursorPos.y + font.size;
}

/**
 * 文字列を領域内に描画する。
 *
 * @param renderer レンダラー。
 * @param text テキスト。
 * @param position 描画位置。
 * @param bounds 描画領域。この領域内に描画する。
 * @param font フォント。
 */
function drawTextClipped(
	renderer: g.Renderer,
	text: string,
	position: Vec2Like,
	bounds: AABB,
	font: g.Font
): void {
	typeWrite(
		text,
		font,
		font.size,
		position,
		bounds.max.x,
		bounds.max.y,
		(pos, glyph) => {
			if (!glyph.surface) {
				return;
			}

			const minX = pos.x + glyph.offsetX;
			if (minX >= bounds.max.x) {
				return;
			}

			const maxX = minX + glyph.width;
			if (maxX <= bounds.min.x) {
				return;
			}

			const minY = pos.y + glyph.offsetY;
			if (minY >= bounds.max.y) {
				return;
			}

			const maxY = minY + glyph.height;
			if (maxY <= bounds.min.y) {
				return;
			}

			const boundsMinX = Math.max(minX, bounds.min.x);
			const boundsMinY = Math.max(minY, bounds.min.y);
			const boundsMaxX = Math.min(maxX, bounds.max.x);
			const boundsMaxY = Math.min(maxY, bounds.max.y);

			const dx1 = boundsMinX - minX;
			const dy1 = boundsMinY - minY;
			const dx2 = boundsMaxX - maxX;
			const dy2 = boundsMaxY - maxY;

			renderer.drawImage(
				glyph.surface,
				glyph.x + dx1, glyph.y + dy1,
				glyph.width - dx1 + dx2, glyph.height - dy1 + dy2,
				minX, minY
			);
		}
	);
}

/**
 * TextBoxE コンストラクタパラメータオブジェクト。
 */
export interface TextBoxEParameterObject extends WidgetEParameterObject {
	text: string;
	font: g.Font;
}

/**
 * TextBox E。
 *
 * テキストを複数行にわたって表示するE。
 *
 * 子に widget を持つことはできない。子 widget を与えた時の動作は未定義。
 */
export class TextBoxE extends WidgetE {
	text: string;

	get contentArea(): AABB {
		return {
			min: { x: 0, y: 0 },
			max: { x: this.width - sizes.scrollBarW, y: this.height }
		};
	}

	private font: g.Font;

	private padding: number;

	private textBounds: AABB;
	private textCursorPosition: Vec2;
	private prevText: string;

	private scrollBar: ScrollBar;
	private tracking: "none" | "thumb";

	constructor(param: TextBoxEParameterObject) {
		super(param);

		this.text = param.text;

		this.font = param.font;
		this.textCursorPosition = new Vec2();
		this.padding = 4;
		this.tracking = "none";
		this.prevText = this.text;

		this.textBounds = {
			min: { x: 0, y: 0 },
			max: { x: 0, y: 0 }
		};

		const memory = this.getMemory();
		this.scrollBar = new ScrollBar();
		this.scrollBar.scroll = memory.scroll;

		this.onPointDown.add(this.handlePointDown, this);
		this.onPointMove.add(this.handlePointMove, this);
		this.onPointUp.add(this.handlePointUp, this);
	}

	place(ui: Gui): void {
		this.prepare(ui);
		super.place(ui);
	}

	postRun(): void {
		this.scrollBar.scrollBy(this.getScrollArea(), 0);
		this.getMemory().scroll = this.scrollBar.scroll;
		super.postRun();
	}

	renderSelf(renderer: g.Renderer, _camera?: g.Camera): boolean {
		const contentArea = this.contentArea;

		// 背景。
		renderer.fillRect(
			contentArea.min.x,
			contentArea.min.y,
			contentArea.max.x - contentArea.min.x,
			contentArea.max.y - contentArea.min.x,
			colors.textBoxBg
		);

		drawTextClipped(
			renderer,
			this.text,
			this.textCursorPosition,
			{
				min: {
					x: contentArea.min.x + this.padding,
					y: contentArea.min.y + this.padding
				},
				max: {
					x: contentArea.max.x - this.padding,
					y: contentArea.max.y - this.padding
				},
			},
			this.font
		);

		if (this.scrollBar.inspectArea(this.getScrollArea()) ||
			this.tracking === "thumb"
		) {
			this.scrollBar.draw(renderer, this.getScrollArea());
		}

		// DEBUG: レイアウトに関する領域を描画する。
		// this.drawLayout(renderer);

		return false;
	}

	shouldFindChildrenByPoint(point: g.CommonOffset): boolean {
		const insideWindow =
			0 < point.x && point.x < this.width &&
			0 < point.y && point.y < this.height;
		const insideResizeThumb =
			this.width - 16 < point.x && point.x < this.width &&
			this.height - 16 < point.y && point.y < this.height;
		const insideScrollBar = this.scrollBar.intersectBar(this.getScrollArea(), point);

		return insideWindow && !insideResizeThumb && !insideScrollBar;
	}

	scrollToBottom(): void {
		this.scrollBar.scrollToBottom(this.getScrollArea());
	}

	private prepare(ui: Gui): void {
		// 期待するサイズの設定。
		const parentPlacer = ui.currentPlacer!;
		this.desiredWidth = parentPlacer.availableWidth();
		this.desiredHeight = this.height;

		// テキスト描画開始位置の初期化。
		this.textCursorPosition.copy({
			x: this.padding,
			y: this.padding - this.scrollBar.scroll
		});

		const contentArea = this.contentArea;
		const contentAreaWidth = contentArea.max.x - contentArea.min.x;
		const maxTextLineWidth = contentAreaWidth - this.padding * 2;

		// テキスト全体の高さ[px] の算出。
		const textLinesHeight = getTextLinesHeight(
			this.text,
			maxTextLineWidth,
			this.font
		);

		// テキスト領域の算出。
		const textBoundsMin = this.textCursorPosition.clone();
		const textBoundsMax = textBoundsMin.clone().add({ x: maxTextLineWidth, y: textLinesHeight });

		if (this.prevText !== this.text ||
			!Vec2.equal(this.textBounds.min, textBoundsMin) ||
			!Vec2.equal(this.textBounds.max, textBoundsMax)
		) {
			Vec2.copy(this.textBounds.min, textBoundsMin);
			Vec2.copy(this.textBounds.max, textBoundsMax);
			this.prevText = this.text;
			this.modified();
		}
	}

	protected getMemory(): TextBoxMemory {
		const memory = super.getMemory() || { scroll: 0 };
		super.setMemory(memory);
		return memory as TextBoxMemory;
	}

	protected drawLayout(renderer: g.Renderer): void {
		super.drawLayout(renderer);
		this.drawAABB(renderer, this.textBounds, "red");
	}

	private getScrollArea(): ScrollArea {
		return {
			visibleArea: this.contentArea,
			// textBounds は contentArea よりやや小さくなるように
			// 計算される。その分拡張することでスクロール範囲が正しくなる。
			contentBounds: {
				min: {
					x: this.textBounds.min.x - this.padding,
					y: this.textBounds.min.y - this.padding
				},
				max: {
					x: this.textBounds.max.x + this.padding,
					y: this.textBounds.max.y + this.padding
				}
			}
		};
	}

	private handlePointDown(ev: g.PointDownEvent): void {
		if (this.scrollBar.intersectThumb(this.getScrollArea(), ev.point)) {
			this.tracking = "thumb";
		} else {
			this.tracking = "none";
		}
	}

	private handlePointMove(ev: g.PointMoveEvent): void {
		if (this.tracking === "thumb") {
			this.handleThumbMove(ev);
		}
	}

	private handlePointUp(_ev: g.PointUpEvent): void {
		this.tracking = "none";
	}

	private handleThumbMove(ev: g.PointMoveEvent): void {
		this.scrollBar.scrollBy(this.getScrollArea(), ev.prevDelta.y);

		this.modified();
	}
}
