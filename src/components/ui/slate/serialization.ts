import { Descendant, Text } from 'slate'
import { escapeHtml } from '@/lib/html-utils'
import { DOMNode, CustomText } from '@/types/slate'

// --- Serialize Function ---

export const serialize = (node: Descendant): string => {
  try {
    // Handle null/undefined nodes gracefully
    if (!node || typeof node !== 'object') {
      return ''
    }

    if (Text.isText(node)) {
      let string = escapeHtml(node.text || '')
      if (node.bold) string = `<strong>${string}</strong>`
      if (node.italic) string = `<em>${string}</em>`
      if (node.strike) string = `<s>${string}</s>`
      // Convert newlines to <br/> tags
      string = string.replace(/\n/g, '<br/>')
      return string
    }

    // Safety check: ensure children exists and is an array with valid nodes
    const children =
      node.children && Array.isArray(node.children)
        ? node.children
            .filter((child) => child && typeof child === 'object')
            .map((n) => serialize(n))
            .join('')
        : ''

    switch (node.type) {
      case 'paragraph':
        return `<p>${children}</p>`
      case 'bulleted-list':
        return `<ul>${children}</ul>`
      case 'numbered-list':
        return `<ol>${children}</ol>`
      case 'list-item':
        return `<li>${children}</li>`
      case 'link':
        return `<a href="${escapeHtml(node.url || '')}">${children}</a>`
      default:
        return children
    }
  } catch (error) {
    console.warn('SlateEditor: Error serializing node:', error, node)
    return ''
  }
}

// --- Deserialize Function ---

export const deserialize = (el: DOMNode): Descendant[] | CustomText | null => {
  if (el.nodeType === 3) {
    // TEXT_NODE - preserve all text content including spaces
    const textContent = el.textContent || ''
    // Don't filter out single spaces or meaningful whitespace
    // Only filter out completely empty strings or purely newline/tab sequences
    if (!textContent || /^[\n\r\t]*$/.test(textContent)) {
      return null
    }
    return { text: textContent }
  } else if (el.nodeType !== 1) {
    // Skip comment nodes and other non-element nodes
    return null
  }

  const element = el as HTMLElement

  // Helper function to check if an element or its styles indicate bold/italic
  const isBoldElement = (elem: HTMLElement): boolean => {
    const nodeName = elem.nodeName
    if (nodeName === 'STRONG' || nodeName === 'B') return true

    // Check computed styles for font-weight
    try {
      const style = elem.style
      const fontWeight = style.fontWeight || getComputedStyle(elem).fontWeight
      return fontWeight === 'bold' || fontWeight === '700' || parseInt(fontWeight) >= 700
    } catch {
      return false
    }
  }

  const isItalicElement = (elem: HTMLElement): boolean => {
    const nodeName = elem.nodeName
    if (nodeName === 'EM' || nodeName === 'I') return true

    // Check computed styles for font-style
    try {
      const style = elem.style
      const fontStyle = style.fontStyle || getComputedStyle(elem).fontStyle
      return fontStyle === 'italic'
    } catch {
      return false
    }
  }

  const isStrikeElement = (elem: HTMLElement): boolean => {
    const nodeName = elem.nodeName
    if (nodeName === 'S' || nodeName === 'STRIKE' || nodeName === 'DEL') return true

    // Check computed styles for text-decoration
    try {
      const style = elem.style
      const textDecoration = style.textDecoration || getComputedStyle(elem).textDecoration
      return textDecoration.includes('line-through')
    } catch {
      return false
    }
  }

  // Process children and flatten spans that are just for styling
  let children = Array.from(element.childNodes)
    .flatMap((child) => {
      const result = deserialize(child)
      if (!result) return []
      return Array.isArray(result) ? result : [result]
    })
    .filter((child) => {
      // Only filter out completely empty text nodes or pure newline/tab sequences
      // BUT preserve intentional line breaks from <br/> elements
      if ('text' in child) {
        if (!child.text) return false
        // Preserve intentional breaks even if they're just newlines
        if ((child as any).isIntentionalBreak) return true
        // Filter out pure structural whitespace (newlines/tabs) but keep spaces
        return !/^[\n\r\t]+$/.test(child.text)
      }
      return true
    })

  // Apply formatting based on current element
  const isBold = isBoldElement(element)
  const isItalic = isItalicElement(element)
  const isStrike = isStrikeElement(element)

  if (isBold || isItalic || isStrike) {
    children = children.map((child) => {
      if ('text' in child) {
        const { isIntentionalBreak, ...cleanChild } = child as any
        return {
          ...cleanChild,
          ...(isBold && { bold: true }),
          ...(isItalic && { italic: true }),
          ...(isStrike && { strike: true })
        }
      }
      return child
    })
  } else {
    // Clean up the intentional break marker even if no formatting is applied
    children = children.map((child) => {
      if ('text' in child && (child as any).isIntentionalBreak) {
        const { isIntentionalBreak, ...cleanChild } = child as any
        return cleanChild
      }
      return child
    })
  }

  if (children.length === 0) {
    children = [{ text: '' }]
  }

  switch (element.nodeName) {
    case 'BODY':
    case 'DIV':
      return children
    case 'P':
      // Filter out empty paragraphs
      const hasContent = children.some((child) => ('text' in child && child.text.trim()) || 'type' in child)
      if (!hasContent) return []
      return [{ type: 'paragraph', children }]
    case 'UL':
      return [{ type: 'bulleted-list', children }]
    case 'OL':
      return [{ type: 'numbered-list', children }]
    case 'LI':
      return [{ type: 'list-item', children }]
    case 'A':
      return [{ type: 'link', url: element.getAttribute('href') || '', children }]
    case 'BR':
      // Use a special marker for intentional line breaks to distinguish from structural whitespace
      return [{ text: '\n', isIntentionalBreak: true } as any]
    case 'H1':
    case 'H2':
    case 'H3':
    case 'H4':
    case 'H5':
    case 'H6':
      // Treat headings as bold paragraphs
      const headingChildren = children.map((child) => ('text' in child ? { ...child, bold: true as true } : child))
      return [{ type: 'paragraph', children: headingChildren }]
    case 'SPAN':
      // For spans, just return the children with any applied formatting
      // The formatting was already applied above based on classes
      return children
    default:
      // For unknown elements, just return their children
      return children
  }
}

// --- Initial Value ---

export const initialValue: Descendant[] = [{ type: 'paragraph', children: [{ text: '' }] }]
