import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdminUser } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";

const statuses = ["NEW", "IN_REVIEW", "RESOLVED"] as const;
const categories = ["ERROR", "CONFUSING_FEATURE", "SUGGESTION"] as const;

export async function GET(request: NextRequest) {
  if (!isAdminUser(await getCurrentUser())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 15));
  const category = searchParams.get("category");
  const reviewStatus = searchParams.get("status");
  const where = {
    ...(categories.includes(category as typeof categories[number]) ? { category: category as typeof categories[number] } : {}),
    ...(statuses.includes(reviewStatus as typeof statuses[number]) ? { reviewStatus: reviewStatus as typeof statuses[number] } : {}),
  };
  const [total, feedback] = await Promise.all([
    prisma.productFeedback.count({ where }),
    prisma.productFeedback.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      // Contact details are selected only for records that explicitly retained a contact user.
      select: { id: true, category: true, description: true, currentPath: true, technicalData: true, reviewStatus: true, createdAt: true, contactUserId: true, contactUser: { select: { name: true, email: true } } },
    }),
  ]);
  return NextResponse.json({ feedback: feedback.map((item) => ({ ...item, contact: item.contactUserId ? item.contactUser : null })), page, totalPages: Math.max(1, Math.ceil(total / limit)), total });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminUser(await getCurrentUser())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const body = await request.json().catch(() => null) as { id?: string; reviewStatus?: string } | null;
  if (!body?.id || !statuses.includes(body.reviewStatus as typeof statuses[number])) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  await prisma.productFeedback.update({ where: { id: body.id }, data: { reviewStatus: body.reviewStatus as typeof statuses[number] } });
  return NextResponse.json({ success: true });
}
