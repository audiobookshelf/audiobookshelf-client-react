import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Btn from '@/components/ui/Btn'

// Import all necessary styles
import '@/assets/globals.css'
import '@/assets/fonts.css'
import '@/assets/app.css'

const meta = {
  title: 'UI/Btn',
  component: Btn,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile button component that can render as either a button or link, with support for loading states, progress indicators, and various styling options.'
      }
    }
  },
  argTypes: {
    to: {
      description: 'If provided, renders as a Next.js Link instead of a button',
      control: 'text'
    },
    color: {
      description: 'Background color class',
      control: 'select',
      options: ['bg-primary', 'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-gray-500'],
      defaultValue: 'bg-primary'
    },
    type: {
      description: 'Button type (only applies when not a link)',
      control: 'select',
      options: ['button', 'submit', 'reset']
    },
    paddingX: {
      description: 'Horizontal padding (overrides default)',
      control: { type: 'number', min: 0, max: 20 }
    },
    paddingY: {
      description: 'Vertical padding (overrides default)',
      control: { type: 'number', min: 0, max: 20 }
    },
    small: {
      description: 'Smaller button variant',
      control: 'boolean'
    },
    loading: {
      description: 'Shows loading spinner and disables button',
      control: 'boolean'
    },
    disabled: {
      description: 'Disables the button',
      control: 'boolean'
    },
    progress: {
      description: 'Progress text to show instead of spinner',
      control: 'text'
    },
    onClick: {
      description: 'Click handler',
      action: 'clicked'
    },
    children: {
      description: 'Button content',
      control: 'text'
    },
    className: {
      description: 'Additional CSS classes',
      control: 'text'
    }
  },
  tags: ['autodocs']
} satisfies Meta<typeof Btn>

export default meta
type Story = StoryObj<typeof meta>

// Basic button stories
export const Default: Story = {
  args: {
    children: 'Click me'
  }
}

export const AsLink: Story = {
  args: {
    to: '/test',
    children: 'Link Button'
  }
}

export const Small: Story = {
  args: {
    small: true,
    children: 'Small Button'
  }
}

export const CustomColor: Story = {
  args: {
    color: 'bg-red-500',
    children: 'Red Button'
  }
}

export const CustomPadding: Story = {
  args: {
    paddingX: 6,
    paddingY: 3,
    children: 'Custom Padding'
  }
}

// Loading states
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading Button'
  }
}

export const LoadingWithProgress: Story = {
  args: {
    loading: true,
    progress: '50%',
    children: 'Progress Button'
  }
}

// Disabled states
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button'
  }
}

export const LoadingLink: Story = {
  args: {
    to: '/test',
    loading: true,
    children: 'Loading Link'
  }
}

export const DisabledLink: Story = {
  args: {
    to: '/test',
    disabled: true,
    children: 'Disabled Link'
  }
}

// Button types
export const Submit: Story = {
  args: {
    type: 'submit',
    children: 'Submit Button'
  }
}

export const Reset: Story = {
  args: {
    type: 'reset',
    children: 'Reset Button'
  }
}

// Complex content
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <span>🚀</span>
        <span>Launch</span>
      </>
    )
  }
}

export const ComplexContent: Story = {
  args: {
    children: (
      <>
        <span>📚</span>
        <span>Audiobookshelf</span>
        <span>→</span>
      </>
    )
  }
}

// Interactive examples
export const Interactive: Story = {
  args: {
    children: 'Click me!',
    onClick: () => alert('Button clicked!')
  }
}

export const WithCustomClass: Story = {
  args: {
    className: 'hover:scale-105 transition-transform',
    children: 'Hover Effect'
  }
}

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <div className="space-x-2">
        <Btn>Default</Btn>
        <Btn small>Small</Btn>
        <Btn color="bg-red-500">Red</Btn>
        <Btn color="bg-blue-500">Blue</Btn>
      </div>
      <div className="space-x-2">
        <Btn loading>Loading</Btn>
        <Btn loading progress="75%">
          Progress
        </Btn>
        <Btn disabled>Disabled</Btn>
      </div>
      <div className="space-x-2">
        <Btn to="/test">Link</Btn>
        <Btn to="/test" loading>
          Loading Link
        </Btn>
        <Btn to="/test" disabled>
          Disabled Link
        </Btn>
      </div>
    </div>
  ),
  args: {
    children: 'Default'
  },
  parameters: {
    docs: {
      description: {
        story: 'All button variants displayed together for easy comparison.'
      }
    }
  }
}
