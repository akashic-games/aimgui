import type { AssignableKeys, Constructor, ValueObject } from "./generics";
import { gwidFromIdStack, gwidFromIdStackAndTitle } from "./gwid";
import type { Memory } from "./Memory";
import { useMemory, releaseMemoryHierarchy } from "./Memory";
import { Placer } from "./Placer";
import type { WindowStyle } from "./widget";
import {
	ButtonE, CheckboxE, CollapsingE, HorizonE, MarginE, RadioButtonE,
	SliderE, LabelE, TextBoxE, WidgetE,
	WindowE
} from "./widget";
import { WindowManager } from "./WindowManager";

/**
 * ウィジェットのフォントサイズからウィジェットの高さを求める。
 *
 * @param font ウィジェットの用いるフォント。
 * @returns ウィジェットの高さ。
 */
function widgetHeightByFont(font: g.Font): number {
	return Math.round(font.size * 1.5);
}

/**
 * 使用されなかったウィジェットの破棄。
 *
 * @param e ウィジェット。
 * @param alives 使用中ウィジェットリスト。
 */
function destroyDeadWidget(e: g.E, alives: g.E[]): void {
	if (alives.indexOf(e) === -1) {
		// 親の破棄ですでに破棄されているケースに備え、念の為確認する。
		if (!e.destroyed()) {
			e.destroy();
		}
		return;
	}
}

/**
 * g.E のツリー縦走し WidgetE インスタンスについて callback を実行する。
 *
 * @param e 縦走の起点となる E インスタンス。
 * @param callback コールバック関数。
 */
function traverse(e: g.E, callback: (w: WidgetE) => void): void {
	if (e instanceof WidgetE) {
		callback(e);
	}
	e.children?.forEach(c => traverse(c, callback));
}

/**
 * Eツリーから WidgetID と型（コンストラクタ）で widget を検索する。
 * @param e 検索対象のE。
 * @param gwid WidgetID。
 * @param ctor WidgetE のコンストラクタ
 * @returns ウィジェット。見つからなかった時 null 。
 */
function findWidgetByGwidAndType<T extends WidgetE>(e: g.E | null | undefined, gwid: string, ctor: Constructor<T>): T | null {
	if (!e) {
		return null;
	}

	if (e instanceof ctor && e.gwid === gwid) {
		return e as T;
	}

	if (e.children) {
		for (let i = 0; i < e.children.length; i++) {
			const c = e.children[i];
			const w = findWidgetByGwidAndType(c, gwid, ctor);
			if (w) {
				return w;
			}
		}
	}

	return null;
}

function button(ui: Gui, title: string): boolean {
	const gwid = ui.titleToGwid(title);
	const button =
		ui.findWidgetByGwidAndType(gwid, ButtonE) ||
		new ButtonE({
			scene: ui.scene,
			height: widgetHeightByFont(ui.font),
			title,
			font: ui.font,
			gwid,
			memory: ui.memory
		});

	button.place(ui);

	return button.isClicked;
}

function buttonUi(title: string): (ui: Gui) => boolean {
	return (ui: Gui) => button(ui, title);
}

function checkbox<T extends ValueObject>(ui: Gui, title: string, valueObject: T, key: AssignableKeys<T, boolean>): boolean {
	const gwid = ui.titleToGwid(title);
	const checkbox = ui.findWidgetByGwidAndType(gwid, CheckboxE) ||
		new CheckboxE({
			scene: ui.scene,
			height: widgetHeightByFont(ui.font),
			title,
			font: ui.font,
			valueObject,
			key: key as string,
			gwid,
			memory: ui.memory
		});

	// 対象が変更になることがあるので。
	checkbox.valueObject = valueObject;
	checkbox.key = key as string;

	checkbox.place(ui);

	return checkbox.pressed;
}

function checkboxUi<T extends ValueObject>(title: string, valueObject: T, key: AssignableKeys<T, boolean>): (ui: Gui) => boolean {
	return (ui: Gui) => checkbox<T>(ui, title, valueObject, key);
}

