import SettingsMoreInfoIcon from './SettingsMoreInfoIcon'

export default function SettingsContent(props: { children: React.ReactNode; title: string; description?: string; moreInfoUrl?: string }) {
  return (
    <div className="w-full max-w-4xl mx-auto p-2 md:p-6">
      <div className="bg-bg rounded-md shadow-lg border border-white/5 p-2 sm:p-4 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-xl">{props.title}</h1>
          {props.moreInfoUrl && <SettingsMoreInfoIcon moreInfoUrl={props.moreInfoUrl} />}
        </div>
        {props.description && <p className="text-sm text-gray-400 mb-6">{props.description}</p>}
        {props.children}
      </div>
    </div>
  )
}
