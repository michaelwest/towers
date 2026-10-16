// Generated Venetian miniatures. Source rectangles keep each sprite isolated
// in the shared transparent atlas; there is only one image request to decode.
export const sprites = {
  skiff: [10, 102, 386, 218],
  raider: [405, 106, 409, 223],
  galleon: [817, 83, 433, 268],
  bolt: [87, 323, 326, 483],
  splash: [457, 358, 349, 448],
  frost: [876, 352, 327, 459],
  palazzo: [12, 817, 393, 398],
  basilica: [420, 802, 399, 432],
  townhouses: [826, 808, 423, 410]
};
export function paintSprite(context, image, name, x, y, width, height) {
  context.drawImage(image, ...sprites[name], x, y, width, height);
}