function radioButton<T extends ValueObject, K extends keyof T>(
	ui: Gui,
	title: string,
	valueObject: T,
	key: K,
	buttonValue: T[K]
): boolean {
	const gwid = ui.titleToGwid(title);
	const radioButton =
		ui.findWidgetByGwidAndType(gwid, RadioButtonE) ||
		new RadioButtonE({
			scene: ui.scene,
			height: widgetHeightByFont(ui.font),
			title,
			font: ui.font,
			valueObject: valueObject,
			key: key as string,
			buttonValue,
			gwid,
			memory: ui.memory
		});

	// 対象が変更になることがあるので。
	radioButton.valueObject = valueObject;
	radioButton.key = key as string;

	radioButton.place(ui);

	return radioButton.pressed;
}

function radioButtonUi<T extends ValueObject, K extends keyof T>(
	title: string, valueObject: T, key: K, buttonValue: T[K]
): (ui: Gui) => boolean {
	return (ui: Gui) => radioButton<T, K>(ui, title, valueObject, key, buttonValue);
}

function slider<T extends ValueObject>(
	ui: Gui, title: string, valueObject: T, key: AssignableKeys<T, number>, min: number, max: number
): boolean {
	const gwid = ui.titleToGwid(title);
	const slider =
		ui.findWidgetByGwidAndType(gwid, SliderE) ||
		new SliderE({
			scene: ui.scene,
			height: widgetHeightByFont(ui.font),
			title,
			valueObject,
			key: key as string,
			min,
			max,
			font: ui.font,
			gwid,
			memory: ui.memory
		});

	// 対象が変更になることがあるので。
	slider.valueObject = valueObject;
	slider.key = key as string;

	slider.place(ui);

	return slider.changed;
}

function sliderUi<T extends ValueObject>(
	title: string, valueObject: T, key: AssignableKeys<T, number>, min: number, max: number
): (ui: Gui) => boolean {
	return (ui: Gui) => slider<T>(ui, title, valueObject, key, min, max);
}

function label(ui: Gui, title: string): void {
	const gwid = ui.titleToGwid(title);
	const label =
		ui.findWidgetByGwidAndType(gwid, LabelE) ||
		new LabelE({
			scene: ui.scene,
			height: widgetHeightByFont(ui.font),
			font: ui.font,
			title,
			gwid,
			memory: ui.memory
		});

	label.title = title;

	label.place(ui);
}

function labelUi(_ui: Gui, title: string): (ui: Gui) => boolean {
	return (ui: Gui) => {
		label(ui, title);
		return false;
	};
}

function textBox(ui: Gui, title: string, height: number, text: string): void {
	const gwid = ui.titleToGwid(title);
	const textBox =
		ui.findWidgetByGwidAndType(gwid, TextBoxE) ||
		new TextBoxE({
			scene: ui.scene,
			width: 256,
			height,
			title,
			text,
			font: ui.font,
			gwid,
			memory: ui.memory
		});

	textBox.text = text;

	textBox.place(ui);
}

function textBoxUi(_ui: Gui, title: string, height: number, text: string): (ui: Gui) => boolean {
	return (ui: Gui) => {
		textBox(ui, title, height, text);
		return false;
	};
}

function margin(ui: Gui, title: string): void {
	const gwid = ui.titleToGwid(title);
	const margin =
		ui.findWidgetByGwidAndType(gwid, MarginE) ||
		new MarginE({
			scene: ui.scene,
			width: 100,
			height: widgetHeightByFont(ui.font),
			title,
			gwid,
			memory: ui.memory
		});

	margin.place(ui);
}

function marginUi(_ui: Gui, title: string): (ui: Gui) => boolean {
	return (ui: Gui) => {
		margin(ui, title);
		return false;
	};
}

function collapsing(ui: Gui, title: string, addContents: (ui: Gui) => void): boolean {
	const gwid = ui.titleToGwid(title);
	const collapsing =
		ui.findWidgetByGwidAndType(gwid, CollapsingE) ||
		new CollapsingE({
			scene: ui.scene,
			width: 128,
			height: widgetHeightByFont(ui.font),
			title,
			font: ui.font,
			gwid,
			memory: ui.memory
		});

	collapsing.place(ui, addContents);

	return collapsing.isOpen;
}

function collapsingUi(_ui: Gui, title: string, addContents: (ui: Gui) => void): (ui: Gui) => boolean {
	return (ui: Gui) => {
		return collapsing(ui, title, addContents);
	};
}

