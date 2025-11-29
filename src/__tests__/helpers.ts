import type { ExpressRequestWithUser, ExpressResponseWithUser } from "@/types";

export const createMockRequest = (
  overrides: Partial<ExpressRequestWithUser> = {}
): ExpressRequestWithUser => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    file: undefined,
    ...overrides,
  } as ExpressRequestWithUser;
};

export const createMockResponse = (): ExpressResponseWithUser => {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    status: function (code: number) {
      this.statusCode = code;
      return this;
    },
    json: function (data: any) {
      this.jsonData = data;
      return this;
    },
  };
  return res as ExpressResponseWithUser;
};

export const createMockFile = (
  overrides: Partial<Express.Multer.File> = {}
): Express.Multer.File => {
  return {
    fieldname: "file",
    originalname: "test.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    size: 1024,
    buffer: Buffer.from("test"),
    stream: null as any,
    destination: "",
    filename: "test.jpg",
    path: "",
    ...overrides,
  } as Express.Multer.File;
};
