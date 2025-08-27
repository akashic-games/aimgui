// Global Widget ID のセパレータ
export const separator = "::";

export function gwidFromIdStack(idStack: string[]): string | null {
	return idStack.length > 0 ? idStack.join(separator) : null;
}

export function gwidFromIdStackAndTitle(idStack: string[], title: string): string {
	const gwid = gwidFromIdStack(idStack);
	return gwid ? gwid + separator + title : title;
}
