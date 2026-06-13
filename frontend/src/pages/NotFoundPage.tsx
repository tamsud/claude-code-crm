import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-center">
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">Page not found</h2>
      <p className="text-slate-500 mb-6">The page you are looking for does not exist.</p>
      <Link to="/" className="text-blue-600 hover:underline">
        Back to Dashboard
      </Link>
    </div>
  )
}
