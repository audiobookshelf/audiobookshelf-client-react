import type { User, UserPermissions } from '@/types/api'

type UserWithPermissions = Pick<User, 'type' | 'permissions'>

export function isUserAdminOrUp(userType: string): boolean {
  return userType === 'admin' || userType === 'root'
}

/**
 * User "Home" page is the default library, or libraries settings for admin/root when none exist yet
 * (Vue: `/config/libraries` for root with no libraries).
 */
export function getUserDefaultUrlPath(userDefaultLibraryId: string | null, userType: string) {
  return userDefaultLibraryId ? `/library/${userDefaultLibraryId}` : isUserAdminOrUp(userType) ? '/settings/libraries' : '/account'
}

function hasUserPermission(user: UserWithPermissions, permission: keyof UserPermissions): boolean {
  return !!(user.permissions?.[permission] || isUserAdminOrUp(user.type))
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
  const userIsAdminOrUp = isUserAdminOrUp(user.type)

  return {
    userCanUpdate: userCanUpdate(user),
    userCanDelete: userCanDelete(user),
    userCanDownload: userCanDownload(user),
    userIsAdminOrUp
  }
}
