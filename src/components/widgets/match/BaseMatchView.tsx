'use client'

import { applyMatchAction } from '@/app/actions/matchActions'
import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import IconBtn from '@/components/ui/IconBtn'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useTypeSafeTranslations } from '@/hooks/useTypeSafeTranslations'
import { UpdateLibraryItemMediaPayload } from '@/types/api'
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'

interface BaseMatchViewProps<TUsage extends { [key: string]: boolean }, TMatch> {
  libraryItemId: string
  defaultMatchUsage: TUsage
  localStorageKey: string
  buildMatchUpdatePayload: (selectedMatchUsage: TUsage, selectedMatch: TMatch) => UpdateLibraryItemMediaPayload | null
  selectedMatch: TMatch
  onBack: () => void
  onSuccess?: () => void
  children: (props: {
    selectedMatchUsage: TUsage
    setSelectedMatchUsage: React.Dispatch<React.SetStateAction<TUsage>>
    createFieldUsageHandler: (field: keyof TUsage) => (value: boolean) => void
    handleSubmitMatchUpdate: (e?: React.FormEvent | React.MouseEvent) => void
  }) => React.ReactNode
}

export default function BaseMatchView<TUsage extends { [key: string]: boolean }, TMatch>({
  libraryItemId,
  defaultMatchUsage,
  localStorageKey,
  buildMatchUpdatePayload,
  selectedMatch,
  onBack,
  onSuccess,
  children
}: BaseMatchViewProps<TUsage, TMatch>) {
  const t = useTypeSafeTranslations()
  const { showToast } = useGlobalToast()
  const [isPendingApply, startApplyTransition] = useTransition()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showShadow, setShowShadow] = useState(false)

  const [selectedMatchUsage, setSelectedMatchUsage] = useState<TUsage>(() => {
    try {
      const saved = localStorage.getItem(localStorageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...defaultMatchUsage, ...parsed }
      }
    } catch (error) {
      console.error(`Failed to load saved ${localStorageKey}`, error)
    }
    return defaultMatchUsage
  })

  const selectAll = useMemo(() => Object.values(selectedMatchUsage).every((v) => v === true), [selectedMatchUsage])

  const handleSelectAllToggle = useCallback(
    (value: boolean) => {
      const newUsage = Object.keys(selectedMatchUsage).reduce((acc, key) => {
        ;(acc as TUsage)[key as keyof TUsage] = value as TUsage[keyof TUsage]
        return acc
      }, {} as TUsage)
      setSelectedMatchUsage(newUsage)
    },
    [selectedMatchUsage]
  )

  const createFieldUsageHandler = useCallback(
    (field: keyof TUsage) => (value: boolean) => {
      setSelectedMatchUsage((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleSubmitMatchUpdate = useCallback(
    (e?: React.FormEvent | React.MouseEvent) => {
      e?.preventDefault()

      const updatePayload = buildMatchUpdatePayload(selectedMatchUsage, selectedMatch)
      if (!updatePayload || Object.keys(updatePayload).length === 0) {
        return
      }

      // Persist in local storage
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(selectedMatchUsage))
      } catch (error) {
        console.error(`Failed to save ${localStorageKey}`, error)
      }

      startApplyTransition(async () => {
        try {
          const result = await applyMatchAction(libraryItemId, updatePayload)
          if (result?.updated) {
            showToast(t('ToastItemDetailsUpdateSuccess'), { type: 'success' })
          } else {
            showToast(t('ToastNoUpdatesNecessary'), { type: 'info' })
          }
          if (onSuccess) {
            onSuccess()
          } else {
            onBack()
          }
        } catch (error) {
          console.error('Failed to update', error)
          showToast(error instanceof Error ? error.message : t('ToastFailedToUpdate'), { type: 'error' })
        }
      })
    },
    [buildMatchUpdatePayload, libraryItemId, selectedMatchUsage, selectedMatch, localStorageKey, t, showToast, onBack, onSuccess]
  )

  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const isScrollable = container.scrollHeight > container.clientHeight
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 1
    setShowShadow(isScrollable && !isAtBottom)
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Check initial state
    checkScroll()

    // Add scroll listener
    container.addEventListener('scroll', checkScroll)

    // Add resize observer to check when content size changes
    const resizeObserver = new ResizeObserver(checkScroll)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', checkScroll)
      resizeObserver.disconnect()
    }
  }, [checkScroll])

  return (
    <div className="w-full py-6 md:py-8 flex flex-col overflow-hidden">
      <div className="flex items-center mb-4 flex-shrink-0">
        <IconBtn borderless size="large" iconClass="text-3xl" onClick={onBack} ariaLabel={t('ButtonBack')}>
          arrow_back
        </IconBtn>
        <p className="text-xl pl-3">{t('HeaderUpdateDetails')}</p>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden pr-2 pl-1 pt-1">
        <Checkbox value={selectAll} onChange={handleSelectAllToggle} label={t('LabelSelectAll')} checkboxBgClass="bg-bg" className="w-fit" />

        <form onSubmit={handleSubmitMatchUpdate}>
          {children({
            selectedMatchUsage,
            setSelectedMatchUsage,
            createFieldUsageHandler,
            handleSubmitMatchUpdate
          })}
        </form>
      </div>

      <div className={`flex items-center justify-end py-2 mt-4 flex-shrink-0 transition-shadow duration-200 ${showShadow ? 'box-shadow-md-up' : ''}`}>
        <Btn color="bg-success" type="submit" disabled={isPendingApply} loading={isPendingApply} onClick={handleSubmitMatchUpdate}>
          {t('ButtonSubmit')}
        </Btn>
      </div>
    </div>
  )
}
