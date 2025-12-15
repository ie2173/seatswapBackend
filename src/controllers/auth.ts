import jwt from "jsonwebtoken";
import { SiweMessage } from "siwe";
import type {
  ExpressRequest,
  ExpressResponse,
  AsyncExpressResponse,
  ExpressRequestWithUser,
  ExpressResponseWithUser,
} from "@/types";
import { generateNonce, nonceStore } from "@/utils";
import { UserSchema } from "@/models";

/**
 * Api endpoint to generate a nonce for a given Ethereum address to be used in the SIWE authentication flow.
 * @param address - The Ethereum address for which to generate the nonce.
 * @returns nonce - A unique nonce string that can be used for authentication.
 * @throws 400 - If the address is missing or invalid.
 */
export const getNonce = (
  req: ExpressRequest,
  res: ExpressResponse
): ExpressResponse => {
  const { address } = req.body;
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: "Proper Address is required" });
  }
  const nonce = generateNonce();
  nonceStore.set({ address, nonce });
  return res.status(200).json({ nonce });
};

/**
 * Api endpoint to verify a SIWE message and signature, and authenticate the user and return a JWT token.
 * @param address - The Ethereum address of the user to authenticate.
 * @param message - The SIWE message to verify.
 * @param signature - The signature of the SIWE message.
 * @returns token - A JWT token that can be used for authenticated requests.
 * @throws 400 - If the message or signature is missing or invalid.
 */

export const verifySignature = async (
  req: ExpressRequest,
  res: ExpressResponse
): AsyncExpressResponse => {
  const { address, message, signature } = req.body;
  if (!address || !message || !signature) {
    return res
      .status(400)
      .json({ error: "Address, message, and signature are required" });
  }
  try {
    // Parse the SIWE message and verify correct parameters
    const siweMessage = new SiweMessage(message);

    // Verify address in request matches address in SIWE message
    if (siweMessage.address.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({ error: "Address mismatch" });
    }

    // Domain
    // Allow configuring one or more allowed domains via SIWE_DOMAIN env var (comma-separated).
    // Normalize domains by removing protocol, www and trailing slashes so values like
    // `https://seatswap.net` or `seatswap.net` both match.
    const rawAllowed = process.env.SIWE_DOMAIN || "localhost";
    let allowed = rawAllowed
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => d.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "").toLowerCase());

    // In production, explicitly disallow localhost and loopback addresses.
    if (process.env.NODE_ENV === "production") {
      allowed = allowed.filter((d) => d !== "localhost" && d !== "127.0.0.1");
      if (allowed.length === 0) {
        // If no allowed domains were provided for production, default to seatswap.net
        allowed = ["seatswap.net"];
      }
    }
    const messageDomainNormalized = (siweMessage.domain || "")
      .toString()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/$/, "")
      .toLowerCase();

    if (!allowed.includes(messageDomainNormalized)) {
      console.warn("SIWE domain mismatch", { messageDomain: siweMessage.domain, allowed });
      return res.status(400).json({ error: "Invalid domain" });
    }
    // Nonce - check against nonce store
    const userNonce = nonceStore.get({ address });
    if (!userNonce || siweMessage.nonce !== userNonce) {
      // if nonce is invalid, delete it from the store
      if (userNonce) {
        nonceStore.delete({ address });
      }
      return res.status(400).json({ error: "Invalid nonce" });
    }
    //chainId
    if (siweMessage.chainId !== 84532) {
      return res.status(400).json({ error: "Invalid chainId" });
    }
    // Require expirationTime
    if (!siweMessage.expirationTime) {
      return res
        .status(400)
        .json({ error: "Message must include expiration time" });
    }
    // Verify expirationTime is within 15 minutes from now
    const expirationDate = new Date(siweMessage.expirationTime);
    const maxExpirationDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    if (expirationDate > maxExpirationDate) {
      return res
        .status(400)
        .json({ error: "Message expiration time must be within 15 minutes" });
    }
    // Verify the signature
    await siweMessage.verify({ signature });
    let user = await UserSchema.findOne({ address: address.toLowerCase() });
    if (!user) {
      const newUser = new UserSchema({ address: address.toLowerCase() });
      await newUser.save();
      user = newUser;
    }

    // if valid delete nonce from the store and generate JWT Token
    nonceStore.delete({ address });
    const token = jwt.sign(
      {
        address: siweMessage.address.toLowerCase(),
        chainId: siweMessage.chainId,
        isAdmin: user.isAdmin || false,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return res.status(200).json({ token });
  } catch (error) {
    console.error("Error verifying SIWE message:", error);
    if (error instanceof Error) {
      if (error.message.includes("Signature verification failed")) {
        return res.status(401).json({ error: "Invalid signature" });
      }
      if (error.message.includes("expired")) {
        return res.status(401).json({ error: "Message expired" });
      }
    }

    return res.status(401).json({ error: "Verification failed" });
  }
};

/**
 * Api endpoint to logout a user by invalidating their JWT token.
 * @returns success - A message indicating the user has been logged out.
 */

export const logout = async (
  req: ExpressRequestWithUser,
  res: ExpressResponseWithUser
): AsyncExpressResponse => {
  try {
    const address = req.user?.address;

    if (address) {
      nonceStore.delete({ address });
    }
    return res.status(200).json({ success: "User logged out" });
  } catch (error) {
    console.error("Error logging out user:", error);
    return res.status(500).json({ error: "Logout failed" });
  }
};

/**
 * Api endpoint to verify a JWT token and return its status and account address.
 * @param token - The JWT token to verify.
 * @returns status - 'expired' or 'valid', and the account address if valid.
 */
export const verifyJwt = (
  req: ExpressRequest,
  res: ExpressResponse
): ExpressResponse => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // If verification succeeds, token is valid
    return res.status(200).json({
      status: "valid",
      address: decoded.address,
      chainId: decoded.chainId,
      isAdmin: decoded.isAdmin || false,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ status: "expired", error: "JWT has expired" });
    }
    return res.status(401).json({ status: "invalid", error: "JWT is invalid" });
  }
};
