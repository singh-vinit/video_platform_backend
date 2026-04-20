import { Request, Response } from "express";
import { prisma } from "../db/prisma";

export const postComment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { content } = req.body;
    const { videoId } = req.params;

    if (!content?.trim()) {
      res.status(400).json({ message: "Comment cannot be empty" });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: req.user!.id,
        // @ts-ignore
        videoId,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error posting comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getComments = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const comments = await prisma.comment.findMany({
      //@ts-ignore
      where: { videoId: req.params.videoId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
