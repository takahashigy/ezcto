/**
 * Watermark utility for adding "EZCTO" watermark to images
 */

import sharp from "sharp";

export interface WatermarkOptions {
  text?: string;
  opacity?: number;
  fontSize?: number;
  rotation?: number;
  color?: string;
}

/**
 * Add watermark to an image buffer
 * @param imageBuffer - Original image buffer
 * @param options - Watermark options
 * @returns Buffer with watermark applied
 */
export async function addWatermark(
  imageBuffer: Buffer,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  const {
    text = "EZCTO",
    opacity = 0.3,
    fontSize = 48,
    rotation = -45,
    color = "white",
  } = options;

  try {
    // Get image metadata
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;

    // Create watermark SVG with tiled pattern
    const watermarkSvg = `
      <svg width="${width}" height="${height}">
        <defs>
          <pattern id="watermark" x="0" y="0" width="${width / 3}" height="${height / 3}" patternUnits="userSpaceOnUse">
            <text 
              x="${width / 6}" 
              y="${height / 6}" 
              font-size="${fontSize}" 
              font-family="Arial, sans-serif" 
              font-weight="bold" 
              fill="${color}" 
              opacity="${opacity}" 
              transform="rotate(${rotation} ${width / 6} ${height / 6})"
              text-anchor="middle"
            >${text}</text>
          </pattern>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#watermark)" />
      </svg>
    `;

    // Composite watermark onto image
    const watermarkedBuffer = await image
      .composite([
        {
          input: Buffer.from(watermarkSvg),
          blend: "over",
        },
      ])
      .toBuffer();

    return watermarkedBuffer;
  } catch (error) {
    console.error("[Watermark] Failed to add watermark:", error);
    // Return original buffer if watermarking fails
    return imageBuffer;
  }
}

/**
 * Check if an image already has a watermark (simple heuristic)
 * @param imageBuffer - Image buffer to check
 * @returns true if watermark detected
 */
export async function hasWatermark(imageBuffer: Buffer): Promise<boolean> {
  // This is a placeholder - in production you might want to:
  // 1. Check image metadata for custom fields
  // 2. Use image analysis to detect watermark patterns
  // 3. Store watermark status in database
  return false;
}
