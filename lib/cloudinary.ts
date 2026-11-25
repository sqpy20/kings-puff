import { v2 as cloudinary } from "cloudinary";
import "server-only";

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
};

type ParsedCloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

function parseCloudinaryEnv(): ParsedCloudinaryConfig | null {
  const raw = process.env.CLOUDINARY_URL?.trim();
  if (raw) {
    try {
      const parsed = new URL(raw);
      if (parsed.protocol === "cloudinary:" && parsed.hostname) {
        const cloudName = parsed.hostname;
        const apiKey = decodeURIComponent(parsed.username);
        const apiSecret = decodeURIComponent(parsed.password);
        if (cloudName && apiKey && apiSecret) {
          return { cloudName, apiKey, apiSecret };
        }
      }
    } catch {
      return null;
    }
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (cloudName && apiKey && apiSecret) {
    return { cloudName, apiKey, apiSecret };
  }

  return null;
}

function getConfiguredCloudinary() {
  const creds = parseCloudinaryEnv();
  if (!creds) {
    throw new Error("Cloudinary environment variables are not configured.");
  }
  cloudinary.config({
    cloud_name: creds.cloudName,
    api_key: creds.apiKey,
    api_secret: creds.apiSecret,
    secure: true,
  });
  return cloudinary;
}

export function isCloudinaryConfigured(): boolean {
  return parseCloudinaryEnv() !== null;
}

export function getCloudinaryCloudName(): string | null {
  return parseCloudinaryEnv()?.cloudName ?? null;
}

/** Uploads an image buffer to Cloudinary and returns its secure URL and metadata. */
export async function uploadImageToCloudinary(
  buffer: Buffer,
  options?: { folder?: string; publicId?: string },
): Promise<CloudinaryUploadResult> {
  const client = getConfiguredCloudinary();
  const folder = options?.folder ?? "momo-eliquid/products";
  const cleanPublicId = options?.publicId
    ?.toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder,
        ...(cleanPublicId ? { public_id: cleanPublicId } : {}),
        resource_type: "image",
        overwrite: true,
        unique_filename: !cleanPublicId,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(
            error ?? new Error("Cloudinary did not return a secure image URL."),
          );
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );
    stream.end(buffer);
  });
}

/** Deletes an uploaded image asset from Cloudinary by publicId. */
export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  if (!publicId) return;
  const client = getConfiguredCloudinary();
  await client.uploader.destroy(publicId, { resource_type: "image" });
}
