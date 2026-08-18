import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

import { auth } from "@/auth";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/avif", ".avif"],
]);

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ message: "دسترسی غیرمجاز است." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "فایل تصویر ارسال نشده است." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          message: "فرمت فایل نامعتبر است. فقط JPG, PNG, WEBP, AVIF مجاز هستند.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          message: "حجم فایل بیشتر از 5 مگابایت است.",
        },
        { status: 400 }
      );
    }

    const extension = ALLOWED_MIME_TYPES.get(file.type);

    if (!extension) {
      return NextResponse.json({ message: "پسوند فایل قابل تشخیص نیست." }, { status: 400 });
    }

    const fileName = `${randomUUID()}${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    const filePath = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return NextResponse.json(
      {
        message: "آپلود تصویر با موفقیت انجام شد.",
        url: `/uploads/products/${fileName}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ADMIN_PRODUCT_IMAGE_UPLOAD_ERROR]", error);

    return NextResponse.json(
      { message: "خطای داخلی سرور در آپلود تصویر." },
      { status: 500 }
    );
  }
}
