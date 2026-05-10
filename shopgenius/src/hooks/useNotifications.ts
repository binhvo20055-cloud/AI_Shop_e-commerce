"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "./useAuth";

export interface Notification {
  id: string;
  type: "order_confirmed" | "order_shipped" | "order_delivered" | "new_review" | "low_stock";
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  metadata?: Record<string, string>;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const notifRef = collection(db, "notifications", user.uid, "items");
    const q = query(notifRef, orderBy("createdAt", "desc"), limit(20));

    const unsubscribe: Unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Notification[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Notification, "id">),
      }));
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    const ref = doc(db, "notifications", user.uid, "items", notificationId);
    await updateDoc(ref, { read: true });
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markAsRead(n.id)));
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
