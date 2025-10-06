'use client'

import AbridgedIndicator from '@/components/widgets/AbridgedIndicator'
import AlreadyInLibraryIndicator from '@/components/widgets/AlreadyInLibraryIndicator'
import BonusIndicator from '@/components/widgets/BonusIndicator'
import ExplicitIndicator from '@/components/widgets/ExplicitIndicator'
import OnlineIndicator from '@/components/widgets/OnlineIndicator'
import TrailerIndicator from '@/components/widgets/TrailerIndicator'
import { Code, ComponentExamples, ComponentInfo, Example, ExamplesBlock } from '../ComponentExamples'

export function InlineIndicatorExamples() {
  return (
    <ComponentExamples title="Inline Indicators">
      <ComponentInfo component="AbridgedIndicator" description="A small indicator showing that content is abridged, with a tooltip">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import AbridgedIndicator from &apos;@/components/widgets/AbridgedIndicator&apos;</Code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <Code>className</Code> (optional)
        </p>
        <p className="mb-2">
          <span className="font-bold">Note:</span> Uses a custom svg icon with a tooltip that says &quot;Abridged&quot;
        </p>
      </ComponentInfo>

      <ComponentInfo component="AlreadyInLibraryIndicator" description="A small indicator showing that content is already in your library, with a tooltip">
        <p className="mb-2">
          <span className="font-bold">Import:</span>{' '}
          <Code overflow>import AlreadyInLibraryIndicator from &apos;@/components/widgets/AlreadyInLibraryIndicator&apos;</Code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <Code>className</Code> (optional)
        </p>
        <p className="mb-2">
          <span className="font-bold">Note:</span> Uses a material symbols check_circle icon with a tooltip that says &quot;Already in your library&quot;
        </p>
      </ComponentInfo>

      <ComponentInfo component="ExplicitIndicator" description="A small indicator showing that content is explicit, with a tooltip">
        <p className="mb-2">
          <span className="font-bold">Import:</span> <Code overflow>import ExplicitIndicator from &apos;@/components/widgets/ExplicitIndicator&apos;</Code>
        </p>
        <p className="mb-2">
          <span className="font-bold">Props:</span> <Code>className</Code> (optional)
        </p>
        <p className="mb-2">
          <span className="font-bold">Note:</span> Uses a material symbols explicit icon with a tooltip that says &quot;Explicit&quot;
        </p>
      </ComponentInfo>

      <ExamplesBlock>
        <Example title="Abridged">
          <div className="space-y-4">
            <div className="flex items-center gap-1">
              <span className="text-3xl">Abridged Book</span>
              <AbridgedIndicator />
            </div>
          </div>
        </Example>

        <Example title="Explicit">
          <div className="space-y-4">
            <div className="flex items-center gap-1">
              <span className="text-3xl">F#?@!! Book</span>
              <ExplicitIndicator />
            </div>
          </div>
        </Example>

        <Example title="Abridged and Explicit">
          <div className="space-y-4">
            <div className="flex items-center gap-1">
              <span className="text-3xl">Shock and Shortened</span>
              <AbridgedIndicator />
              <ExplicitIndicator />
            </div>
          </div>
        </Example>

        <Example title="Already in Library">
          <div className="space-y-4">
            <div className="flex items-center gap-1">
              <span className="text-xl">Podcast Title</span>
              <AlreadyInLibraryIndicator />
            </div>
          </div>
        </Example>

        <Example title="Bonus">
          <div className="space-y-4">
            <div className="flex items-center gap-1">
              <span className="text-xl">Bonus Episode</span>
              <BonusIndicator />
            </div>
          </div>
        </Example>

        <Example title="Trailer">
          <div className="space-y-4">
            <div className="flex items-center gap-1">
              <span className="text-xl">Trailer Episode</span>
              <TrailerIndicator />
            </div>
          </div>
        </Example>

        <Example title="Online">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <OnlineIndicator value={true} />
              <span className="text-base">online_user</span>
            </div>
          </div>
        </Example>

        <Example title="Offline">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <OnlineIndicator value={false} />
              <span className="text-base">offline_user</span>
            </div>
          </div>
        </Example>
      </ExamplesBlock>
    </ComponentExamples>
  )
}
