import type { Request, Response, NextFunction } from "express";
import type { Address } from "viem";

export type EndpointProps = {
  req: Request;
  res: Response;
};

export type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";

export type AsyncExpressResponse = Promise<Response>;
export type AsyncExpressResponseWithUser = Promise<ExpressResponseWithUser>;

export type ExpressRequestWithUser = Request & {
  user?: {
    address: Address;
    chainId: number;
    isAdmin?: boolean;
  };
};

export type ExpressEndpointPropsWithUser = {
  req: ExpressRequestWithUser;
  res: ExpressResponseWithUser;
};

export type ExpressResponseWithUser = Response & {
  user?: {
    address: Address;
    chainId: number;
    isAdmin?: boolean;
  };
};

export type MiddlewareProps = {
  req: ExpressRequestWithUser;
  res: ExpressResponseWithUser;
  next: NextFunction;
};
