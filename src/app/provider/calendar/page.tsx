"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faFilter,
  faPlus,
  faUser,
  faTimes,
  faCalendar,
  faClock,
  faSpinner,
  faExclamationTriangle,
  faCheckCircle,
  faEdit,
  faTrash,
  faCalendarPlus,
  faCalendarCheck,
  faEye,
  faCheck,
  faBan,
  faHourglassHalf,
  faInfoCircle,
  faEnvelope,
  faPhone,
  faSearch,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ==================================================================================
// TYPE DEFINITIONS
// ==================================================================================
interface Event {
  id: number;
  title: string;
  event_type: "deadline" | "meeting" | "reminder" | "task" | "appointment";
  event_date: string;
  event_time: string | null;
  description: string;
  user_assigned: number | null;
  assigned_user_email: string | null;
  location: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface EventsData {
  [key: string]: Event[];
}

interface AvailabilitySlot {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurring_days: string[] | null;
  recurring_end_date: string | null;
  is_booked: boolean;
  booked_by: number | null;
  booked_by_email: string | null;
  notes: string;
  created_at: string;
}

interface EventFormData {
  title: string;
  event_type: "deadline" | "meeting" | "reminder" | "task" | "appointment";
  event_date: string;
  event_time: string;
  description: string;
  location: string;
}

interface AvailabilityFormData {
  date: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurring_days: string[];
  recurring_end_date: string;
  notes: string;
}

interface Appointment {
  id: number;
  service_provider: { id: number; full_name: string; business_name: string };
  client: {
    id: number;
    full_name: string;
    user_email: string;
    user_phone: string;
  } | null;
  client_name: string;
  client_email: string;
  client_phone: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  description: string;
  location_address: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rescheduled";
  status_display: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface AppointmentCounts {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  rescheduled: number;
}

// ==================================================================================
// SHARED STYLE HELPERS
// ==================================================================================
const baseInput: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 1rem",
  fontFamily: "var(--font-sans)",
  fontSize: "0.875rem",
  color: "var(--color-neutral-900)",
  backgroundColor: "var(--color-neutral-0)",
  border: "1px solid var(--color-neutral-200)",
  borderRadius: "0.625rem",
  outline: "none",
  transition: "border-color 150ms, box-shadow 150ms",
  appearance: "none" as const,
};

const tealFocus = (
  e: React.FocusEvent<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >,
) => {
  e.currentTarget.style.borderColor = "#1ab189";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,177,137,0.12)";
};
const blurReset = (
  e: React.FocusEvent<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >,
) => {
  e.currentTarget.style.borderColor = "var(--color-neutral-200)";
  e.currentTarget.style.boxShadow = "none";
};

// ==================================================================================
// EVENT TYPE CONFIG
// ==================================================================================
const EVENT_TYPE_CONFIG: Record<
  string,
  { bg: string; border: string; text: string; dot: string; label: string }
> = {
  deadline: {
    bg: "#fef2f2",
    border: "#fecaca",
    text: "#b91c1c",
    dot: "#ef4444",
    label: "Deadline",
  },
  meeting: {
    bg: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
    dot: "#3b82f6",
    label: "Meeting",
  },
  reminder: {
    bg: "#fffbeb",
    border: "#fde68a",
    text: "#92400e",
    dot: "#f59e0b",
    label: "Reminder",
  },
  task: {
    bg: "#f0fdf4",
    border: "#bbf7d0",
    text: "#15803d",
    dot: "#22c55e",
    label: "Task",
  },
  appointment: {
    bg: "#faf5ff",
    border: "#e9d5ff",
    text: "#7e22ce",
    dot: "#a855f7",
    label: "Appointment",
  },
};

const APPT_STATUS_CONFIG: Record<
  string,
  { bg: string; border: string; color: string; icon: typeof faHourglassHalf }
> = {
  pending: {
    bg: "#fffbeb",
    border: "#fde68a",
    color: "#92400e",
    icon: faHourglassHalf,
  },
  confirmed: {
    bg: "#eff6ff",
    border: "#bfdbfe",
    color: "#1d4ed8",
    icon: faCheckCircle,
  },
  completed: {
    bg: "#f0fdf4",
    border: "#bbf7d0",
    color: "#15803d",
    icon: faCheck,
  },
  cancelled: {
    bg: "#fef2f2",
    border: "#fecaca",
    color: "#b91c1c",
    icon: faBan,
  },
  rescheduled: {
    bg: "#faf5ff",
    border: "#e9d5ff",
    color: "#7e22ce",
    icon: faCalendar,
  },
};

const STAT_CARD_CONFIG: Record<
  string,
  {
    border: string;
    activeBg: string;
    iconColor: string;
    icon: typeof faCalendarCheck;
  }
> = {
  all: {
    border: "#1ab189",
    activeBg: "rgba(26,177,137,0.06)",
    iconColor: "#1ab189",
    icon: faCalendarCheck,
  },
  pending: {
    border: "#f59e0b",
    activeBg: "#fffbeb",
    iconColor: "#d97706",
    icon: faHourglassHalf,
  },
  confirmed: {
    border: "#3b82f6",
    activeBg: "#eff6ff",
    iconColor: "#2563eb",
    icon: faCheckCircle,
  },
  completed: {
    border: "#22c55e",
    activeBg: "#f0fdf4",
    iconColor: "#16a34a",
    icon: faCheck,
  },
  rescheduled: {
    border: "#a855f7",
    activeBg: "#faf5ff",
    iconColor: "#9333ea",
    icon: faCalendar,
  },
  cancelled: {
    border: "#ef4444",
    activeBg: "#fef2f2",
    iconColor: "#dc2626",
    icon: faBan,
  },
};

