import React from "react";
import { User } from "../types";
import { useWardData } from "../context/WardDataContext";

interface StaffAvatarProps {
  user: Pick<User, "id" | "name" | "avatarInitials"> | null | undefined;
  size?: number;
  className?: string;
}

/** Staff profile photo, falling back to initials. */
export default function StaffAvatar({ user, size = 32, className = "" }: StaffAvatarProps) {
  const { staffPhotos } = useWardData();
  const photo = user ? staffPhotos[user.id] : undefined;
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) };

  if (photo) {
    return (
      <img
        src={photo}
        alt={user?.name ?? "Staff photo"}
        style={style}
        className={`rounded-full object-cover border border-slate-200 shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      style={style}
      className={`rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center border border-emerald-300 shrink-0 ${className}`}
    >
      {user?.avatarInitials || "?"}
    </div>
  );
}
