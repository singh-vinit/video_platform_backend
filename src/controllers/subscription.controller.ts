import { Request, Response } from "express";
import { prisma } from "../db/prisma";

export const subscribe = async (req: Request, res: Response): Promise<void> => {
  const { creatorId } = req.params;
  const userId = req.user!.id;

  if (userId === creatorId) {
    res.status(400).json({ message: "Cannot subscribe to yourself" });
    return;
  }

  const existing = await prisma.subscription.findUnique({
    //@ts-ignore
    where: { userId_creatorId: { userId, creatorId } },
  });

  if (existing) {
    res.status(409).json({ message: "Already subscribed" });
    return;
  }

  const sub = await prisma.subscription.create({
    //@ts-ignore
    data: { userId, creatorId },
  });

  res.status(201).json(sub);
};

export const unsubscribe = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { creatorId } = req.params;
  const userId = req.user!.id;

  await prisma.subscription.deleteMany({
    //@ts-ignore
    where: { userId, creatorId },
  });

  res.json({ message: "Unsubscribed" });
};

// Feed: videos from subscribed creators + other creators mixed in
export const getFeed = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    select: { creatorId: true },
  });

  const subscribedIds = subscriptions.map((s) => s.creatorId);

  const [subscribedVideos, otherVideos] = await Promise.all([
    prisma.video.findMany({
      where: { creatorId: { in: subscribedIds } },
      include: { creator: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.video.findMany({
      where: { creatorId: { notIn: subscribedIds } },
      include: { creator: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  res.json({ subscribedVideos, otherVideos });
};

export const getMySubscriptions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const subs = await prisma.subscription.findMany({
    where: { userId: req.user!.id },
    include: { creator: { select: { id: true, name: true } } },
  });
  res.json(subs);
};
