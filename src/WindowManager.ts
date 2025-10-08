import { WindowE } from "./widget";

/**
 * ウインドウマネージャ。
 *
 * GUIクラスにウインドウの前後関係を管理する機能を提供する。
 */
export class WindowManager {
	root: g.E;

	private newWindowEs: WindowE[];
	private windowEsToBeMovedFront: WindowE[];

	constructor(scene: g.Scene) {
		this.root = new g.E({ scene });
		this.newWindowEs = [];
		this.windowEsToBeMovedFront = [];
	}

	/**
	 * ウインドウの並べ替え。
	 */
	sortWindows(): void {
		// ウインドウの前後の並び替え。
		// 新規ウインドウと最前面に移動する指示のあったウインドウを append する。
		const frontWindows = this.newWindowEs.concat(this.windowEsToBeMovedFront);
		for (const w of frontWindows) {
			this.root.append(w);
		}

		if (this.root.children) {
			const windowEs = this.root.children.filter(child => child instanceof WindowE);
			for (let i = 0; i < windowEs.length; i++) {
				const windowE = windowEs[i];
				windowE.zOrder = (windowEs.length - 1) - i;
			}
		}

		this.newWindowEs = [];
		this.windowEsToBeMovedFront = [];
	}

	/**
	 * 新規ウインドウの追加。
	 *
	 * @param windowE ウインドウ。
	 */
	addNewWindow(windowE: WindowE): void {
		windowE.windowManager = this;
		this.newWindowEs.push(windowE);
	}

	/**
	 * ウインドウを最前面に移動する。
	 *
	 * @param windowE ウインドウ。
	 */
	moveFront(windowE: WindowE): void {
		windowE.windowManager = this;
		this.windowEsToBeMovedFront.push(windowE);
	}
}