function horizon(ui: Gui, title: string, addContents: (ui: Gui) => void): void {
	const gwid = ui.titleToGwid(title);
	const horizon =
		ui.findWidgetByGwidAndType(gwid, HorizonE) ||
		new HorizonE({
			scene: ui.scene,
			width: 128,
			height: widgetHeightByFont(ui.font),
			title,
			gwid,
			memory: ui.memory
		});

	horizon.place(ui, addContents);
}

function horizonUi(_ui: Gui, title: string, addContents: (ui: Gui) => void): (ui: Gui) => boolean {
	return (ui: Gui) => {
		horizon(ui, title, addContents);
		return false;
	};
}

/**
 * WindowCreator
 *
 * ウインドウスタイルを設定し、ウインドウを生成する役。
 */
export class WindowCreator {
	private create: (addContents: (ui: Gui) => void, style: WindowStyle) => void;
	private style: WindowStyle;

	constructor(create: (addContents: (ui: Gui) => void, style: WindowStyle) => void) {
		this.create = create;
		this.style = {};
	}

	/**
	 * ウインドウを表示する。
	 *
	 * @param addContents ウインドウにウィジェットを追加する関数。
	 */
	show(addContents: (ui: Gui) => void): void {
		this.create(addContents, this.style);
	}

	/**
	 * タイトルバーの表示・非表示を設定する。
	 *
	 * @param v 真の時、表示する。
	 * @returns this
	 */
	titleBar(v: boolean): this {
		this.style.titleBar = v;
		return this;
	}

	/**
	 * リサイズの可否を設定する。
	 *
	 * @param v 真の時、リサイズ可能になる。
	 * @returns this
	 */
	resizable(v: boolean): this {
		this.style.resizable = v;
		return this;
	}

	/**
	 * スクロールバーの利用可否を設定する。
	 *
	 * @param v 真の時、スクロールバーを利用可能にする。
	 * @returns this
	 */
	scrollable(v: boolean): this {
		this.style.scrollable = v;
		return this;
	}

	/**
	 * ウインドウの位置を設定する。
	 *
	 * @param x X座標。
	 * @param y Y座標。
	 * @returns this
	 */
	position(x: number, y: number): this {
		this.style.position = { x, y };
		return this;
	}

	/**
	 * ウインドウの大きさを設定する。
	 *
	 * @param width 横幅[px]。
	 * @param height 縦幅[px]。
	 * @returns this
	 */
	size(width: number, height: number): this {
		this.style.size = { x: width, y: height };
		return this;
	}
}

/**
 * GUI。
 */
export class Gui {
	/**
	 * GUIを描画するシーン。
	 *
	 * 読み取り専用。
	 */
	scene: g.Scene;

	/**
	 * GUIで使用されるフォント。
	 *
	 * 読み取り専用。
	 */
	font: g.Font;

	/**
	 * ウィジェットの状態を保持するためのメモリ。
	 */
	memory: Memory;

	/**
	 * 現在のウィジェット。
	 *
	 * ウィジェットの追加はこのウィジェットに対して行う。
	 */
	get currentWidget(): WidgetE | null {
		if (this.widgetStack.length === 0) {
			return null;
		} else {
			return this.widgetStack[this.widgetStack.length - 1];
		}
	}

	/**
	 * 現在のプレイサー。
	 *
	 * ウィジェットの追加はこのプレイサーと交渉して位置と場所を決める。
	 */
	get currentPlacer(): Placer | null {
		if (this.placerStack.length === 0) {
			return null;
		} else {
			return this.placerStack[this.placerStack.length - 1];
		}
	}

	public aliveWidgets: WidgetE[];

	private root: g.E;
	private coverE: g.E;

	private windowManager: WindowManager;
	private modalWindowManager: WindowManager;

	private currentWindow: WindowE | null = null;

	private idStack: string[];
	private widgetStack: WidgetE[];
	private placerStack: Placer[];

	/**
	 * コンストラクタ。
	 *
	 * @param scene シーン。
	 * @param root ウインドウを接続する E 。画面の原点（左上隅）に配置する。
	 * @param font ウィジェットの利用するフォント。
	 * @param memory ウィジェットの状態を保存するメモリ。
	 */
	constructor(scene: g.Scene, root: g.E, font: g.Font, memory: Memory) {
		this.scene = scene;
		this.root = root;
		this.font = font;
		this.aliveWidgets = [];

		this.coverE = new g.E({
			scene,
			width: g.game.width,
			height: g.game.height
		});

		this.windowManager = new WindowManager(scene);
		this.modalWindowManager = new WindowManager(scene);

		this.currentWindow = null;

		this.widgetStack = [];
		this.idStack = [];
		this.placerStack = [];
		this.memory = memory;

		this.setupLayer();
	}

