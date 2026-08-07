"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  CreditCard,
  Info,
  RotateCcw,
  Ticket,
  Bus,
  AlertTriangle,
  X,
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

const mockNotifications: OperatorNotification[] = [
  {
    id: "1",
    title: "New Seat Booking",
    message: "Aayush Sharma booked 2 seats on Kathmandu → Pokhara (Bus BA-3-KHA 4092).",
    time: "2m ago",
    read: false,
    category: "Booking",
    priority: "Normal",
  },
  {
    id: "2",
    title: "Settlement Transferred",
    message: "Daily settlement of NPR 45,200 transferred to your Nabil Bank account.",
    time: "45m ago",
    read: false,
    category: "Payment",
    priority: "High",
  },
  {
    id: "3",
    title: "Fleet Document Review",
    message: "Vehicle BA-2-KHA 8812 draft documents uploaded and queued for KYC review.",
    time: "2h ago",
    read: false,
    category: "Fleet",
    priority: "Normal",
  },
  {
    id: "4",
    title: "Driver License Warning",
    message: "Driver Ram Bahadur's license expires in 5 days. Please update documents.",
    time: "1d ago",
    read: true,
    category: "System",
    priority: "Critical",
  },
];

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export default function NotificationDropdown({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationDropdownProps) {
  const [activeTab, setActiveTab] = useState<"All" | "Unread">("All");
  const [notifications, setNotifications] = useState<OperatorNotification[]>(mockNotifications);
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

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
                      onClick={() => {
                        setNotifications((prev) =>
                          prev.map((n) =>
                            n.id === notification.id ? { ...n, read: true } : n
                          )
                        );
                      }}
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
