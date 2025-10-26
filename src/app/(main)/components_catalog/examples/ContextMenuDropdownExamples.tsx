'use client'
import ContextMenuDropdown, { type ContextMenuDropdownItem } from '@/components/ui/ContextMenuDropdown'
import { useGlobalToast } from '@/contexts/ToastContext'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

// ContextMenuDropdown Examples
export function ContextMenuDropdownExamples() {
  const { showToast } = useGlobalToast()

  // ContextMenuDropdown sample data
  const contextMenuItems: ContextMenuDropdownItem[] = [
    { text: 'Edit', action: 'edit' },
    { text: 'Delete', action: 'delete' },
    {
      text: 'More Options',
      action: 'more',
      subitems: [
        { text: 'Copy', action: 'copy' },
        { text: 'Move', action: 'move' },
        { text: 'Share', action: 'share' }
      ]
    },
    {
      text: 'More Options 2',
      action: 'more2',
      subitems: [
        { text: 'Copy 2', action: 'copy2' },
        { text: 'Move 2', action: 'move2' },
        { text: 'Share 2', action: 'share2' }
      ]
    }
  ]

  const contextMenuItemsWithData: ContextMenuDropdownItem<number>[] = [
    { text: 'Edit Item', action: 'edit' },
    { text: 'Delete Item', action: 'delete' },
    {
      text: 'Advanced',
      action: 'advanced',
      subitems: [
        { text: 'Duplicate', action: 'duplicate', data: { id: 1 } },
        { text: 'Archive', action: 'archive', data: { id: 1 } }
      ]
    }
  ]

  const contextMenuItemsWithEmptySubitems: ContextMenuDropdownItem[] = [
    { text: 'Edit Item', action: 'edit' },
    { text: 'Delete Item', action: 'delete' },
    { text: 'Empty', action: 'empty', subitems: [] }
  ]

  return (
    <ComponentExamples title="Context Menu Button">
      <ComponentInfo component="ContextMenuDropdown" description="Context menu triggered by a button with submenus, loading states, and custom triggers">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import ContextMenuDropdown from &apos;@/components/ui/ContextMenuDropdown&apos;</Code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <Code>items</Code> (ContextMenuItem[]), <Code>disabled</Code>, <Code>processing</Code>,{' '}
          <Code>iconClass</Code>, <Code>menuWidth</Code>, <Code>onAction</Code>, <Code>children</Code> (ReactNode or function)
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Default Context Menu">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItems}
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
            <span className="text-sm text-gray-400">Click to see menu</span>
          </div>
        </Example>

        <Example title="Large Button">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItems}
              size="large"
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
            <span className="text-sm text-gray-400">Click to see menu</span>
          </div>
        </Example>

        <Example title="Small Button">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItems}
              size="small"
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
            <span className="text-sm text-gray-400">Click to see menu</span>
          </div>
        </Example>

        <Example title="Left Aligned Context Menu">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItems}
              menuAlign="left"
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
            <span className="text-sm text-gray-400">Click to see menu</span>
          </div>
        </Example>

        <Example title="Context Menu with Data">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItemsWithData}
              onAction={(action) =>
                showToast(`Action: ${action.action} ${action.data ? `, Data: ${JSON.stringify(action.data)}` : ''}`, {
                  type: 'info',
                  title: 'Context Menu Action'
                })
              }
            />
            <span className="text-sm text-gray-400">Click to see menu with data</span>
          </div>
        </Example>

        <Example title="Disabled Context Menu">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItems}
              disabled={true}
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
            <span className="text-sm text-gray-400">Disabled state</span>
          </div>
        </Example>

        <Example title="Processing Context Menu">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItems}
              processing={true}
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
            <span className="text-sm text-gray-400">Loading state</span>
          </div>
        </Example>

        <Example title="Custom Icon Context Menu">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItems}
              iconClass="text-blue-400"
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
            <span className="text-sm text-gray-400">Custom icon color</span>
          </div>
        </Example>

        <Example title="Wide Context Menu">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItems}
              menuWidth={250}
              menuAlign="left"
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
            <span className="text-sm text-gray-400">Wider menu</span>
          </div>
        </Example>

        <Example title="Context Menu with Empty Submenu">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItemsWithEmptySubitems}
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
          </div>
        </Example>

        <Example title="Borderless Context Menu">
          <div className="flex items-center gap-4">
            <ContextMenuDropdown
              items={contextMenuItems}
              borderless={true}
              onAction={(action) => showToast(`Action: ${action.action}`, { type: 'info', title: 'Context Menu Action' })}
            />
            <span className="text-sm text-gray-400">Borderless state</span>
          </div>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
