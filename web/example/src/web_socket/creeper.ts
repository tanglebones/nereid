import {serializableType} from "@nereid/anycore";
import {starRepositoryCloneFactoryType} from "@nereid/anycore/dist/star_repo";
import {creeperEventRegistry} from "@nereid/creeper";

export const creeperCtor = (starRepositoryCloneFactory: starRepositoryCloneFactoryType) => {
  const srCreeper = starRepositoryCloneFactory(
    creeperEventRegistry,
    console.error,
    {}
  );

  const set = async (params: serializableType) => {
    srCreeper.serverState = params;
    return true;
  }

  const commit = async (params: serializableType) => {
    srCreeper.onRebase(params);
    console.log('creeper commit', srCreeper.state);
    return true;
  }

  return {commit, set};
}
