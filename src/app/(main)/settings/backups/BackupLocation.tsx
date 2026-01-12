import Btn from '@/components/ui/Btn'
import IconBtn from '@/components/ui/IconBtn'
import TextInput from '@/components/ui/TextInput'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { useState } from 'react'

interface BackupLocationProps {
  backupLocation: string
}

export default function BackupLocation({ backupLocation }: BackupLocationProps) {
  const t = useTypeSafeTranslations()
  const [isEditing, setIsEditing] = useState(false)
  const [editedBackupLocation, setEditedBackupLocation] = useState(backupLocation)

  const handleSave = () => {
    setIsEditing(false)
    if (editedBackupLocation === backupLocation) {
      return
    }
    // TODO: Save the backup location
    console.log('Saving backup location:', editedBackupLocation)
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
        <div className="flex items-center gap-2">
          <TextInput value={editedBackupLocation} className="text-sm" onChange={(value) => setEditedBackupLocation(value)} />
          <Btn size="small" color="bg-success" onClick={handleSave}>
            {t('ButtonSave')}
          </Btn>
          <Btn size="small" onClick={handleCancel}>
            {t('ButtonCancel')}
          </Btn>
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
