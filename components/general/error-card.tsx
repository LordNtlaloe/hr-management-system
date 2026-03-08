import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import CardWrapper from './card-wrapper'

export default function ErrorCard() {
  return (
    <CardWrapper headerLabel={'Sorry! Something Went Wrong'} backButtonLabel={'Return To Login'} backButtonHref={'/auth/sign-in'}>
      <div className="flex justify-center items-center w-full">
        <ExclamationTriangleIcon className='text-destructive w-10 h-10'/>
      </div>
    </CardWrapper>
  )
}
