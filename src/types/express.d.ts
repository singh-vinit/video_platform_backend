import { Role } from "@prisma/client";

//extended express request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
      };
    }
  }
}