import { createParamDecorator } from '@nestjs/common';

export const NativeAuth = createParamDecorator((key, req) => {
  const nativeAuth = req.args[0].nativeAuth;
  if (!nativeAuth) {
    return undefined;
  }

  if (key === undefined) {
    return nativeAuth;
  }

  return nativeAuth[key];
});
