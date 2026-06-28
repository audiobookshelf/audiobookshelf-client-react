import type { User, UserPermissions } from '@/types/api'

type UserWithPermissions = Pick<User, 'type' | 'permissions'>

export function isUserAdminOrUp(user: Pick<User, 'type'>): boolean {
  return user.type === 'admin' || user.type === 'root'
}

function hasUserPermission(user: UserWithPermissions, permission: keyof UserPermissions): boolean {
  return !!(user.permissions?.[permission] || isUserAdminOrUp(user))
}

export function userCanUpdate(user: UserWithPermissions): boolean {
  return hasUserPermission(user, 'update')
}

export function userCanDelete(user: UserWithPermissions): boolean {
  return hasUserPermission(user, 'delete')
}

export function userCanDownload(user: UserWithPermissions): boolean {
  return hasUserPermission(user, 'download')
}

export function getUserPermissionFlags(user: User) {
  const userIsAdminOrUp = isUserAdminOrUp(user)

  return {
    userCanUpdate: userCanUpdate(user),
    userCanDelete: userCanDelete(user),
    userCanDownload: userCanDownload(user),
    userIsAdminOrUp
  }
}
