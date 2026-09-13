import { formatList, listFormatParts } from '@/lib/formatList'

describe('formatList', () => {
  it('joins labels with locale-aware unit separators', () => {
    expect(formatList(['Alice', 'Bob', 'Carol'], 'en-US')).to.equal('Alice, Bob, Carol')
  })

  it('includes a space in English unit separators', () => {
    const parts = listFormatParts(['Alice', 'Bob'], 'en-US')
    expect(parts).to.deep.equal([
      { type: 'element', value: 'Alice' },
      { type: 'literal', value: ', ' },
      { type: 'element', value: 'Bob' }
    ])
  })
})
