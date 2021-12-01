/**
 * テキストの長さ[px]を制限する。
 *
 * @param font フォント
 * @param text テキスト
 * @param maxWidth 最大幅[ix]。
 * @param replaceStr 代替文字列。長さを制限された文字列の末尾に加えられる。省略時 "..." 。
 * @returns 長さを制限された文字列。
 */
export function limitText(font: g.Font, text: string, maxWidth: number, replaceStr: string = "..."): string {
	if (font.measureText(text).width <= maxWidth) {
		return text;
	}

	const replaceStrWidth = font.measureText(replaceStr).width;

	let width = 0;
	let limited = "";

	for (let i = 0; i < text.length; ++i) {
		const code = g.Util.charCodeAt(text, i);
		if (!code) {
			continue;
		}

		const glyph = font.glyphForCharacter(code);
		if (!glyph) {
			continue;
		}

		width += glyph.advanceWidth;
		if (width + replaceStrWidth < maxWidth) {
			limited += text[i];
		} else {
			break;
		}
	}

	limited += replaceStr;

	return limited;
}

/**
 * テキストを描画する。
 *
 * @param renderer レンダラー。
 * @param font フォント。
 * @param text テキスト。
 * @param x 描画X位置。
 * @param y 描画Y位置。
 * @param maxWidth テキストの最大の長さ[px]。省略時、無制限。
 */
export function drawText(renderer: g.Renderer, font: g.Font, text: string, startX: number, startY: number, maxWidth?: number): void {
	let x = 0;
	for (let i = 0; i < text.length; ++i) {
		const code = g.Util.charCodeAt(text, i);
		if (!code) {
			continue;
		}

		const glyph = font.glyphForCharacter(code);
		if (!glyph) {
			continue;
		}

		if (glyph.surface) {
			const glyphWidth = maxWidth != null ?
				Math.min(glyph.width, maxWidth - x) :
				glyph.width;

			renderer.drawImage(
				glyph.surface,
				glyph.x,
				glyph.y,
				glyphWidth,
				glyph.height,
				Math.round(startX + x + glyph.offsetX),
				Math.round(startY + glyph.offsetY)
			);
		}

		x += glyph.advanceWidth;

		if (maxWidth != null && x >= maxWidth) {
			break;
		}
	}
}
