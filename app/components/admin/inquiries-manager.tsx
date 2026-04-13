"use client";

import { InquiryStatus } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string | null;
  message: string;
  status: InquiryStatus;
  locale: string | null;
  createdAt: string;
};

const labels: Record<InquiryStatus, string> = {
  NEW: "New",
  READ: "In review",
  ARCHIVED: "Archived",
};

export function InquiriesManager() {
  const [items, setItems] = useState<Row[]>([]);

  const reload = useCallback(async () => {
    const res = await fetch("/api/admin/inquiries");
    const json = await res.json();
    setItems(json.items);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="mt-10 overflow-x-auto border border-line">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead className="border-b border-line text-[10px] uppercase tracking-[0.2em] text-muted">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Locale</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">Message</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className="border-b border-line align-top">
              <td className="px-4 py-3 text-muted">{i.createdAt.slice(0, 10)}</td>
              <td className="px-4 py-3 text-muted">{i.locale ?? "—"}</td>
              <td className="px-4 py-3">
                <select
                  value={i.status}
                  className="border border-line bg-black px-2 py-1 text-xs uppercase tracking-[0.15em] text-white"
                  onChange={async (e) => {
                    const status = e.target.value as InquiryStatus;
                    await fetch(`/api/admin/inquiries/${i.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status }),
                    });
                    await reload();
                  }}
                >
                  {(Object.keys(labels) as InquiryStatus[]).map((k) => (
                    <option key={k} value={k}>
                      {labels[k]}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">{i.name}</td>
              <td className="px-4 py-3">{i.email}</td>
              <td className="px-4 py-3">{i.phone}</td>
              <td className="px-4 py-3 text-muted">{i.service ?? "—"}</td>
              <td className="max-w-md px-4 py-3 text-neutral-300">{i.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
