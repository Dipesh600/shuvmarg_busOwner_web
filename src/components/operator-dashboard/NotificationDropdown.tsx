"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { authFetch } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  CreditCard,
  Info,
  RotateCcw,
  Ticket,
  Bus,
} from "lucide-react";

export interface OperatorNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  category: "Booking" | "Fleet" | "Payment" | "Refund" | "System";
  priority: "Critical" | "High" | "Normal";
}


function mapBackendTypeToCategory(type: string): "Booking" | "Fleet" | "Payment" | "Refund" | "System" {
  if (!type) return "System";
  if (type.includes("BOOKING") || type.includes("TICKET")) return "Booking";
  if (type.includes("PAYMENT") || type.includes("DISPUTE")) return "Payment";
  if (type.includes("FLEET")) return "Fleet";
  if (type.includes("REFUND")) return "Refund";
  return "System";
}

function mapBackendTypeToPriority(type: string): "Critical" | "High" | "Normal" {
  if (!type) return "Normal";
  if (type.includes("DISPUTE") || type.includes("CANCELLED")) return "High";
  return "Normal";
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}


interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

interface BackendNotification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  type: string;
}

export default function NotificationDropdown({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationDropdownProps) {
  const [activeTab, setActiveTab] = useState<"All" | "Unread">("All");
  const [notifications, setNotifications] = useState<OperatorNotification[]>([]);
  const [, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await authFetch("/pushnoti/my-local-notifications");
      if (res.ok) {
        const data = await res.json();
        if (data.status && Array.isArray(data.notifications)) {
          const mapped = (data.notifications as BackendNotification[]).map((n) => ({
            id: n._id,
            title: n.title,
            message: n.message,
            time: timeAgo(n.createdAt),
            read: n.isRead,
            category: mapBackendTypeToCategory(n.type),
            priority: mapBackendTypeToPriority(n.type),
          }));
          setNotifications(mapped);
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialId = window.setTimeout(() => void fetchNotifications(), 0);
    const intervalId = window.setInterval(() => void fetchNotifications(), 60_000);
    return () => {
      window.clearTimeout(initialId);
      window.clearInterval(intervalId);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isOpen) return;
    const refreshId = window.setTimeout(() => void fetchNotifications(), 0);
    return () => window.clearTimeout(refreshId);
  }, [isOpen, fetchNotifications]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target as Node) &&
        !target.closest(".notification-toggle-btn")
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const filteredNotifications = notifications.filter((n) =>
    activeTab === "All" ? true : !n.read
  );

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    // Send background requests to mark all as read
    try {
      await Promise.all(
        unreadIds.map((id) =>
          authFetch(`/pushnoti/markNotificationAsRead/${id}`, { method: "PATCH" })
        )
      );
    } catch (err) {
      console.error("Failed to mark some notifications as read", err);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    try {
      await authFetch(`/pushnoti/markNotificationAsRead/${notificationId}`, { method: "PATCH" });
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const getCategoryIcon = (category: string, priority: string) => {
    let iconColor = "text-neutral-500";
    let bgColor = "bg-neutral-100";

    if (priority === "Critical" || priority === "High") {
      iconColor = "text-[#D96861]";
      bgColor = "bg-[#D96861]/10";
    }

    switch (category) {
      case "Booking":
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bgColor}`}>
            <Ticket className={`w-4 h-4 ${iconColor}`} />
          </div>
        );
      case "Fleet":
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bgColor}`}>
            <Bus className={`w-4 h-4 ${iconColor}`} />
          </div>
        );
      case "Payment":
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bgColor}`}>
            <CreditCard className={`w-4 h-4 ${iconColor}`} />
          </div>
        );
      case "Refund":
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bgColor}`}>
            <RotateCcw className={`w-4 h-4 ${iconColor}`} />
          </div>
        );
      case "System":
      default:
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bgColor}`}>
            <Info className={`w-4 h-4 ${iconColor}`} />
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-40 hidden sm:block md:hidden"
            onClick={onClose}
          />

          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute right-0 top-[calc(100%+8px)] w-[340px] sm:w-[380px] bg-white rounded-[24px] shadow-[0_16px_40px_rgba(0,0,0,0.12)] border border-[#EEE8E2] z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base lg:text-[17px] font-bold text-neutral-900">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#D96861]/10 text-[#D96861]">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-[#7A1D1B] hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#EEE8E2]">
                <button
                  type="button"
                  onClick={() => setActiveTab("All")}
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors ${
                    activeTab === "All"
                      ? "bg-white text-neutral-900 shadow-2xs"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("Unread")}
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === "Unread"
                      ? "bg-white text-neutral-900 shadow-2xs"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  Unread
                  {unreadCount > 0 && (
                    <span className="bg-[#D96861] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[380px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-neutral-200 [&::-webkit-scrollbar-thumb]:rounded-full pb-2">
              {filteredNotifications.length > 0 ? (
                <div className="flex flex-col">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-5 py-3.5 flex gap-3 hover:bg-neutral-50 cursor-pointer transition-colors border-l-2 ${
                        notification.read
                          ? "border-transparent"
                          : notification.priority === "High" || notification.priority === "Critical"
                          ? "border-[#D96861] bg-[#D96861]/[0.03]"
                          : "border-[#7A1D1B] bg-[#FAF8F5]/60"
                      }`}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      {getCategoryIcon(notification.category, notification.priority)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <p
                            className={`text-xs sm:text-[13px] font-bold truncate ${
                              notification.read ? "text-neutral-700" : "text-neutral-900"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <span className="text-[11px] font-medium text-neutral-400 shrink-0 mt-0.5">
                            {notification.time}
                          </span>
                        </div>
                        <p
                          className={`text-xs leading-relaxed line-clamp-2 ${
                            notification.read ? "text-neutral-500" : "text-neutral-600"
                          }`}
                        >
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-10 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[#FAF8F5] flex items-center justify-center mb-3 border border-[#EEE8E2]">
                    <CheckCircle2 className="w-6 h-6 text-neutral-400" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mb-1">
                    You&apos;re all caught up
                  </h4>
                  <p className="text-xs text-neutral-500 max-w-[220px]">
                    {activeTab === "Unread"
                      ? "No unread notifications right now."
                      : "You don't have any notifications at the moment."}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-[#EEE8E2] bg-[#FAF8F5]/50">
                <button
                  type="button"
                  className="w-full py-2 text-xs font-bold text-neutral-700 hover:text-[#7A1D1B] bg-white border border-[#EEE8E2] hover:border-[#7A1D1B]/30 rounded-xl transition-all shadow-2xs"
                >
                  View All Notifications
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
