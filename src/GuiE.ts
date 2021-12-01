import { Gui } from "./Gui";
import { Memory } from "./Memory";

/**
 * GuiE パラメータオブジェクト。
 */
export interface GuiEParameterObject extends g.EParameterObject {
	/**
	 * GuiE に配置されるウィジェットで利用されるフォント。
	 */
	font: g.Font;

	/**
	 * ウィジェットの状態を保持するメモリ。
	 *
	 * 省略時、空のメモリが生成される。
	 */
	memory?: Memory;
}

/**
 * GUI E。
 *
 * GUIを描画する E 。
 *
 * 画面の原点（左上隅）に配置する。
 */
export class GuiE extends g.E {
	/**
	 * ウィジェットを配置するユーザ関数。
	 */
	run: ((gui: Gui) => void) | null;

	/**
	 * この GuiE に配置されるウィジェットで利用されるフォント。
	 *
	 * 読み取り専用。
	 */
	font: g.Font;

	private gui: Gui;

	/**
	 * コンストラクタ。
	 *
	 * @param param GuiEコンストラクタパラメータオブジェクト。
	 */
	constructor(param: GuiEParameterObject) {
		super(param);

		this.run = null;
		this.font = param.font;
		this.gui = new Gui(this.scene, this, this.font, param.memory ?? { data: {} });

		this.onUpdate.add(this.handleUpdate, this);
	}

	private handleUpdate(): void {
		this.gui.preRun();

		if (this.run) {
			this.run(this.gui);
		}

		this.gui.postRun();
	}
}
