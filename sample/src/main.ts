import * as aimgui from "@akashic-extension/aimgui";

/**
 * バトルステート。
 */
interface BattleState {
	currentWeapon: "sword" | "axe" | "wand";
	battleReword: number;
}

/**
 * 逆ポーランド記法電卓。
 *
 * AimGuiの提供するウィジェットを組み合わせて電卓を実装する。このようなものを
 * 関数型複合ウィジェット、またはただ複合ウィジェットと呼ぶ。
 *
 * 複合ウィジェットの状態を管理したい時、beginWidget(), endWidget(), useMemory()
 * を用いる。この電卓では、計算のためのスタックと、テキストボックスのスクロール
 * 制御のためのフラグを useMemory() で管理している。
 *
 * @param gui AimGui の gui インスタンス。
 * @param title この関数ウィジェットのタイトル。
 * @param initialValue 電卓の初期値。
 * @returns クローズボタンを押下すると計算結果が返る。電卓が利用中の時、null 。
 */
function calculatorUi(gui: aimgui.Gui, title: string, initialValue: number): number | null {
	let result: number | null = null;

	// 関数型複合ウィジェットは beginWidget() で始まる。
	gui.beginWidget(title);

	// メモリから電卓の状態を取得する。最初の取得の時、初期値が用いられる。
	// 次回以降のアクセスでは、初期化済みの状態が返る。
	const state = gui.useMemory("state", {
		stack: [initialValue],
		scroll: false,
	});

	const text = state.stack.map((v, i) => `#${i}: ${v}`).join("\n");

	gui.textBox("calcTextBox", 64, text);

	// 計算機の表示が更新されたとき、テキストボックスをスクロールする。
	if (state.scroll) {
		const textBoxE = gui.getWidget("calcTextBox");
		if (textBoxE instanceof aimgui.TextBoxE) {
			textBoxE.scrollToBottom();
		}
		state.scroll = false;
	}

	const numberButtons = (numbers: number[]): void => {
		numbers.forEach(num => {
			if (gui.button(num.toString())) {
				state.stack[state.stack.length - 1] = state.stack[state.stack.length - 1] * 10 + num;
				state.scroll = true;
			}
		});
	};

	// スタックの値を取り出して計算し、結果をプッシュする。
	const calc = (op: (a: number, b: number) => number): void => {
		if (state.stack.length < 2) {
			return;
		}
		const a = state.stack.pop() || 0;
		const b = state.stack.pop() || 0;

		state.stack.push(op(a, b));

		state.scroll = true;
	};

	gui.horizontal("789/", gui => {
		numberButtons([7, 8, 9]);

		if (gui.button("/")) {
			calc((a, b) => b / a);
		}
	});

	gui.horizontal("456x", gui => {
		numberButtons([4, 5, 6]);

		if (gui.button("x")) {
			calc((a, b) => b * a);
		}
	});

	gui.horizontal("123-", gui => {
		numberButtons([1, 2, 3]);
		if (gui.button("-")) {
			calc((a, b) => b - a);
		}
	});

	gui.horizontal("0C+E", gui => {
		numberButtons([0]);
		if (gui.button("C")) {
			state.stack.length = 0;
			state.stack.push(0);
		}
		if (gui.button("+")) {
			calc((a, b) => b + a);
		}
		// 新しい値の入力を開始する時は Enter ボタンを押す。
		if (gui.button("E")) {
			state.stack.push(0);
			state.scroll = true;
		}
	});

	if (gui.button("Close")) {
		result = state.stack[0];
	}

	// 関数型複合ウィジェットは endWidget() で終わる。
	gui.endWidget();

	return result;
}

/**
 * ゲーム内開発者ツール風 UI 。
 *
 * @param scene シーン。
 * @param guiE AimGui の guiE インスタンス。
 * @param gameState ゲームの状態。
 */


class GameScene extends g.Scene {
	soundVolume: number;

	battleState: BattleState;

	constructor(param: g.SceneParameterObject) {
		super(param);

		this.soundVolume = 0.5;

		this.battleState = {
			currentWeapon: "sword",
			battleReword: 100,
		};

		this.onLoad.add(() => this.handleLoad());
	}

	handleLoad(): void {
		const background = new g.FilledRect({
			scene: this,
			cssColor: "#2C7CFF",
			width: g.game.width,
			height: g.game.height
		});
		this.append(background);

		// AimGui のためのフォント。フォントの大きさでウィジェットの大きさが決まる
		const font = new g.DynamicFont({
			game: g.game,
			size: 13,
			fontFamily: "monospace",
			fontColor: "white"
		});

		const guiE = new aimgui.GuiE({
			scene: this,
			width: g.game.width,
			height: g.game.height,
			font,
			local: true
		});

		this.setupToolUi(guiE);

		this.append(guiE);
	}

