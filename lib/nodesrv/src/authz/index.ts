export type ctxAuthzType = {
  permission?: {
    [name: string]: boolean,
  },
  user?: {
    login: string
  }
};

export type authzType = (ctx: ctxAuthzType) => boolean;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const anon: authzType = (_: ctxAuthzType) => {
  return true;
};

const anyUser: authzType = (ctx: ctxAuthzType) => {
  return !!(ctx.permission && ctx.user?.login);
};

const allOf = (perm: string[]) => (ctx: ctxAuthzType) => {
  const {permission} = ctx;
  if (!permission) {
    return false;
  }

  for (const p of perm) {
    if (!permission[p]) {
      return false;
    }
  }

  return perm.length > 0;
};

const anyOf = (perm: string[]) => (ctx: ctxAuthzType) => {
  const {permission} = ctx;
  if (!permission) {
    return false;
  }
  for (const p of perm) {
    if (permission[p]) {
      return true;
    }
  }
  return false;
};

const anyOfAuthz = (az: authzType[]) => (ctx: ctxAuthzType) => {
  for (const authz of az) {
    if (authz(ctx)) {
      return true;
    }
  }
  return false;
};

const allOfAuthz = (az: authzType[]) => (ctx: ctxAuthzType) => {
  for (const authz of az) {
    if (!authz(ctx)) {
      return false;
    }
  }
  return az.length > 0;
};

export const authz = {
  anon,
  anyUser,
  allOf,
  anyOf,
  allOfAuthz,
  anyOfAuthz,
};