// ==================================================================================
// FIELD & SECTION CARD
// ==================================================================================
function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="block font-semibold mb-1.5"
        style={{ fontSize: "0.8rem", color: "var(--color-neutral-700)" }}
      >
        {label}
        {required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {children}
      {hint && (
        <p
          className="mt-1"
          style={{ fontSize: "0.72rem", color: "var(--color-neutral-500)" }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

// ==================================================================================
// MODAL WRAPPER
// ==================================================================================
function Modal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      {children}
    </div>
  );
}

// ==================================================================================
// MAIN COMPONENT
// ==================================================================================
export default function CalendarPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"calendar" | "appointments">(
    "calendar",
  );
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const diff = today.getDate() - today.getDay();
    return new Date(today.setDate(diff));
  });
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(
    new Set(),
  );
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [showSlotsModal, setShowSlotsModal] = useState(false);
  const [selectedDateSlots, setSelectedDateSlots] = useState<string | null>(
    null,
  );
  const [viewingSlots, setViewingSlots] = useState<AvailabilitySlot[]>([]);

  const [selectedAppointmentStatus, setSelectedAppointmentStatus] =
    useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showAppointmentDetailsModal, setShowAppointmentDetailsModal] =
    useState(false);
  const [showConfirmAppointmentModal, setShowConfirmAppointmentModal] =
    useState(false);
  const [showCancelAppointmentModal, setShowCancelAppointmentModal] =
    useState(false);
  const [appointmentActionNotes, setAppointmentActionNotes] = useState("");

  const filterRef = useRef<HTMLDivElement>(null);

  const [eventForm, setEventForm] = useState<EventFormData>({
    title: "",
    event_type: "task",
    event_date: new Date().toISOString().split("T")[0],
    event_time: "",
    description: "",
    location: "",
  });

  const [availabilityForm, setAvailabilityForm] =
    useState<AvailabilityFormData>({
      date: new Date().toISOString().split("T")[0],
      start_time: "09:00",
      end_time: "17:00",
      is_recurring: false,
      recurring_days: [],
      recurring_end_date: "",
      notes: "",
    });

  // ── Helpers ──
  const formatDateForAPI = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getWeekDates = () =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      return d;
    });

  const weekEndDate = new Date(currentWeekStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const formatTime12Hour = (time24: string) => {
    if (!time24) return "";
    const [h, m] = time24.split(":");
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatDateTime = (dateStr: string, timeStr: string) =>
    `${formatDate(dateStr)} at ${formatTime12Hour(timeStr)}`;

  const getSlotCountForDate = (dateStr: string) =>
    (
      availabilityData as
        | { date: string; slots: AvailabilitySlot[] }[]
        | undefined
    )?.find((d) => d.date === dateStr)?.slots?.length ?? 0;

  const getBookedSlotCountForDate = (dateStr: string) =>
    (
      availabilityData as
        | { date: string; slots: AvailabilitySlot[] }[]
        | undefined
    )
      ?.find((d) => d.date === dateStr)
      ?.slots?.filter((s) => s.is_booked).length ?? 0;

  // ── Queries ──
  const {
    data: eventsData,
    isLoading: eventsLoading,
    isError: eventsError,
  } = useQuery<EventsData>({
    queryKey: ["calendar-events", formatDateForAPI(currentWeekStart)],
    queryFn: () =>
      api.get<EventsData>(
        `/api/v1/calendar/events/week/?week_start=${formatDateForAPI(currentWeekStart)}`,
      ),
  });

  const { data: availabilityData, isLoading: availabilityLoading } = useQuery({
    queryKey: ["calendar-availability", formatDateForAPI(currentWeekStart)],
    queryFn: () =>
      api.get<{ date: string; slots: AvailabilitySlot[] }[]>(
        `/api/v1/calendar/availability/week/?week_start=${formatDateForAPI(currentWeekStart)}`,
      ),
  });

  const {
    data: appointments,
    isLoading: appointmentsLoading,
    isError: appointmentsError,
  } = useQuery<Appointment[]>({
    queryKey: ["appointments", selectedAppointmentStatus],
    queryFn: async () => {
      const url =
        selectedAppointmentStatus === "all"
          ? "/api/v1/appointments/"
          : `/api/v1/appointments/?status=${selectedAppointmentStatus}`;
      const res = await api.get<{ count: number; results: Appointment[] }>(url);
      return res.results;
    },
  });

  const { data: appointmentCounts } = useQuery<AppointmentCounts>({
    queryKey: ["appointment-counts"],
    queryFn: () => api.get<AppointmentCounts>("/api/v1/appointments/counts/"),
  });

  // ── Mutations ──
  const createEventMutation = useMutation({
    mutationFn: (data: EventFormData) =>
      api.post<Event>("/api/v1/calendar/events/", {
        ...data,
        event_time: data.event_time || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["calendar-events", formatDateForAPI(currentWeekStart)],
      });
      setShowAddEventModal(false);
      resetEventForm();
    },
    onError: (err: unknown) => {
      const e = err as { data?: { detail?: string }; message?: string };
      alert(
        `Failed to create event: ${e.data?.detail ?? e.message ?? "Unknown error"}`,
      );
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EventFormData> }) =>
      api.patch<Event>(`/api/v1/calendar/events/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["calendar-events", formatDateForAPI(currentWeekStart)],
      });
      setShowEditEventModal(false);
      setSelectedEvent(null);
    },
    onError: (err: unknown) => {
      const e = err as { data?: { detail?: string }; message?: string };
      alert(
        `Failed to update event: ${e.data?.detail ?? e.message ?? "Unknown error"}`,
      );
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/calendar/events/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["calendar-events", formatDateForAPI(currentWeekStart)],
      });
      setShowDeleteEventModal(false);
      setSelectedEvent(null);
    },
    onError: (err: unknown) => {
      const e = err as { data?: { detail?: string }; message?: string };
      alert(
        `Failed to delete event: ${e.data?.detail ?? e.message ?? "Unknown error"}`,
      );
    },
  });

  const completeEventMutation = useMutation({
    mutationFn: (id: number) =>
      api.post<Event>(`/api/v1/calendar/events/${id}/complete/`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["calendar-events", formatDateForAPI(currentWeekStart)],
      });
    },
    onError: (err: unknown) => {
      const e = err as { data?: { detail?: string }; message?: string };
      alert(`Failed: ${e.data?.detail ?? e.message ?? "Unknown error"}`);
    },
  });

  const createAvailabilityMutation = useMutation({
    mutationFn: (data: AvailabilityFormData) =>
      api.post<AvailabilitySlot[]>("/api/v1/calendar/availability/", {
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
        is_recurring: data.is_recurring,
        recurring_days: data.is_recurring ? data.recurring_days : undefined,
        recurring_end_date:
          data.is_recurring && data.recurring_end_date
            ? data.recurring_end_date
            : null,
        notes: data.notes || "",
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["calendar-availability", formatDateForAPI(currentWeekStart)],
      });
      setShowAvailabilityModal(false);
      resetAvailabilityForm();
      alert(
        `Success! Created ${data.length} hourly time slot${data.length !== 1 ? "s" : ""}.`,
      );
    },
    onError: (err: unknown) => {
      const e = err as { data?: { detail?: string }; message?: string };
      alert(
        `Failed to create availability: ${e.data?.detail ?? e.message ?? "Unknown error"}`,
      );
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (slotId: number) =>
      api.delete(`/api/v1/calendar/availability/${slotId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["calendar-availability", formatDateForAPI(currentWeekStart)],
      });
      if (selectedDateSlots) fetchSlotsForDate(selectedDateSlots);
    },
    onError: (err: unknown) => {
      const e = err as { data?: { detail?: string }; message?: string };
      alert(
        `Failed to delete slot: ${e.data?.detail ?? e.message ?? "This slot may be booked"}`,
      );
    },
  });

  const confirmAppointmentMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      api.put<{ confirmation_email_sent?: boolean }>(
        `/api/v1/appointments/${id}/status/`,
        { status: "confirmed", notes },
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment-counts"] });
      setShowConfirmAppointmentModal(false);
      setSelectedAppointment(null);
      setAppointmentActionNotes("");
      const emailStatus = data.confirmation_email_sent
        ? "Confirmation email sent to client!"
        : "Confirmed (email notification failed)";
      alert(`✅ Appointment confirmed!\n📧 ${emailStatus}`);
    },
    onError: (err: unknown) => {
      const e = err as { data?: { error?: string }; message?: string };
      alert(
        `Failed to confirm: ${e.data?.error ?? e.message ?? "Unknown error"}`,
      );
    },
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.post(`/api/v1/appointments/${id}/cancel/`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment-counts"] });
      setShowCancelAppointmentModal(false);
      setSelectedAppointment(null);
      setAppointmentActionNotes("");
    },
    onError: (err: unknown) => {
      const e = err as { data?: { error?: string }; message?: string };
      alert(
        `Failed to cancel: ${e.data?.error ?? e.message ?? "Unknown error"}`,
      );
    },
  });

  const completeAppointmentMutation = useMutation({
    mutationFn: (id: number) =>
      api.put(`/api/v1/appointments/${id}/status/`, { status: "completed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment-counts"] });
    },
    onError: (err: unknown) => {
      const e = err as { data?: { error?: string }; message?: string };
      alert(`Failed: ${e.data?.error ?? e.message ?? "Unknown error"}`);
    },
  });

  // ── Handlers ──
  const resetEventForm = () =>
    setEventForm({
      title: "",
      event_type: "task",
      event_date: new Date().toISOString().split("T")[0],
      event_time: "",
      description: "",
      location: "",
    });
  const resetAvailabilityForm = () =>
    setAvailabilityForm({
      date: new Date().toISOString().split("T")[0],
      start_time: "09:00",
      end_time: "17:00",
      is_recurring: false,
      recurring_days: [],
      recurring_end_date: "",
      notes: "",
    });

  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    setEventForm({
      title: event.title,
      event_type: event.event_type,
      event_date: event.event_date,
      event_time: event.event_time || "",
      description: event.description || "",
      location: event.location || "",
    });
    setShowEditEventModal(true);
  };

  const fetchSlotsForDate = (dateStr: string) => {
    setSelectedDateSlots(dateStr);
    setShowSlotsModal(true);
    const dayData = (
      availabilityData as
        | { date: string; slots: AvailabilitySlot[] }[]
        | undefined
    )?.find((d) => d.date === dateStr);
    setViewingSlots(dayData?.slots || []);
  };

  const handleDeleteSlot = (slotId: number) => {
    if (confirm("Are you sure you want to delete this time slot?"))
      deleteSlotMutation.mutate(slotId);
  };

  const toggleFilter = (filter: string) => {
    const next = new Set(selectedFilters);
    next.has(filter) ? next.delete(filter) : next.add(filter);
    setSelectedFilters(next);
  };

  const toggleRecurringDay = (day: string) => {
    const days = availabilityForm.recurring_days.includes(day)
      ? availabilityForm.recurring_days.filter((d) => d !== day)
      : [...availabilityForm.recurring_days, day];
    setAvailabilityForm({ ...availabilityForm, recurring_days: days });
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setShowFilterDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredAppointments = appointments?.filter((apt) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      apt.client_name.toLowerCase().includes(q) ||
      apt.client_email?.toLowerCase().includes(q) ||
      apt.client_phone?.toLowerCase().includes(q) ||
      apt.service_type?.toLowerCase().includes(q)
    );
  });

  const pendingCount = appointmentCounts?.pending ?? 0;

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekDaysAPI = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const eventTypes = Object.entries(EVENT_TYPE_CONFIG).map(([type, c]) => ({
    type,
    label: c.label,
    dot: c.dot,
  }));

  // ── Loading / Error ──
  if (eventsLoading || availabilityLoading || appointmentsLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-neutral-50)" }}
      >
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="animate-spin mb-3"
            style={{ fontSize: "2rem", color: "#1ab189" }}
          />
          <p
            style={{ fontSize: "0.875rem", color: "var(--color-neutral-500)" }}
          >
            Loading…
          </p>
        </div>
      </div>
    );
  }

  if (eventsError || appointmentsError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-neutral-50)" }}
      >
        <div
          className="rounded-2xl p-8 text-center max-w-md"
          style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#fee2e2" }}
          >
            <FontAwesomeIcon
              icon={faTimes}
              style={{ color: "#b91c1c", fontSize: "1.25rem" }}
            />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: "#7f1d1d" }}>
            Error Loading Data
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#b91c1c" }}>
            Failed to load calendar data. Please try again.
          </p>
        </div>
      </div>
    );
  }

  // ==================================================================================
  // RENDER
  // ==================================================================================
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-neutral-50)" }}
    >
      {/* ── Page Header ── */}
      <div
        style={{
          backgroundColor: "var(--color-neutral-0)",
          borderBottom: "1px solid var(--color-neutral-200)",
          padding: "1.125rem 2rem",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1
              className="font-bold"
              style={{
                fontSize: "1.375rem",
                color: "var(--color-neutral-900)",
                lineHeight: 1.2,
              }}
            >
              Calendar &amp; Appointments
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-neutral-500)",
                marginTop: "0.125rem",
              }}
            >
              Manage your schedule, availability, and booking requests
            </p>
            {pendingCount > 0 && (
              <button
                onClick={() => setActiveTab("appointments")}
                className="mt-2 inline-flex items-center gap-2 rounded-xl"
                style={{
                  padding: "0.375rem 0.875rem",
                  backgroundColor: "#fffbeb",
                  border: "1px solid #fde68a",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#92400e",
                  cursor: "pointer",
                }}
              >
                <FontAwesomeIcon
                  icon={faHourglassHalf}
                  style={{ color: "#d97706", fontSize: "0.75rem" }}
                />
                {pendingCount} pending request{pendingCount !== 1 ? "s" : ""} ·
                Click to review
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => setShowAvailabilityModal(true)}
              className="btn btn-secondary btn-md flex items-center gap-2"
            >
              <FontAwesomeIcon
                icon={faCalendarPlus}
                style={{ fontSize: "0.8rem" }}
              />
              Set Availability
            </button>
            <button
              onClick={() => {
                resetEventForm();
                setShowAddEventModal(true);
              }}
              className="btn btn-primary btn-md flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} style={{ fontSize: "0.8rem" }} />
              Add Event
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="mt-5 flex gap-2">
          {(["calendar", "appointments"] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative flex items-center gap-2 font-semibold rounded-xl"
                style={{
                  padding: "0.625rem 1.25rem",
                  fontSize: "0.875rem",
                  backgroundColor: active
                    ? "#1ab189"
                    : "var(--color-neutral-100)",
                  color: active ? "white" : "var(--color-neutral-700)",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 150ms",
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = "var(--color-neutral-200)";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = "var(--color-neutral-100)";
                }}
              >
                <FontAwesomeIcon
                  icon={tab === "calendar" ? faCalendarCheck : faUser}
                  style={{ fontSize: "0.8rem" }}
                />
                {tab === "calendar" ? "Calendar View" : "Appointments"}
                {tab === "appointments" && pendingCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full font-bold"
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                      backgroundColor: "#f59e0b",
                      color: "white",
                      fontSize: "0.6rem",
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================================
          CALENDAR TAB
      ================================================================================== */}
      {activeTab === "calendar" && (
        <div
          style={{
            padding: "1.75rem 2rem",
            maxWidth: "90rem",
            margin: "0 auto",
          }}
        >
          {/* Controls bar */}
          <div
            className="rounded-2xl mb-5"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
              padding: "1.25rem 1.5rem",
            }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Week navigation */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const d = new Date(currentWeekStart);
                    d.setDate(d.getDate() - 7);
                    setCurrentWeekStart(d);
                  }}
                  style={{
                    width: "2.25rem",
                    height: "2.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--color-neutral-200)",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = "var(--color-neutral-50)";
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = "transparent";
                  }}
                >
                  <FontAwesomeIcon
                    icon={faChevronLeft}
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-neutral-600)",
                    }}
                  />
                </button>
                <p
                  className="font-semibold text-center"
                  style={{
                    minWidth: "13rem",
                    fontSize: "0.9rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  {monthNames[currentWeekStart.getMonth()]}{" "}
                  {currentWeekStart.getDate()} – {weekEndDate.getDate()},{" "}
                  {currentWeekStart.getFullYear()}
                </p>
                <button
                  onClick={() => {
                    const d = new Date(currentWeekStart);
                    d.setDate(d.getDate() + 7);
                    setCurrentWeekStart(d);
                  }}
                  style={{
                    width: "2.25rem",
                    height: "2.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--color-neutral-200)",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = "var(--color-neutral-50)";
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = "transparent";
                  }}
                >
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-neutral-600)",
                    }}
                  />
                </button>
              </div>

              {/* Legend + filter */}
              <div className="flex items-center gap-5 flex-wrap">
                <div className="flex items-center gap-4 flex-wrap">
                  {eventTypes.map(({ type, label, dot }) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: dot }}
                      />
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--color-neutral-600)",
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Filter button */}
                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setShowFilterDropdown((v) => !v)}
                    className="flex items-center gap-2 rounded-xl"
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "var(--color-neutral-0)",
                      border: "1px solid var(--color-neutral-200)",
                      cursor: "pointer",
                      fontSize: "0.8125rem",
                      color: "var(--color-neutral-700)",
                    }}
                    onMouseEnter={(e) => {
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "var(--color-neutral-50)";
                    }}
                    onMouseLeave={(e) => {
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "var(--color-neutral-0)";
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faFilter}
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-neutral-500)",
                      }}
                    />
                    Filter
                    {selectedFilters.size > 0 && (
                      <span
                        className="rounded-full font-bold"
                        style={{
                          padding: "0.1rem 0.45rem",
                          backgroundColor: "#1ab189",
                          color: "white",
                          fontSize: "0.6rem",
                        }}
                      >
                        {selectedFilters.size}
                      </span>
                    )}
                  </button>

                  {showFilterDropdown && (
                    <div
                      className="absolute right-0 rounded-xl overflow-hidden z-10"
                      style={{
                        marginTop: "0.5rem",
                        width: "11rem",
                        backgroundColor: "var(--color-neutral-0)",
                        border: "1px solid var(--color-neutral-200)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      }}
                    >
                      {eventTypes.map(({ type, label }) => (
                        <button
                          key={type}
                          onClick={() => toggleFilter(type)}
                          className="w-full flex items-center justify-between px-4 py-2.5"
                          style={{
                            background: selectedFilters.has(type)
                              ? "rgba(26,177,137,0.06)"
                              : "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.8125rem",
                            color: "var(--color-neutral-700)",
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor = "var(--color-neutral-50)";
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor = selectedFilters.has(type)
                              ? "rgba(26,177,137,0.06)"
                              : "transparent";
                          }}
                        >
                          {label}
                          {selectedFilters.has(type) && (
                            <FontAwesomeIcon
                              icon={faCheck}
                              style={{ color: "#1ab189", fontSize: "0.75rem" }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {selectedFilters.size > 0 && (
              <div
                className="flex items-center gap-2 mt-4 pt-4 flex-wrap"
                style={{ borderTop: "1px solid var(--color-neutral-100)" }}
              >
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--color-neutral-500)",
                    fontWeight: 600,
                  }}
                >
                  Active:
                </span>
                {[...selectedFilters].map((filter) => {
                  const cfg = EVENT_TYPE_CONFIG[filter];
                  return (
                    <span
                      key={filter}
                      className="flex items-center gap-1.5 rounded-lg"
                      style={{
                        padding: "0.25rem 0.75rem",
                        backgroundColor: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        color: cfg.text,
                        fontSize: "0.78rem",
                        fontWeight: 600,
                      }}
                    >
                      {cfg.label}
                      <button
                        onClick={() => {
                          const n = new Set(selectedFilters);
                          n.delete(filter);
                          setSelectedFilters(n);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: cfg.text,
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faTimes}
                          style={{ fontSize: "0.6rem" }}
                        />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Calendar grid */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
            }}
          >
            {/* Day headers */}
            <div
              className="grid grid-cols-7"
              style={{
                borderBottom: "1px solid var(--color-neutral-200)",
                backgroundColor: "var(--color-neutral-50)",
              }}
            >
              {getWeekDates().map((date, i) => {
                const isToday =
                  date.toDateString() === new Date().toDateString();
                const dateStr = formatDateForAPI(date);
                const slots = getSlotCountForDate(dateStr);
                const booked = getBookedSlotCountForDate(dateStr);
                return (
                  <div
                    key={i}
                    className="p-3 text-center"
                    style={{
                      borderRight:
                        i < 6 ? "1px solid var(--color-neutral-200)" : "none",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "var(--color-neutral-500)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "0.375rem",
                      }}
                    >
                      {weekDays[date.getDay()]}
                    </p>
                    <div className="flex justify-center">
                      <div
                        className="flex items-center justify-center font-bold"
                        style={{
                          width: "2rem",
                          height: "2rem",
                          borderRadius: "50%",
                          fontSize: "0.9375rem",
                          backgroundColor: isToday ? "#1ab189" : "transparent",
                          color: isToday ? "white" : "var(--color-neutral-900)",
                        }}
                      >
                        {date.getDate()}
                      </div>
                    </div>
                    {slots > 0 && (
                      <button
                        onClick={() => fetchSlotsForDate(dateStr)}
                        className="mt-1.5 flex items-center justify-center gap-1 mx-auto rounded-lg"
                        style={{
                          padding: "0.2rem 0.5rem",
                          backgroundColor: "rgba(26,177,137,0.1)",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "0.65rem",
                          fontWeight: 600,
                          color: "#1ab189",
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faCalendarCheck}
                          style={{ fontSize: "0.55rem" }}
                        />
                        {slots} slot{slots !== 1 ? "s" : ""}
                        {booked > 0 && ` (${booked} booked)`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Event cells */}
            <div className="grid grid-cols-7">
              {getWeekDates().map((date, i) => {
                const key = formatDateForAPI(date);
                const dayEvents = eventsData?.[key] ?? [];
                const visible =
                  selectedFilters.size === 0
                    ? dayEvents
                    : dayEvents.filter((ev) =>
                        selectedFilters.has(ev.event_type),
                      );
                return (
                  <div
                    key={i}
                    className="p-2"
                    style={{
                      minHeight: "10rem",
                      borderRight:
                        i < 6 ? "1px solid var(--color-neutral-200)" : "none",
                      borderBottom: "1px solid var(--color-neutral-200)",
                      transition: "background-color 120ms",
                    }}
                    onMouseEnter={(e) => {
                      (
                        e.currentTarget as HTMLDivElement
                      ).style.backgroundColor = "var(--color-neutral-50)";
                    }}
                    onMouseLeave={(e) => {
                      (
                        e.currentTarget as HTMLDivElement
                      ).style.backgroundColor = "transparent";
                    }}
                  >
                    <div className="space-y-1.5">
                      {visible.map((event) => {
                        const cfg =
                          EVENT_TYPE_CONFIG[event.event_type] ??
                          EVENT_TYPE_CONFIG.task;
                        return (
                          <div
                            key={event.id}
                            className="relative group rounded-lg p-2.5"
                            style={{
                              backgroundColor: cfg.bg,
                              border: `1px solid ${cfg.border}`,
                              opacity: event.is_completed ? 0.6 : 1,
                              cursor: "default",
                            }}
                          >
                            <div className="flex items-start gap-1.5 mb-1">
                              <div
                                className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                                style={{ backgroundColor: cfg.dot }}
                              />
                              <p
                                className="font-semibold leading-tight flex-1"
                                style={{
                                  fontSize: "0.76rem",
                                  color: cfg.text,
                                  textDecoration: event.is_completed
                                    ? "line-through"
                                    : "none",
                                }}
                              >
                                {event.title}
                              </p>
                            </div>
                            {event.event_time && (
                              <div
                                className="flex items-center gap-1"
                                style={{
                                  fontSize: "0.68rem",
                                  color: cfg.text,
                                  opacity: 0.8,
                                }}
                              >
                                <FontAwesomeIcon
                                  icon={faClock}
                                  style={{ fontSize: "0.55rem" }}
                                />
                                {formatTime12Hour(event.event_time)}
                              </div>
                            )}
                            {event.assigned_user_email && (
                              <div
                                className="flex items-center gap-1 mt-0.5 truncate"
                                style={{
                                  fontSize: "0.65rem",
                                  color: cfg.text,
                                  opacity: 0.75,
                                }}
                              >
                                <FontAwesomeIcon
                                  icon={faUser}
                                  style={{ fontSize: "0.55rem" }}
                                />
                                {event.assigned_user_email}
                              </div>
                            )}

                            {/* Hover actions */}
                            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                              {!event.is_completed && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    completeEventMutation.mutate(event.id);
                                  }}
                                  title="Mark complete"
                                  style={{
                                    width: "1.375rem",
                                    height: "1.375rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: "#16a34a",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "0.375rem",
                                    cursor: "pointer",
                                  }}
                                >
                                  <FontAwesomeIcon
                                    icon={faCheck}
                                    style={{ fontSize: "0.6rem" }}
                                  />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(event);
                                }}
                                title="Edit"
                                style={{
                                  width: "1.375rem",
                                  height: "1.375rem",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: "#2563eb",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "0.375rem",
                                  cursor: "pointer",
                                }}
                              >
                                <FontAwesomeIcon
                                  icon={faEdit}
                                  style={{ fontSize: "0.6rem" }}
                                />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event);
                                  setShowDeleteEventModal(true);
                                }}
                                title="Delete"
                                style={{
                                  width: "1.375rem",
                                  height: "1.375rem",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: "#dc2626",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "0.375rem",
                                  cursor: "pointer",
                                }}
                              >
                                <FontAwesomeIcon
                                  icon={faTrash}
                                  style={{ fontSize: "0.6rem" }}
                                />
                              </button>
                            </div>

                            {event.is_completed && (
                              <div className="absolute top-1.5 right-1.5">
                                <FontAwesomeIcon
                                  icon={faCheckCircle}
                                  style={{
                                    color: "#16a34a",
                                    fontSize: "0.75rem",
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================================
          APPOINTMENTS TAB
      ================================================================================== */}
      {activeTab === "appointments" && (
        <div
          style={{
            padding: "1.75rem 2rem",
            maxWidth: "72rem",
            margin: "0 auto",
          }}
        >
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
            {Object.entries(STAT_CARD_CONFIG).map(([status, cfg]) => {
              const count =
                status === "all"
                  ? (appointmentCounts?.total ?? 0)
                  : (appointmentCounts?.[status as keyof AppointmentCounts] ??
                    0);
              const active = selectedAppointmentStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => setSelectedAppointmentStatus(status)}
                  className="rounded-2xl text-left"
                  style={{
                    padding: "1rem",
                    backgroundColor: active
                      ? cfg.activeBg
                      : "var(--color-neutral-0)",
                    border: `2px solid ${active ? cfg.border : "var(--color-neutral-200)"}`,
                    cursor: "pointer",
                    transition: "all 150ms",
                  }}
                  onMouseEnter={(e) => {
                    if (!active)
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        cfg.border;
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "var(--color-neutral-200)";
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <FontAwesomeIcon
                      icon={cfg.icon}
                      style={{ color: cfg.iconColor, fontSize: "1rem" }}
                    />
                    <span
                      className="font-bold"
                      style={{
                        fontSize: "1.5rem",
                        color: "var(--color-neutral-900)",
                      }}
                    >
                      {count}
                    </span>
                  </div>
                  <p
                    className="font-semibold capitalize"
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-neutral-600)",
                    }}
                  >
                    {status === "all" ? "Total" : status}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div
            className="rounded-2xl mb-5 relative"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              border: "1px solid var(--color-neutral-200)",
              padding: "0.875rem 1rem",
            }}
          >
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                color: "var(--color-neutral-400)",
                fontSize: "0.8rem",
                top: "50%",
                left: "1.75rem",
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, email, phone, or service type…"
              style={{ ...baseInput, paddingLeft: "2.25rem" }}
              onFocus={tealFocus}
              onBlur={blurReset}
            />
          </div>

          {/* Appointment list */}
          <div className="space-y-3">
            {(filteredAppointments ?? []).length > 0 ? (
              (filteredAppointments ?? []).map((appt) => {
                const statusCfg =
                  APPT_STATUS_CONFIG[appt.status] ?? APPT_STATUS_CONFIG.pending;
                return (
                  <div
                    key={appt.id}
                    className="rounded-2xl"
                    style={{
                      backgroundColor: "var(--color-neutral-0)",
                      border: "1px solid var(--color-neutral-200)",
                      padding: "1.25rem 1.5rem",
                      transition: "box-shadow 150ms",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow =
                        "0 4px 16px rgba(0,0,0,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow =
                        "none";
                    }}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      {/* Left: client info */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Avatar */}
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                          style={{
                            backgroundColor: "rgba(26,177,137,0.12)",
                            color: "#1ab189",
                            fontSize: "0.875rem",
                          }}
                        >
                          {appt.client_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-bold mb-0.5"
                            style={{
                              fontSize: "1rem",
                              color: "var(--color-neutral-900)",
                            }}
                          >
                            {appt.client_name}
                          </h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                            {appt.client_email && (
                              <span
                                className="flex items-center gap-1.5"
                                style={{
                                  fontSize: "0.78rem",
                                  color: "var(--color-neutral-500)",
                                }}
                              >
                                <FontAwesomeIcon
                                  icon={faEnvelope}
                                  style={{ fontSize: "0.65rem" }}
                                />
                                {appt.client_email}
                              </span>
                            )}
                            <span
                              className="flex items-center gap-1.5"
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--color-neutral-500)",
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faPhone}
                                style={{ fontSize: "0.65rem" }}
                              />
                              {appt.client_phone}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <FontAwesomeIcon
                              icon={faCalendar}
                              style={{ color: "#1ab189", fontSize: "0.75rem" }}
                            />
                            <span
                              className="font-semibold"
                              style={{
                                fontSize: "0.875rem",
                                color: "var(--color-neutral-900)",
                              }}
                            >
                              {formatDateTime(
                                appt.appointment_date,
                                appt.appointment_time,
                              )}
                            </span>
                          </div>
                          {appt.service_type && (
                            <span
                              className="inline-flex items-center gap-1.5 rounded-lg"
                              style={{
                                padding: "0.2rem 0.6rem",
                                backgroundColor: "#eff6ff",
                                border: "1px solid #bfdbfe",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "#1d4ed8",
                              }}
                            >
                              <FontAwesomeIcon
                                icon={faInfoCircle}
                                style={{ fontSize: "0.65rem" }}
                              />
                              {appt.service_type}
                            </span>
                          )}
                          {appt.description && (
                            <p
                              className="mt-2 line-clamp-2"
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--color-neutral-500)",
                              }}
                            >
                              {appt.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: status + actions */}
                      <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
                        {/* Status badge */}
                        <span
                          className="inline-flex items-center gap-2 rounded-xl font-semibold"
                          style={{
                            padding: "0.375rem 0.875rem",
                            backgroundColor: statusCfg.bg,
                            border: `1.5px solid ${statusCfg.border}`,
                            color: statusCfg.color,
                            fontSize: "0.78rem",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={statusCfg.icon}
                            style={{ fontSize: "0.7rem" }}
                          />
                          {appt.status_display}
                        </span>

                        {/* Action buttons */}
                        <div
                          className="flex flex-col gap-1.5 w-full"
                          style={{ minWidth: "8.5rem" }}
                        >
                          {appt.status === "pending" && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedAppointment(appt);
                                  setShowConfirmAppointmentModal(true);
                                }}
                                className="btn btn-primary btn-sm flex items-center justify-center gap-1.5"
                              >
                                <FontAwesomeIcon
                                  icon={faCheck}
                                  style={{ fontSize: "0.75rem" }}
                                />{" "}
                                Confirm
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedAppointment(appt);
                                  setShowCancelAppointmentModal(true);
                                }}
                                className="btn btn-sm flex items-center justify-center gap-1.5"
                                style={{
                                  backgroundColor: "#ef4444",
                                  color: "white",
                                  border: "none",
                                }}
                                onMouseEnter={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.backgroundColor = "#dc2626";
                                }}
                                onMouseLeave={(e) => {
                                  (
                                    e.currentTarget as HTMLButtonElement
                                  ).style.backgroundColor = "#ef4444";
                                }}
                              >
                                <FontAwesomeIcon
                                  icon={faBan}
                                  style={{ fontSize: "0.75rem" }}
                                />{" "}
                                Decline
                              </button>
                            </>
                          )}
                          {appt.status === "confirmed" && (
                            <>
                              <button
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Mark appointment with ${appt.client_name} as completed?`,
                                    )
                                  )
                                    completeAppointmentMutation.mutate(appt.id);
                                }}
                                className="btn btn-primary btn-sm flex items-center justify-center gap-1.5"
                              >
                                <FontAwesomeIcon
                                  icon={faCheckCircle}
                                  style={{ fontSize: "0.75rem" }}
                                />{" "}
                                Complete
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedAppointment(appt);
                                  setShowCancelAppointmentModal(true);
                                }}
                                className="btn btn-secondary btn-sm flex items-center justify-center gap-1.5"
                              >
                                <FontAwesomeIcon
                                  icon={faBan}
                                  style={{ fontSize: "0.75rem" }}
                                />{" "}
                                Cancel
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setSelectedAppointment(appt);
                              setShowAppointmentDetailsModal(true);
                            }}
                            className="btn btn-secondary btn-sm flex items-center justify-center gap-1.5"
                          >
                            <FontAwesomeIcon
                              icon={faEye}
                              style={{ fontSize: "0.75rem" }}
                            />{" "}
                            Details
                          </button>
                        </div>

                        <p
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--color-neutral-400)",
                          }}
                        >
                          Requested{" "}
                          {new Date(appt.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                className="rounded-2xl text-center py-14"
                style={{
                  backgroundColor: "var(--color-neutral-0)",
                  border: "1px solid var(--color-neutral-200)",
                }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "var(--color-neutral-100)" }}
                >
                  <FontAwesomeIcon
                    icon={faCalendarCheck}
                    style={{
                      fontSize: "1.5rem",
                      color: "var(--color-neutral-400)",
                    }}
                  />
                </div>
                <h3
                  className="font-semibold mb-1"
                  style={{
                    fontSize: "1rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  No appointments found
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-neutral-500)",
                  }}
                >
                  {searchQuery
                    ? "Try adjusting your search"
                    : selectedAppointmentStatus === "all"
                      ? "You don't have any appointments yet"
                      : `No ${selectedAppointmentStatus} appointments`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================================
          MODALS
      ================================================================================== */}

      {/* ── Event Form Modal (shared for Add + Edit) ── */}
      {(showAddEventModal || (showEditEventModal && selectedEvent)) &&
        (() => {
          const isEdit = showEditEventModal && !!selectedEvent;
          const isPending = isEdit
            ? updateEventMutation.isPending
            : createEventMutation.isPending;
          const onSubmit = isEdit
            ? () =>
                updateEventMutation.mutate({
                  id: selectedEvent!.id,
                  data: eventForm,
                })
            : () => {
                if (!eventForm.title || !eventForm.event_date) {
                  alert("Please fill in Title and Date");
                  return;
                }
                createEventMutation.mutate(eventForm);
              };
          const onClose = () => {
            setShowAddEventModal(false);
            setShowEditEventModal(false);
            setSelectedEvent(null);
          };
          return (
            <Modal onClose={onClose}>
              <div
                className="rounded-2xl w-full max-w-lg"
                style={{
                  backgroundColor: "var(--color-neutral-0)",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between"
                  style={{
                    padding: "1.25rem 1.5rem",
                    borderBottom: "1px solid var(--color-neutral-200)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
                    >
                      <FontAwesomeIcon
                        icon={isEdit ? faEdit : faPlus}
                        style={{ color: "#1ab189", fontSize: "0.875rem" }}
                      />
                    </div>
                    <h3
                      className="font-semibold"
                      style={{
                        fontSize: "1.0625rem",
                        color: "var(--color-neutral-900)",
                      }}
                    >
                      {isEdit ? "Edit Event" : "Add New Event"}
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-neutral-500)",
                      padding: "0.375rem",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faTimes}
                      style={{ fontSize: "0.875rem" }}
                    />
                  </button>
                </div>

                {/* Body */}
                <div style={{ padding: "1.5rem" }}>
                  <div className="space-y-4">
                    <Field label="Event Title" required>
                      <input
                        type="text"
                        value={eventForm.title}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, title: e.target.value })
                        }
                        placeholder="Enter event title…"
                        style={baseInput}
                        onFocus={tealFocus}
                        onBlur={blurReset}
                      />
                    </Field>
                    <Field label="Event Type" required>
                      <select
                        value={eventForm.event_type}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            event_type: e.target
                              .value as EventFormData["event_type"],
                          })
                        }
                        style={{
                          ...baseInput,
                          cursor: "pointer",
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a1a1aa' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 0.875rem center",
                          paddingRight: "2.5rem",
                        }}
                        onFocus={tealFocus}
                        onBlur={blurReset}
                      >
                        {eventTypes.map(({ type, label }) => (
                          <option key={type} value={type}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Date" required>
                        <input
                          type="date"
                          value={eventForm.event_date}
                          onChange={(e) =>
                            setEventForm({
                              ...eventForm,
                              event_date: e.target.value,
                            })
                          }
                          style={baseInput}
                          onFocus={tealFocus}
                          onBlur={blurReset}
                        />
                      </Field>
                      <Field label="Time">
                        <input
                          type="time"
                          value={eventForm.event_time}
                          onChange={(e) =>
                            setEventForm({
                              ...eventForm,
                              event_time: e.target.value,
                            })
                          }
                          style={baseInput}
                          onFocus={tealFocus}
                          onBlur={blurReset}
                        />
                      </Field>
                    </div>
                    <Field label="Description">
                      <textarea
                        value={eventForm.description}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Add event description…"
                        rows={3}
                        style={{ ...baseInput, resize: "none" }}
                        onFocus={tealFocus}
                        onBlur={blurReset}
                      />
                    </Field>
                    <Field label="Location">
                      <input
                        type="text"
                        value={eventForm.location}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            location: e.target.value,
                          })
                        }
                        placeholder="Enter location…"
                        style={baseInput}
                        onFocus={tealFocus}
                        onBlur={blurReset}
                      />
                    </Field>
                  </div>
                </div>

                {/* Footer */}
                <div
                  className="flex items-center justify-end gap-3"
                  style={{
                    padding: "1rem 1.5rem",
                    borderTop: "1px solid var(--color-neutral-200)",
                  }}
                >
                  <button
                    onClick={onClose}
                    disabled={isPending}
                    className="btn btn-ghost btn-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSubmit}
                    disabled={isPending}
                    className="btn btn-primary btn-md flex items-center gap-2"
                    style={{ opacity: isPending ? 0.6 : 1 }}
                  >
                    {isPending ? (
                      <>
                        <FontAwesomeIcon
                          icon={faSpinner}
                          className="animate-spin"
                          style={{ fontSize: "0.875rem" }}
                        />{" "}
                        {isEdit ? "Updating…" : "Creating…"}
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon
                          icon={isEdit ? faEdit : faPlus}
                          style={{ fontSize: "0.875rem" }}
                        />{" "}
                        {isEdit ? "Update Event" : "Add Event"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Modal>
          );
        })()}

      {/* ── Delete Event Modal ── */}
      {showDeleteEventModal && selectedEvent && (
        <Modal
          onClose={() => {
            setShowDeleteEventModal(false);
            setSelectedEvent(null);
          }}
        >
          <div
            className="rounded-2xl max-w-md w-full"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
              padding: "1.75rem",
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#fef2f2" }}
            >
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                style={{ color: "#ef4444", fontSize: "1.1rem" }}
              />
            </div>
            <h3
              className="font-semibold text-center mb-2"
              style={{
                fontSize: "1.0625rem",
                color: "var(--color-neutral-900)",
              }}
            >
              Delete Event?
            </h3>
            <p
              className="text-center mb-6"
              style={{
                fontSize: "0.875rem",
                color: "var(--color-neutral-500)",
              }}
            >
              Are you sure you want to delete &quot;{selectedEvent.title}&quot;?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteEventModal(false);
                  setSelectedEvent(null);
                }}
                disabled={deleteEventMutation.isPending}
                className="btn btn-ghost btn-md flex-1 justify-center"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteEventMutation.mutate(selectedEvent.id)}
                disabled={deleteEventMutation.isPending}
                className="btn btn-md flex-1 justify-center flex items-center gap-2"
                style={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  opacity: deleteEventMutation.isPending ? 0.6 : 1,
                }}
              >
                {deleteEventMutation.isPending ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                      style={{ fontSize: "0.875rem" }}
                    />{" "}
                    Deleting…
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon
                      icon={faTrash}
                      style={{ fontSize: "0.875rem" }}
                    />{" "}
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Set Availability Modal ── */}
      {showAvailabilityModal && (
        <Modal onClose={() => setShowAvailabilityModal(false)}>
          <div
            className="rounded-2xl w-full max-w-lg"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
              maxHeight: "95vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between flex-shrink-0"
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--color-neutral-200)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
                >
                  <FontAwesomeIcon
                    icon={faCalendarPlus}
                    style={{ color: "#1ab189", fontSize: "0.875rem" }}
                  />
                </div>
                <div>
                  <h3
                    className="font-semibold"
                    style={{
                      fontSize: "1.0625rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    Set Your Availability
                  </h3>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    System will create 1-hour time slots automatically
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAvailabilityModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-neutral-500)",
                  padding: "0.375rem",
                }}
              >
                <FontAwesomeIcon
                  icon={faTimes}
                  style={{ fontSize: "0.875rem" }}
                />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
              <div className="space-y-4">
                {/* Info banner */}
                <div
                  className="rounded-xl flex items-start gap-3 px-4 py-3"
                  style={{
                    backgroundColor: "rgba(26,177,137,0.06)",
                    border: "1px solid rgba(26,177,137,0.2)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faInfoCircle}
                    style={{
                      color: "#1ab189",
                      fontSize: "0.875rem",
                      marginTop: "0.1rem",
                      flexShrink: 0,
                    }}
                  />
                  <p
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--color-neutral-700)",
                    }}
                  >
                    <strong>How it works:</strong> Enter a time range (e.g., 9
                    AM – 5 PM) and we&apos;ll create 1-hour booking slots.
                  </p>
                </div>

                <Field label="Date" required>
                  <input
                    type="date"
                    value={availabilityForm.date}
                    onChange={(e) =>
                      setAvailabilityForm({
                        ...availabilityForm,
                        date: e.target.value,
                      })
                    }
                    style={baseInput}
                    onFocus={tealFocus}
                    onBlur={blurReset}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Start Time" required>
                    <input
                      type="time"
                      value={availabilityForm.start_time}
                      onChange={(e) =>
                        setAvailabilityForm({
                          ...availabilityForm,
                          start_time: e.target.value,
                        })
                      }
                      style={baseInput}
                      onFocus={tealFocus}
                      onBlur={blurReset}
                    />
                  </Field>
                  <Field label="End Time" required>
                    <input
                      type="time"
                      value={availabilityForm.end_time}
                      onChange={(e) =>
                        setAvailabilityForm({
                          ...availabilityForm,
                          end_time: e.target.value,
                        })
                      }
                      style={baseInput}
                      onFocus={tealFocus}
                      onBlur={blurReset}
                    />
                  </Field>
                </div>

                {/* Preview */}
                {availabilityForm.start_time && availabilityForm.end_time && (
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    <p style={{ fontSize: "0.78rem", color: "#15803d" }}>
                      <strong>Preview:</strong>{" "}
                      {Math.max(
                        0,
                        parseInt(availabilityForm.end_time) -
                          parseInt(availabilityForm.start_time),
                      )}{" "}
                      hourly slot(s) between{" "}
                      {formatTime12Hour(availabilityForm.start_time)} and{" "}
                      {formatTime12Hour(availabilityForm.end_time)}
                    </p>
                  </div>
                )}

                <Field
                  label="Notes"
                  hint="Optional: Add context for clients viewing available slots"
                >
                  <textarea
                    value={availabilityForm.notes}
                    onChange={(e) =>
                      setAvailabilityForm({
                        ...availabilityForm,
                        notes: e.target.value,
                      })
                    }
                    placeholder="e.g., Remote consultations only"
                    rows={2}
                    style={{ ...baseInput, resize: "none" }}
                    onFocus={tealFocus}
                    onBlur={blurReset}
                  />
                </Field>

                {/* Recurring toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="font-semibold"
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--color-neutral-900)",
                      }}
                    >
                      Recurring availability
                    </p>
                    <p
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--color-neutral-500)",
                      }}
                    >
                      Repeat on selected days of the week
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setAvailabilityForm({
                        ...availabilityForm,
                        is_recurring: !availabilityForm.is_recurring,
                      })
                    }
                    style={{
                      width: "2.75rem",
                      height: "1.5rem",
                      borderRadius: "9999px",
                      border: "none",
                      cursor: "pointer",
                      backgroundColor: availabilityForm.is_recurring
                        ? "#1ab189"
                        : "var(--color-neutral-300)",
                      position: "relative",
                      transition: "background-color 200ms",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "0.125rem",
                        left: availabilityForm.is_recurring
                          ? "calc(100% - 1.375rem)"
                          : "0.125rem",
                        width: "1.25rem",
                        height: "1.25rem",
                        borderRadius: "50%",
                        backgroundColor: "white",
                        transition: "left 200ms",
                      }}
                    />
                  </button>
                </div>

                {availabilityForm.is_recurring && (
                  <>
                    <div
                      className="rounded-xl"
                      style={{
                        backgroundColor: "rgba(26,177,137,0.06)",
                        border: "1px solid rgba(26,177,137,0.2)",
                        padding: "1rem",
                      }}
                    >
                      <p
                        className="font-semibold mb-3"
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--color-neutral-700)",
                        }}
                      >
                        Select Days <span style={{ color: "#ef4444" }}>*</span>
                      </p>
                      <div className="grid grid-cols-7 gap-1.5">
                        {weekDaysAPI.map((day, idx) => {
                          const selected =
                            availabilityForm.recurring_days.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleRecurringDay(day)}
                              style={{
                                padding: "0.375rem 0",
                                borderRadius: "0.5rem",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                border: selected
                                  ? "none"
                                  : "1px solid var(--color-neutral-200)",
                                backgroundColor: selected
                                  ? "#1ab189"
                                  : "var(--color-neutral-0)",
                                color: selected
                                  ? "white"
                                  : "var(--color-neutral-700)",
                                transition: "all 150ms",
                              }}
                            >
                              {weekDays[idx]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <Field
                      label="Recurring End Date"
                      hint="Leave empty to default to 90 days from start date"
                    >
                      <input
                        type="date"
                        value={availabilityForm.recurring_end_date}
                        onChange={(e) =>
                          setAvailabilityForm({
                            ...availabilityForm,
                            recurring_end_date: e.target.value,
                          })
                        }
                        style={baseInput}
                        onFocus={tealFocus}
                        onBlur={blurReset}
                      />
                    </Field>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-3 flex-shrink-0"
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid var(--color-neutral-200)",
              }}
            >
              <button
                onClick={() => setShowAvailabilityModal(false)}
                disabled={createAvailabilityMutation.isPending}
                className="btn btn-ghost btn-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (
                    !availabilityForm.date ||
                    !availabilityForm.start_time ||
                    !availabilityForm.end_time
                  ) {
                    alert("Please fill in all required fields");
                    return;
                  }
                  if (
                    availabilityForm.start_time >= availabilityForm.end_time
                  ) {
                    alert("End time must be after start time");
                    return;
                  }
                  if (
                    availabilityForm.is_recurring &&
                    availabilityForm.recurring_days.length === 0
                  ) {
                    alert("Please select at least one recurring day");
                    return;
                  }
                  createAvailabilityMutation.mutate(availabilityForm);
                }}
                disabled={createAvailabilityMutation.isPending}
                className="btn btn-primary btn-md flex items-center gap-2"
                style={{
                  opacity: createAvailabilityMutation.isPending ? 0.6 : 1,
                }}
              >
                {createAvailabilityMutation.isPending ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                      style={{ fontSize: "0.875rem" }}
                    />{" "}
                    Creating…
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon
                      icon={faCalendarPlus}
                      style={{ fontSize: "0.875rem" }}
                    />{" "}
                    Create Slots
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── View Slots Modal ── */}
      {showSlotsModal && selectedDateSlots && (
        <Modal
          onClose={() => {
            setShowSlotsModal(false);
            setSelectedDateSlots(null);
            setViewingSlots([]);
          }}
        >
          <div
            className="rounded-2xl w-full max-w-xl"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              className="flex items-center justify-between flex-shrink-0"
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--color-neutral-200)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
                >
                  <FontAwesomeIcon
                    icon={faClock}
                    style={{ color: "#1ab189", fontSize: "0.875rem" }}
                  />
                </div>
                <div>
                  <h3
                    className="font-semibold"
                    style={{
                      fontSize: "1.0625rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    Time Slots
                  </h3>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-neutral-500)",
                    }}
                  >
                    {new Date(
                      selectedDateSlots + "T00:00:00",
                    ).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSlotsModal(false);
                  setSelectedDateSlots(null);
                  setViewingSlots([]);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-neutral-500)",
                  padding: "0.375rem",
                }}
              >
                <FontAwesomeIcon
                  icon={faTimes}
                  style={{ fontSize: "0.875rem" }}
                />
              </button>
            </div>

            <div
              style={{ padding: "1.25rem 1.5rem", overflowY: "auto", flex: 1 }}
            >
              {viewingSlots.length > 0 ? (
                <div className="space-y-2.5">
                  {viewingSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between rounded-xl"
                      style={{
                        padding: "0.875rem 1rem",
                        backgroundColor: slot.is_booked
                          ? "var(--color-neutral-50)"
                          : "#f0fdf4",
                        border: `1.5px solid ${slot.is_booked ? "var(--color-neutral-200)" : "#bbf7d0"}`,
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2.5 mb-1">
                          <FontAwesomeIcon
                            icon={faClock}
                            style={{
                              color: slot.is_booked
                                ? "var(--color-neutral-400)"
                                : "#16a34a",
                              fontSize: "0.8rem",
                            }}
                          />
                          <span
                            className="font-semibold"
                            style={{
                              fontSize: "0.875rem",
                              color: slot.is_booked
                                ? "var(--color-neutral-700)"
                                : "#15803d",
                            }}
                          >
                            {formatTime12Hour(slot.start_time)} –{" "}
                            {formatTime12Hour(slot.end_time)}
                          </span>
                          <span
                            className="rounded-lg font-semibold"
                            style={{
                              padding: "0.15rem 0.5rem",
                              fontSize: "0.65rem",
                              backgroundColor: slot.is_booked
                                ? "var(--color-neutral-200)"
                                : "#16a34a",
                              color: slot.is_booked
                                ? "var(--color-neutral-600)"
                                : "white",
                            }}
                          >
                            {slot.is_booked ? "Booked" : "Available"}
                          </span>
                        </div>
                        {slot.notes && (
                          <p
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--color-neutral-600)",
                              marginLeft: "1.375rem",
                            }}
                          >
                            {slot.notes}
                          </p>
                        )}
                        {slot.is_booked && slot.booked_by_email && (
                          <p
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--color-neutral-500)",
                              marginLeft: "1.375rem",
                              marginTop: "0.25rem",
                            }}
                          >
                            Booked by: {slot.booked_by_email}
                          </p>
                        )}
                      </div>
                      {!slot.is_booked && (
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          style={{
                            width: "1.875rem",
                            height: "1.875rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "0.5rem",
                            cursor: "pointer",
                            flexShrink: 0,
                            marginLeft: "0.75rem",
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor = "#dc2626";
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.backgroundColor = "#ef4444";
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faTrash}
                            style={{ fontSize: "0.7rem" }}
                          />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  className="text-center py-8"
                  style={{
                    color: "var(--color-neutral-500)",
                    fontSize: "0.875rem",
                  }}
                >
                  No time slots for this date
                </p>
              )}
            </div>

            <div
              className="flex items-center justify-between flex-shrink-0"
              style={{
                padding: "0.875rem 1.5rem",
                borderTop: "1px solid var(--color-neutral-200)",
              }}
            >
              <div className="flex items-center gap-4">
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--color-neutral-600)",
                  }}
                >
                  Total: {viewingSlots.length}
                </span>
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "#16a34a",
                    fontWeight: 600,
                  }}
                >
                  Available: {viewingSlots.filter((s) => !s.is_booked).length}
                </span>
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--color-neutral-500)",
                  }}
                >
                  Booked: {viewingSlots.filter((s) => s.is_booked).length}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowSlotsModal(false);
                  setSelectedDateSlots(null);
                  setViewingSlots([]);
                }}
                className="btn btn-secondary btn-md"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Appointment Details Modal ── */}
      {showAppointmentDetailsModal && selectedAppointment && (
        <Modal
          onClose={() => {
            setShowAppointmentDetailsModal(false);
            setSelectedAppointment(null);
          }}
        >
          <div
            className="rounded-2xl w-full max-w-xl"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              className="flex items-center justify-between flex-shrink-0"
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--color-neutral-200)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
                >
                  <FontAwesomeIcon
                    icon={faCalendar}
                    style={{ color: "#1ab189", fontSize: "0.875rem" }}
                  />
                </div>
                <h3
                  className="font-semibold"
                  style={{
                    fontSize: "1.0625rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  Appointment Details
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAppointmentDetailsModal(false);
                  setSelectedAppointment(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-neutral-500)",
                  padding: "0.375rem",
                }}
              >
                <FontAwesomeIcon
                  icon={faTimes}
                  style={{ fontSize: "0.875rem" }}
                />
              </button>
            </div>

            <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
              {/* Status */}
              {(() => {
                const sc = APPT_STATUS_CONFIG[selectedAppointment.status];
                return (
                  <span
                    className="inline-flex items-center gap-2 rounded-xl font-semibold mb-5"
                    style={{
                      padding: "0.375rem 0.875rem",
                      backgroundColor: sc.bg,
                      border: `1.5px solid ${sc.border}`,
                      color: sc.color,
                      fontSize: "0.8rem",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={sc.icon}
                      style={{ fontSize: "0.75rem" }}
                    />
                    {selectedAppointment.status_display}
                  </span>
                );
              })()}

              {/* Detail sections */}
              {[
                {
                  title: "Client Information",
                  rows: [
                    { label: "Name", value: selectedAppointment.client_name },
                    ...(selectedAppointment.client_email
                      ? [
                          {
                            label: "Email",
                            value: selectedAppointment.client_email,
                          },
                        ]
                      : []),
                    { label: "Phone", value: selectedAppointment.client_phone },
                  ],
                },
                {
                  title: "Appointment Details",
                  rows: [
                    {
                      label: "Date & Time",
                      value: formatDateTime(
                        selectedAppointment.appointment_date,
                        selectedAppointment.appointment_time,
                      ),
                    },
                    ...(selectedAppointment.service_type
                      ? [
                          {
                            label: "Service Type",
                            value: selectedAppointment.service_type,
                          },
                        ]
                      : []),
                    ...(selectedAppointment.description
                      ? [
                          {
                            label: "Description",
                            value: selectedAppointment.description,
                          },
                        ]
                      : []),
                    ...(selectedAppointment.location_address
                      ? [
                          {
                            label: "Location",
                            value: selectedAppointment.location_address,
                          },
                        ]
                      : []),
                    ...(selectedAppointment.notes
                      ? [{ label: "Notes", value: selectedAppointment.notes }]
                      : []),
                  ],
                },
                {
                  title: "Request Information",
                  rows: [
                    {
                      label: "Created",
                      value: new Date(
                        selectedAppointment.created_at,
                      ).toLocaleString(),
                    },
                    {
                      label: "Last Updated",
                      value: new Date(
                        selectedAppointment.updated_at,
                      ).toLocaleString(),
                    },
                  ],
                },
              ].map(({ title, rows }) => (
                <div key={title} className="mb-5">
                  <h4
                    className="font-semibold mb-3"
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    {title}
                  </h4>
                  <div
                    className="rounded-xl"
                    style={{
                      backgroundColor: "var(--color-neutral-50)",
                      padding: "1rem",
                      border: "1px solid var(--color-neutral-100)",
                    }}
                  >
                    {rows.map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex justify-between gap-4 mb-2 last:mb-0"
                      >
                        <span
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--color-neutral-500)",
                            flexShrink: 0,
                          }}
                        >
                          {label}
                        </span>
                        <span
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--color-neutral-900)",
                            fontWeight: 500,
                            textAlign: "right",
                          }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div
              className="flex-shrink-0"
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid var(--color-neutral-200)",
              }}
            >
              <button
                onClick={() => {
                  setShowAppointmentDetailsModal(false);
                  setSelectedAppointment(null);
                }}
                className="w-full btn btn-secondary btn-md"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Confirm Appointment Modal ── */}
      {showConfirmAppointmentModal && selectedAppointment && (
        <Modal
          onClose={() => {
            setShowConfirmAppointmentModal(false);
            setSelectedAppointment(null);
            setAppointmentActionNotes("");
          }}
        >
          <div
            className="rounded-2xl max-w-md w-full"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
              padding: "1.75rem",
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#f0fdf4" }}
            >
              <FontAwesomeIcon
                icon={faCheck}
                style={{ color: "#16a34a", fontSize: "1.1rem" }}
              />
            </div>
            <h3
              className="font-semibold text-center mb-2"
              style={{
                fontSize: "1.0625rem",
                color: "var(--color-neutral-900)",
              }}
            >
              Confirm Appointment?
            </h3>
            <p
              className="text-center mb-1"
              style={{
                fontSize: "0.875rem",
                color: "var(--color-neutral-700)",
              }}
            >
              Confirm appointment with{" "}
              <strong>{selectedAppointment.client_name}</strong>
            </p>
            <p
              className="text-center mb-5"
              style={{ fontSize: "0.8rem", color: "#1ab189", fontWeight: 600 }}
            >
              {formatDateTime(
                selectedAppointment.appointment_date,
                selectedAppointment.appointment_time,
              )}
            </p>
            <p
              className="text-center mb-5"
              style={{ fontSize: "0.78rem", color: "var(--color-neutral-500)" }}
            >
              This will add the appointment to your calendar and notify the
              client via email.
            </p>
            <Field label="Add a note (optional)">
              <textarea
                value={appointmentActionNotes}
                onChange={(e) => setAppointmentActionNotes(e.target.value)}
                placeholder="e.g., Looking forward to meeting you!"
                rows={3}
                style={{ ...baseInput, resize: "none" }}
                onFocus={tealFocus}
                onBlur={blurReset}
              />
            </Field>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setShowConfirmAppointmentModal(false);
                  setSelectedAppointment(null);
                  setAppointmentActionNotes("");
                }}
                disabled={confirmAppointmentMutation.isPending}
                className="btn btn-ghost btn-md flex-1 justify-center"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  confirmAppointmentMutation.mutate({
                    id: selectedAppointment.id,
                    notes: appointmentActionNotes,
                  })
                }
                disabled={confirmAppointmentMutation.isPending}
                className="btn btn-primary btn-md flex-1 justify-center flex items-center gap-2"
                style={{
                  opacity: confirmAppointmentMutation.isPending ? 0.6 : 1,
                }}
              >
                {confirmAppointmentMutation.isPending ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                      style={{ fontSize: "0.875rem" }}
                    />{" "}
                    Confirming…
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon
                      icon={faCheck}
                      style={{ fontSize: "0.875rem" }}
                    />{" "}
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Cancel / Decline Appointment Modal ── */}
      {showCancelAppointmentModal && selectedAppointment && (
        <Modal
          onClose={() => {
            setShowCancelAppointmentModal(false);
            setSelectedAppointment(null);
            setAppointmentActionNotes("");
          }}
        >
          <div
            className="rounded-2xl max-w-md w-full"
            style={{
              backgroundColor: "var(--color-neutral-0)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
              padding: "1.75rem",
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#fef2f2" }}
            >
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                style={{ color: "#ef4444", fontSize: "1.1rem" }}
              />
            </div>
            <h3
              className="font-semibold text-center mb-2"
              style={{
                fontSize: "1.0625rem",
                color: "var(--color-neutral-900)",
              }}
            >
              {selectedAppointment.status === "pending"
                ? "Decline Appointment?"
                : "Cancel Appointment?"}
            </h3>
            <p
              className="text-center mb-5"
              style={{
                fontSize: "0.875rem",
                color: "var(--color-neutral-500)",
              }}
            >
              {selectedAppointment.status === "pending"
                ? "Decline the request from"
                : "Cancel the confirmed appointment with"}{" "}
              <strong style={{ color: "var(--color-neutral-900)" }}>
                {selectedAppointment.client_name}
              </strong>
              ? The client will be notified.
            </p>
            <Field label="Reason (optional)">
              <textarea
                value={appointmentActionNotes}
                onChange={(e) => setAppointmentActionNotes(e.target.value)}
                placeholder="Let the client know why…"
                rows={3}
                style={{ ...baseInput, resize: "none" }}
                onFocus={tealFocus}
                onBlur={blurReset}
              />
            </Field>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setShowCancelAppointmentModal(false);
                  setSelectedAppointment(null);
                  setAppointmentActionNotes("");
                }}
                disabled={cancelAppointmentMutation.isPending}
                className="btn btn-ghost btn-md flex-1 justify-center"
              >
                Go Back
              </button>
              <button
                onClick={() =>
                  cancelAppointmentMutation.mutate({
                    id: selectedAppointment.id,
                    reason: appointmentActionNotes,
                  })
                }
                disabled={cancelAppointmentMutation.isPending}
                className="btn btn-md flex-1 justify-center flex items-center gap-2"
                style={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  opacity: cancelAppointmentMutation.isPending ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#dc2626";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "#ef4444";
                }}
              >
                {cancelAppointmentMutation.isPending ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                      style={{ fontSize: "0.875rem" }}
                    />{" "}
                    Processing…
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon
                      icon={faBan}
                      style={{ fontSize: "0.875rem" }}
                    />{" "}
                    {selectedAppointment.status === "pending"
                      ? "Decline"
                      : "Cancel"}
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
