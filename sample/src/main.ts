import * as aimgui from "@akashic-extension/aimgui";

interface ColorDisplayEParameterObject extends aimgui.WidgetEParameterObject {
	rgb: { r: number; g: number; b: number };
}

class ColorDisplayE extends aimgui.WidgetE {
	rgb: { r: number; g: number; b: number };

	constructor(param: ColorDisplayEParameterObject) {
		super(param);
		this.rgb = param.rgb;
	}

	renderSelf(renderer: g.Renderer, _camera?: g.Camera): boolean {
		renderer.fillRect(0, 0, this.width, this.height, "white");
		renderer.fillRect(1, 1, this.width - 2, this.height - 2, this.cssColor());
		return true;
	}

	cssColor(): string {
		const r = this.toHexString(Math.round(this.rgb.r * 255));
		const g = this.toHexString(Math.round(this.rgb.g * 255));
		const b = this.toHexString(Math.round(this.rgb.b * 255));
		return `#${r}${g}${b}`;
	}

	private toHexString(n: number): string {
		return ("0" + n.toString(16)).substr(-2);
	}
}

function colorDisplay(ui: aimgui.Gui, title: string, rgb: { r: number; g: number; b: number }): void {
	const gwid = ui.titleToGwid(title);
	const colorDisplay =
		ui.findWidgetByGwidAndType(gwid, ColorDisplayE) ||
		new ColorDisplayE({
			scene: ui.scene,
			width: ui.font.size,
			// height: aimgui.widgetHeightByFont(ui.font),
			height: ui.font.size,
			title,
			gwid,
			memory: ui.memory,
			rgb
		});

	colorDisplay.place(ui);
}

function colorDisplayUi(_ui: aimgui.Gui, title: string, rgb: { r: number; g: number; b: number }): (ui: aimgui.Gui) => boolean {
	return (ui: aimgui.Gui) => {
		colorDisplay(ui, title, rgb);
		return false;
	};
}

function main(_param: g.GameMainParameterObject): void {
	const scene = new g.Scene({ game: g.game, assetIds: ["se"] });

	scene.onLoad.add(() => {
		const background = new g.FilledRect({
			scene: scene,
			cssColor: "#2C7CFF",
			width: g.game.width,
			height: g.game.height
		});
		scene.append(background);

		const font = new g.DynamicFont({
			game: g.game,
			size: 13,
			fontFamily: "monospace",
			fontColor: "white"
		});

		const guiE = new aimgui.GuiE({
			scene,
			width: g.game.width,
			height: g.game.height,
			font
		});

		const valueObject = {
			sliderValue: 0.5,
			checkBoxBoolean: false,
			radioButtonValue: "rb1",
			scrollToBottom: false
		};
		let text = "";
		let showModalWindow = false;

		const rgbColor = {
			r: 0.5,
			g: 0.5,
			b: 0.5
		};

		const sliderDataList = [
			{
				min: -1,
				max: 1,
				value: 0
			},
			{
				min: -2,
				max: 0,
				value: -1
			},
			{
				min: -2,
				max: 1,
				value: -0.5
			},
			{
				min: 1,
				max: 3,
				value: 2
			}
		];

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
			} else {
				gui.window("Debug Tool")
					.position(16, 16)
					.size(240, 240)
					.show(gui => {
						gui.label("Super Cool Game v0.1.0");

						gui.margin("margin 1");

						if (gui.button("Back to Title")) {
							showModalWindow = true;
							console.log("back-to-title Button clicked!");
						}

						if (gui.checkbox("Weapon Setting", valueObject, "checkBoxBoolean")) {
							console.log(`Show-RadioButton checkbox value ${valueObject.checkBoxBoolean}`);
						}

						if (valueObject.checkBoxBoolean) {
							gui.horizontal("checkboxes", _ui => {
								if (gui.radioButton("Sword⚔️", valueObject, "radioButtonValue", "rb1")) {
									console.log(`checkbox value ${valueObject.radioButtonValue}`);
								}
								if (gui.radioButton("Axe🪓", valueObject, "radioButtonValue", "rb2")) {
									console.log(`checkbox value ${valueObject.radioButtonValue}`);
								}
								if (gui.radioButton("Wand🪄", valueObject, "radioButtonValue", "rb3")) {
									console.log(`checkbox value ${valueObject.radioButtonValue}`);
								}
							});
						}

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

						if (gui.slider("Volume", valueObject, "sliderValue", 0, 1)) {
							console.log(`Volume slider value ${valueObject.sliderValue}`);
						}

						if (gui.button("Sound Test")) {
							scene.asset.getAudio("/audio/se").play().changeVolume(valueObject.sliderValue);
							console.log("sound-test Button clicked");
						}
					});

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
								clicked = gui.checkbox("Scroll To Bottom", valueObject, "scrollToBottom");
								if (gui.button("Clear Log")) {
									text = "";
								}
							});
							gui.textBox("text box", 128, text);
							if (valueObject.scrollToBottom && (newLine || clicked)) {
								const textBoxE = gui.getWidget("text box");
								if (textBoxE instanceof aimgui.TextBoxE) {
									textBoxE.scrollToBottom();
								}
							}
						});
					});

				gui.window("Slider Test")
					.position(Math.round(g.game.width / 5), 32)
					.size(480, 320)
					.show(gui => {
						sliderDataList.forEach(data => {
							gui.slider(`${data.min}<=>${data.max}`, data, "value", data.min, data.max);
						});
						gui.horizontal("color setting", gui => {
							gui.add(colorDisplayUi(gui, "RGB", rgbColor));
							gui.slider("R", rgbColor, "r", 0, 1);
							gui.slider("G", rgbColor, "g", 0, 1);
							gui.slider("B", rgbColor, "b", 0, 1);
						});
					});

			}
		};

		scene.append(guiE);
	});

	g.game.pushScene(scene);
}

export = main;
