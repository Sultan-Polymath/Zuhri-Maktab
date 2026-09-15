import { randomBytes, randomInt } from "crypto";

export function generateTempPassword(): string {
  return randomBytes(9).toString("base64url");
}

export function generatePin(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}
