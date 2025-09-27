import Btn from '@/components/ui/Btn'
import IconBtn from '@/components/ui/IconBtn'
import Tooltip from '@/components/ui/Tooltip'
import { getTypeSafeTranslations } from '@/lib/getTypeSafeTranslations'
import Image from 'next/image'
import Link from 'next/link'
import GlobalSearchInput from './GlobalSearchInput'
import LibrariesDropdown from './LibrariesDropdown'

export default async function AppBar(props: { libraries?: any; currentLibraryId?: string; user: any }) {
  const t = await getTypeSafeTranslations()
  const userCanUpload = props.user.permissions.upload
  return (
    <div className="w-full h-16 bg-primary flex items-center justify-start px-2 md:px-6 gap-4 shadow-xl">
      <Link href={'/'} title={t('ButtonHome')} className="text-sm text-foreground hover:text-foreground/80">
        <Image src="/icon.svg" alt="audiobookshelf" width={40} height={40} priority className="w-8 min-w-8 h-8 sm:w-10 sm:min-w-10 sm:h-10" />
      </Link>
      <Link href={'/'} title={t('ButtonHome')} className="text-sm text-foreground hover:text-foreground/80">
        <h1 className="text-xl hidden lg:block hover:underline">audiobookshelf</h1>
      </Link>
      {props.libraries && props.currentLibraryId && <LibrariesDropdown currentLibraryId={props.currentLibraryId} libraries={props.libraries} />}
      <GlobalSearchInput />
      <div className="flex-grow" />
      <div className="flex items-center">
        <Tooltip text={t('ButtonComponentsCatalog')} position="bottom">
          <IconBtn borderless ariaLabel={t('ButtonComponentsCatalog')} to="/components_catalog">
            widgets
          </IconBtn>
        </Tooltip>

        {userCanUpload && (
          <Tooltip text={t('ButtonUpload')} position="bottom">
            <IconBtn borderless ariaLabel={t('ButtonUpload')} to="/upload">
              upload
            </IconBtn>
          </Tooltip>
        )}

        {['admin', 'root'].includes(props.user.type) && (
          <Tooltip text={t('HeaderSettings')} position="bottom">
            <IconBtn borderless ariaLabel={t('HeaderSettings')} to="/settings">
              settings
            </IconBtn>
          </Tooltip>
        )}

        <Tooltip text={t('ButtonStats')} position="bottom">
          <IconBtn borderless ariaLabel={t('ButtonStats')} to="/account/stats">
            equalizer
          </IconBtn>
        </Tooltip>
      </div>
      <Btn to="/account" className="ps-3 pe-2 w-32 justify-between">
        <span className="text-sm">{props.user.username}</span>
        <span className="material-symbols text-xl">person</span>
      </Btn>
    </div>
  )
}
