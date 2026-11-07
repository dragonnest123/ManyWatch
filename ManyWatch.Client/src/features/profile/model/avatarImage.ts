import type { AvatarCropRect } from './avatarCrop';

const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const AVATAR_SIZE = 256;

export type AvatarSource = {
  image: HTMLImageElement;
  url: string;
};

export async function loadAvatarSource(file: File): Promise<AvatarSource> {
  if (!SUPPORTED_TYPES.has(file.type)) {
    throw new Error('Choose a JPG, PNG, WebP or GIF image');
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('Image must be 8 MB or smaller');
  }

  const url = URL.createObjectURL(file);

  try {
    const image = await loadImage(url);

    if (image.width === 0 || image.height === 0) {
      throw new Error('Could not process the image');
    }

    return { image, url };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export function createAvatarDataUrl(image: HTMLImageElement, crop: AvatarCropRect): string {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not process the image');
  }

  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.size,
    crop.size,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );

  return canvas.toDataURL('image/webp', 0.85);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not read the image'));
    image.src = url;
  });
}
