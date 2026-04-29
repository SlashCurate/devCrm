// ==================== HOSTEL SERVICE ====================
import api from '../axios';
import type { 
  Hostel,
  HostelRoom,
  HostelAllocation,
  HostelLeave,
  HostelComplaint,
  HostelVisitor,
  MessMenu,
  ApiResponse,
  PaginatedResponse,
  QueryFilters 
} from '../../types';

export const hostelService = {
  // Hostels
  getHostels: async (): Promise<ApiResponse<Hostel[]>> => {
    const response = await api.get<ApiResponse<Hostel[]>>('/hostels');
    return response.data;
  },

  getHostelById: async (id: number): Promise<ApiResponse<Hostel>> => {
    const response = await api.get<ApiResponse<Hostel>>(`/hostels/${id}`);
    return response.data;
  },

  createHostel: async (data: Partial<Hostel>): Promise<ApiResponse<Hostel>> => {
    const response = await api.post<ApiResponse<Hostel>>('/hostels', data);
    return response.data;
  },

  updateHostel: async (id: number, data: Partial<Hostel>): Promise<ApiResponse<Hostel>> => {
    const response = await api.put<ApiResponse<Hostel>>(`/hostels/${id}`, data);
    return response.data;
  },

  deleteHostel: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/hostels/${id}`);
    return response.data;
  },

  // Rooms
  getRooms: async (hostelId?: number): Promise<ApiResponse<HostelRoom[]>> => {
    const params = hostelId ? { hostel_id: hostelId } : {};
    const response = await api.get<ApiResponse<HostelRoom[]>>('/rooms', { params });
    return response.data;
  },

  getRoomById: async (id: number): Promise<ApiResponse<HostelRoom>> => {
    const response = await api.get<ApiResponse<HostelRoom>>(`/rooms/${id}`);
    return response.data;
  },

  createRoom: async (data: Partial<HostelRoom>): Promise<ApiResponse<HostelRoom>> => {
    const response = await api.post<ApiResponse<HostelRoom>>('/rooms', data);
    return response.data;
  },

  updateRoom: async (id: number, data: Partial<HostelRoom>): Promise<ApiResponse<HostelRoom>> => {
    const response = await api.put<ApiResponse<HostelRoom>>(`/rooms/${id}`, data);
    return response.data;
  },

  deleteRoom: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/rooms/${id}`);
    return response.data;
  },

  getAvailableRooms: async (hostelId?: number): Promise<ApiResponse<HostelRoom[]>> => {
    const params = hostelId ? { hostel_id: hostelId } : {};
    const response = await api.get<ApiResponse<HostelRoom[]>>(`/rooms/available`, { params });
    return response.data;
  },

  // Allocations
  getAllocations: async (filters?: QueryFilters): Promise<PaginatedResponse<HostelAllocation>> => {
    const response = await api.get<PaginatedResponse<HostelAllocation>>('/allocations', { params: filters });
    return response.data;
  },

  getMyAllocation: async (): Promise<ApiResponse<HostelAllocation>> => {
    const response = await api.get<ApiResponse<HostelAllocation>>('/allocations/my');
    return response.data;
  },

  allocateRoom: async (studentId: number, roomId: number): Promise<ApiResponse<HostelAllocation>> => {
    const response = await api.post<ApiResponse<HostelAllocation>>('/allocations', {
      student_id: studentId,
      room_id: roomId
    });
    return response.data;
  },

  vacateRoom: async (allocationId: number, reason?: string): Promise<ApiResponse<HostelAllocation>> => {
    const response = await api.post<ApiResponse<HostelAllocation>>(`/allocations/${allocationId}/vacate`, { reason });
    return response.data;
  },

  transferRoom: async (allocationId: number, newRoomId: number): Promise<ApiResponse<HostelAllocation>> => {
    const response = await api.post<ApiResponse<HostelAllocation>>(`/allocations/${allocationId}/transfer`, {
      new_room_id: newRoomId
    });
    return response.data;
  },

  // Leaves
  getLeaves: async (): Promise<ApiResponse<HostelLeave[]>> => {
    const response = await api.get<ApiResponse<HostelLeave[]>>('/hostel-leaves');
    return response.data;
  },

  getMyLeaves: async (): Promise<ApiResponse<HostelLeave[]>> => {
    const response = await api.get<ApiResponse<HostelLeave[]>>('/hostel-leaves/my');
    return response.data;
  },

  applyLeave: async (data: Partial<HostelLeave>): Promise<ApiResponse<HostelLeave>> => {
    const response = await api.post<ApiResponse<HostelLeave>>('/hostel-leaves', data);
    return response.data;
  },

  updateLeaveStatus: async (leaveId: number, status: string, remarks?: string): Promise<ApiResponse<HostelLeave>> => {
    const response = await api.patch<ApiResponse<HostelLeave>>(`/hostel-leaves/${leaveId}/status`, {
      status,
      remarks
    });
    return response.data;
  },

  // Complaints
  getComplaints: async (): Promise<ApiResponse<HostelComplaint[]>> => {
    const response = await api.get<ApiResponse<HostelComplaint[]>>('/hostel-complaints');
    return response.data;
  },

  getMyComplaints: async (): Promise<ApiResponse<HostelComplaint[]>> => {
    const response = await api.get<ApiResponse<HostelComplaint[]>>('/hostel-complaints/my');
    return response.data;
  },

  submitComplaint: async (data: Partial<HostelComplaint>): Promise<ApiResponse<HostelComplaint>> => {
    const response = await api.post<ApiResponse<HostelComplaint>>('/hostel-complaints', data);
    return response.data;
  },

  updateComplaintStatus: async (complaintId: number, status: string, resolution?: string): Promise<ApiResponse<HostelComplaint>> => {
    const response = await api.patch<ApiResponse<HostelComplaint>>(`/hostel-complaints/${complaintId}/status`, {
      status,
      resolution
    });
    return response.data;
  },

  // Visitors
  getVisitors: async (studentId?: number): Promise<ApiResponse<HostelVisitor[]>> => {
    const url = studentId ? `/students/${studentId}/visitors` : '/students/me/visitors';
    const response = await api.get<ApiResponse<HostelVisitor[]>>(url);
    return response.data;
  },

  registerVisitor: async (data: Partial<HostelVisitor>): Promise<ApiResponse<HostelVisitor>> => {
    const response = await api.post<ApiResponse<HostelVisitor>>('/visitors', data);
    return response.data;
  },

  checkoutVisitor: async (visitorId: number): Promise<ApiResponse<HostelVisitor>> => {
    const response = await api.post<ApiResponse<HostelVisitor>>(`/visitors/${visitorId}/checkout`);
    return response.data;
  },

  // Mess Menu
  getMessMenu: async (hostelId?: number): Promise<ApiResponse<MessMenu[]>> => {
    const params = hostelId ? { hostel_id: hostelId } : {};
    const response = await api.get<ApiResponse<MessMenu[]>>(`/mess/menu`, { params });
    return response.data;
  },

  updateMessMenu: async (menuId: number, data: Partial<MessMenu>): Promise<ApiResponse<MessMenu>> => {
    const response = await api.put<ApiResponse<MessMenu>>(`/mess/menu/${menuId}`, data);
    return response.data;
  },

  // Dashboard
  getDashboard: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await api.get<ApiResponse<Record<string, unknown>>>(`/hostels/dashboard`);
    return response.data;
  },
};

export default hostelService;
