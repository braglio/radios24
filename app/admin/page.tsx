import AdminClient from "../../components/AdminClient";
import LiveStats from "../../components/admin/LiveStats";
import { readRadiosFile } from "../api/radios/_utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminPage() {
  const radios = readRadiosFile();

  return (
    <main className="min-h-screen bg-black text-white">
      <LiveStats />
      <AdminClient initialRadios={radios} />
    </main>
  );
}
