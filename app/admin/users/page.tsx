"use client";
import { useEffect, useState } from "react";

type User = { id: string; name: string; email: string; role: string };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const load = () => fetch("/api/admin/users").then(r => r.json()).then(setUsers);
  useEffect(() => { load(); }, []);

  const toggleRole = async (u: User) => {
    const role = u.role === "ADMIN" ? "CUSTOMER" : "ADMIN";
    await fetch(`/api/admin/users/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">مدیریت کاربران</h1>
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-right">نام</th>
            <th className="p-2 text-right">ایمیل</th>
            <th className="p-2 text-right">نقش</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.role}</td>
              <td className="p-2">
                <button onClick={() => toggleRole(u)}
                  className="text-xs border rounded px-2 py-1 hover:bg-gray-100">
                  {u.role === "ADMIN" ? "تبدیل به CUSTOMER" : "تبدیل به ADMIN"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