	/**
	 * ウィジェット ID をスタックにプッシュする。
	 *
	 * 通常、ウィジェットのタイトルをウィジェット ID に用いる。
	 *
	 * @param wid ウィジェット ID 。
	 */
	pushWid(wid: number | string): void {
		this.idStack.push(wid + "");
	}

	/**
	 * ウィジェット ID をスタックからポップする。
	 */
	popWid(): void {
		this.idStack.pop();
	}

	/**
	 * 現在のグローバルウィジェット ID を得る。
	 * @returns 現在のグローバルウィジェット ID 。ウィジェットが１つもプッシュされていない場合、null 。
	 */
	currentGwid(): string | null {
		return gwidFromIdStack(this.idStack);
	}

	/**
	 * ウィジェットタイトル(ID)からグローバルウィジェット ID を得る。
	 *
	 * @param title ウィジェットのタイトル。
	 * @returns グローバルウィジェット ID 。
	 */
	titleToGwid(title: string): string {
		return gwidFromIdStackAndTitle(this.idStack, title);
	}

	/**
	 * グローバルウィジェットIDとウィジェットの型の両方が一致するウィジェットを返す。
	 *
	 * @param gwid グローバルウィジェット ID 。
	 * @param ctor ウィジェットのコンストラクタ。
	 * @returns ウィジェット。見つからなかった時 null 。
	 */
	findWidgetByGwidAndType<T extends WidgetE>(gwid: string, ctor: Constructor<T>): T | null {
		return findWidgetByGwidAndType(this.root, gwid, ctor);
	}

	/**
	 * run() 実行前に実行するメソッド。
	 *
	 * 通常、開発者はこれを利用する必要はない。
	 */
	preRun(): void {
		WidgetE.local = this.root.local === true || null;
		this.aliveWidgets = [];
	}

	/**
	 * run() 実行後に実行するメソッド。
	 *
	 * 通常、開発者はこれを利用する必要はない。
	 */
	postRun(): void {
		traverse(this.root, w => w.postRun());

		const closedWindowGwids = this.closedWindowGwids();

		traverse(this.root, w => destroyDeadWidget(w, this.aliveWidgets));

		// メモリはウィンドウ単位で解放する。
		closedWindowGwids.forEach(gwid => releaseMemoryHierarchy(this.memory, gwid));

		this.windowManager.sortWindows();
		this.modalWindowManager.sortWindows();

		const modalWindowsExist = !!(
			this.modalWindowManager.root.children &&
			this.modalWindowManager.root.children.length
		);

		if (modalWindowsExist) {
			this.coverE.touchable = true;
			this.windowManager.enabled = false;
		} else {
			this.coverE.touchable = false;
			this.windowManager.enabled = true;
		}

		WidgetE.local = null;
	}

	/**
	 * ウインドウを準備する。
	 *
	 * @param title ウインドウのタイトル。
	 * @param addContents ウインドウにウィジェットを配置する関数。
	 * @returns ウインドウクリエータ。これに対して show() を呼ぶことでウインドウが表示される。
	 */
	window(title: string): WindowCreator {
		const creator = new WindowCreator((addContents, style) => {
			const gwid = this.titleToGwid(title);

			if (!this.memory.data[gwid]) {
				this.memory.data[gwid] = style;
			}

			const found = this.findWidgetByGwidAndType(gwid, WindowE);
			const window = found ??
				new WindowE({
					scene: this.scene,
					font: this.font,
					title,
					gwid,
					memory: this.memory,
				});

			if (!found) {
				this.windowManager.addNewWindow(window);
				window.onPointDown.add(_ev => {
					this.windowManager.moveFront(window);
				});
			}

			this.aliveWidgets.push(window);

			const placer = new Placer(
				window.cursorPosition,
				window.contentArea
			);

			this.pushWidget(window);
			this.pushPlacer(placer);
			this.pushWid(title);

			this.currentWindow = window;

			addContents(this);

			this.currentWindow = null;

			this.popWid();
			this.popPlacer();
			this.popWidget();

			window.bounds = placer.bounds;
		});

		return creator;
	}

