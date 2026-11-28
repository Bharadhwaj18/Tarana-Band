import { frameImageStyle } from '@/lib/imageFrame';

interface FramedImageProps {
  src: string;
  alt: string;
  /** The saved position/zoom for this photo (merchandise.image_positions[i]) */
  position?: string | null;
  /** The frame's width / height, so a zoomed photo is placed correctly in it (square = 1, a 3:4 tile = 0.75) */
  aspect?: number;
  /** Sets the frame's size and border, e.g. "w-full aspect-square" */
  className?: string;
}

/**
 * A merch photo inside a fixed-size frame. The photo is cropped to fill it, or, if it was zoomed out in admin,
 * shown whole with black bars. Same drawing for the shop card, the homepage tiles and the cart.
 */
export default function FramedImage({ src, alt, position, aspect = 1, className = '' }: FramedImageProps) {
  return (
    <span className={`block relative overflow-hidden bg-ink ${className}`}>
      <img src={src} alt={alt} className="absolute inset-0 w-full h-full" style={frameImageStyle(position, aspect)} />
    </span>
  );
}
