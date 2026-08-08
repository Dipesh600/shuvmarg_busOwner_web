const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILENAME_LENGTH = 180;

const FORMATS = {
  "application/pdf": {
    extensions: ["pdf"],
    signature: [0x25, 0x50, 0x44, 0x46, 0x2d],
  },
  "image/jpeg": {
    extensions: ["jpg", "jpeg"],
    signature: [0xff, 0xd8, 0xff],
  },
  "image/png": {
    extensions: ["png"],
    signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
} as const;

function bytesMatch(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function hasUnsafeFilename(name: string): boolean {
  return (
    !name ||
    name.length > MAX_FILENAME_LENGTH ||
    name.startsWith(".") ||
    name.startsWith("-") ||
    name.endsWith(".") ||
    name.includes("\0") ||
    name.includes("/") ||
    name.includes("\\") ||
    name.includes("..")
  );
}

export async function validateKycDraftFile(file: File): Promise<string | null> {
  if (hasUnsafeFilename(file.name)) {
    return `${file.name || "Document"} has an unsafe filename.`;
  }
  if (file.size === 0) return `${file.name} is empty.`;
  if (file.size > MAX_FILE_SIZE) return `${file.name} must be 5 MB or smaller.`;

  const format = FORMATS[file.type as keyof typeof FORMATS];
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!format || !(format.extensions as readonly string[]).includes(extension)) {
    return `${file.name} must be a PDF, JPG or PNG.`;
  }

  const firstBytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (!bytesMatch(firstBytes, format.signature)) {
    return `${file.name} does not match its declared file type.`;
  }

  if (file.type === "application/pdf") {
    const tail = await file.slice(Math.max(0, file.size - 2048)).text();
    if (!/%%EOF[\u0000\t\n\f\r ]*$/.test(tail)) {
      return `${file.name} appears incomplete or malformed.`;
    }
  } else if (file.type === "image/jpeg") {
    const tail = new Uint8Array(await file.slice(-2).arrayBuffer());
    if (tail[0] !== 0xff || tail[1] !== 0xd9) {
      return `${file.name} appears incomplete or malformed.`;
    }
  } else {
    const pngEnd = [
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
      0xae, 0x42, 0x60, 0x82,
    ];
    const tail = new Uint8Array(await file.slice(-pngEnd.length).arrayBuffer());
    if (!bytesMatch(tail, pngEnd)) {
      return `${file.name} appears incomplete or malformed.`;
    }
  }

  return null;
}
