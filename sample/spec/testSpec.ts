import * as path from "path";
import { GameContext } from "@akashic/headless-akashic";

describe("mainScene", () => {
	it("ゲームが正常に動作できる", async () => {
		const context = new GameContext<3>({
			gameJsonPath: path.join(__dirname, "..", "game.json")
		});
		const client = await context.getGameClient();

		expect(client.type).toBe("active");

		const game = client.game!;

		expect(game.width).toBe(720);
		expect(game.height).toBe(480);
		expect(game.fps).toBe(30);

		const scene = client.game.scene()!;

		expect(scene).toBeDefined();

		await context.destroy();
	});
});
