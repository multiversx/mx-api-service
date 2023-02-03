import { createParamDecorator } from "@nestjs/common";

export const UserAddress = createParamDecorator((_, req) => {
  const jwt = req.args[0].jwt;
  const nativeAuth = req.args[0].nativeAuth;

  const address = jwt?.address ?? nativeAuth?.address;
  return address;
});
