import { describe, expect, it } from 'vitest';
import { clampCropCenter, clampZoom, getCropRect, getSourceSide, MAX_ZOOM, MIN_ZOOM } from './avatarCrop';

describe('avatarCrop', () => {
  it('centers a square crop on a landscape image', () => {
    expect(getCropRect(1600, 900, { x: 800, y: 450 }, 1)).toEqual({
      x: 350,
      y: 0,
      size: 900,
    });
  });

  it('centers a square crop on a portrait image', () => {
    expect(getCropRect(900, 1600, { x: 450, y: 800 }, 1)).toEqual({
      x: 0,
      y: 350,
      size: 900,
    });
  });

  it('shrinks the crop around the center when zoomed in', () => {
    expect(getCropRect(1600, 900, { x: 800, y: 450 }, 2)).toEqual({
      x: 575,
      y: 225,
      size: 450,
    });
  });

  it('clamps the crop to the image bounds', () => {
    expect(clampCropCenter(1600, 900, 1, { x: -100, y: 2000 })).toEqual({
      x: 450,
      y: 450,
    });

    expect(getCropRect(1600, 900, { x: 0, y: 0 }, 1)).toEqual({
      x: 0,
      y: 0,
      size: 900,
    });

    expect(getCropRect(1600, 900, { x: 1600, y: 900 }, 1)).toEqual({
      x: 700,
      y: 0,
      size: 900,
    });
  });

  it('keeps zoom inside the supported range', () => {
    expect(clampZoom(0.2)).toBe(MIN_ZOOM);
    expect(clampZoom(10)).toBe(MAX_ZOOM);
    expect(clampZoom(Number.NaN)).toBe(MIN_ZOOM);
    expect(getSourceSide(1600, 900, 10)).toBe(300);
  });
});
