"use client";
import { UserButton, useUser } from "@clerk/nextjs";

export default function UserBadge() {
  const { user } = useUser();

  return <div
    style={{
      position: "fixed",
      top: 8,
      borderRadius: 12,
      left: 12,
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "#ECEFF388",
      paddingRight: 24,
      padding: 8
    }}>
    {user ? <UserButton /> : <div style={{ width: 56, height: 56, background: "#ababab", borderRadius: 999 }} />}
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {user && <span style={{ fontSize: 14, color: "#908E96" }}>Welcome 👋</span>}
      <span style={{ fontSize: 20, fontWeight: "bold" }}>{user ? user.fullName : "Logging in..."}</span>
    </div>
  </div>
}
