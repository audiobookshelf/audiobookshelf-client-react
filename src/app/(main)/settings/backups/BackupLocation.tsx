import Btn from '@/components/ui/Btn'
import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useState, useTransition } from 'react'
import { updateBackupPath } from './actions'

interface BackupLocationProps {
  backupLocation: string
  backupPathEnvSet: boolean
}

export default function BackupLocation({ backupLocation, backupPathEnvSet }: BackupLocationProps) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [editedBackupLocation, setEditedBackupLocation] = useState(backupLocation)

  const handleSave = () => {
    if (isPending) return

    const newBackupLocation = editedBackupLocation.trim()
    if (!newBackupLocation) {
      showToast(t('MessageBackupsLocationPathEmpty'), { type: 'error' })
      return
    }

    if (newBackupLocation === backupLocation) {
      setIsEditing(false)
      return
    }

    startTransition(async () => {
      const success = await updateBackupPath(newBackupLocation)
      if (success) {
        setIsEditing(false)
        setEditedBackupLocation(newBackupLocation)
      } else {
        showToast(t('ToastFailedToUpdate'), { type: 'error' })
      }
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedBackupLocation(backupLocation)
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols text-xl text-foreground-subdued" aria-hidden="true">
          folder
        </span>
        <p className="text-foreground-subdued uppercase text-sm">{t('LabelBackupLocation')}</p>
      </div>
      {isEditing ? (
        <div>
          <div className="flex items-center gap-2">
            <TextInput value={editedBackupLocation} disabled={backupPathEnvSet} className="text-sm" onChange={(value) => setEditedBackupLocation(value)} />
            {!backupPathEnvSet && (
              <Btn size="small" color="bg-success" onClick={handleSave}>
                {t('ButtonSave')}
              </Btn>
            )}

            <Btn size="small" onClick={handleCancel}>
              {t('ButtonCancel')}
            </Btn>
          </div>
          <p className="text-sm text-foreground-subdued">{backupPathEnvSet ? t('MessageBackupsLocationNoEditNote') : t('MessageBackupsLocationEditNote')}</p>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <p className="text-base text-foreground break-all">{backupLocation}</p>
          <IconBtn
            ariaLabel={t('LabelEdit')}
            borderless
            size="small"
            className="text-foreground-muted cursor-pointer"
            onClick={() => {
              setIsEditing(true)
            }}
          >
            edit
          </IconBtn>
        </div>
      )}
    </div>
  )
}
