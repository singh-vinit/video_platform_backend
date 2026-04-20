import { Request, Response } from "express";
import { prisma } from "../db/prisma";

// Get all creator and their videos
export const getAllCreators = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const creators = await prisma.user.findMany({
      where: { role: "CREATOR" },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });
    res.json(creators);
  } catch (error) {
    console.error("Error fetching creators:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get single creator by ID and their videos
export const getCreatorById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const creator = await prisma.user.findUnique({
      where: { id: req.params.id as string },
      select: {
        id: true,
        name: true,
        createdAt: true,
        videos: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!creator || creator === null) {
      res.status(404).json({ message: "Creator not found" });
      return;
    }

    res.json(creator);
  } catch (error) {
    console.error("Error fetching creator+videos:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
