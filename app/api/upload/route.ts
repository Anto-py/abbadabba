import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToDrive } from "@/lib/google-drive";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function extFromMime(mime: string) {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/heic") return "heic";
  return "jpg";
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jwt = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = jwt?.accessToken as string | undefined;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Token Google manquant — reconnecte-toi pour accorder l'accès Drive" },
      { status: 401 }
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  const categoryId = form.get("categoryId");
  const dateStr = form.get("date");
  const description = (form.get("description") as string | null) ?? "";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (typeof categoryId !== "string" || typeof dateStr !== "string") {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fichier > 25 Mo" }, { status: 413 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: `Type non supporté : ${file.type}` }, { status: 415 });
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category || category.userId !== userId) {
    return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const iso = date.toISOString().slice(0, 10);
  const slug = slugify(description) || "preuve";
  const ext = extFromMime(file.type);
  const fileName = `${iso}_${category.code}_${slug}.${ext}`;

  try {
    const result = await uploadToDrive(
      accessToken,
      buffer,
      file.type,
      fileName,
      date.getFullYear(),
      category.code,
    );
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    console.error("Drive upload error", e);
    return NextResponse.json({ error: "Upload Drive échoué" }, { status: 500 });
  }
}