	// AimGui で this のプロパティを操作するときは第一引数に this の型を宣言します。
	// このサンプルでは、slider で this.soundVolume を操作するために宣言しています。
	// 呼び出し側は this を与える必要はありません。
	setupToolUi(this: GameScene, guiE: aimgui.GuiE): void {
		const battleState = this.battleState;
		const toolUiState = {
			scrollToBottom: false
		};
		let text = "";
		let showModalWindow = true;
		let showCalculator = false;

		guiE.run = gui => {
			if (showModalWindow) {
				gui.modalWindow("Let's Try AimGui !")
					.size(256, 46)
					.show(gui => {
						gui.horizontal("horizon", gui => {
							if (gui.button("START")) {
								showModalWindow = false;
							}
						});
					});
				return;
			}

			gui.window("Debug Tool")
				.position(16, 16)
				.size(240, 240)
				.show(gui => {
					gui.label("Super Cool Game v0.1.0");

					if (gui.button("Back to Title")) {
						showModalWindow = true;
						console.log("back-to-title Button clicked!");
					}

					gui.margin("margin 1");

					gui.horizontal("calculator_horizon", gui => {
						gui.label(`Battle Reward: ${battleState.battleReword}`);
						if (gui.button("Calc")) {
							showCalculator = true;
						}
					});

					gui.label("Weapon Setting");
					gui.horizontal("weaponRadioButtons", _ui => {
						if (gui.radioButton("Sword⚔️", battleState, "currentWeapon", "sword")) {
							console.log(`current weapon ${battleState.currentWeapon}`);
						}
						if (gui.radioButton("Axe🪓", battleState, "currentWeapon", "axe")) {
							console.log(`current weapon ${battleState.currentWeapon}`);
						}
						if (gui.radioButton("Wand🪄", battleState, "currentWeapon", "wand")) {
							console.log(`current weapon ${battleState.currentWeapon}`);
						}
					});

					gui.collapsing("System", gui => {
						gui.horizontal("system buttons", gui => {
							if (gui.button("Save")) {
								console.log("Save button clicked");
							}
							if (gui.button("Load")) {
								console.log("Load button clicked");
							}
						});
						gui.collapsing("Difficulty Level", gui => {
							if (gui.button("Easy")) {
								console.log("Button Easy clicked");
							}
							if (gui.button("Normal")) {
								console.log("Button Normal clicked");
							}
							if (gui.button("Hard")) {
								console.log("Button Hard clicked");
							}
						});
					});

					gui.collapsing("Sound", gui => {
						if (gui.slider("Volume", this, "soundVolume", 0, 1)) {
							console.log(`Volume slider value ${this.soundVolume}`);
						}
						if (gui.button("Play")) {
							this.asset.getAudio("/audio/se").play().changeVolume(this.soundVolume);
							console.log("sound-test Button clicked");
						}
					});
				});

			if (showCalculator) {
				gui.window("RPN Calculator")
					.position(g.game.width - 236, 32)
					.size(120, 208)
					.resizable(false)
					.show(gui => {
						const result = calculatorUi(gui, "RPN Calculator", 0);
						if (result !== null) {
							battleState.battleReword = result;
							showCalculator = false;
						}
					});
			}

			gui.window("Battle Test")
				.position(320, 96)
				.size(320, 240)
				.show(gui => {
					let newLine: string | null = null;
					gui.horizontal("horizon", gui => {
						gui.label("Command:");
						if (gui.button("Attack")) {
							const monsterName = g.game.random.generate() < 0.5 ? "slime" : "giant";
							newLine = `The ${monsterName} is defeated!`;
						}
						if (gui.button("Spell")) {
							const monsterName = g.game.random.generate() < 0.5 ? "wolf" : "sorcerer";
							newLine = `You chanted the spell of Sleep and the ${monsterName} is asleep.`;
						}
						if (gui.button("Defend")) {
							newLine = `Your HP decreased by ${Math.round(g.game.random.generate() * 50)}.`;
						}
						if (newLine) {
							text += text === "" ? newLine : `\n${newLine}`;
						}
					});

					gui.collapsing("Log", gui => {
						let clicked = false;
						gui.horizontal("Log UI", gui => {
							clicked = gui.checkbox("Scroll To Bottom", toolUiState, "scrollToBottom");
							if (gui.button("Clear Log")) {
								text = "";
							}
						});
						gui.textBox("logTextBox", 128, text);
						if (toolUiState.scrollToBottom && (newLine || clicked)) {
							const textBoxE = gui.getWidget("logTextBox");
							if (textBoxE instanceof aimgui.TextBoxE) {
								textBoxE.scrollToBottom();
							}
						}
					});
				});
		};
	}
}

function main(_param: g.GameMainParameterObject): void {
	const scene = new GameScene({ game: g.game, assetIds: ["se"] });
	g.game.pushScene(scene);
}

export = main;
