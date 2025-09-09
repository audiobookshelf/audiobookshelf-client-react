import Link from 'next/link'
import SettingsMoreInfoIcon from './SettingsMoreInfoIcon'

export default function SettingsContent(props: { children: React.ReactNode; title: string; description?: string; moreInfoUrl?: string; backLink?: string }) {
  return (
    <div className="w-full max-w-4xl mx-auto p-2 md:p-6">
      <div className="bg-bg rounded-md shadow-lg border border-white/5 p-2 sm:p-4 mb-8">
        <div className="flex items-center gap-2 mb-2">
          {props.backLink && (
            <Link aria-label="Back" href={props.backLink} className="text-gray-300 hover:text-white">
              <span className="material-symbols text-xl !align-middle">arrow_back</span>
            </Link>
          )}
          <h1 className="text-xl">{props.title}</h1>
          {props.moreInfoUrl && <SettingsMoreInfoIcon moreInfoUrl={props.moreInfoUrl} />}
        </div>
        {props.description && <p className="text-sm text-gray-400 mb-6">{props.description}</p>}
        {props.children}
      </div>
    </div>
  )
}
