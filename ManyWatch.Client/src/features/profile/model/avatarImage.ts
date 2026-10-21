const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const AVATAR_SIZE = 256;

export async function createAvatarDataUrl(file: File): Promise<string> {
  if (!SUPPORTED_TYPES.has(file.type)) {
    throw new Error('Choose a JPG, PNG, WebP or GIF image');
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('Image must be 8 MB or smaller');
  }

  const image = await loadImage(file);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not process the image');
  }

  const side = Math.min(image.width, image.height);

  if (side === 0) {
    throw new Error('Could not process the image');
  }

  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;

  context.drawImage(
    image,
    (image.width - side) / 2,
    (image.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );

  return canvas.toDataURL('image/webp', 0.85);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read the image'));
    };

    image.src = url;
  });
}
