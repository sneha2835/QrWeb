import crypto from "crypto";

export function signSession(value: string, secret: string) {
  const sig = crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("hex");

  return `${value}.${sig}`;
}

export function verifySession(signed: string, secret: string) {
  const [value, sig] = signed.split(".");
  if (!value || !sig) return null;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("hex");

  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }

  return value;
}
