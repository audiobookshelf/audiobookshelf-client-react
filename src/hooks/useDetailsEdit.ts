import React, { useCallback, useEffect, useImperativeHandle, useMemo, useReducer } from 'react'

// Generic state interface
interface EditState<TDetails> {
  details: TDetails
  tags: string[]
  initialDetails: TDetails
  initialTags: string[]
}

// Generic action types
type Action<TDetails> =
  | { type: 'RESET_STATE'; payload: { details: TDetails; tags: string[] } }
  | { type: 'UPDATE_FIELD'; payload: { field: keyof TDetails; value: TDetails[keyof TDetails] } }
  | { type: 'UPDATE_TAGS'; payload: { tags: string[] } }
  | { type: 'BATCH_UPDATE'; payload: { batchDetails: Partial<TDetails & { tags: string[] }>; mapType: 'overwrite' | 'append' } }

// Generic reducer factory
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDetailsReducer<TDetails extends Record<string, any>>(
  batchAppendLogic?: (state: EditState<TDetails>, detailsToUpdate: Partial<TDetails>) => TDetails
) {
  return (state: EditState<TDetails>, action: Action<TDetails>): EditState<TDetails> => {
    switch (action.type) {
      case 'RESET_STATE':
        return {
          ...state,
          details: action.payload.details,
          tags: action.payload.tags,
          initialDetails: action.payload.details,
          initialTags: action.payload.tags
        }
      case 'UPDATE_FIELD':
        return {
          ...state,
          details: {
            ...state.details,
            [action.payload.field]: action.payload.value
          }
        }
      case 'UPDATE_TAGS':
        return {
          ...state,
          tags: action.payload.tags
        }
      case 'BATCH_UPDATE': {
        const { batchDetails, mapType } = action.payload
        const { tags: newTags, ...detailsToUpdate } = batchDetails

        const finalTags = newTags ? (mapType === 'append' ? [...new Set([...state.tags, ...newTags])] : [...newTags]) : state.tags

        if (mapType === 'overwrite') {
          return {
            ...state,
            details: { ...state.details, ...detailsToUpdate },
            tags: finalTags
          }
        } else {
          // Append logic - use custom logic if provided
          const appendedDetails = batchAppendLogic ? batchAppendLogic(state, detailsToUpdate as Partial<TDetails>) : { ...state.details, ...detailsToUpdate }

          return {
            ...state,
            details: appendedDetails,
            tags: finalTags
          }
        }
      }
      default:
        return state
    }
  }
}

export interface UpdatePayload<TDetails> {
  metadata?: Partial<TDetails>
  tags?: string[]
}

export interface DetailsEditRef<TDetails> {
  submit: () => void
  getTitleAndAuthorName: () => { title: string | null; author: string }
  mapBatchDetails: (batchDetails: Partial<TDetails & { tags: string[] }>, mapType?: 'overwrite' | 'append') => void
}

interface UseDetailsEditOptions<TDetails> {
  metadata: TDetails
  tags: string[]
  libraryItemId: string
  ref?: React.Ref<DetailsEditRef<TDetails>>
  extractAuthor: (details: TDetails) => string
  onChange?: (details: { libraryItemId: string; hasChanges: boolean }) => void
  onSubmit?: (details: { updatePayload: UpdatePayload<TDetails>; hasChanges: boolean }) => void
  batchAppendLogic?: (state: EditState<TDetails>, detailsToUpdate: Partial<TDetails>) => TDetails
  /** Use loose equality (!=) instead of strict equality (!==) for change detection */
  useLooseEquality?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDetailsEdit<TDetails extends Record<string, any>>({
  metadata,
  tags,
  libraryItemId,
  ref,
  extractAuthor,
  onChange,
  onSubmit,
  batchAppendLogic,
  useLooseEquality = false
}: UseDetailsEditOptions<TDetails>) {
  const reducer = useMemo(() => createDetailsReducer<TDetails>(batchAppendLogic), [batchAppendLogic])

  const [state, dispatch] = useReducer(reducer, {
    details: metadata || ({} as TDetails),
    tags: [...(tags || [])],
    initialDetails: metadata || ({} as TDetails),
    initialTags: [...(tags || [])]
  })

  const { details, tags: currentTags, initialDetails, initialTags } = state

  // Reset state when metadata or tags change
  useEffect(() => {
    dispatch({
      type: 'RESET_STATE',
      payload: {
        details: metadata || ({} as TDetails),
        tags: [...(tags || [])]
      }
    })
  }, [metadata, tags])

  const updateField = useCallback(
    <K extends keyof TDetails>(field: K) =>
      (value: TDetails[K]) => {
        dispatch({ type: 'UPDATE_FIELD', payload: { field, value } })
      },
    []
  )

  const updateTags = useCallback((newTags: string[]) => {
    dispatch({ type: 'UPDATE_TAGS', payload: { tags: newTags } })
  }, [])

  const mapBatchDetails = useCallback((batchDetails: Partial<TDetails & { tags: string[] }>, mapType: 'overwrite' | 'append' = 'overwrite') => {
    dispatch({ type: 'BATCH_UPDATE', payload: { batchDetails, mapType } })
  }, [])

  // Calculate changes
  const changes = useMemo(() => {
    const changedEntries = (Object.keys(details) as Array<keyof TDetails>)
      .filter((key) => {
        const initialValue = initialDetails[key]
        const currentValue = details[key]

        if (Array.isArray(currentValue) && Array.isArray(initialValue)) {
          return JSON.stringify(currentValue) !== JSON.stringify(initialValue)
        }

        // Use loose or strict equality based on option
        return useLooseEquality ? currentValue != initialValue : currentValue !== initialValue
      })
      .map((key) => [key, details[key]])

    const metadataUpdate = Object.fromEntries(changedEntries) as Partial<TDetails>

    const updatePayload: UpdatePayload<TDetails> = {}
    if (changedEntries.length > 0) {
      updatePayload.metadata = metadataUpdate
    }

    if (JSON.stringify(currentTags) !== JSON.stringify(initialTags)) {
      updatePayload.tags = currentTags
    }

    return {
      updatePayload,
      hasChanges: Object.keys(updatePayload).length > 0
    }
  }, [details, initialDetails, currentTags, initialTags, useLooseEquality])

  // Notify parent of changes
  const handleInputChange = useCallback(() => {
    onChange?.({
      libraryItemId,
      hasChanges: changes.hasChanges
    })
  }, [libraryItemId, onChange, changes.hasChanges])

  useEffect(() => {
    handleInputChange()
  }, [handleInputChange])

  // Submit handler
  const submitForm = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      onSubmit?.(changes)
    },
    [changes, onSubmit]
  )

  // Extract title from details (assuming it has a title property)
  const title = useMemo(() => {
    const detailsWithTitle = details as TDetails & { title?: string | null }
    return detailsWithTitle.title ?? null
  }, [details])

  const author = useMemo(() => extractAuthor(details), [details, extractAuthor])

  useImperativeHandle(
    ref,
    () => ({
      submit: () => submitForm(),
      getTitleAndAuthorName: () => ({
        title,
        author
      }),
      mapBatchDetails
    }),
    [submitForm, title, author, mapBatchDetails]
  )

  return {
    details,
    tags: currentTags,
    initialDetails,
    updateField,
    updateTags,
    mapBatchDetails,
    changes,
    submitForm,
    dispatch
  }
}
