import React from "react";

const stats = [
  { label: "Pending Approvals", value: "24", change: "+5", color: "text-amber-600" },
  { label: "Approved Today", value: "18", change: "+3", color: "text-green-600" },
  { label: "Rejected", value: "3", change: "-1", color: "text-red-600" },
  { label: "Total Requests (MTD)", value: "142", change: "+12%", color: "text-blue-600" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back. Here is your approval overview.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
            <p className={`mt-1 text-sm font-medium ${s.color}`}>{s.change}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">
            Recent Requests
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            No pending requests to display.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">
            Approval Activity
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            No recent activity to display.
          </p>
        </div>
      </div>
    </div>
  );
}
