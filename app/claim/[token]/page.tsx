import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/token";
import { getFilteredCatalog, getRecommendedCategories } from "@/lib/catalog";
import { getTemplate } from "@/lib/card-templates";
import ClaimClient from "./ClaimClient";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ClaimPage({ params }: Props) {
  const { token } = await params;

  if (!token || token.length < 32) {
    return <ErrorState title="Invalid Link" message="This gift link is not valid." />;
  }

  const tokenHash = hashToken(token);

  const order = await prisma.giftOrder.findFirst({
    where: { claimTokenHash: tokenHash },
  });

  if (!order) {
    return <ErrorState title="Gift Not Found" message="This gift link is invalid or has already been used." />;
  }

  // Check expiry
  if (order.claimExpiresAt && new Date() > order.claimExpiresAt) {
    return (
      <ErrorState
        title="Link Expired"
        message="This gift link has expired. Please contact the sender to request a new one."
      />
    );
  }

  // Check status
  if (order.status === "LOCKED" || order.status === "REDEEMED" || order.status === "FULFILLED" || order.status === "FULFILLING") {
    return <ErrorState title="Already Claimed" message="This gift has already been claimed." />;
  }

  if (order.status !== "ACTIVE") {
    return (
      <ErrorState
        title="Not Yet Available"
        message="This gift is not available for claiming yet. Payment may still be processing."
      />
    );
  }

  // Get budget info
  const maxCents = order.amountType === "FIXED"
    ? (order.amountFixed ?? 0)
    : (order.amountMax ?? 0);
  const minCents = order.amountType === "RANGE" ? (order.amountMin ?? 0) : undefined;

  // Fetch catalog
  const catalog = await getFilteredCatalog({ maxCents, minCents });
  const recommendedCategories = getRecommendedCategories(order.occasion);
  const template = getTemplate(order.cardTemplateId);

  // Separate recommended items
  const recommended = catalog
    .filter((item) => recommendedCategories.includes(item.category))
    .slice(0, 3);

  return (
    <ClaimClient
      token={token}
      order={{
        senderName: order.senderName,
        recipientName: order.recipientName,
        message: order.message,
        occasion: order.occasion,
        cardTemplateId: order.cardTemplateId,
        amountType: order.amountType,
        maxCents,
        minCents: minCents ?? null,
      }}
      template={template}
      catalog={catalog.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        priceCents: item.priceCents,
        category: item.category,
        imageUrl: item.imageUrl,
        isBestMatch: item.isBestMatch,
      }))}
      recommended={recommended.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        priceCents: item.priceCents,
        category: item.category,
        imageUrl: item.imageUrl,
        isBestMatch: item.isBestMatch,
      }))}
    />
  );
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <div className="text-6xl">😔</div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
