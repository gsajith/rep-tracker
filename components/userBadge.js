"use client";
import { UserButton, useUser } from "@clerk/nextjs";

export default function UserBadge() {
  const { user } = useUser();

  return <div
    style={{
      position: "absolute",
      top: 16,
      borderRadius: 12,
      left: 12,
      display: "flex",
      alignItems: "center",
      gap: 10
    }}>
    <UserButton />
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 14, color: "#747176" }}>Welcome 👋</span>
      <span style={{ fontSize: 20, fontWeight: "bold" }}>{user.fullName}</span>
    </div>
  </div>
}
