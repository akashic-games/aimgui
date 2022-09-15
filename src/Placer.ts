import type { AABB, Vec2Like } from "@akashic-extension/collision-js";
import { enlargeAABB, Vec2 } from "@akashic-extension/collision-js";
import { sizes } from "./widget/sizes";

export type CursorDirection = "horizontal" | "vertical";
/**
 * ウィジェットを配置する場所の選択と確保役。
 *
 *  cursorPosition や contentArea などの座標系は WidgetE のローカル座標系である。
 */
export class Placer {
	/**
	 * ウィジェットを配置する位置。
	 */
	cursorPosition: Vec2;

	/**
	 * カーソル移動方向。
	 */
	cursorDirection: CursorDirection;

	/**
	 * 子ウィジェット全体の領域。
	 */
	bounds: AABB;

	/**
	 * 子ウィジェットを配置される領域。
	 */
	outerBounds: AABB;

	constructor(cursorPosition: Vec2Like, outerBounds: AABB, cursorDirection: CursorDirection = "vertical") {
		this.cursorPosition = new Vec2(cursorPosition);
		this.cursorDirection = cursorDirection;
		this.bounds = {
			min: { ...cursorPosition },
			max: { ...cursorPosition }
		};
		this.outerBounds = {
			min: { ...outerBounds.min },
			max: { ...outerBounds.max }
		};
	}

	/**
	 * 現在のカーソル位置からウィジェットが確保可能な領域の横幅。
	 *
	 * @returns 横幅[px]。
	 */
	availableWidth(): number {
		return this.outerBounds.max.x - this.cursorPosition.x;
	}

	/**
	 * 現在のカーソル位置にウィジェットを配置するにあたり要求する領域の大きさ。
	 *
	 * @param desiredSize 要求サイズ。
	 * @returns 利用可能とされたサイズ。
	 */
	requireSize(desiredSize: Vec2Like): Vec2Like {
		return {
			x: Math.min(this.availableWidth(), desiredSize.x),
			y: desiredSize.y
		};
	}

	/**
	 * 領域を確保し、カーソルを前進する。
	 *
	 * @param aabb 確保する領域。
	 */
	advance(aabb: AABB): void {
		enlargeAABB(this.bounds, aabb.min);
		enlargeAABB(this.bounds, aabb.max);

		if (this.cursorDirection === "vertical") {
			this.cursorPosition.y = this.bounds.max.y + sizes.margin;
		} else {
			this.cursorPosition.x = this.bounds.max.x + sizes.margin;
		}
	}
}
