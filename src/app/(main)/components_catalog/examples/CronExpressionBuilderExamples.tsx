'use client'
import CronExpressionBuilder from '@/components/widgets/CronExpressionBuilder'
import { useState, useCallback } from 'react'
import { ComponentExamples, ComponentInfo, ExamplesBlock, Example } from '../ComponentExamples'
import { useGlobalToast } from '@/contexts/ToastContext'

// CronExpressionBuilder Examples
export function CronExpressionBuilderExamples() {
  const { showToast } = useGlobalToast()

  const [cronValue1, setCronValue1] = useState<string>('0 0 * * *')
  const [cronValue2, setCronValue2] = useState<string>('0 9 * * 1,3,5')
  const [cronValue3, setCronValue3] = useState<string>('*/15 * * * *')
  const [cronValue4, setCronValue4] = useState<string>('')

  const handleCronChange1 = useCallback((value: string, isInvalid?: boolean) => {
    setCronValue1(value)
    console.log('Cron expression 1 updated: ', value, ' isInvalid: ', isInvalid)
  }, [])

  const handleCronChange2 = useCallback((value: string, isInvalid?: boolean) => {
    setCronValue2(value)
    console.log('Cron expression 2 updated: ', value, ' isInvalid: ', isInvalid)
  }, [])

  const handleCronChange3 = useCallback((value: string, isInvalid?: boolean) => {
    setCronValue3(value)
    console.log('Cron expression 3 updated: ', value, ' isInvalid: ', isInvalid)
  }, [])

  const handleCronChange4 = useCallback((value: string, isInvalid?: boolean) => {
    setCronValue4(value)
    console.log('Cron expression 4 updated: ', value, ' isInvalid: ', isInvalid)
  }, [])

  return (
    <ComponentExamples title="Cron Expression Builder">
      <ComponentInfo
        component="CronExpressionBuilder"
        description="A comprehensive cron expression builder with visual schedule builder and advanced cron expression input option"
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">import CronExpressionBuilder from '@/components/widgets/CronExpressionBuilder'</code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <code className="bg-gray-700 px-2 py-1 rounded">value</code> (string | null),{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">onChange</code> (function)
        </p>
        <p className="mb-2">
          <span className="font-bold">Features:</span>
        </p>
        <ul className="list-disc list-inside mb-2 text-sm text-gray-300 ml-4">
          <li>Visual schedule builder with predefined intervals</li>
          <li>Custom daily/weekly scheduling with time picker</li>
          <li>Advanced option for direct cron expression editing</li>
          <li>Real-time validation with server-side verification</li>
          <li>Next run date calculation and display</li>
          <li>Simplified single-interface design</li>
        </ul>
      </ComponentInfo>

      <ExamplesBlock className="lg:grid-cols-2">
        <Example title="Daily Schedule (Default)">
          <CronExpressionBuilder currentCronValue={cronValue1} onChange={handleCronChange1} />
        </Example>

        <Example title="Weekly Schedule (Monday, Wednesday, Friday at 9:00 AM)">
          <CronExpressionBuilder currentCronValue={cronValue2} onChange={handleCronChange2} />
        </Example>

        <Example title="Advanced Schedule (Every 15 minutes)">
          <CronExpressionBuilder currentCronValue={cronValue3} onChange={handleCronChange3} />
        </Example>

        <Example title="Empty Schedule Builder">
          <CronExpressionBuilder currentCronValue={cronValue4} onChange={handleCronChange4} />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
