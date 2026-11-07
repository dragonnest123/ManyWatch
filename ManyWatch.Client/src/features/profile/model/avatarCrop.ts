export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;

export type AvatarCropCenter = {
  x: number;
  y: number;
};

export type AvatarCropRect = {
  x: number;
  y: number;
  size: number;
};

export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) {
    return MIN_ZOOM;
  }

  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function getSourceSide(imageWidth: number, imageHeight: number, zoom: number): number {
  return Math.min(imageWidth, imageHeight) / clampZoom(zoom);
}

export function clampCropCenter(
  imageWidth: number,
  imageHeight: number,
  zoom: number,
  center: AvatarCropCenter,
): AvatarCropCenter {
  const halfSide = getSourceSide(imageWidth, imageHeight, zoom) / 2;

  return {
    x: Math.min(imageWidth - halfSide, Math.max(halfSide, center.x)),
    y: Math.min(imageHeight - halfSide, Math.max(halfSide, center.y)),
  };
}

export function getCropRect(
  imageWidth: number,
  imageHeight: number,
  center: AvatarCropCenter,
  zoom: number,
): AvatarCropRect {
  const side = getSourceSide(imageWidth, imageHeight, zoom);
  const clampedCenter = clampCropCenter(imageWidth, imageHeight, zoom, center);

  return {
    x: clampedCenter.x - side / 2,
    y: clampedCenter.y - side / 2,
    size: side,
  };
}
