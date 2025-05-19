import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import ConnectAI from './connect-ai' // adjust path as needed

const DomainsList = ({ data }) => {
  return (
    <div className="flex flex-col mt-10">
      <div className="flex gap-3">
        <h1 className="opacity-50 mb-3">Domain</h1>
      </div>
      <div className="flex flex-col-reverse gap-3">
        {data?.domains.map((item, index) => {
          const url = `${item.https ? 'https' : 'http'}://${item.host}${item.path}`
          return (
            <div key={index} className="flex items-center gap-4">
              <Link
                className="flex items-center gap-2 text-base font-medium hover:underline user-domain"
                target="_blank"
                href={url}
              >
                {item.host}
                <ExternalLink className="size-4" />
              </Link>
              <ConnectAI appurl={url} data={data}/>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DomainsList