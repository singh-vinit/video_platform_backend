import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import supabase from "../utils/supabase";

// Extracts "videos/filename.mp4" from the full Supabase public URL
function extractStoragePath(url: string): string | null {
  try {
    // Supabase public URLs look like: https://xyz.supabase.co/storage/v1/object/public/videos/filename.mp4
    const marker = "/object/public/";
    const index = url.indexOf(marker);
    if (index === -1) return null;
    return url.substring(index + marker.length);
  } catch {
    return null;
  }
}

// Frontend uploads to Supabase directly and sends us the URL
export const uploadVideo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
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
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyVideos = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const videos = await prisma.video.findMany({
      where: { creatorId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(videos);
  } catch (error) {
    console.error("Error fetching my videos:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getVideoById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
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
  } catch (error) {
    console.error("Error fetching video by ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteVideo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const video = await prisma.video.findUnique({
      where: { id: req.params.id as string },
    });

    if (!video || video.creatorId !== req.user!.id) {
      res.status(403).json({ message: "Not allowed" });
      return;
    }

    //extract storage path from URL
    const storagePath = extractStoragePath(video.url);
    if (storagePath) {
      const bucket = process.env.SUPABASE_BUCKET || "creator_videos";
      const filePath = storagePath.replace(`${bucket}/`, ""); // Remove bucket prefix
      const { error } = await supabase.storage.from(bucket).remove([filePath]);
      if (error) {
        // Log but don't block — DB record should still be deleted
        console.error("Supabase storage delete failed:", error.message);
      } else {
        console.log("video deleted from supabase storage:", storagePath);
      }
    }

    await prisma.video.delete({ where: { id: req.params.id as string } });
    res.json({ message: "Video deleted" });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateVideo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
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
  } catch (error) {
    console.error("Error updating video:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
