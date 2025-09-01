import { redirect } from "next/navigation"

export default function ProductEditAlias({ params }: { params: { id: string } }) {
  // Redirect legacy path /vendor/products/:id/edit -> /vendor/products/edit/:id
  redirect(`/vendor/products/edit/${params.id}`)
}
