import { api } from "@/lib/api";

export interface Client {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  profile_image: string;
  is_active: boolean;
  project_count: number;
  last_project: {
    id: number;
    name: string;
    date: string;
  } | null;
  created_at: string;
}

export interface ClientDetail extends Client {
  country_code: string;
  country: string;
  address: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  updated_at: string;
  stats: {
    total_projects: number;
    active_projects: number;
    completed_projects: number;
    total_spent: number;
    last_project_date: string | null;
  };
  projects: Array<{
    id: number;
    name: string;
    status: string;
    start_date: string | null;
    total_cost: number;
    created_at: string;
  }>;
}

export interface ClientCreateData {
  email: string;
  phone: string;
  full_name: string;
  password?: string;
  city?: string;
  state?: string;
  address?: string;
  postal_code?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  profile_image?: string;
  project_id?: number; // NEW: Optional project assignment
}

export interface ClientListResponse {
  count: number;
  results: Client[];
}

export const clientService = {
  // Get list of clients
  async getClients(
    search?: string,
    getAll = false
  ): Promise<ClientListResponse> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (getAll) params.append("all", "true");

    const queryString = params.toString();
    const endpoint = `/api/v1/provider/clients/${
      queryString ? `?${queryString}` : ""
    }`;

    return api.get(endpoint);
  },

  // Create new client (with optional project assignment)
  async createClient(data: ClientCreateData): Promise<ClientDetail> {
    return api.post("/api/v1/provider/clients/", data);
  },

  // Get single client details
  async getClientDetails(clientId: number): Promise<ClientDetail> {
    return api.get(`/api/v1/provider/clients/${clientId}/`);
  },

  // Update client
  async updateClient(
    clientId: number,
    data: Partial<ClientCreateData>
  ): Promise<ClientDetail> {
    return api.patch(`/api/v1/provider/clients/${clientId}/`, data);
  },

  // Delete client
  async deleteClient(clientId: number): Promise<void> {
    return api.delete(`/api/v1/provider/clients/${clientId}/`);
  },
};
