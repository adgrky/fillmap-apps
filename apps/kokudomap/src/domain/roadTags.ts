// 国道トリビアタグ(プレミアム機能, SPEC §11)。事実ベースの公式データのみを採用(評価・創作的ランキングは著作権上の懸念があるため不採用)。
//
// 海上国道(フェリー等で結ばれ一連の国道として指定されている区間を持つ路線、29路線):
// 出典: Wikipedia「海上国道」(https://ja.wikipedia.org/wiki/海上国道、CC BY-SA 4.0)。一般国道の路線を指定する政令(昭和43年政令第58号)に基づく。
export const KAIJOU_KOKUDOU = new Set([
  2, 16, 28, 30, 42, 57, 58, 197, 224, 259, 260, 269, 279, 280, 317, 324, 338, 350, 382, 384, 389,
  390, 409, 436, 437, 448, 485, 487, 499,
]);

// 交通不能区間のある国道(通称「点線国道」、16路線):
// 出典: 国土交通省 道路データブック2025「10-3 一般国道における交通不能区間の状況」(2025年6月末時点、16路線・18箇所・195.7km)。
export const FUTSUU_KOKUDOU = new Set([
  152, 256, 257, 274, 289, 291, 339, 352, 353, 360, 371, 401, 405, 422, 452, 476,
]);

export function roadTagsFor(ref: number | undefined): string[] {
  if (ref == null) return [];
  const tags: string[] = [];
  if (KAIJOU_KOKUDOU.has(ref)) tags.push("海上国道");
  if (FUTSUU_KOKUDOU.has(ref)) tags.push("点線国道");
  return tags;
}
