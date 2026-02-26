"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faCheckCircle,
  faTruck,
  faRepeat,
  faShieldAlt,
  faPhone,
  faEnvelope,
  faComment,
  faCommentDots,
  faMapMarkerAlt,
  faFlag,
  faTimes,
  faSpinner,
  faChevronLeft,
  faChevronRight,
  faCalendarAlt,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { Provider } from "./providerData";

interface ProfileSidebarProps {
  provider: Provider;
}

// Icon mapping for dynamic icons
const iconMap: Record<string, any> = {
  faClock,
  faCheckCircle,
  faTruck,
  faRepeat,
  faCommentDots,
  faPhone,
  faComment,
  faEnvelope,
};

interface TimeSlot {
  slot_id: number;
  start_time: string;
  end_time: string;
  display_time: string;
  notes: string;
  is_available?: boolean;
}

interface AvailabilityDay {
  day_of_week: string;
  date: string;
  is_available: boolean;
  slots: Array<{
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    is_booked: boolean;
    notes: string;
  }>;
}

export default function ProfileSidebar({ provider }: ProfileSidebarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [allSlots, setAllSlots] = useState<TimeSlot[]>([]);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityDay[]>(
    [],
  );
  const [weekStart, setWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    service_type: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function getWeekStart(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function generateAllPossibleSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    for (let hour = 9; hour < 17; hour++) {
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endTime = `${String(hour + 1).padStart(2, "0")}:00`;
      const startHour12 = hour > 12 ? hour - 12 : hour;
      const endHour12 = hour + 1 > 12 ? hour + 1 - 12 : hour + 1;
      const startAMPM = hour >= 12 ? "PM" : "AM";
      const endAMPM = hour + 1 >= 12 ? "PM" : "AM";

      slots.push({
        slot_id: -1 * (hour - 8),
        start_time: startTime,
        end_time: endTime,
        display_time: `${startHour12}:00 ${startAMPM} - ${endHour12}:00 ${endAMPM}`,
        notes: "",
        is_available: false,
      });
    }
    return slots;
  }

  useEffect(() => {
    fetchAvailability();
  }, [weekStart, provider.slug]);

  async function fetchAvailability() {
    setLoading(true);
    try {
      const weekStartStr = formatDate(weekStart);
      const response = await fetch(
        `/api/v1/calendar/weekly-availability/?provider_slug=${provider.slug}&week_start=${weekStartStr}`,
      );
      if (response.ok) {
        const data = await response.json();
        setAvailabilityData(data);
      } else {
        setAvailabilityData([]);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      setAvailabilityData([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTimeSlotsForDate(dateStr: string) {
    setLoadingSlots(true);
    try {
      const response = await fetch(
        `/api/v1/calendar/available-slots/?provider_slug=${provider.slug}&date=${dateStr}`,
      );
      if (response.ok) {
        const data = await response.json();
        const availableSlotsList = data.slots || [];
        const allPossibleSlots = generateAllPossibleSlots();
        const mergedSlots = allPossibleSlots.map((possibleSlot) => {
          const matchingSlot = availableSlotsList.find(
            (available: TimeSlot) =>
              available.start_time === possibleSlot.start_time,
          );
          if (matchingSlot) {
            return { ...matchingSlot, is_available: true };
          }
          return { ...possibleSlot, is_available: false };
        });
        setAllSlots(mergedSlots);
        setAvailableSlots(
          mergedSlots.filter((slot) => slot.is_available === true),
        );
      } else {
        setAllSlots(generateAllPossibleSlots());
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setAllSlots(generateAllPossibleSlots());
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  function handleDateSelect(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    fetchTimeSlotsForDate(dateStr);
  }

  function getWeekDates() {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekDates = getWeekDates();

  function hasAvailability(date: Date): boolean {
    const dateStr = formatDate(date);
    const dayData = availabilityData.find((d) => d.date === dateStr);
    return dayData?.is_available === true;
  }

  function goToPreviousWeek() {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() - 7);
    setWeekStart(newDate);
    setSelectedDate(null);
    setSelectedSlot(null);
    setAvailableSlots([]);
    setAllSlots([]);
  }

  function goToNextWeek() {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + 7);
    setWeekStart(newDate);
    setSelectedDate(null);
    setSelectedSlot(null);
    setAvailableSlots([]);
    setAllSlots([]);
  }

  async function handleBookingSubmit() {
    if (
      !selectedDate ||
      !selectedSlot ||
      !bookingForm.client_name ||
      !bookingForm.client_email ||
      !bookingForm.client_phone
    ) {
      alert("Please fill in all required fields and select a time slot");
      return;
    }

    setSubmitting(true);
    try {
      // FIXED: Use relative URL instead of hardcoded http://127.0.0.1:8000
      const response = await fetch("/api/v1/appointments/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_provider_id: provider.id,
          appointment_date: selectedDate,
          appointment_time: selectedSlot.start_time,
          slot_id: selectedSlot.slot_id,
          client_name: bookingForm.client_name,
          client_email: bookingForm.client_email,
          client_phone: bookingForm.client_phone,
          service_type: bookingForm.service_type,
          description: bookingForm.description,
        }),
      });

      if (response.ok) {
        alert(
          `✅ Booking request sent successfully!\n\n` +
            `📧 We will send a confirmation to ${bookingForm.client_email}\n\n` +
            `The provider will review and confirm your appointment. ` +
            `You'll receive another email once it's confirmed.`,
        );
        setShowBookingModal(false);
        setBookingForm({
          client_name: "",
          client_email: "",
          client_phone: "",
          service_type: "",
          description: "",
        });
        setSelectedDate(null);
        setSelectedSlot(null);
        setAvailableSlots([]);
        setAllSlots([]);
        fetchAvailability();
      } else {
        const error = await response.json();
        alert(
          `Failed to create booking: ${error.error || error.detail || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Availability Card */}
      <div className="bg-neutral-0 rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="heading-4 text-neutral-900">Availability</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Previous week"
            >
              <FontAwesomeIcon
                icon={faChevronLeft}
                className="text-neutral-600 text-sm"
              />
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Next week"
            >
              <FontAwesomeIcon
                icon={faChevronRight}
                className="text-neutral-600 text-sm"
              />
            </button>
          </div>
        </div>

        <p className="text-center text-neutral-600 text-sm mb-4">
          {weekStart.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}{" "}
          -{" "}
          {weekDates[6].toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDates.map((date, index) => {
            const dateStr = formatDate(date);
            const isAvailable = hasAvailability(date);
            const isSelected = selectedDate === dateStr;
            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

            return (
              <button
                key={dateStr}
                onClick={() =>
                  isAvailable && !isPast && handleDateSelect(dateStr)
                }
                disabled={!isAvailable || isPast}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                  isSelected
                    ? "bg-primary-500 text-neutral-0"
                    : isAvailable && !isPast
                      ? "bg-primary-50 text-primary-700 hover:bg-primary-100"
                      : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                }`}
              >
                <span className="text-xs font-medium mb-1">
                  {weekDays[index]}
                </span>
                <span className="text-lg font-semibold">{date.getDate()}</span>
                {isAvailable && !isPast && (
                  <span className="text-[10px] text-primary-600 mt-1">•</span>
                )}
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <h4 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <FontAwesomeIcon icon={faClock} className="text-primary-600" />
              Time Slots for{" "}
              {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                },
              )}
            </h4>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-4">
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="text-primary-600 animate-spin mr-2"
                />
                <span className="text-neutral-600 text-sm">
                  Loading slots...
                </span>
              </div>
            ) : allSlots.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2">
                {allSlots.map((slot) => {
                  const isAvailable = slot.is_available === true;
                  const isSelected =
                    isAvailable && selectedSlot?.slot_id === slot.slot_id;

                  return (
                    <div key={slot.start_time} className="relative group">
                      <button
                        onClick={() => isAvailable && setSelectedSlot(slot)}
                        disabled={!isAvailable}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-sm font-medium relative ${
                          isSelected
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : isAvailable
                              ? "border-neutral-200 hover:border-primary-300 text-neutral-700 hover:bg-neutral-50"
                              : "border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed opacity-60"
                        }`}
                      >
                        <span className="block">{slot.display_time}</span>
                        {!isAvailable && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                              <FontAwesomeIcon
                                icon={faTimesCircle}
                                className="text-neutral-500 text-lg"
                              />
                            </div>
                          </div>
                        )}
                      </button>
                      {!isAvailable && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="bg-neutral-900 text-neutral-0 text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                            This slot is not available
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                              <div className="border-4 border-transparent border-t-neutral-900"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-neutral-500 text-sm py-4">
                No time slots available
              </p>
            )}

            {allSlots.length > 0 && (
              <p className="text-center text-neutral-600 text-xs mt-3">
                {availableSlots.length} of {allSlots.length} slots available
              </p>
            )}

            {selectedSlot && (
              <div className="mt-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-primary-900 font-semibold text-sm">
                  Selected: {selectedSlot.display_time}
                </p>
                {selectedSlot.notes && (
                  <p className="text-primary-700 text-xs mt-1">
                    {selectedSlot.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setShowBookingModal(true)}
          disabled={!selectedDate || !selectedSlot || loading}
          className="w-full btn-primary mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : "Request Booking"}
        </button>

        {loading && (
          <div className="flex items-center justify-center mt-3">
            <FontAwesomeIcon
              icon={faSpinner}
              className="text-primary-600 animate-spin mr-2"
            />
            <p className="text-neutral-500 text-sm">Loading availability...</p>
          </div>
        )}

        {!loading && availabilityData.length === 0 && (
          <p className="text-center text-neutral-500 text-sm mt-3">
            No availability set for this week
          </p>
        )}

        {!loading && availabilityData.length > 0 && (
          <p className="text-center text-neutral-600 text-xs mt-3">
            {availabilityData.filter((d) => d.is_available).length} days
            available this week
          </p>
        )}
      </div>

      {/* Quick Stats Card */}
      <div className="bg-neutral-0 rounded-xl shadow-sm border border-neutral-200 p-6">
        <h3 className="heading-4 text-neutral-900 mb-4">Quick Stats</h3>
        <div className="space-y-3">
          {provider.quickStats.map((stat, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon
                  icon={iconMap[stat.icon] || faClock}
                  className="text-primary-600 text-sm"
                />
              </div>
              <div className="flex-1">
                <span className="text-neutral-700 body-regular">
                  {stat.label}
                </span>
              </div>
              <span className="font-semibold text-neutral-900">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Service Area Card */}
      <div className="bg-neutral-0 rounded-xl shadow-sm border border-neutral-200 p-6">
        <h3 className="heading-4 text-neutral-900 mb-4">Service Area</h3>
        <div className="relative w-full h-48 bg-neutral-100 rounded-lg mb-4 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-primary-500 flex items-center justify-center bg-primary-50">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-700">
                    {provider.serviceArea.radius}
                  </p>
                  <p className="text-xs text-primary-600">miles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-neutral-700 body-regular text-center mb-3">
          Services within {provider.serviceArea.radius} miles of{" "}
          {provider.serviceArea.location}
        </p>
        <button className="w-full text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center justify-center gap-2">
          View on map
          <FontAwesomeIcon icon={faMapMarkerAlt} />
        </button>
      </div>

      {/* Background Verified Card */}
      {provider.backgroundVerified && (
        <div className="bg-neutral-0 rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon
                icon={faShieldAlt}
                className="text-primary-600 text-xl"
              />
            </div>
            <div>
              <h3 className="heading-4 text-neutral-900 mb-1">
                Background Verified
              </h3>
              <p className="body-small text-neutral-600">
                This provider has passed our comprehensive background check
              </p>
            </div>
          </div>
          <button className="w-full btn-primary">Contact Provider</button>
        </div>
      )}

      {/* Best Ways to Reach Me Card */}
      <div className="bg-neutral-0 rounded-xl shadow-sm border border-neutral-200 p-6">
        <h3 className="heading-4 text-neutral-900 mb-4">
          Best Ways to Reach Me
        </h3>
        <div className="space-y-3">
          {provider.contactMethods.map((method, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon
                  icon={iconMap[method.icon] || faPhone}
                  className="text-neutral-600 text-lg w-5"
                />
                <span className="text-neutral-700 body-regular">
                  {method.label}
                </span>
              </div>
              {method.preferred && (
                <div className="w-3 h-3 rounded-full bg-primary-500"></div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 body-small text-neutral-600">
          Working hours: Mon-Sat 8AM-6PM
        </p>
      </div>

      {/* Report Profile */}
      <button className="w-full text-neutral-500 hover:text-neutral-700 font-medium text-sm flex items-center justify-center gap-2 py-3">
        <FontAwesomeIcon icon={faFlag} />
        Report this profile
      </button>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
              <h3 className="heading-4 text-neutral-900">Request Booking</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>

            {/* Modal Body — scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Selected Date & Time Info */}
              <div className="mb-5 bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon
                    icon={faCalendarAlt}
                    className="text-primary-600 mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <p className="text-primary-900 font-semibold">
                      {selectedDate &&
                        new Date(selectedDate + "T00:00:00").toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                    </p>
                    {selectedSlot && (
                      <p className="text-primary-700 text-sm mt-1">
                        {selectedSlot.display_time}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Booking Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1.5 text-sm">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bookingForm.client_name}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        client_name: e.target.value,
                      })
                    }
                    placeholder="John Doe"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1.5 text-sm">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={bookingForm.client_email}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        client_email: e.target.value,
                      })
                    }
                    placeholder="john@example.com"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1.5 text-sm">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={bookingForm.client_phone}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        client_phone: e.target.value,
                      })
                    }
                    placeholder="+977 98XXXXXXXX"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1.5 text-sm">
                    Service Type
                  </label>
                  <input
                    type="text"
                    value={bookingForm.service_type}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        service_type: e.target.value,
                      })
                    }
                    placeholder="e.g., Consultation, Repair, Inquiry"
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1.5 text-sm">
                    Reason for Booking
                  </label>
                  <textarea
                    value={bookingForm.description}
                    onChange={(e) =>
                      setBookingForm({
                        ...bookingForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Please describe your needs..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none text-sm"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-700 text-sm">
                    <strong>Note:</strong> This is a booking request. The
                    provider will review and confirm your appointment.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setShowBookingModal(false)}
                disabled={submitting}
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors disabled:opacity-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleBookingSubmit}
                disabled={submitting}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                    />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
