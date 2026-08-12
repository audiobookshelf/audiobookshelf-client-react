import type { User, UserPermissions } from '@/types/api'

type UserWithPermissions = Pick<User, 'type' | 'permissions'>

export function isUserAdminOrUp(userType: string): boolean {
  return userType === 'admin' || userType === 'root'
}

/**
 * User "Home" page is the default library, or `/library` empty home when none exist yet
 * (Vue: `/config/libraries` for root with no libraries; React uses `/library` empty state).
 */
export function getUserDefaultUrlPath(userDefaultLibraryId: string | null, _userType?: string) {
  return userDefaultLibraryId ? `/library/${userDefaultLibraryId}` : '/library'
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

export function userCanUpload(user: UserWithPermissions): boolean {
  return !!user.permissions?.upload
}

export function getUserPermissionFlags(user: User) {
  const userIsAdminOrUp = isUserAdminOrUp(user.type)

  return {
    userCanUpdate: userCanUpdate(user),
    userCanDelete: userCanDelete(user),
    userCanDownload: userCanDownload(user),
    userCanUpload: userCanUpload(user),
    userIsAdminOrUp
  }
}
