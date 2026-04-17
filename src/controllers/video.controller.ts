import { Request, Response } from "express";
import { prisma } from "../db/prisma";

// Frontend uploads to Supabase directly and sends us the URL
export const uploadVideo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { title, description, url } = req.body;

  if (!title || !url) {
    res.status(400).json({ message: "Title and video URL are required" });
    return;
  }

  // Basic check to ensure URL is a Firebase Storage URL
  if (!url.includes("supabase.co/storage")) {
    res.status(400).json({ message: "Invalid video URL" });
    return;
  }

  const video = await prisma.video.create({
    data: {
      title,
      description: description || null,
      url,
      creatorId: req.user!.id,
    },
  });

  res.status(201).json(video);
};

export const getMyVideos = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const videos = await prisma.video.findMany({
    where: { creatorId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(videos);
};

export const getVideoById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const video = await prisma.video.findUnique({
    where: { id: req.params.id as string },
    include: {
      creator: { select: { id: true, name: true } },
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!video) {
    res.status(404).json({ message: "Video not found" });
    return;
  }

  res.json(video);
};

export const deleteVideo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const video = await prisma.video.findUnique({
    where: { id: req.params.id as string },
  });

  if (!video || video.creatorId !== req.user!.id) {
    res.status(403).json({ message: "Not allowed" });
    return;
  }

  await prisma.video.delete({ where: { id: req.params.id as string } });
  res.json({ message: "Video deleted" });
};

export const updateVideo = async (req: Request, res: Response): Promise<void> => {
  const { title, description } = req.body;
  const id = req.params.id as string;

  if (!title?.trim()) {
    res.status(400).json({ message: "Title is required" });
    return;
  }

  const video = await prisma.video.findUnique({ where: { id } });

  if (!video || video.creatorId !== req.user!.id) {
    res.status(403).json({ message: "Not allowed" });
    return;
  }

  const updated = await prisma.video.update({
    where: { id },
    data: {
      title: title.trim(),
      description: description?.trim() || null,
    },
  });

  res.json(updated);
};