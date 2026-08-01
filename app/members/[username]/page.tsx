import { Header } from "../../ui";
import { MemberProfileClient } from "./MemberProfileClient";

export default async function MemberProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <main><Header/><MemberProfileClient username={decodeURIComponent(username)}/></main>;
}
