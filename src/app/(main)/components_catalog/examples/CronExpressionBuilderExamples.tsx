'use client'
import CronExpressionBuilder from '@/components/widgets/CronExpressionBuilder'
import CronExpressionPreview from '@/components/widgets/CronExpressionPreview'
import { useCallback, useState } from 'react'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

// CronExpressionBuilder Examples
export function CronExpressionBuilderExamples() {
  // Example server settings for demonstration
  const exampleServerSettings = {
    language: 'en-us',
    dateFormat: 'EEEE, MM/dd/yyyy',
    timeFormat: 'HH:mm',
    timeZone: 'America/New_York'
  }

  // Example with different languages for testing
  const spanishSettings = {
    language: 'es',
    dateFormat: 'EEEE, dd/MM/yyyy',
    timeFormat: 'HH:mm',
    timeZone: 'America/New_York'
  }

  const frenchSettings = {
    language: 'fr',
    dateFormat: 'EEEE dd/MM/yyyy',
    timeFormat: 'HH:mm',
    timeZone: 'America/New_York'
  }

  const [cronValue1, setCronValue1] = useState<string>('0 0 * * *')
  const [cronValue1IsValid, setCronValue1IsValid] = useState<boolean>(true)
  const [cronValue2, setCronValue2] = useState<string>('0 9 * * 1,3,5')
  const [cronValue2IsValid, setCronValue2IsValid] = useState<boolean>(true)
  const [cronValue3, setCronValue3] = useState<string>('*/15 * * * *')
  const [cronValue3IsValid, setCronValue3IsValid] = useState<boolean>(true)
  const [cronValue4, setCronValue4] = useState<string>('15 */3 * * *')
  const [cronValue4IsValid, setCronValue4IsValid] = useState<boolean>(true)
  const [cronValue5, setCronValue5] = useState<string>('0 10 * * 0,2,4,6')
  const [cronValue5IsValid, setCronValue5IsValid] = useState<boolean>(true)

  const handleCronChange1 = useCallback((value: string, isValid: boolean) => {
    setCronValue1(value)
    setCronValue1IsValid(isValid)
    console.log('Cron expression 1 updated: ', value, ' isValid: ', isValid)
  }, [])

  const handleCronChange2 = useCallback((value: string, isValid: boolean = false) => {
    setCronValue2(value)
    setCronValue2IsValid(isValid)
    console.log('Cron expression 2 updated: ', value, ' isValid: ', isValid)
  }, [])

  const handleCronChange3 = useCallback((value: string, isValid: boolean) => {
    setCronValue3(value)
    setCronValue3IsValid(isValid)
    console.log('Cron expression 3 updated: ', value, ' isValid: ', isValid)
  }, [])

  const handleCronChange4 = useCallback((value: string, isValid: boolean) => {
    setCronValue4(value)
    setCronValue4IsValid(isValid)
    console.log('Cron expression 4 updated: ', value, ' isValid: ', isValid)
  }, [])

  const handleCronChange5 = useCallback((value: string, isValid: boolean) => {
    setCronValue5(value)
    setCronValue5IsValid(isValid)
    console.log('Cron expression 5 updated: ', value, ' isValid: ', isValid)
  }, [])

  return (
    <ComponentExamples title="Cron Expression Builder">
      <ComponentInfo
        component="CronExpressionBuilder"
        description="A comprehensive cron expression builder with visual schedule builder and advanced cron expression input option"
      >
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <Code overflow>import CronExpressionBuilder from &apos;@/components/widgets/CronExpressionBuilder&apos;</Code>
        </p>
        <div className="mb-2">
          <span className="font-bold">Props:</span>
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <Code className="px-1">value</Code>
            <span>a cron expression</span>
            <Code className="px-1">options? </Code>
            <span>
              <Code>
                {'{'} language?, timeZone? {'}'}
              </Code>{' '}
              - server language and time zone settings
            </span>
            <Code className="px-1">onChange?</Code>
            <Code>function (value: string, isValid?: boolean): void</Code>
          </div>
        </div>
      </ComponentInfo>

      <ComponentInfo component="CronExpressionPreview" description="A preview of the cron expression with a verbal description of the schedule, next run date">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <Code overflow>import CronExpressionPreview from &apos;@/components/widgets/CronExpressionPreview&apos;</Code>
        </p>
        <div className="mb-2">
          <span className="font-bold">Props:</span>
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <Code className="px-1">cronExpression</Code>
            <span>a cron expression</span>
            <Code className="px-1">isValid?</Code>
            <span>the validity of the cron expression. Will validate the cron expression internally if not provided</span>
            <Code className="px-1">options?</Code>
            <span>
              <Code>
                {'{'} language?, dateFormat?, timeFormat?, timeZone? {'}'}
              </Code>{' '}
              - the server language, date, and time settings
            </span>
            <Code className="px-1">className?</Code>
            <span>classes to merge with the default classes</span>
          </div>
        </div>
      </ComponentInfo>

      <ExamplesBlock className="lg:grid-cols-2">
        <Example title="Daily">
          <CronExpressionBuilder value={cronValue1} onChange={handleCronChange1} options={exampleServerSettings} />
          <CronExpressionPreview cronExpression={cronValue1} isValid={cronValue1IsValid} options={exampleServerSettings} />
        </Example>

        <Example title="Weekly">
          <CronExpressionBuilder value={cronValue2} onChange={handleCronChange2} options={exampleServerSettings} />
          <CronExpressionPreview cronExpression={cronValue2} isValid={cronValue2IsValid} options={exampleServerSettings} />
        </Example>

        <Example title="Every 15 Minutes">
          <CronExpressionBuilder value={cronValue3} onChange={handleCronChange3} options={exampleServerSettings} />
          <CronExpressionPreview cronExpression={cronValue3} isValid={cronValue3IsValid} options={exampleServerSettings} />
        </Example>

        <Example title="Custom Cron Expression">
          <CronExpressionBuilder value={cronValue4} onChange={handleCronChange4} options={exampleServerSettings} />
          <CronExpressionPreview cronExpression={cronValue4} isValid={cronValue4IsValid} options={exampleServerSettings} />
        </Example>

        <Example title="i18n">
          <CronExpressionBuilder value={cronValue5} onChange={handleCronChange5} options={exampleServerSettings} />
          <p>Spanish</p>
          <CronExpressionPreview cronExpression={cronValue5} isValid={cronValue5IsValid} options={spanishSettings} />
          <p>French</p>
          <CronExpressionPreview cronExpression={cronValue5} isValid={cronValue5IsValid} options={frenchSettings} />
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
