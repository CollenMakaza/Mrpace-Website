import { useMemo, useState } from "react";
import { AdminPage } from "../components/ui.jsx";
import RunnerLoader from "../components/RunnerLoader.jsx";
import useFetch from "../useFetch.js";
import { formatDate } from "../api.js";

export default function Runners() {
  const { data, loading, error } = useFetch("/admin/users");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const users = data?.users || [];
    return s ? users.filter((u) => [u.name, u.email, u.phone].some((v) => v && v.toLowerCase().includes(s))) : users;
  }, [data, q]);

  const exportCsv = () => {
    const rows = [["Name", "Email", "Phone", "Gender", "Date of birth", "Joined", "Registrations"]].concat(
      list.map((u) => [u.name, u.email, u.phone, u.gender, u.dateOfBirth, formatDate(u.createdAt), u.registrations])
    );
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "mrpace-runners.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <AdminPage
      title="Runners"
      subtitle={data ? `${data.users.length} people have signed up.` : "Everyone who has signed up."}
      actions={<button className="btn btn-outline" onClick={exportCsv} disabled={!list.length}>Export CSV</button>}
    >
      <div className="filter-row">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone…" />
      </div>
      {loading ? (
        <RunnerLoader label="Loading runners" />
      ) : error ? (
        <p className="alert alert-error">{error}</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Gender</th><th>Joined</th><th>Races</th></tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td data-label="Name"><b>{u.name}</b></td>
                  <td data-label="Email"><a href={`mailto:${u.email}`}>{u.email}</a></td>
                  <td data-label="Phone">{u.phone || "—"}</td>
                  <td data-label="Gender">{u.gender || "—"}</td>
                  <td data-label="Joined">{formatDate(u.createdAt)}</td>
                  <td data-label="Races">{u.registrations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPage>
  );
}
