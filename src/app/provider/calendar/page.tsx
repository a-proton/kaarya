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

// ==================================================================================
// MAIN COMPONENT
// ==================================================================================

export default function CalendarPage() {
  const queryClient = useQueryClient();

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  });

  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(
    new Set()
  );
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

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
  // UTILITY FUNCTIONS (Define early to avoid hoisting issues)
  // ==================================================================================

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Format date key for events object
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
        `/api/v1/calendar/events/week/?week_start=${weekStart}`
      );
    },
  });

  // ==================================================================================
  // MUTATIONS
  // ==================================================================================

  // Create event mutation
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
        `Failed to create event: ${
          error.data?.detail || error.message || "Unknown error"
        }`
      );
    },
  });

  // Update event mutation
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
        `Failed to update event: ${
          error.data?.detail || error.message || "Unknown error"
        }`
      );
    },
  });

  // Delete event mutation
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
        `Failed to delete event: ${
          error.data?.detail || error.message || "Unknown error"
        }`
      );
    },
  });

  // Mark event complete mutation
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
        `Failed to mark event complete: ${
          error.data?.detail || error.message || "Unknown error"
        }`
      );
    },
  });

  // Create availability mutation
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
    onSuccess: () => {
      setShowAvailabilityModal(false);
      resetAvailabilityForm();
      alert("Availability added successfully!");
    },
    onError: (error: any) => {
      alert(
        `Failed to create availability: ${
          error.data?.detail || error.message || "Unknown error"
        }`
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

  if (eventsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-primary-600 text-4xl mb-4 animate-spin"
          />
          <p className="text-neutral-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (eventsError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faTimes} className="text-red-600 text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Error Loading Calendar
          </h3>
          <p className="text-red-700 mb-4">Failed to load calendar events</p>
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
            <h1 className="heading-2 text-neutral-900 mb-1">Calendar View</h1>
            <p className="text-neutral-600 body-regular">
              Track your tasks and schedule
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAvailabilityModal(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faCalendar} />
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
      </div>

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
                  {currentWeekStart.getDate()} - {weekEndDate.getDate()},{" "}
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
                  <div key={eventType.type} className="flex items-center gap-2">
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
                      filter
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
              const isToday = date.toDateString() === new Date().toDateString();
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
                      selectedFilters.has(event.event_type)
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
                          event.event_type
                        )} ${event.is_completed ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div
                            className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${getEventDotColor(
                              event.event_type
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

                        {/* Action buttons - show on hover */}
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
                  Define when you're available to work
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
                    placeholder="Add notes about this availability slot (e.g., 'Remote only', 'Emergency calls accepted', 'Lunch break')..."
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-0 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all body-regular resize-none"
                  />
                  <p className="text-neutral-500 text-xs mt-1">
                    Optional: Add context or restrictions for this time slot
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
                        Select Days
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
                        Leave empty to default to 90 days
                      </p>
                    </div>
                  </>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-700 text-sm">
                    <strong>Tip:</strong> Setting your availability helps
                    clients know when they can book appointments or meetings
                    with you. Use notes to add context like service types or
                    preferences.
                  </p>
                </div>
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
                    Setting...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCalendar} />
                    Set Availability
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
