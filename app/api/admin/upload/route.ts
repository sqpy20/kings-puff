import { requireAdminPermission } from "@/lib/auth/admin";
import {
  isCloudinaryConfigured,
  uploadImageToCloudinary,
} from "@/lib/cloudinary";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Protected admin endpoint that uploads a product image directly to Cloudinary. */
export async function POST(request: Request) {
  const gate = await requireAdminPermission("inventory.write");
  if ("response" in gate) return gate.response;

  if (!isCloudinaryConfigured()) {
    return Response.json(
      { error: "Cloudinary storage is not configured on the server." },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "Expected multipart/form-data request." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json(
      { error: "Please attach a non-empty image file." },
      { status: 400 },
    );
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return Response.json(
      {
        error:
          "Unsupported image format. Please upload JPEG, PNG, WebP, GIF, or AVIF.",
      },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return Response.json(
      { error: "Image file exceeds the 10 MB upload limit." },
      { status: 400 },
    );
  }

  const rawPublicId = formData.get("publicId");
  const publicId =
    typeof rawPublicId === "string" && rawPublicId.trim()
      ? rawPublicId.trim()
      : undefined;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadImageToCloudinary(buffer, {
      folder: "momo-eliquid/products",
      publicId,
    });
    return Response.json(uploaded, { status: 201 });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? `Cloudinary upload failed: ${err.message}`
            : "Cloudinary upload failed.",
      },
      { status: 502 },
    );
  }
}
