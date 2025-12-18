import { redirect } from "next/navigation";
export default function Home() {
  // Redirect to the landing page
  redirect("/landing");
}
