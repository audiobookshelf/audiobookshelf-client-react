'use client'

import CoverSizeWidget, { availableCoverSizes } from '@/components/widgets/CoverSizeWidget'
import { ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'
import { useCallback, useState } from 'react'

export function CoverSizeWidgetExamples() {
  const [index, setIndex] = useState(3)
  const handleSizeIndexChange = useCallback((sizeIndex: number) => setIndex(sizeIndex), [])

  return (
    <ComponentExamples title="Cover Size Widget">
      <ComponentInfo component="CoverSizeWidget" description="Interactive widget for adjusting cover sizes with increase/decrease controls." />

      <ExamplesBlock>
        <Example title="Basic Usage">
          <div id="bookshelf" className="flex items-end justify-end p-4 mb-4" style={{ height: '16rem' }}>
            <CoverSizeWidget sizeIndex={index} onSizeIndexChange={handleSizeIndexChange} />
          </div>
          <div className="text-base">Current size: {availableCoverSizes[index]}px</div>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
