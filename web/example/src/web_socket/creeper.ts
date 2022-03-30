import {serializableType, stateModifierFunctionType} from "@nereid/anycore";
import {starRepositoryCloneFactoryType} from "@nereid/anycore/dist/star_repo";

export const creeperCtor = (
  starRepositoryCloneFactory: starRepositoryCloneFactoryType,
  creeperEventRegistry: Readonly<Record<string, stateModifierFunctionType>>
) => {
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
    console.log(repo.localState);
    return true;
  }

  return {wsRebase, wsSetState, repo};
}
