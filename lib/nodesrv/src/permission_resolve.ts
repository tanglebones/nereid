import debugCtor from 'debug';

export type permissionsType = Record<string, boolean>;

const debug = debugCtor(
  'db:permission',
);
const critical = debugCtor('critical:db:permission');

// This function should be given an array of unique permission_names, without duplicates,
// so the looping order shouldn't matter.

export function permissionResolve(permissionOperations: { permission_name: string, relation_type: string }[]): permissionsType {
  const permissions: permissionsType = {};

  for (const {permission_name: permissionName, relation_type: relType} of permissionOperations) {
    debug(`${relType} ${permissionName}`);
    switch (relType) {
      case 'add':
        permissions[permissionName] = true;
        break;
      case 'remove':
        delete permissions[permissionName];
        delete permissions[`+${permissionName}`];
        break;
      case 'add_grant':
        permissions[permissionName] = true;
        permissions[`+${permissionName}`] = true;
        break;
      default:
        critical(`${relType} is unknown`);
        break;
    }
  }
  return permissions;
}
