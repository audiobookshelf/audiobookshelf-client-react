import React from 'react'
import MultiSelect, { type MultiSelectProps } from './MultiSelect'

type MultiSelectDropdownProps = Omit<MultiSelectProps, 'showInput' | 'allowNew' | 'onNewItem'>

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ ...rest }) => {
  return <MultiSelect showInput={false} allowNew={false} {...rest} />
}

export default MultiSelectDropdown
