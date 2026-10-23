// Shared geometry: terrain, visible paths and navigation use the same dimensions.
export const ISLAND_RADIUS = 3.2;
export const ISLAND_SPACING = 3.5;
export const PATH_RADIUS = 2.75;
export const PATH_WIDTH = .60;
export const BRIDGE_WIDTH = .90;
export function islandPosition([q,r]) {
  return {x:Math.sqrt(3)*ISLAND_SPACING*(q+r/2),z:1.5*ISLAND_SPACING*r};
}
