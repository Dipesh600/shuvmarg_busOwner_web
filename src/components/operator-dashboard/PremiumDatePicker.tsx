"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface PremiumDatePickerProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  customTrigger?: React.ReactNode;
}

export default function PremiumDatePicker({
  selectedDate: externalSelectedDate,
  onDateChange,
  customTrigger,
}: PremiumDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(externalSelectedDate || new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date((externalSelectedDate || new Date()).getFullYear(), (externalSelectedDate || new Date()).getMonth(), 1)
  );
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalSelectedDate) {
      setSelectedDate(externalSelectedDate);
      setCurrentMonth(new Date(externalSelectedDate.getFullYear(), externalSelectedDate.getMonth(), 1));
    }
  }, [externalSelectedDate]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Formatting date string: e.g. "August 7, 2026, Friday"
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(selectedDate);

  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(selectedDate);

  const displayStr = `${formattedDate}, ${weekday}`;

  // Calendar logic
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    if (onDateChange) onDateChange(date);
    setIsOpen(false);
  };

  return (
    <div className="relative self-start sm:self-auto" ref={popoverRef}>
      {/* Trigger Button */}
      {customTrigger ? (
        <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
          {customTrigger}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white hover:bg-neutral-50 border border-[#EEE8E2] rounded-2xl shadow-2xs transition-all group focus:outline-none focus:ring-2 focus:ring-[#7A1D1B]/10"
          aria-expanded={isOpen}
          aria-label="Select date"
        >
          <Image
            src="/operator-dashboard/icons/calendar-doodle.svg"
            alt="Calendar"
            width={18}
            height={18}
            className="flex-shrink-0"
          />
          <span className="text-xs font-semibold text-[#746E69] group-hover:text-neutral-900 transition-colors">
            {displayStr}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 transition-transform duration-200 ml-0.5 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {/* Popover Calendar */}
      {isOpen && (
        <div className="absolute right-0 sm:right-0 top-[calc(100%+8px)] w-[310px] bg-white border border-[#EEE8E2] rounded-3xl shadow-xl z-50 overflow-hidden transform origin-top-right animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-neutral-900 tracking-tight">
                {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(currentMonth)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-600"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-600"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div key={day} className="text-center text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, i) => {
                if (!date) return <div key={`empty-${i}`} className="h-8" />;

                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, new Date());

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => handleSelectDate(date)}
                    className={`h-8 w-full rounded-xl flex items-center justify-center text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-[#D96861] text-white shadow-xs font-bold"
                        : isToday
                        ? "bg-[#FAF8F5] text-[#D96861] font-bold border border-[#D96861]/30"
                        : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
