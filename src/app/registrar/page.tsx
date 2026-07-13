import { redirect } from "next/navigation";

export default function LegacyRegisterRoute() {
  redirect("/bets/new");
}
