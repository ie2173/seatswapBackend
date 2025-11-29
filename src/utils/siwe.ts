import { randomBytes } from "crypto";

export const generateNonce = (length: number = 16): string => {
  return randomBytes(length).toString("hex");
};
