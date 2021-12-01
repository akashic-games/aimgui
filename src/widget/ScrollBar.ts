import { AABB, aabbToVec, clamp, Vec2Like } from "@akashic-extension/collision-js";
import { colors } from "./colors";
import { sizes } from "./sizes";

/**
 * スクロールバーシェイプ。
 *
 * スクロールバーの形状とスクロール量を操作する機能を提供する。
 */
export interface ScrollBarShape {
	min: number;
	max: number;
	bar: AABB;
	thumb: AABB;
	addScroll: (v: number) => number;
}

/**
 * スクロールされる領域。
 */
export interface ScrollArea {
	/**
	 * コンテンツの表示領域。
	 */
	visibleArea: AABB;

	/**
	 * コンテンツ全体の領域。
	 */
	contentBounds: AABB;
}

/**
 * スクロールバーコンストラクタパラメータオブジェクト。
 */
export interface ScrollBarParameterObject {
	avoidsResizeThumb?: boolean;
}

/**
 * スクロールバー。
 *
 * widget にスクロールバーのUIを提供するためのユーティティ。
 *
 * スクロールバーの形状（バーそのものやサムの大きさ、位置など）は widget のレイアウトから
 * 求められる。
 *
 * スクロールバー自体は widget ではない。
 *
 * 縦スクロールのみサポートする。
 */
export class ScrollBar {

	/**
	 * スクロール位置。
	 */
	scroll: number;

	/**
	 * 真の時、ウインドウなどのリサイズつまみを避ける。
	 */
	avoidsResizeThumb: boolean;

	constructor(param: ScrollBarParameterObject = {}) {
		this.scroll = 0;
		this.avoidsResizeThumb = !!param.avoidsResizeThumb;
	}

	/**
	 * スクロール位置を変更する。
	 *
	 * @param layout レイアウト。
	 * @param v スクロール量。
	 */
	scrollBy(scrollArea: ScrollArea, v: number): void {
		const shape = this.getShape(scrollArea);
		this.scroll = shape ? shape.addScroll(v) : 0;
	}

	scrollTo(scrollArea: ScrollArea, v: number): void {
		const shape = this.getShape(scrollArea);
		if (shape) {
			this.scroll = Math.min(shape.max, Math.max(shape.min, v));
		}
	}

	scrollToBottom(scrollArea: ScrollArea): void {
		const shape = this.getShape(scrollArea);
		if (shape) {
			this.scroll = shape.max;
		}
	}

	/**
	 * スクロール操作が必要なレイアウトか調べる。
	 *
	 * @param layout レイアウト。
	 * @returns スクロール操作が必要な時、真。
	 */
	inspectArea(scrollArea: ScrollArea): boolean {
		const bounds = scrollArea.contentBounds;
		const visibleArea = scrollArea.visibleArea;

		// コンテンツ表示領域内にコンテンツの境界が収まっているか。
		// 縦方向のみ判定。
		const inside =
			visibleArea.min.y <= bounds.min.y && bounds.max.y <= visibleArea.max.y;

		return !inside;
	}

	/**
	 * サム(スクロール操作のためのつまみ)と点との交差判定。
	 *
	 * @param layout スクロールバーの形状を求めるためのレイアウト。
	 * @param pos 点の座標。
	 * @returns 交差している時、真。
	 */
	intersectThumb(scrollArea: ScrollArea, pos: Vec2Like): boolean {
		const shape = this.getShape(scrollArea);
		return shape != null && aabbToVec(shape.thumb, pos);
	}

	/**
	 * スクロールバー(thumbを含む)と点との交差判定。
	 *
	 * @param layout スクロールバーの形状を求めるためのレイアウト。
	 * @param pos 点の座標。
	 * @returns 交差している時、真。
	 */
	intersectBar(scrollArea: ScrollArea, pos: Vec2Like): boolean {
		const shape = this.getShape(scrollArea);
		return shape != null && aabbToVec(shape.bar, pos);
	}

	/**
	 * スクロールバーの形状の取得。
	 *
	 * @param layout 形状を決めるためのレイアウト。
	 * @returns 形状。
	 */
	getShape(scrollArea: ScrollArea): ScrollBarShape | null {
		const contentArea = scrollArea.contentBounds;
		const visibleArea = scrollArea.visibleArea;

		const visibleAreaH = visibleArea.max.y - visibleArea.min.y;
		const contentAreaH = contentArea.max.y - contentArea.min.y;

		if (visibleAreaH >= contentAreaH) {
			return null;
		}

		const scrollY = this.scroll;
		const resizeThumbH = this.avoidsResizeThumb ? sizes.resizeThumbH : 0;

		const maxScrollY = contentAreaH - visibleAreaH;
		const vScrollBarW = sizes.scrollBarW;
		// TODO: 計算方法を見直す
		// visibleArea のウインドウ内での位置(と大きさは)が必ずしも
		// ウインドウいっぱいに配置されたものでないので、単純にその高さから引き算
		// してもリサイズつまみを避けられるとは限らない。
		const vScrollBarH = visibleArea.max.y - visibleArea.min.y - resizeThumbH;
		const vScrollBarX = visibleArea.max.x;
		const vScrollBarY = visibleArea.min.y;

		if (vScrollBarH <= 0) {
			return null;
		}

		const thumbW = vScrollBarW - (3 * 2);
		const thumbH = visibleAreaH / contentAreaH * vScrollBarH; // 見えている範囲に比例した高さ。

		const thumbX = vScrollBarX + 3;
		const thumbY = vScrollBarY + scrollY / maxScrollY * (vScrollBarH - thumbH);

		return {
			min: 0,
			max: maxScrollY,
			bar: {
				min: { x: vScrollBarX, y: vScrollBarY },
				max: { x: vScrollBarX + vScrollBarW, y: vScrollBarY + vScrollBarH }
			},
			thumb: {
				min: { x: thumbX, y: thumbY },
				max: { x: thumbX + thumbW, y: thumbY + thumbH }
			},
			addScroll: (dy: number) => clamp(dy / (vScrollBarH - thumbH) + (scrollY / maxScrollY), 0, 1) * maxScrollY
		};
	}

	/**
	 * スクロールバーの描画。
	 *
	 * @param renderer レンダラー。
	 * @param layout レイアウト。
	 */
	draw(renderer: g.Renderer, scrollArea: ScrollArea): void {
		const shape = this.getShape(scrollArea);

		if (!shape) {
			return;
		}

		renderer.save();

		const bar = shape.bar;

		renderer.setOpacity(0.75);
		renderer.fillRect(
			bar.min.x, bar.min.y,
			bar.max.x - bar.min.x, bar.max.y - bar.min.y,
			colors.scrollBarBg
		);

		renderer.restore();

		const thumb = shape.thumb;
		renderer.fillRect(
			thumb.min.x, thumb.min.y,
			thumb.max.x - thumb.min.x, thumb.max.y - thumb.min.y,
			colors.scrollBarThumb
		);
	}
}
