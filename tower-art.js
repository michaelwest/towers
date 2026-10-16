// The camera and building stay fixed. Only the mounted weapon changes yaw.
// Each crop records its mounting pivot and muzzle so aiming never shifts the base.
const frame = (crop, pivot, tip) => ({crop, pivot, tip});
export const directionalArt = {
  bolt: {
    file: 'crossbow-directions.png', base: [481,335,281,534],
    baseBox: [-19,-55,38,72], mount: [0,-44], scale: .075,
    frames: [
      frame([855,474,378,261],[976,658],[1220,594]), // E
      frame([870,873,326,254],[977,991],[1180,1110]), // SE
      frame([459,874,337,332],[630,959],[627,1194]), // S
      frame([60,873,324,253],[285,997],[78,1106]), // SW
      frame([21,473,377,262],[278,658],[33,594]), // W
      frame([81,50,297,290],[260,277],[104,74]), // NW
      frame([458,8,338,328],[629,260],[628,20]), // N
      frame([873,49,297,294],[989,269],[1151,73]) // NE
    ]
  },
  splash: {
    file: 'cannon-directions.png', base: [414,399,424,448],
    baseBox: [-27,-40,54,57], mount: [0,-24], scale: .084,
    frames: [
      frame([860,538,384,210],[974,677],[1225,602]),
      frame([891,866,340,324],[991,967],[1190,1151]),
      frame([525,862,214,347],[630,966],[630,1164]),
      frame([22,869,337,317],[269,966],[69,1138]),
      frame([13,537,383,211],[278,677],[40,601]),
      frame([22,31,336,338],[266,287],[67,78]),
      frame([520,23,216,339],[627,283],[627,55]),
      frame([895,30,336,339],[994,285],[1185,79])
    ]
  }
};
export function aimDirection(angle) {
  return ((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8;
}
export function weaponMount(type) {
  return directionalArt[type]?.mount || [0,-37];
}
export function muzzlePosition(type, x, y, angle) {
  const art = directionalArt[type];
  if (!art) return {x,y:y-37};
  const f = art.frames[aimDirection(angle)];
  return {
    x:x+art.mount[0]+(f.tip[0]-f.pivot[0])*art.scale,
    y:y+art.mount[1]+(f.tip[1]-f.pivot[1])*art.scale
  };
}
export function drawDirectionalTower(context,image,type,angle,recoil=0) {
  const art=directionalArt[type];
  const f=art.frames[aimDirection(angle)];
  context.drawImage(image,...art.base,...art.baseBox);
  const [sx,sy,sw,sh]=f.crop;
  // Recoil moves only the weapon along its barrel; the tower remains planted.
  const dx=f.tip[0]-f.pivot[0],dy=f.tip[1]-f.pivot[1],length=Math.hypot(dx,dy);
  context.drawImage(image,sx,sy,sw,sh,
    art.mount[0]+(sx-f.pivot[0])*art.scale-dx/length*recoil,
    art.mount[1]+(sy-f.pivot[1])*art.scale-dy/length*recoil,
    sw*art.scale,sh*art.scale);
}
