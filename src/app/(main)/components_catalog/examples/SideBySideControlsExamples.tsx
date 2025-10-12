'use client'

import Btn from '@/components/ui/Btn'
import Checkbox from '@/components/ui/Checkbox'
import Dropdown from '@/components/ui/Dropdown'
import FileInput from '@/components/ui/FileInput'
import IconBtn from '@/components/ui/IconBtn'
import MultiSelect, { MultiSelectItem } from '@/components/ui/MultiSelect'
import RangeInput from '@/components/ui/RangeInput'
import ReadIconBtn from '@/components/ui/ReadIconBtn'
import TextInput from '@/components/ui/TextInput'
import { useGlobalToast } from '@/contexts/ToastContext'
import { useState } from 'react'
import { ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

export function SideBySideControlsExamples() {
  const { showToast } = useGlobalToast()
  const [textInputValue, setTextInputValue] = useState('Initial Value')
  const [checkboxValue, setCheckboxValue] = useState(false)
  const [dropdownValue, setDropdownValue] = useState<string | number>('item1')
  const [rangeValue, setRangeValue] = useState(50)
  const [readIconBtnValue, setReadIconBtnValue] = useState(false)
  const [multiSelectValue, setMultiSelectValue] = useState<MultiSelectItem[]>([
    { content: 'Item 1', value: 'item1' },
    { content: 'Item 2', value: 'item2' }
  ])
  const [checkboxValue2, setCheckboxValue2] = useState(false)

  return (
    <ComponentExamples title="Side By Side Controls">
      <ComponentInfo component="SideBySideControls" description="Several different controls side by side" />

      <ExamplesBlock>
        <Example title="Side By Side Controls" className="col-span-1 md:col-span-2 lg:col-span-3">
          <div className="flex flex-wrap gap-2 items-start">
            <Btn className="mt-6" onClick={() => showToast('Button clicked', { type: 'info', title: 'Button' })}>
              Button
            </Btn>
            <IconBtn className="mt-6 shrink-0" onClick={() => showToast('IconBtn clicked', { type: 'info', title: 'IconBtn' })}>
              Edit
            </IconBtn>
            <TextInput label="Text Input" value={textInputValue} onChange={setTextInputValue} />
            <Checkbox className="mt-6 grow-0 shrink" labelClass="w-fit" label="Checkbox" value={checkboxValue} onChange={setCheckboxValue} />
            <Dropdown
              label="Dropdown"
              items={[
                { text: 'Item 1', value: 'item1' },
                { text: 'Item 2', value: 'item2' }
              ]}
              value={dropdownValue}
              onChange={setDropdownValue}
            />
            <FileInput className="mt-6 shrink-0">Select File</FileInput>
            <RangeInput label="Range Input" value={rangeValue} min={0} max={100} step={1} onChange={setRangeValue} />
            <ReadIconBtn className="mt-6 shrink-0" isRead={readIconBtnValue} onClick={() => setReadIconBtnValue(!readIconBtnValue)} />
            <MultiSelect
              label="Multi Select"
              items={[
                { content: 'Item 1', value: 'item1' },
                { content: 'Item 2', value: 'item2' },
                { content: 'Item 3', value: 'item3' },
                { content: 'Item 4', value: 'item4' },
                { content: 'Item 5', value: 'item5' },
                { content: 'Item 6', value: 'item6' },
                { content: 'Item 7', value: 'item7' },
                { content: 'Item 8', value: 'item8' },
                { content: 'Item 9', value: 'item9' }
              ]}
              selectedItems={multiSelectValue}
              onItemAdded={(item) => setMultiSelectValue([...multiSelectValue, item])}
              onItemRemoved={(item) => setMultiSelectValue(multiSelectValue.filter((i) => i.value !== item.value))}
              onItemEdited={(item, index) => {
                const newItems = [...multiSelectValue]
                newItems[index] = item
                setMultiSelectValue(newItems)
              }}
            />
            <Checkbox className="mt-6 grow-0 shrink" labelClass="w-fit" value={checkboxValue2} onChange={setCheckboxValue2} />
          </div>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
