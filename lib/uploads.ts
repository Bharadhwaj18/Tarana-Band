// Shared rules for payment / refund proof screenshots (used by forms and API routes)

export const MAX_PROOF_SIZE_MB = 4;

const PROOF_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

// Returns an error message, or null when the file is fine
export function validateProofImage(file: { type: string; size: number }): string | null {
  if (!PROOF_EXTENSIONS[file.type]) {
    return 'Please upload a JPG, PNG or WEBP image.';
  }
  if (file.size > MAX_PROOF_SIZE_MB * 1024 * 1024) {
    return `Image is too large. Please upload a file under ${MAX_PROOF_SIZE_MB} MB.`;
  }
  return null;
}

export function getProofExtension(file: { type: string }): string {
  return PROOF_EXTENSIONS[file.type] || 'jpg';
}
