import type { AABB} from "@akashic-extension/collision-js";
import { Vec2 } from "@akashic-extension/collision-js";
import { type WindowE, type Gui } from "..";
import type { Memory } from "../Memory";
import type { Placer } from "../Placer";

/**
 * WidgetE コンストラクタパラメータオブジェクト。
 */
export interface WidgetEParameterObject extends g.EParameterObject {
	/**
	 * タイトル。
	 */
	title: string;

	/**
	 * グローバルウィジェットID。
	 */
	gwid: string;

	/**
	 * ウィジェットの状態を保持するためのメモリ。
	 */
	memory: Memory;

	/**
	 * 望ましいウィジェットの幅。
	 */
	desiredWidth?: number;

	/**
	 * 望ましいウィジェットの高さ。
	 */
	desiredHeight?: number;

	/**
	 * ウィジェットの最小の幅。
	 */
	minWidth?: number;

	/**
	 * ウィジェットの最小の高さ。
	 */
	minHeight?: number;
}

/**
 * Widget E。
 *
 * ウィジェット(ボタンやラベルといったGUI要素)の基底クラス。
 */
export class WidgetE extends g.E {
	/**
	 * null でない時、WidgetEおよびその派生クラスの生成時のローカルフラグをこの値で上書きする。
	 */
	static local: boolean | null = null;

	/**
	 * タイトル。
	 *
	 * タイトルはボタンのラベルやウインドウのタイトルなどに用いられるとともに、
	 * ウィジェットのID(WID)としても利用される。
	 */
	title: string;

	/**
	 * グローバルウィジェットID。
	 *
	 * グローバルウィジェットIDは Gui インスタンス内で一意の識別子である。
	 */
	gwid: string;

	/**
	 * このウィジェットの親ウィンドウ。
	 */
	parentWindow: WindowE | null;

	protected desiredWidth?: number;
	protected desiredHeight?: number;
	protected minWidth?: number;
	protected minHeight?: number;

	private memory: Memory;

	constructor(param: WidgetEParameterObject) {
		param = {
			...param,
			touchable: true,
			local: WidgetE.local != null ? WidgetE.local : param.local
		};

		super(param);

		this.title = param.title;
		this.gwid = param.gwid;
		this.memory = param.memory;
		this.desiredWidth = param.desiredWidth;
		this.desiredHeight = param.desiredHeight;
		this.minWidth = param.minWidth;
		this.minHeight = param.minHeight;
		this.parentWindow = null;

		this.onPointDown.add(() => this.focusWindow());
	}

	/**
	 * 後処理。
	 *
	 * Gui#run() 実行後に呼び出される。
	 */
	postRun(): void {
		// nop.
	}

	/**
	 * 自身を Gui に配置する。
	 *
	 * 処理の実体は placeSelf() で実装する。
	 *
	 * @param ui 配置先の Gui 。
	 * @param addContents 自身に子ウィジェットを配置する処理。WidgetE はこれを利用しない。
	 */
	place(ui: Gui, addContents?: (ui: Gui) => void): void {
		this.placeSelf(ui.currentPlacer!, addContents);
		ui.attach(this);
	}

	drawFrame(renderer: g.Renderer, cssColor: string, width?: number, height?: number): void {
		width = width ?? this.width;
		height = height ?? this.height;

		renderer.fillRect(0, 0, width - 1, 1, cssColor);
		renderer.fillRect(width - 1, 0, 1, height - 1, cssColor);
		renderer.fillRect(1, height - 1, width - 1, 1, cssColor);
		renderer.fillRect(0, 1, 1, height - 1, cssColor);
	}

	/**
	 * 親ウインドウを最前面に移動する。
	 */
	private focusWindow(): void {
		this.parentWindow?.moveFront();
	}

	protected placeSelf(placer: Placer, _addContents?: (ui: Gui) => void): void {
		const desiredSize = {
			x: this.desiredWidth ?? this.width,
			y: this.desiredHeight ?? this.height
		};
		const size = placer.requireSize(desiredSize);

		size.x = this.minWidth ? Math.max(this.minWidth, size.x) : size.x;
		size.y = this.minHeight ? Math.max(this.minHeight, size.y) : size.y;

		// 位置を変更する。
		if (!Vec2.equal(this, placer.cursorPosition)) {
			Vec2.copy(this, placer.cursorPosition);
			this.modified();
		}

		// 大きさを変更する。
		if (this.width !== size.x || this.height !== size.y) {
			this.width = size.x;
			this.height = size.y;
			this.modified();
		}

		const bounds = {
			min: { ...placer.cursorPosition },
			max: new Vec2(placer.cursorPosition).add(size)
		};

		placer.advance(bounds);
	}

	/**
	 * このウィジェットインスタンスのフレームを跨ぐ情報の設定。
	 *
	 * @param memory メモリ。
	 */
	protected setMemory(memory: unknown): void {
		this.memory.data[this.gwid] = memory;
	}

	/**
	 * このウィジェットインスタンスのフレームを跨ぐ情報の取得。
	 *
	 * @param memory メモリ。
	 */
	protected getMemory(): unknown {
		return this.memory.data[this.gwid];
	}

	// TODO: 再実装
	protected drawLayout(_renderer: g.Renderer): void {
		// this.drawAABB(renderer, this.layout.contentArea, "lime");
		// this.drawAABB(renderer, this.layout.bounds, "yellow");
	}

	protected drawAABB(renderer: g.Renderer, aabb: AABB, cssColor: string): void {
		const min = aabb.min;
		const max = aabb.max;
		const width = Math.max(1, max.x - min.x);
		const height = Math.max(1, max.y - min.y);

		renderer.fillRect(
			min.x, min.y,
			width, 1,
			cssColor
		);

		renderer.fillRect(
			max.x - 1, min.y,
			1, height,
			cssColor
		);

		renderer.fillRect(
			min.x, min.y,
			1, height,
			cssColor
		);

		renderer.fillRect(
			min.x, max.y - 1,
			width, 1,
			cssColor
		);
	}
}
