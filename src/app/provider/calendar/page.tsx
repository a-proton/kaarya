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
  service_provider: {
    id: number;
    full_name: string;
    business_name: string;
  };
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
// MAIN COMPONENT
// ==================================================================================
export default function CalendarPage() {
  const queryClient = useQueryClient();

  // Tab state
  const [activeTab, setActiveTab] = useState<"calendar" | "appointments">(
    "calendar",
  );
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
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

  // Slot viewing
  const [showSlotsModal, setShowSlotsModal] = useState(false);
  const [selectedDateSlots, setSelectedDateSlots] = useState<string | null>(
    null,
  );
  const [viewingSlots, setViewingSlots] = useState<AvailabilitySlot[]>([]);

  // Appointments state
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

  // Form state for adding event
  const [eventForm, setEventForm] = useState<EventFormData>({
    title: "",
    event_type: "task",
    event_date: new Date().toISOString().split("T")[0],
    event_time: "",
    description: "",
    location: "",
  });

  // Form state for availability
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

  // ==================================================================================
  // UTILITY FUNCTIONS
  // ==================================================================================
  const formatDateForAPI = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateKey = (date: Date) => {
    return formatDateForAPI(date);
  };

  // ==================================================================================
  // DATA FETCHING WITH TANSTACK QUERY
  // ==================================================================================
  // Fetch weekly events
  const {
    data: eventsData,
    isLoading: eventsLoading,
    isError: eventsError,
  } = useQuery<EventsData>({
    queryKey: ["calendar-events", formatDateForAPI(currentWeekStart)],
    queryFn: async () => {
      const weekStart = formatDateForAPI(currentWeekStart);
      return api.get<EventsData>(
        `/api/v1/calendar/events/week/?week_start=${weekStart}`,
      );
    },
  });

  // Fetch availability slots for current week
  const { data: availabilityData, isLoading: availabilityLoading } = useQuery({
    queryKey: ["calendar-availability", formatDateForAPI(currentWeekStart)],
    queryFn: async () => {
      const weekStart = formatDateForAPI(currentWeekStart);
      return api.get<any[]>(
        `/api/v1/calendar/availability/week/?week_start=${weekStart}`,
      );
    },
  });

  // Fetch appointments
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
      const response = await api.get<{ count: number; results: Appointment[] }>(
        url,
      );
      return response.results;
    },
  });

  // Fetch appointment counts
  const { data: appointmentCounts } = useQuery<AppointmentCounts>({
    queryKey: ["appointment-counts"],
    queryFn: async () => {
      return api.get<AppointmentCounts>("/api/v1/appointments/counts/");
    },
  });

  // ==================================================================================
  // MUTATIONS - EVENTS & AVAILABILITY
  // ==================================================================================
  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      return api.post<Event>("/api/v1/calendar/events/", {
        ...data,
        event_time: data.event_time || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["calendar-events", formatDateForAPI(currentWeekStart)],
      });
      setShowAddEventModal(false);
      resetEventForm();
    },
    onError: (error: any) => {
      alert(
        `Failed to create event: ${error.data?.detail || error.message || "Unknown error"}`,
      );
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<EventFormData>;
    }) => {
      return api.patch<Event>(`/api/v1/calendar/events/${id}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["calendar-events", formatDateForAPI(currentWeekStart)],
      });
      setShowEditEventModal(false);
      setSelectedEvent(null);
    },
    onError: (error: any) => {
      alert(
        `Failed to update event: ${error.data?.detail || error.message || "Unknown error"}`,
      );
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/calendar/events/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["calendar-events", formatDateForAPI(currentWeekStart)],
      });
      setShowDeleteEventModal(false);
      setSelectedEvent(null);
    },
    onError: (error: any) => {
      alert(
        `Failed to delete event: ${error.data?.detail || error.message || "Unknown error"}`,
      );
    },
  });

  const completeEventMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.post<Event>(`/api/v1/calendar/events/${id}/complete/`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["calendar-events", formatDateForAPI(currentWeekStart)],
      });
    },
    onError: (error: any) => {
      alert(
        `Failed to mark event complete: ${error.data?.detail || error.message || "Unknown error"}`,
      );
    },
  });

  const createAvailabilityMutation = useMutation({
    mutationFn: async (data: AvailabilityFormData) => {
      return api.post<AvailabilitySlot[]>("/api/v1/calendar/availability/", {
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
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["calendar-availability", formatDateForAPI(currentWeekStart)],
      });
      setShowAvailabilityModal(false);
      resetAvailabilityForm();
      const slotCount = data.length;
      alert(
        `Success! Created ${slotCount} hourly time slot${slotCount !== 1 ? "s" : ""}.`,
      );
    },
    onError: (error: any) => {
      alert(
        `Failed to create availability: ${error.data?.detail || error.message || "Unknown error"}`,
      );
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: number) => {
      await api.delete(`/api/v1/calendar/availability/${slotId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["calendar-availability", formatDateForAPI(currentWeekStart)],
      });
      if (selectedDateSlots) {
        fetchSlotsForDate(selectedDateSlots);
      }
    },
    onError: (error: any) => {
      alert(
        `Failed to delete slot: ${
          error.data?.detail ||
          error.message ||
          "This slot may be booked and cannot be deleted"
        }`,
      );
    },
  });

  // ==================================================================================
  // MUTATIONS - APPOINTMENTS
  // ==================================================================================
  const confirmAppointmentMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      return api.put(`/api/v1/appointments/${id}/status/`, {
        status: "confirmed",
        notes: notes,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment-counts"] });
      setShowConfirmAppointmentModal(false);
      setSelectedAppointment(null);
      setAppointmentActionNotes("");

      // NEW: Show success message with email status
      const emailStatus = data.confirmation_email_sent
        ? "Confirmation email sent to client!"
        : "Confirmed (email notification failed)";

      alert(`✅ Appointment confirmed successfully!\n📧 ${emailStatus}`);
    },
    onError: (error: any) => {
      alert(
        `Failed to confirm appointment: ${error.data?.error || error.message || "Unknown error"}`,
      );
    },
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return api.post(`/api/v1/appointments/${id}/cancel/`, {
        reason: reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment-counts"] });
      setShowCancelAppointmentModal(false);
      setSelectedAppointment(null);
      setAppointmentActionNotes("");
    },
    onError: (error: any) => {
      alert(
        `Failed to cancel appointment: ${error.data?.error || error.message || "Unknown error"}`,
      );
    },
  });

  const completeAppointmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.put(`/api/v1/appointments/${id}/status/`, {
        status: "completed",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment-counts"] });
    },
    onError: (error: any) => {
      alert(
        `Failed to complete appointment: ${error.data?.error || error.message || "Unknown error"}`,
      );
    },
  });

  // ==================================================================================
  // HANDLERS
  // ==================================================================================
  const handleCreateEvent = () => {
    if (!eventForm.title || !eventForm.event_date) {
      alert("Please fill in required fields (Title and Date)");
      return;
    }
    createEventMutation.mutate(eventForm);
  };

  const handleUpdateEvent = () => {
    if (!selectedEvent) return;
    updateEventMutation.mutate({
      id: selectedEvent.id,
      data: eventForm,
    });
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    deleteEventMutation.mutate(selectedEvent.id);
  };

  const handleCompleteEvent = (event: Event) => {
    if (!event.is_completed) {
      completeEventMutation.mutate(event.id);
    }
  };

  const handleAddAvailability = () => {
    if (
      !availabilityForm.date ||
      !availabilityForm.start_time ||
      !availabilityForm.end_time
    ) {
      alert("Please fill in all required fields");
      return;
    }
    if (availabilityForm.start_time >= availabilityForm.end_time) {
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
  };

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

  const openDeleteModal = (event: Event) => {
    setSelectedEvent(event);
    setShowDeleteEventModal(true);
  };

  const fetchSlotsForDate = async (dateStr: string) => {
    setSelectedDateSlots(dateStr);
    setShowSlotsModal(true);
    try {
      const dayData = availabilityData?.find((d: any) => d.date === dateStr);
      setViewingSlots(dayData?.slots || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setViewingSlots([]);
    }
  };

  const handleDeleteSlot = (slotId: number) => {
    if (confirm("Are you sure you want to delete this time slot?")) {
      deleteSlotMutation.mutate(slotId);
    }
  };

  const handleConfirmAppointment = () => {
    if (!selectedAppointment) return;
    confirmAppointmentMutation.mutate({
      id: selectedAppointment.id,
      notes: appointmentActionNotes,
    });
  };

  const handleCancelAppointment = () => {
    if (!selectedAppointment) return;
    cancelAppointmentMutation.mutate({
      id: selectedAppointment.id,
      reason: appointmentActionNotes,
    });
  };

  const handleCompleteAppointment = (appointment: Appointment) => {
    if (
      confirm(`Mark appointment with ${appointment.client_name} as completed?`)
    ) {
      completeAppointmentMutation.mutate(appointment.id);
    }
  };

  // ==================================================================================
  // UTILITY FUNCTIONS
  // ==================================================================================
  const resetEventForm = () => {
    setEventForm({
      title: "",
      event_type: "task",
      event_date: new Date().toISOString().split("T")[0],
      event_time: "",
      description: "",
      location: "",
    });
  };

  const resetAvailabilityForm = () => {
    setAvailabilityForm({
      date: new Date().toISOString().split("T")[0],
      start_time: "09:00",
      end_time: "17:00",
      is_recurring: false,
      recurring_days: [],
      recurring_end_date: "",
      notes: "",
    });
  };

  const toggleFilter = (filter: string) => {
    const newFilters = new Set(selectedFilters);
    if (newFilters.has(filter)) {
      newFilters.delete(filter);
    } else {
      newFilters.add(filter);
    }
    setSelectedFilters(newFilters);
  };

  const removeFilter = (filter: string) => {
    const newFilters = new Set(selectedFilters);
    newFilters.delete(filter);
    setSelectedFilters(newFilters);
  };

  const toggleRecurringDay = (day: string) => {
    const newDays = availabilityForm.recurring_days.includes(day)
      ? availabilityForm.recurring_days.filter((d) => d !== day)
      : [...availabilityForm.recurring_days, day];
    setAvailabilityForm({ ...availabilityForm, recurring_days: newDays });
  };

  const getWeekDates = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      return day;
    });
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "deadline":
        return "bg-red-50 border-red-200 text-red-700";
      case "meeting":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "reminder":
        return "bg-yellow-50 border-yellow-200 text-yellow-700";
      case "task":
        return "bg-green-50 border-green-200 text-green-700";
      case "appointment":
        return "bg-purple-50 border-purple-200 text-purple-700";
      default:
        return "bg-neutral-50 border-neutral-200 text-neutral-700";
    }
  };

  const getEventDotColor = (type: string) => {
    switch (type) {
      case "deadline":
        return "bg-red-500";
      case "meeting":
        return "bg-blue-500";
      case "reminder":
        return "bg-yellow-500";
      case "task":
        return "bg-green-500";
      case "appointment":
        return "bg-purple-500";
      default:
        return "bg-neutral-500";
    }
  };

  const formatTime12Hour = (time24: string) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getSlotCountForDate = (dateStr: string) => {
    const dayData = availabilityData?.find((d: any) => d.date === dateStr);
    return dayData?.slots?.length || 0;
  };

  const getBookedSlotCountForDate = (dateStr: string) => {
    const dayData = availabilityData?.find((d: any) => d.date === dateStr);
    return dayData?.slots?.filter((s: any) => s.is_booked).length || 0;
  };

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "confirmed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      case "rescheduled":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-neutral-50 text-neutral-700 border-neutral-200";
    }
  };

  const getAppointmentStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return faHourglassHalf;
      case "confirmed":
        return faCheckCircle;
      case "completed":
        return faCheck;
      case "cancelled":
        return faBan;
      case "rescheduled":
        return faCalendar;
      default:
        return faInfoCircle;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string, timeStr: string) => {
    return `${formatDate(dateStr)} at ${formatTime12Hour(timeStr)}`;
  };

  const filteredAppointments = appointments?.filter((apt) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        apt.client_name.toLowerCase().includes(query) ||
        apt.client_email?.toLowerCase().includes(query) ||
        apt.client_phone?.toLowerCase().includes(query) ||
        apt.service_type?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const pendingAppointmentCount = appointmentCounts?.pending || 0;

  // Click outside handler for filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ==================================================================================
  // CONSTANTS
  // ==================================================================================
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
  const eventTypes = [
    { type: "deadline", label: "Deadline", color: "bg-red-500" },
    { type: "meeting", label: "Meeting", color: "bg-blue-500" },
    { type: "reminder", label: "Reminder", color: "bg-yellow-500" },
    { type: "task", label: "Task", color: "bg-green-500" },
    { type: "appointment", label: "Appointment", color: "bg-purple-500" },
  ];
  const weekEndDate = new Date(currentWeekStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  // ==================================================================================
  // LOADING & ERROR STATES
  // ==================================================================================
  if (eventsLoading || availabilityLoading || appointmentsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-primary-600 text-4xl mb-4 animate-spin"
          />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (eventsError || appointmentsError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faTimes} className="text-red-600 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Error Loading Data
          </h3>
          <p className="text-red-700 mb-4">
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
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-0 border-b border-neutral-200 px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="heading-2 text-neutral-900 mb-1">
              Calendar & Appointments
            </h1>
            <p className="text-neutral-600 body-regular">
              Manage your schedule, availability, and booking requests
            </p>
            {pendingAppointmentCount > 0 && (
              <div
                className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
                onClick={() => setActiveTab("appointments")}
              >
                <FontAwesomeIcon
                  icon={faHourglassHalf}
                  className="text-yellow-600"
                />
                <span className="text-yellow-700 font-semibold text-sm">
                  {pendingAppointmentCount} pending request
                  {pendingAppointmentCount !== 1 ? "s" : ""} - Click to review
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAvailabilityModal(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faCalendarPlus} />
              Set Availability
            </button>
            <button
              onClick={() => {
                resetEventForm();
                setShowAddEventModal(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Event
            </button>
          </div>
        </div>
        {/* Tab Navigation */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "calendar"
                ? "bg-primary-600 text-white shadow-md"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            <FontAwesomeIcon icon={faCalendarCheck} className="mr-2" />
            Calendar View
          </button>
          <button
            onClick={() => setActiveTab("appointments")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all relative ${
              activeTab === "appointments"
                ? "bg-primary-600 text-white shadow-md"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            <FontAwesomeIcon icon={faUser} className="mr-2" />
            Appointments
            {pendingAppointmentCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingAppointmentCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Calendar Tab Content */}
      {activeTab === "calendar" && (
        <div className="p-8 max-w-7xl mx-auto">
          {/* Controls Bar */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Week Navigation */}
              <div className="flex items-center gap-4">
                <button
                  onClick={goToPreviousWeek}
                  className="p-2.5 hover:bg-neutral-50 rounded-lg transition-colors border border-neutral-200"
                >
                  <FontAwesomeIcon
                    icon={faChevronLeft}
                    className="text-neutral-600"
                  />
                </button>
                <div className="text-center min-w-[200px]">
                  <p className="font-semibold text-neutral-900">
                    {monthNames[currentWeekStart.getMonth()]}{" "}
                    {currentWeekStart.getDate()} - {weekEndDate.getDate()},
                    {currentWeekStart.getFullYear()}
                  </p>
                </div>
                <button
                  onClick={goToNextWeek}
                  className="p-2.5 hover:bg-neutral-50 rounded-lg transition-colors border border-neutral-200"
                >
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className="text-neutral-600"
                  />
                </button>
              </div>
              {/* Legend and Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Legend */}
                <div className="flex items-center gap-4 flex-wrap">
                  {eventTypes.map((eventType) => (
                    <div
                      key={eventType.type}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${eventType.color}`}
                      ></div>
                      <span className="text-neutral-700 text-sm">
                        {eventType.label}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Filter Button */}
                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-0 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <FontAwesomeIcon
                      icon={faFilter}
                      className="text-neutral-600"
                    />
                    <span className="text-neutral-700 font-medium">Filter</span>
                    {selectedFilters.size > 0 && (
                      <span className="px-2 py-0.5 bg-primary-600 text-neutral-0 rounded-full text-xs font-semibold">
                        {selectedFilters.size}
                      </span>
                    )}
                  </button>
                  {/* Filter Dropdown */}
                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-neutral-0 rounded-lg shadow-lg border border-neutral-200 py-2 z-10">
                      {eventTypes.map((eventType) => (
                        <button
                          key={eventType.type}
                          onClick={() => toggleFilter(eventType.type)}
                          className={`w-full px-4 py-2 text-left hover:bg-neutral-50 transition-colors flex items-center justify-between ${
                            selectedFilters.has(eventType.type)
                              ? "bg-primary-50"
                              : ""
                          }`}
                        >
                          <span className="text-neutral-700">
                            {eventType.label}
                          </span>
                          {selectedFilters.has(eventType.type) && (
                            <span className="text-primary-600 font-semibold">
                              ✓
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Active Filters */}
            {selectedFilters.size > 0 && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-100">
                <span className="text-neutral-600 text-sm font-medium">
                  Active Filters:
                </span>
                {Array.from(selectedFilters).map((filter) => {
                  const eventType = eventTypes.find((et) => et.type === filter);
                  return (
                    <span
                      key={filter}
                      className={`px-3 py-1 rounded-lg text-sm font-medium border flex items-center gap-2 ${getEventTypeColor(
                        filter,
                      )}`}
                    >
                      {eventType?.label}
                      <button
                        onClick={() => removeFilter(filter)}
                        className="hover:scale-110 transition-transform"
                      >
                        <FontAwesomeIcon icon={faTimes} className="text-xs" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          {/* Calendar Grid */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50">
              {getWeekDates().map((date, i) => {
                const isToday =
                  date.toDateString() === new Date().toDateString();
                const dateStr = formatDateKey(date);
                const slotCount = getSlotCountForDate(dateStr);
                const bookedCount = getBookedSlotCountForDate(dateStr);
                return (
                  <div
                    key={i}
                    className="p-4 text-center border-r border-neutral-200 last:border-r-0"
                  >
                    <div className="text-neutral-600 text-sm font-medium mb-1">
                      {weekDays[date.getDay()]}
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        isToday
                          ? "w-8 h-8 bg-primary-600 text-neutral-0 rounded-full flex items-center justify-center mx-auto"
                          : "text-neutral-900"
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    {/* Show slot availability indicator */}
                    {slotCount > 0 && (
                      <button
                        onClick={() => fetchSlotsForDate(dateStr)}
                        className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1 mx-auto"
                        title="View time slots"
                      >
                        <FontAwesomeIcon
                          icon={faCalendarCheck}
                          className="text-xs"
                        />
                        {slotCount} slot{slotCount !== 1 ? "s" : ""}
                        {bookedCount > 0 && ` (${bookedCount} booked)`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Event Cells */}
            <div className="grid grid-cols-7">
              {getWeekDates().map((date, i) => {
                const key = formatDateKey(date);
                const dayEvents = eventsData?.[key] || [];
                const filteredEvents =
                  selectedFilters.size === 0
                    ? dayEvents
                    : dayEvents.filter((event) =>
                        selectedFilters.has(event.event_type),
                      );
                return (
                  <div
                    key={i}
                    className="min-h-[200px] p-3 border-r border-b border-neutral-200 last:border-r-0 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="space-y-2">
                      {filteredEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all relative group ${getEventTypeColor(
                            event.event_type,
                          )} ${event.is_completed ? "opacity-60" : ""}`}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <div
                              className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${getEventDotColor(
                                event.event_type,
                              )}`}
                            ></div>
                            <p
                              className={`font-semibold text-sm leading-tight flex-1 ${
                                event.is_completed ? "line-through" : ""
                              }`}
                            >
                              {event.title}
                            </p>
                          </div>
                          {event.event_time && (
                            <div className="flex items-center gap-1 text-xs mb-1">
                              <FontAwesomeIcon
                                icon={faClock}
                                className="text-xs"
                              />
                              <span>{formatTime12Hour(event.event_time)}</span>
                            </div>
                          )}
                          {event.assigned_user_email && (
                            <div className="flex items-center gap-1 text-xs">
                              <FontAwesomeIcon
                                icon={faUser}
                                className="text-xs"
                              />
                              <span className="truncate">
                                {event.assigned_user_email}
                              </span>
                            </div>
                          )}
                          {/* Action buttons */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            {!event.is_completed && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompleteEvent(event);
                                }}
                                className="p-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                title="Mark as complete"
                              >
                                <FontAwesomeIcon
                                  icon={faCheckCircle}
                                  className="text-xs"
                                />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(event);
                              }}
                              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              title="Edit event"
                            >
                              <FontAwesomeIcon
                                icon={faEdit}
                                className="text-xs"
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(event);
                              }}
                              className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                              title="Delete event"
                            >
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="text-xs"
                              />
                            </button>
                          </div>
                          {event.is_completed && (
                            <div className="absolute top-2 right-2">
                              <FontAwesomeIcon
                                icon={faCheckCircle}
                                className="text-green-600"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Appointments Tab Content */}
      {activeTab === "appointments" && (
        <div className="p-8 max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <button
              onClick={() => setSelectedAppointmentStatus("all")}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedAppointmentStatus === "all"
                  ? "border-primary-500 bg-primary-50"
                  : "border-neutral-200 bg-neutral-0 hover:border-primary-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon
                  icon={faCalendarCheck}
                  className="text-primary-600 text-lg"
                />
                <span className="text-2xl font-bold text-neutral-900">
                  {appointmentCounts?.total || 0}
                </span>
              </div>
              <p className="text-neutral-600 text-sm font-medium">Total</p>
            </button>
            <button
              onClick={() => setSelectedAppointmentStatus("pending")}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedAppointmentStatus === "pending"
                  ? "border-yellow-500 bg-yellow-50"
                  : "border-neutral-200 bg-neutral-0 hover:border-yellow-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon
                  icon={faHourglassHalf}
                  className="text-yellow-600 text-lg"
                />
                <span className="text-2xl font-bold text-neutral-900">
                  {appointmentCounts?.pending || 0}
                </span>
              </div>
              <p className="text-neutral-600 text-sm font-medium">Pending</p>
            </button>
            <button
              onClick={() => setSelectedAppointmentStatus("confirmed")}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedAppointmentStatus === "confirmed"
                  ? "border-blue-500 bg-blue-50"
                  : "border-neutral-200 bg-neutral-0 hover:border-blue-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-blue-600 text-lg"
                />
                <span className="text-2xl font-bold text-neutral-900">
                  {appointmentCounts?.confirmed || 0}
                </span>
              </div>
              <p className="text-neutral-600 text-sm font-medium">Confirmed</p>
            </button>
            <button
              onClick={() => setSelectedAppointmentStatus("completed")}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedAppointmentStatus === "completed"
                  ? "border-green-500 bg-green-50"
                  : "border-neutral-200 bg-neutral-0 hover:border-green-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-green-600 text-lg"
                />
                <span className="text-2xl font-bold text-neutral-900">
                  {appointmentCounts?.completed || 0}
                </span>
              </div>
              <p className="text-neutral-600 text-sm font-medium">Completed</p>
            </button>
            <button
              onClick={() => setSelectedAppointmentStatus("rescheduled")}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedAppointmentStatus === "rescheduled"
                  ? "border-purple-500 bg-purple-50"
                  : "border-neutral-200 bg-neutral-0 hover:border-purple-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon
                  icon={faCalendar}
                  className="text-purple-600 text-lg"
                />
                <span className="text-2xl font-bold text-neutral-900">
                  {appointmentCounts?.rescheduled || 0}
                </span>
              </div>
              <p className="text-neutral-600 text-sm font-medium">
                Rescheduled
              </p>
            </button>
            <button
              onClick={() => setSelectedAppointmentStatus("cancelled")}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedAppointmentStatus === "cancelled"
                  ? "border-red-500 bg-red-50"
                  : "border-neutral-200 bg-neutral-0 hover:border-red-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <FontAwesomeIcon
                  icon={faBan}
                  className="text-red-600 text-lg"
                />
                <span className="text-2xl font-bold text-neutral-900">
                  {appointmentCounts?.cancelled || 0}
                </span>
              </div>
              <p className="text-neutral-600 text-sm font-medium">Cancelled</p>
            </button>
          </div>
          {/* Search Bar */}
          <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-4 mb-6">
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by client name, email, phone, or service type..."
                className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
          {/* Appointments List */}
          <div className="space-y-4">
            {filteredAppointments && filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-neutral-0 rounded-xl border border-neutral-200 p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left Section - Client Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-700 font-bold text-lg">
                            {appointment.client_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </span>
                        </div>
                        {/* Details */}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-neutral-900 mb-1">
                            {appointment.client_name}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                            {appointment.client_email && (
                              <div className="flex items-center gap-2 text-neutral-600 text-sm">
                                <FontAwesomeIcon
                                  icon={faEnvelope}
                                  className="text-neutral-400"
                                />
                                <span>{appointment.client_email}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-neutral-600 text-sm">
                              <FontAwesomeIcon
                                icon={faPhone}
                                className="text-neutral-400"
                              />
                              <span>{appointment.client_phone}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-700 mb-2">
                            <FontAwesomeIcon
                              icon={faCalendar}
                              className="text-primary-600"
                            />
                            <span className="font-semibold">
                              {formatDateTime(
                                appointment.appointment_date,
                                appointment.appointment_time,
                              )}
                            </span>
                          </div>
                          {appointment.service_type && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg mb-2">
                              <FontAwesomeIcon
                                icon={faInfoCircle}
                                className="text-blue-600 text-xs"
                              />
                              <span className="text-blue-700 text-sm font-medium">
                                {appointment.service_type}
                              </span>
                            </div>
                          )}
                          {appointment.description && (
                            <p className="text-neutral-600 text-sm mt-2 line-clamp-2">
                              {appointment.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Right Section - Status & Actions */}
                    <div className="flex flex-col items-end gap-3">
                      {/* Status Badge */}
                      <div
                        className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm flex items-center gap-2 ${getAppointmentStatusColor(
                          appointment.status,
                        )}`}
                      >
                        <FontAwesomeIcon
                          icon={getAppointmentStatusIcon(appointment.status)}
                        />
                        {appointment.status_display}
                      </div>
                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 w-full min-w-[140px]">
                        {appointment.status === "pending" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowConfirmAppointmentModal(true);
                              }}
                              className="btn-primary flex items-center justify-center gap-2 text-sm py-2"
                            >
                              <FontAwesomeIcon icon={faCheck} />
                              Confirm
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowCancelAppointmentModal(true);
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                              <FontAwesomeIcon icon={faBan} />
                              Decline
                            </button>
                          </>
                        )}
                        {appointment.status === "confirmed" && (
                          <>
                            <button
                              onClick={() =>
                                handleCompleteAppointment(appointment)
                              }
                              className="btn-primary flex items-center justify-center gap-2 text-sm py-2"
                            >
                              <FontAwesomeIcon icon={faCheckCircle} />
                              Mark Complete
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowCancelAppointmentModal(true);
                              }}
                              className="btn-secondary flex items-center justify-center gap-2 text-sm py-2"
                            >
                              <FontAwesomeIcon icon={faBan} />
                              Cancel
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowAppointmentDetailsModal(true);
                          }}
                          className="btn-secondary flex items-center justify-center gap-2 text-sm py-2"
                        >
                          <FontAwesomeIcon icon={faEye} />
                          View Details
                        </button>
                      </div>
                      {/* Created Date */}
                      <p className="text-neutral-400 text-xs">
                        Requested{" "}
                        {new Date(appointment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-neutral-0 rounded-xl border border-neutral-200 p-12 text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon
                    icon={faCalendarCheck}
                    className="text-neutral-400 text-2xl"
                  />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  No appointments found
                </h3>
                <p className="text-neutral-600">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : selectedAppointmentStatus === "all"
                      ? "You don't have any appointments yet"
                      : `No ${selectedAppointmentStatus} appointments`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-secondary-50">
              <h3 className="heading-4 text-neutral-900">Add New Event</h3>
              <button
                onClick={() => setShowAddEventModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, title: e.target.value })
                    }
                    placeholder="Enter event title..."
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Event Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={eventForm.event_type}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        event_type: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                  >
                    <option value="deadline">Deadline</option>
                    <option value="meeting">Meeting</option>
                    <option value="reminder">Reminder</option>
                    <option value="task">Task</option>
                    <option value="appointment">Appointment</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={eventForm.event_date}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          event_date: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Time
                    </label>
                    <input
                      type="time"
                      value={eventForm.event_time}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          event_time: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Description
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Add event description..."
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular resize-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Location
                  </label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, location: e.target.value })
                    }
                    placeholder="Enter location..."
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddEventModal(false)}
                disabled={createEventMutation.isPending}
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={createEventMutation.isPending}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {createEventMutation.isPending ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlus} />
                    Add Event
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-primary-50">
              <h3 className="heading-4 text-neutral-900">Edit Event</h3>
              <button
                onClick={() => {
                  setShowEditEventModal(false);
                  setSelectedEvent(null);
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, title: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Event Type
                  </label>
                  <select
                    value={eventForm.event_type}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        event_type: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular cursor-pointer"
                  >
                    <option value="deadline">Deadline</option>
                    <option value="meeting">Meeting</option>
                    <option value="reminder">Reminder</option>
                    <option value="task">Task</option>
                    <option value="appointment">Appointment</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Date
                    </label>
                    <input
                      type="date"
                      value={eventForm.event_date}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          event_date: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Time
                    </label>
                    <input
                      type="time"
                      value={eventForm.event_time}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          event_time: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Description
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular resize-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Location
                  </label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, location: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditEventModal(false);
                  setSelectedEvent(null);
                }}
                disabled={updateEventMutation.isPending}
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEvent}
                disabled={updateEventMutation.isPending}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {updateEventMutation.isPending ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                    />
                    Updating...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faEdit} />
                    Update Event
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Event Confirmation Modal */}
      {showDeleteEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="text-red-600 text-xl"
                />
              </div>
              <h3 className="heading-4 text-neutral-900 text-center mb-2">
                Delete Event?
              </h3>
              <p className="text-neutral-600 text-center mb-6">
                Are you sure you want to delete "{selectedEvent.title}"? This
                action cannot be undone.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowDeleteEventModal(false);
                    setSelectedEvent(null);
                  }}
                  disabled={deleteEventMutation.isPending}
                  className="flex-1 btn-secondary disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteEvent}
                  disabled={deleteEventMutation.isPending}
                  className="flex-1 px-5 py-3 bg-red-600 text-neutral-0 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleteEventMutation.isPending ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin"
                      />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faTrash} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Set Availability Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-lg w-full my-8">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-secondary-50">
              <div>
                <h3 className="heading-4 text-neutral-900">
                  Set Your Availability
                </h3>
                <p className="text-neutral-600 text-sm">
                  System will create 1-hour time slots
                </p>
              </div>
              <button
                onClick={() => setShowAvailabilityModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>

            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="space-y-5">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-700 text-sm">
                    <strong>How it works:</strong> Enter a time range (e.g., 9
                    AM - 5 PM) and we'll automatically create 1-hour booking
                    slots (9-10, 10-11, etc.).
                  </p>
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={availabilityForm.date}
                    onChange={(e) =>
                      setAvailabilityForm({
                        ...availabilityForm,
                        date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={availabilityForm.start_time}
                      onChange={(e) =>
                        setAvailabilityForm({
                          ...availabilityForm,
                          start_time: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-700 font-semibold mb-2 body-small">
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={availabilityForm.end_time}
                      onChange={(e) =>
                        setAvailabilityForm({
                          ...availabilityForm,
                          end_time: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                    />
                  </div>
                </div>

                {/* Preview of slots that will be created */}
                {availabilityForm.start_time && availabilityForm.end_time && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-700 text-sm">
                      <strong>Preview:</strong> This will create{" "}
                      {Math.floor(
                        parseInt(availabilityForm.end_time.split(":")[0]) -
                          parseInt(availabilityForm.start_time.split(":")[0]),
                      )}{" "}
                      hourly slot(s) between{" "}
                      {formatTime12Hour(availabilityForm.start_time)} and{" "}
                      {formatTime12Hour(availabilityForm.end_time)}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-neutral-700 font-semibold mb-2 body-small">
                    Notes
                  </label>
                  <textarea
                    value={availabilityForm.notes}
                    onChange={(e) =>
                      setAvailabilityForm({
                        ...availabilityForm,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Add notes (e.g., 'Remote consultations only', 'Lunch break 12-1')"
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular resize-none"
                  />
                  <p className="text-neutral-500 text-xs mt-1">
                    Optional: Add context for clients viewing available slots
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availabilityForm.is_recurring}
                      onChange={(e) =>
                        setAvailabilityForm({
                          ...availabilityForm,
                          is_recurring: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
                    />
                    <span className="text-neutral-700 font-semibold body-small">
                      Set as recurring availability
                    </span>
                  </label>
                </div>

                {availabilityForm.is_recurring && (
                  <>
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                      <label className="block text-neutral-700 font-semibold mb-3 body-small">
                        Select Days <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-7 gap-2">
                        {weekDaysAPI.map((day, idx) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleRecurringDay(day)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              availabilityForm.recurring_days.includes(day)
                                ? "bg-primary-600 text-neutral-0"
                                : "bg-neutral-0 text-neutral-700 border border-neutral-200 hover:border-primary-500"
                            }`}
                          >
                            {weekDays[idx]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-semibold mb-2 body-small">
                        Recurring End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={availabilityForm.recurring_end_date}
                        onChange={(e) =>
                          setAvailabilityForm({
                            ...availabilityForm,
                            recurring_end_date: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular"
                      />
                      <p className="text-neutral-500 text-xs mt-1">
                        Leave empty to default to 90 days from start date
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAvailabilityModal(false)}
                disabled={createAvailabilityMutation.isPending}
                className="px-5 py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAvailability}
                disabled={createAvailabilityMutation.isPending}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {createAvailabilityMutation.isPending ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="animate-spin"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCalendarPlus} />
                    Create Slots
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Slots Modal */}
      {showSlotsModal && selectedDateSlots && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-secondary-50">
              <div>
                <h3 className="heading-4 text-neutral-900">Time Slots</h3>
                <p className="text-neutral-600 text-sm">
                  {new Date(selectedDateSlots + "T00:00:00").toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSlotsModal(false);
                  setSelectedDateSlots(null);
                  setViewingSlots([]);
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {viewingSlots.length > 0 ? (
                <div className="space-y-3">
                  {viewingSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        slot.is_booked
                          ? "bg-neutral-50 border-neutral-300"
                          : "bg-green-50 border-green-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FontAwesomeIcon
                              icon={faClock}
                              className={
                                slot.is_booked
                                  ? "text-neutral-500"
                                  : "text-green-600"
                              }
                            />
                            <span
                              className={`font-semibold ${
                                slot.is_booked
                                  ? "text-neutral-700"
                                  : "text-green-900"
                              }`}
                            >
                              {formatTime12Hour(slot.start_time)} -{" "}
                              {formatTime12Hour(slot.end_time)}
                            </span>
                            {slot.is_booked && (
                              <span className="px-2 py-1 bg-neutral-200 text-neutral-700 rounded text-xs font-medium">
                                Booked
                              </span>
                            )}
                            {!slot.is_booked && (
                              <span className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium">
                                Available
                              </span>
                            )}
                          </div>
                          {slot.notes && (
                            <p className="text-neutral-600 text-sm">
                              {slot.notes}
                            </p>
                          )}
                          {slot.is_booked && slot.booked_by_email && (
                            <p className="text-neutral-500 text-xs mt-1">
                              Booked by: {slot.booked_by_email}
                            </p>
                          )}
                        </div>
                        {!slot.is_booked && (
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors ml-3"
                            title="Delete slot"
                          >
                            <FontAwesomeIcon
                              icon={faTrash}
                              className="text-sm"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-neutral-500">
                    No time slots for this date
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-neutral-600">
                    Total: {viewingSlots.length} slot
                    {viewingSlots.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-green-600">
                    Available: {viewingSlots.filter((s) => !s.is_booked).length}
                  </span>
                  <span className="text-neutral-500">
                    Booked: {viewingSlots.filter((s) => s.is_booked).length}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowSlotsModal(false);
                    setSelectedDateSlots(null);
                    setViewingSlots([]);
                  }}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {showAppointmentDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-secondary-50 sticky top-0">
              <h3 className="heading-4 text-neutral-900">
                Appointment Details
              </h3>
              <button
                onClick={() => {
                  setShowAppointmentDetailsModal(false);
                  setSelectedAppointment(null);
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-neutral-600" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <label className="block text-neutral-500 text-sm mb-2">
                  Status
                </label>
                <div
                  className={`inline-flex px-4 py-2 rounded-lg border-2 font-semibold ${getAppointmentStatusColor(
                    selectedAppointment.status,
                  )}`}
                >
                  <FontAwesomeIcon
                    icon={getAppointmentStatusIcon(selectedAppointment.status)}
                    className="mr-2"
                  />
                  {selectedAppointment.status_display}
                </div>
              </div>
              {/* Client Information */}
              <div>
                <h4 className="font-semibold text-neutral-900 mb-3">
                  Client Information
                </h4>
                <div className="space-y-3 bg-neutral-50 rounded-lg p-4">
                  <div>
                    <label className="block text-neutral-500 text-sm mb-1">
                      Name
                    </label>
                    <p className="text-neutral-900 font-medium">
                      {selectedAppointment.client_name}
                    </p>
                  </div>
                  {selectedAppointment.client_email && (
                    <div>
                      <label className="block text-neutral-500 text-sm mb-1">
                        Email
                      </label>
                      <p className="text-neutral-900">
                        {selectedAppointment.client_email}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-neutral-500 text-sm mb-1">
                      Phone
                    </label>
                    <p className="text-neutral-900">
                      {selectedAppointment.client_phone}
                    </p>
                  </div>
                </div>
              </div>
              {/* Appointment Details */}
              <div>
                <h4 className="font-semibold text-neutral-900 mb-3">
                  Appointment Details
                </h4>
                <div className="space-y-3 bg-neutral-50 rounded-lg p-4">
                  <div>
                    <label className="block text-neutral-500 text-sm mb-1">
                      Date & Time
                    </label>
                    <p className="text-neutral-900 font-medium">
                      {formatDateTime(
                        selectedAppointment.appointment_date,
                        selectedAppointment.appointment_time,
                      )}
                    </p>
                  </div>
                  {selectedAppointment.service_type && (
                    <div>
                      <label className="block text-neutral-500 text-sm mb-1">
                        Service Type
                      </label>
                      <p className="text-neutral-900">
                        {selectedAppointment.service_type}
                      </p>
                    </div>
                  )}
                  {selectedAppointment.description && (
                    <div>
                      <label className="block text-neutral-500 text-sm mb-1">
                        Description
                      </label>
                      <p className="text-neutral-900">
                        {selectedAppointment.description}
                      </p>
                    </div>
                  )}
                  {selectedAppointment.location_address && (
                    <div>
                      <label className="block text-neutral-500 text-sm mb-1">
                        Location
                      </label>
                      <p className="text-neutral-900">
                        {selectedAppointment.location_address}
                      </p>
                    </div>
                  )}
                  {selectedAppointment.notes && (
                    <div>
                      <label className="block text-neutral-500 text-sm mb-1">
                        Notes
                      </label>
                      <p className="text-neutral-900">
                        {selectedAppointment.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {/* Timestamps */}
              <div>
                <h4 className="font-semibold text-neutral-900 mb-3">
                  Request Information
                </h4>
                <div className="space-y-2 bg-neutral-50 rounded-lg p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Created:</span>
                    <span className="text-neutral-900">
                      {new Date(
                        selectedAppointment.created_at,
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Last Updated:</span>
                    <span className="text-neutral-900">
                      {new Date(
                        selectedAppointment.updated_at,
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 sticky bottom-0">
              <button
                onClick={() => {
                  setShowAppointmentDetailsModal(false);
                  setSelectedAppointment(null);
                }}
                className="w-full btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Appointment Modal */}
      {showConfirmAppointmentModal && selectedAppointment && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-green-600 text-xl"
                />
              </div>
              <h3 className="heading-4 text-neutral-900 text-center mb-2">
                Confirm Appointment?
              </h3>
              <p className="text-neutral-600 text-center mb-2">
                Confirm appointment with{" "}
                <strong>{selectedAppointment.client_name}</strong> for{" "}
                <strong>
                  {formatDateTime(
                    selectedAppointment.appointment_date,
                    selectedAppointment.appointment_time,
                  )}
                </strong>
                ?
              </p>
              <p className="text-neutral-500 text-sm text-center mb-6">
                This will add the appointment to your calendar and notify the
                client.
              </p>
              <div className="mb-4">
                <label className="block text-neutral-700 font-semibold mb-2 text-sm">
                  Add a note (optional)
                </label>
                <textarea
                  value={appointmentActionNotes}
                  onChange={(e) => setAppointmentActionNotes(e.target.value)}
                  placeholder="e.g., Looking forward to meeting you!"
                  rows={3}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowConfirmAppointmentModal(false);
                    setSelectedAppointment(null);
                    setAppointmentActionNotes("");
                  }}
                  disabled={confirmAppointmentMutation.isPending}
                  className="flex-1 btn-secondary disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAppointment}
                  disabled={confirmAppointmentMutation.isPending}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {confirmAppointmentMutation.isPending ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin"
                      />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} />
                      Confirm
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {showCancelAppointmentModal && selectedAppointment && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="text-red-600 text-xl"
                />
              </div>
              <h3 className="heading-4 text-neutral-900 text-center mb-2">
                {selectedAppointment.status === "pending"
                  ? "Decline Appointment?"
                  : "Cancel Appointment?"}
              </h3>
              <p className="text-neutral-600 text-center mb-6">
                {selectedAppointment.status === "pending"
                  ? "Decline the appointment request from"
                  : "Cancel the confirmed appointment with"}{" "}
                <strong>{selectedAppointment.client_name}</strong>? The client
                will be notified.
              </p>
              <div className="mb-4">
                <label className="block text-neutral-700 font-semibold mb-2 text-sm">
                  Reason (optional)
                </label>
                <textarea
                  value={appointmentActionNotes}
                  onChange={(e) => setAppointmentActionNotes(e.target.value)}
                  placeholder="Let the client know why..."
                  rows={3}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowCancelAppointmentModal(false);
                    setSelectedAppointment(null);
                    setAppointmentActionNotes("");
                  }}
                  disabled={cancelAppointmentMutation.isPending}
                  className="flex-1 btn-secondary disabled:opacity-50"
                >
                  Go Back
                </button>
                <button
                  onClick={handleCancelAppointment}
                  disabled={cancelAppointmentMutation.isPending}
                  className="flex-1 px-5 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {cancelAppointmentMutation.isPending ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faBan} />
                      {selectedAppointment.status === "pending"
                        ? "Decline"
                        : "Cancel"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
