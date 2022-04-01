import {serializableType, starRepositoryCloneFactoryType, stateModifierFunctionType} from "@nereid/anycore";

export const creeperClientCtor = (starRepositoryCloneFactory: starRepositoryCloneFactoryType, creeperEventRegistry: Readonly<Record<string, stateModifierFunctionType>>) => {
  const repo = starRepositoryCloneFactory(
    creeperEventRegistry,
    console.error,
    {}
  );

  const wsSetState = async (params: serializableType) => {
    repo.serverState = params;
    return true;
  }

  const wsRebase = async (params: serializableType) => {
    repo.onRebase(params);
    return true;
  }

  return {wsRebase, wsSetState, repo};
}

export type creeperClientType = ReturnType<typeof creeperClientCtor>;
