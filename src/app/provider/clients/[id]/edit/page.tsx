"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faSave,
  faCheckCircle,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientService, ClientCreateData } from "@/lib/clientService";

/* ─────────────────────────────────────────── */
/* Helpers                                      */
/* ─────────────────────────────────────────── */
const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

/* ─────────────────────────────────────────── */
/* Shared input style                           */
/* ─────────────────────────────────────────── */
const baseInput = (disabled: boolean): React.CSSProperties => ({
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
  opacity: disabled ? 0.6 : 1,
});

function onFocusIn(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "#1ab189";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,177,137,0.12)";
}
function onFocusOut(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "var(--color-neutral-200)";
  e.currentTarget.style.boxShadow = "none";
}

/* ─────────────────────────────────────────── */
/* Small reusable pieces                       */
/* ─────────────────────────────────────────── */
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
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
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl"
      style={{
        backgroundColor: "var(--color-neutral-0)",
        border: "1px solid var(--color-neutral-200)",
        padding: "1.5rem",
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "rgba(26,177,137,0.1)" }}
        >
          <span style={{ color: "#1ab189", fontSize: "0.875rem" }}>{icon}</span>
        </div>
        <h2
          className="font-semibold"
          style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* Component                                   */
/* ─────────────────────────────────────────── */
export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const clientId = Number(params.id);

  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode] = useState("+977"); // not editable in UI, kept for payload

  /* ── Query ── */
  const { data: client, isLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => clientService.getClientDetails(clientId),
    enabled: !!clientId,
  });

  /* ── Populate form ── */
  useEffect(() => {
    if (client) {
      setClientName(client.full_name);
      setEmail(client.email);
      setPhone(client.phone);
      setAddress(client.address ?? "");
      setCity(client.city ?? "");
      setState(client.state ?? "");
      setPostalCode(client.postal_code ?? "");
    }
  }, [client]);

  /* ── Update mutation ── */
  const updateMutation = useMutation({
    mutationFn: (data: Partial<ClientCreateData>) =>
      clientService.updateClient(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      router.push(`/provider/clients/${clientId}`);
    },
    onError: (err: unknown) => {
      const e = err as { data?: { detail?: string }; message?: string };
      alert(
        `Error: ${e.data?.detail ?? e.message ?? "Failed to update client"}`,
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !email || !phone) {
      alert("Please fill in all required fields");
      return;
    }

    const updates: Partial<ClientCreateData> = {};
    if (clientName !== client?.full_name) updates.full_name = clientName;
    if (email !== client?.email) updates.email = email;
    if (phone !== client?.phone) updates.phone = phone;
    if (address !== (client?.address ?? "")) updates.address = address;
    if (city !== (client?.city ?? "")) updates.city = city;
    if (state !== (client?.state ?? "")) updates.state = state;
    if (postalCode !== (client?.postal_code ?? ""))
      updates.postal_code = postalCode;
    if (countryCode !== (client?.country_code ?? "+977"))
      updates.country_code = countryCode;

    if (Object.keys(updates).length === 0) {
      alert("No changes to save");
      return;
    }
    updateMutation.mutate(updates);
  };

  const isSubmitting = updateMutation.isPending;

  /* ── Loading / not found ── */
  if (isLoading) {
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
            Loading client details…
          </p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-neutral-50)" }}
      >
        <div className="text-center">
          <p className="mb-4" style={{ color: "#ef4444" }}>
            Client not found
          </p>
          <button
            onClick={() => router.back()}
            className="btn btn-primary btn-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-neutral-50)" }}
    >
      {/* Page header */}
      <div
        style={{
          backgroundColor: "var(--color-neutral-0)",
          borderBottom: "1px solid var(--color-neutral-200)",
          padding: "1.125rem 2rem",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            disabled={isSubmitting}
            aria-label="Go back"
            style={{
              width: "2.25rem",
              height: "2.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
              border: "1px solid var(--color-neutral-200)",
              borderRadius: "0.625rem",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              color: "var(--color-neutral-500)",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting)
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "var(--color-neutral-100)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "transparent";
            }}
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
              style={{ fontSize: "0.85rem" }}
            />
          </button>
          <div>
            <h1
              className="font-bold"
              style={{
                fontSize: "1.375rem",
                color: "var(--color-neutral-900)",
                lineHeight: 1.2,
              }}
            >
              Edit Client
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-neutral-500)",
                marginTop: "0.125rem",
              }}
            >
              Update client information
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{ padding: "1.75rem 2rem", maxWidth: "72rem", margin: "0 auto" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Main column ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Basic information */}
            <SectionCard
              title="Basic Information"
              icon={<FontAwesomeIcon icon={faUser} />}
            >
              <div className="space-y-4">
                <Field label="Full Name" required>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g., John Smith"
                    required
                    disabled={isSubmitting}
                    style={baseInput(isSubmitting)}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Email Address" required>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "#1ab189", fontSize: "0.8rem" }}
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@email.com"
                        required
                        disabled={isSubmitting}
                        style={{
                          ...baseInput(isSubmitting),
                          paddingLeft: "2.25rem",
                        }}
                        onFocus={onFocusIn}
                        onBlur={onFocusOut}
                      />
                    </div>
                  </Field>
                  <Field label="Phone Number" required>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faPhone}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "#1ab189", fontSize: "0.8rem" }}
                      />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+9779841234567"
                        required
                        disabled={isSubmitting}
                        style={{
                          ...baseInput(isSubmitting),
                          paddingLeft: "2.25rem",
                        }}
                        onFocus={onFocusIn}
                        onBlur={onFocusOut}
                      />
                    </div>
                  </Field>
                </div>
              </div>
            </SectionCard>

            {/* Address */}
            <SectionCard
              title="Address Information"
              icon={<FontAwesomeIcon icon={faMapMarkerAlt} />}
            >
              <div className="space-y-4">
                <Field label="Street Address">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main Street"
                    disabled={isSubmitting}
                    style={baseInput(isSubmitting)}
                    onFocus={onFocusIn}
                    onBlur={onFocusOut}
                  />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "City", val: city, set: setCity, ph: "Pokhara" },
                    {
                      label: "State/Province",
                      val: state,
                      set: setState,
                      ph: "Gandaki",
                    },
                    {
                      label: "Postal Code",
                      val: postalCode,
                      set: setPostalCode,
                      ph: "33700",
                    },
                  ].map(({ label, val, set, ph }) => (
                    <Field key={label} label={label}>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        placeholder={ph}
                        disabled={isSubmitting}
                        style={baseInput(isSubmitting)}
                        onFocus={onFocusIn}
                        onBlur={onFocusOut}
                      />
                    </Field>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1">
            <div
              className="rounded-2xl sticky top-8"
              style={{
                backgroundColor: "var(--color-neutral-0)",
                border: "1px solid var(--color-neutral-200)",
                padding: "1.5rem",
              }}
            >
              <h3
                className="font-semibold mb-5"
                style={{ fontSize: "1rem", color: "var(--color-neutral-900)" }}
              >
                Client Preview
              </h3>

              {/* Avatar */}
              <div className="flex justify-center mb-5">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center font-bold"
                  style={{
                    backgroundColor: "#1ab189",
                    color: "white",
                    fontSize: "1.5rem",
                  }}
                >
                  {clientName ? getInitials(clientName) : "?"}
                </div>
              </div>

              {/* Preview rows */}
              {[
                { label: "Name", value: clientName || "Not specified" },
                { label: "Email", value: email || "Not specified" },
                { label: "Phone", value: phone || "Not specified" },
                {
                  label: "Location",
                  value: city && state ? `${city}, ${state}` : "Not specified",
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="text-center pb-4 mb-4"
                  style={{ borderBottom: "1px solid var(--color-neutral-100)" }}
                >
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-neutral-500)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {label}
                  </p>
                  <p
                    className="font-semibold truncate"
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-neutral-900)",
                    }}
                  >
                    {value}
                  </p>
                </div>
              ))}

              <div className="text-center mb-5">
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--color-neutral-500)",
                    marginBottom: "0.25rem",
                  }}
                >
                  Projects
                </p>
                <p
                  className="font-bold"
                  style={{
                    fontSize: "1.25rem",
                    color: "var(--color-neutral-900)",
                  }}
                >
                  {client.project_count}
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-2.5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn btn-primary btn-md flex items-center justify-center gap-2"
                  style={{ opacity: isSubmitting ? 0.6 : 1 }}
                >
                  {isSubmitting ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin"
                        style={{ fontSize: "0.875rem" }}
                      />{" "}
                      Saving…
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon
                        icon={faSave}
                        style={{ fontSize: "0.875rem" }}
                      />{" "}
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="w-full btn btn-ghost btn-md"
                  style={{ opacity: isSubmitting ? 0.6 : 1 }}
                >
                  Cancel
                </button>
              </div>

              {/* Note */}
              <div
                className="mt-5 rounded-xl flex items-start gap-2.5 px-4 py-3"
                style={{
                  backgroundColor: "rgba(26,177,137,0.06)",
                  border: "1px solid rgba(26,177,137,0.2)",
                }}
              >
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  style={{
                    color: "#1ab189",
                    fontSize: "0.8rem",
                    marginTop: "0.1rem",
                    flexShrink: 0,
                  }}
                />
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-neutral-700)",
                  }}
                >
                  <strong>Note:</strong> Changes will be saved when you click
                  &quot;Save Changes&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