	/**
	 * モーダルウインドウを準備する。
	 *
	 * @param title モーダルウインドウのタイトル。
	 * @param addContents モーダルウインドウにウィジェットを配置する関数。
	 * @returns ウインドウクリエータ。これに対して show() を呼ぶことでウインドウが表示される。
	 */
	modalWindow(title: string): WindowCreator {
		const creator = new WindowCreator((addContents, style) => {
			const windowSize = style.size ?? { x: 320, y: 320 };

			// ウインドウの位置を画面中央にする。
			style.position = {
				x: Math.round((g.game.width - windowSize.x) / 2),
				y: Math.round((g.game.height - windowSize.y) / 2)
			};

			const gwid = this.titleToGwid(title);

			if (!this.memory.data[gwid]) {
				this.memory.data[gwid] = style;
			}

			const found = this.findWidgetByGwidAndType(gwid, WindowE);
			const window = found ??
				new WindowE({
					scene: this.scene,
					font: this.font,
					title,
					gwid,
					scrollable: false,
					memory: this.memory,
				});

			if (!found) {
				this.modalWindowManager.addNewWindow(window);
				window.onPointDown.add(_ev => {
					this.modalWindowManager.moveFront(window);
				});
			}

			this.aliveWidgets.push(window);

			const placer = new Placer(
				window.cursorPosition,
				window.contentArea
			);

			this.pushWidget(window);
			this.pushPlacer(placer);
			this.pushWid(title);

			this.currentWindow = window;

			addContents(this);

			this.currentWindow = null;

			this.popWid();
			this.popPlacer();
			this.popWidget();

			window.bounds = placer.bounds;
		});

		creator.resizable(false);

		return creator;
	}

	/**
	 * 現在の親ウィジェットにウィジェットを配置する。
	 *
	 * @param widgetE ウィジェット。
	 */
	attach(widgetE: WidgetE): void {
		widgetE.parentWindow = this.currentWindow;
		this.currentWidget?.append(widgetE);
		this.aliveWidgets.push(widgetE);
	}

	/**
	 * ウィジェットの取得。
	 *
	 * @param title ウィジェットのタイトル。
	 * @returns ウィジェット。
	 */
	getWidget(title: string): WidgetE | null {
		const gwid = this.titleToGwid(title);
		return this.findWidgetByGwidAndType(gwid, WidgetE);
	}

	/**
	 * ウィジェットをスタックにプッシュする。
	 *
	 * プッシュされたウィジェットは、以降アタッチされるウィジェットの親になる。
	 *
	 * @param widgetE プッシュされるウィジェット。
	 */
	pushWidget(widgetE: WidgetE): void {
		this.widgetStack.push(widgetE);
	}

	/**
	 * ウィジェットをスタックからポップする。
	 *
	 * @returns ポップされたウィジェット。
	 */
	popWidget(): WidgetE | undefined {
		return this.widgetStack.pop();
	}

	/**
	 * プレイサーをスタックにプッシュする。
	 *
	 * @param placer プレイサー。
	 */
	pushPlacer(placer: Placer): void {
		this.placerStack.push(placer);
	}

	/**
	 * プレイサーをスタックからポップする。
	 *
	 * @returns ポップされたプレイサー。
	 */
	popPlacer(): Placer | undefined {
		return this.placerStack.pop();
	}

	/**
	 * ファクトリでウィジェットを生成し配置する。
	 *
	 * @param factory ウィジェット生成するファクトリ。
	 * @returns ウィジェットが操作された時、真。
	 */
	add(factory: (ui: Gui) => boolean): boolean {
		return factory(this);
	}

	/**
	 * 複合ウィジェットを開始する。
	 *
	 * @param title
	 */
	beginWidget(title: string): void {
		this.pushWid(title);
	}

