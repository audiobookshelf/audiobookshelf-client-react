'use client'

import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { CustomMetadataProvider } from '@/types/api'
import { useState } from 'react'
import SettingsContent from '../../SettingsContent'
import { createCustomMetadataProvider, deleteCustomMetadataProvider } from './actions'
import AddCustomMetadataProviderModal from './AddCustomMetadataProviderModal'
import CustomMetadataProvidersTable from './CustomMetadataProvidersTable'

interface CustomMetadataProvidersClientProps {
  providers: CustomMetadataProvider[]
}

export default function CustomMetadataProvidersClient({ providers: initialProviders }: CustomMetadataProvidersClientProps) {
  const t = useTypeSafeTranslations()

  const [providers, setProviders] = useState<CustomMetadataProvider[]>(initialProviders)
  const [processing, setProcessing] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const handleAddProvider = async (payload: { name: string; url: string; mediaType: 'book' | 'podcast'; authHeaderValue?: string }) => {
    const result = await createCustomMetadataProvider(payload)
    setProviders((prev) => [...prev, result.provider])
  }

  const handleDeleteProvider = async (providerId: string) => {
    setProcessing(true)

    try {
      await deleteCustomMetadataProvider(providerId)
      setProviders((prev) => prev.filter((provider) => provider.id !== providerId))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <SettingsContent
      title={t('HeaderCustomMetadataProviders')}
      backLink="/settings/item-metadata-utils"
      moreInfoUrl="https://www.audiobookshelf.org/guides/custom-metadata-providers"
      addButton={{
        label: t('ButtonAdd'),
        onClick: () => setIsAddModalOpen(true)
      }}
    >
      <div className="pt-2">
        <CustomMetadataProvidersTable providers={providers} processing={processing} onDeleteProvider={handleDeleteProvider} />
      </div>

      <AddCustomMetadataProviderModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddProvider} />
    </SettingsContent>
  )
}
