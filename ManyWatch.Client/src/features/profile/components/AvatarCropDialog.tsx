import {
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  type AvatarCropCenter,
  clampCropCenter,
  clampZoom,
  getCropRect,
  getSourceSide,
  MAX_ZOOM,
  MIN_ZOOM,
} from '../model/avatarCrop';
import { createAvatarDataUrl, type AvatarSource } from '../model/avatarImage';

type Props = {
  source: AvatarSource;
  isSubmitting: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  centerX: number;
  centerY: number;
};

const INITIAL_VIEWPORT_SIZE = 320;
const MAX_TEXTURE_SIDE = 2048;

export function AvatarCropDialog({
  source,
  isSubmitting,
  error,
  onCancel,
  onConfirm,
}: Props) {
  const { image } = source;
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [center, setCenter] = useState(() => ({
    x: image.width / 2,
    y: image.height / 2,
  }));
  const [viewportSize, setViewportSize] = useState(INITIAL_VIEWPORT_SIZE);

  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const centerRef = useRef(center);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;

      if (width && width > 0) {
        setViewportSize(width);
      }
    });

    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onCancel]);

  const cropRect = getCropRect(image.width, image.height, center, zoom);
  const baseScale = Math.min(
    (viewportSize * MAX_ZOOM) / Math.min(image.width, image.height),
    MAX_TEXTURE_SIDE / Math.max(image.width, image.height),
  );
  const renderScale = zoom / MAX_ZOOM;
  const baseImageWidth = image.width * baseScale;
  const baseImageHeight = image.height * baseScale;
  const imageLeft =
    viewportSize / 2 - (cropRect.x + cropRect.size / 2) * baseScale * renderScale;
  const imageTop =
    viewportSize / 2 - (cropRect.y + cropRect.size / 2) * baseScale * renderScale;

  function positionImage(targetCenter: AvatarCropCenter, targetZoom: number) {
    const element = imageRef.current;

    if (!element) {
      return;
    }

    const rect = getCropRect(image.width, image.height, targetCenter, targetZoom);
    const scale = baseScale * (targetZoom / MAX_ZOOM);
    const left = viewportSize / 2 - (rect.x + rect.size / 2) * scale;
    const top = viewportSize / 2 - (rect.y + rect.size / 2) * scale;

    element.style.transform =
      `translate3d(${left}px, ${top}px, 0) scale(${targetZoom / MAX_ZOOM})`;
  }

  function handleZoomChange(event: ChangeEvent<HTMLInputElement>) {
    const nextZoom = clampZoom(Number(event.target.value));
    const nextCenter = clampCropCenter(image.width, image.height, nextZoom, centerRef.current);

    centerRef.current = nextCenter;
    setZoom(nextZoom);
    setCenter(nextCenter);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (isSubmitting) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      centerX: centerRef.current.x,
      centerY: centerRef.current.y,
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const scale = viewportSize / getSourceSide(image.width, image.height, zoom);
    const nextCenter = clampCropCenter(image.width, image.height, zoom, {
      x: drag.centerX - (event.clientX - drag.startX) / scale,
      y: drag.centerY - (event.clientY - drag.startY) / scale,
    });

    centerRef.current = nextCenter;
    positionImage(nextCenter, zoom);
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setCenter(centerRef.current);
    }
  }

  function handleSave() {
    onConfirm(createAvatarDataUrl(image, cropRect));
  }

  return (
    <div
      className="dialog-backdrop"
      onClick={() => {
        if (!isSubmitting) {
          onCancel();
        }
      }}
    >
      <div
        className="dialog avatar-crop-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-crop-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="avatar-crop-title">Crop avatar</h2>
        <p>Drag the photo and use the slider to choose the area shown in your profile</p>

        <div
          ref={stageRef}
          className="avatar-crop-stage"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <img
            ref={imageRef}
            className="avatar-crop-image"
            src={source.url}
            alt=""
            draggable={false}
            style={{
              width: baseImageWidth,
              height: baseImageHeight,
              transform: `translate3d(${imageLeft}px, ${imageTop}px, 0) scale(${renderScale})`,
            }}
          />
          <span className="avatar-crop-mask" aria-hidden="true" />
        </div>

        <label className="avatar-crop-zoom">
          Zoom
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={handleZoomChange}
            disabled={isSubmitting}
          />
        </label>

        {error && <p className="error">{error}</p>}

        <div className="dialog-actions">
          <button className="secondary" type="button" disabled={isSubmitting} onClick={onCancel}>
            Cancel
          </button>

          <button type="button" disabled={isSubmitting} onClick={handleSave}>
            {isSubmitting ? 'Saving...' : 'Save avatar'}
          </button>
        </div>
      </div>
    </div>
  );
}