	/**
	 * 複合ウィジェットの状態をメモリから取得する。
	 *
	 * beginWidget() と endWidget() の間で使用する。
	 *
	 * 状態は複合ウィジェットを配置するウインドウが閉じられた時に解放される。
	 *
	 * @param title 状態のタイトル。
	 * @param initialValue 状態の初期値。オブジェクトでなければならない。メモリが初期化済みの時、使用しない。
	 * @returns 状態。
	 */
	useMemory<T extends NonNullable<object>>(title: string, initialValue: T): T {
		return useMemory(this.memory, this.titleToGwid(title), initialValue);
	}

	/**
	 * 複合ウィジェットを終了する。
	 */
	endWidget(): void {
		this.popWid();
	}

	/**
	 * ラベルを配置する。
	 *
	 * @param title タイトル。
	 */
	label(title: string): void {
		this.add(labelUi(this, title));
	}

	/**
	 * マージンを配置する。
	 *
	 * 何も描画しないウィジェットを配置します。
	 *
	 * @param title マージンのタイトル。
	 */
	margin(title: string): void {
		this.add(marginUi(this, title));
	}

	/**
	 * ボタンを配置する。
	 *
	 * @param title のタイトル。
	 * @returns ボタンが押下された時、真。
	 */
	button(title: string): boolean {
		return this.add(buttonUi(title));
	}

	/**
	 * チェックボックスを配置する。
	 *
	 * @param title チェックボックスのタイトル。
	 * @param valueObject チェックボックスのオン・オフの真偽値を持つオブジェクト。
	 * @param key チェックボックスのオン・オフの真偽値のプロパティ名。
	 * @returns チェックボックスが押下された時、真。
	 */
	checkbox<T extends ValueObject>(title: string, valueObject: T, key: AssignableKeys<T, boolean>): boolean {
		return this.add(checkboxUi(title, valueObject, key));
	}

	/**
	 * ラジオボタンを配置する。
	 *
	 * @param title ラジオボタンのタイトル。
	 * @param valueObject ラジオボタンのオン・オフの真偽値を持つオブジェクト。
	 * @param key ラジオボタンのオン・オフの真偽値のプロパティ名。
	 * @param buttonValue ラジオボタンがオンの時 valueObject に設定される値。
	 * @returns ラジオボタンが押下された時、真。
	 */
	radioButton<T extends ValueObject, K extends keyof T>(title: string, valueObject: T, key: K, buttonValue: T[K]): boolean {
		return this.add(radioButtonUi(title, valueObject, key, buttonValue));
	}

	/**
	 * スライダーを配置する。
	 *
	 * @param title
	 * @param valueObject スライダーの値を持つオブジェクト。
	 * @param key スライダーのオン・オフの値のプロパティ名。
	 * @param min 最小値。
	 * @param max 最大値。
	 * @returns スライダーによって値が変更された時、真。
	 */
	slider<T extends ValueObject>(title: string, valueObject: T, key: AssignableKeys<T, number>, min: number, max: number): boolean {
		return this.add(sliderUi(title, valueObject, key, min, max));
	}

	/**
	 * 折りたたみを配置する。
	 *
	 * @param title 折りたたみのタイトル。
	 * @param addContents 折りたたみにウィジェットを配置する関数。
	 * @returns 折りたたみを開閉した時、真。
	 */
	collapsing(title: string, addContents: (ui: Gui) => void): boolean {
		return this.add(collapsingUi(this, title, addContents));
	}

	/**
	 * テキストボックスを配置する。
	 *
	 * @param title テキストボックスのタイトル。
	 * @param height 高さ。
	 * @param text テキストボックスに表示する文字列。
	 */
	textBox(title: string, height: number, text: string): void {
		this.add(textBoxUi(this, title, height, text));
	}

	/**
	 * 水平配置を開始する。
	 *
	 * @param title 水平配置のタイトル
	 * @param addContents 水平に配置されるウィジェットを配置する関数。
	 */
	horizontal(title: string, addContents: (ui: Gui) => void): void {
		this.add((horizonUi(this, title, addContents)));
	}

	private setupLayer(): void {
		this.root.append(this.windowManager.root);
		this.root.append(this.coverE);
		this.root.append(this.modalWindowManager.root);
	}

	private closedWindowGwids(): string[] {
		const closedWindowGwids: string[] = [];

		traverse(this.root, widget => {
			if (widget instanceof WindowE && this.aliveWidgets.indexOf(widget) === -1) {
				closedWindowGwids.push(widget.gwid);
			}
		});

		return closedWindowGwids;
	}
}
