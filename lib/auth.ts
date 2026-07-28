import { createHmac, timingSafeEqual } from "crypto";

export const AUTH_COOKIE_NAME = "dsa_command_center_session";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function required(name: "AUTH_USERNAME" | "AUTH_PASSWORD" | "AUTH_SECRET") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function getExpectedCredentials() {
  return {
    username: required("AUTH_USERNAME"),
    password: required("AUTH_PASSWORD"),
  };
}

export function createSessionToken() {
  const { username, password } = getExpectedCredentials();
  return createHmac("sha256", required("AUTH_SECRET"))
    .update(`${username}:${password}`)
    .digest("hex");
}

export function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
