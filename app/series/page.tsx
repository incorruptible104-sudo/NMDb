import { redirect } from 'next/navigation'

export default function SeriesPage() {
  redirect('/movies?content_type=Series')
}