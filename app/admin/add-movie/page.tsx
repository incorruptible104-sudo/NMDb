import { redirect } from 'next/navigation'

export default function AddMoviePage() {
  redirect('/admin/movie/new')
}