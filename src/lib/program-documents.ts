export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;

const DOCUMENT_TYPES: Record<string, { mimeType: string; aliases?: string[] }> = {
  pdf: { mimeType: 'application/pdf' },
  doc: { mimeType: 'application/msword' },
  docx: { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  xls: { mimeType: 'application/vnd.ms-excel' },
  xlsx: { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  ppt: { mimeType: 'application/vnd.ms-powerpoint' },
  pptx: { mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  png: { mimeType: 'image/png' },
  jpg: { mimeType: 'image/jpeg' },
  jpeg: { mimeType: 'image/jpeg' },
  txt: { mimeType: 'text/plain' },
  csv: { mimeType: 'text/csv', aliases: ['application/csv', 'text/plain', 'application/vnd.ms-excel'] },
};

export const DOCUMENT_ACCEPT = Object.keys(DOCUMENT_TYPES).map((extension) => `.${extension}`).join(',');

/** Check the extension, browser MIME type and size before storing a document. */
export function validateUpload(
  name: string,
  type: string,
  size: number,
): { valid: boolean; error?: string; mimeType?: string } {
  if (!Number.isSafeInteger(size) || size <= 0) {
    return { valid: false, error: 'Choose a file that is not empty.' };
  }
  if (size > MAX_DOCUMENT_SIZE) {
    return { valid: false, error: 'File too large. Maximum 20 MB.' };
  }

  const extension = name.trim().split('.').pop()?.toLowerCase() ?? '';
  const documentType = Object.prototype.hasOwnProperty.call(DOCUMENT_TYPES, extension)
    ? DOCUMENT_TYPES[extension]
    : null;
  if (!documentType || !name.trim().includes('.')) {
    return { valid: false, error: 'Use a PDF, Word, Excel, PowerPoint, PNG, JPEG, text or CSV file.' };
  }

  const mimeType = type.split(';')[0].trim().toLowerCase();
  // Mobile file pickers sometimes omit the MIME type or report a generic one.
  if (mimeType && mimeType !== 'application/octet-stream' &&
      mimeType !== documentType.mimeType && !documentType.aliases?.includes(mimeType)) {
    return { valid: false, error: 'The file type does not match its extension.' };
  }

  return { valid: true, mimeType: documentType.mimeType };
}

/** Keep only a short, portable filename; storage directory names come from the server. */
export function safeFileName(name: string): string {
  const baseName = name.replace(/\\/g, '/').split('/').pop() ?? '';
  const clean = baseName.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^[._-]+|[._-]+$/g, '');
  if (!clean) return 'document';
  if (clean.length <= 180) return clean;

  const dot = clean.lastIndexOf('.');
  const extension = dot > 0 && clean.length - dot <= 10 ? clean.slice(dot) : '';
  return `${clean.slice(0, 180 - extension.length)}${extension}`;
}
