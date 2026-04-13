import { redirect } from "next/navigation"

/** Registration is not available on the admin portal — redirect to login. */
export default function RegisterPage() {
  redirect("/auth/login")
}
