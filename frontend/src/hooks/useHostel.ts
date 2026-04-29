// ==================== HOSTEL HOOKS ====================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hostelService } from '../api/services';
import type { 
  Hostel,
  HostelRoom,
  HostelAllocation,
  HostelLeave,
  HostelComplaint,
  HostelVisitor,
  MessMenu,
  QueryFilters 
} from '../types';

export const hostelKeys = {
  all: ['hostel'] as const,
  hostels: () => [...hostelKeys.all, 'hostels'] as const,
  hostelDetail: (id: number) => [...hostelKeys.all, 'hostels', id] as const,
  rooms: (hostelId?: number) => [...hostelKeys.all, 'rooms', hostelId] as const,
  roomDetail: (id: number) => [...hostelKeys.all, 'rooms', id] as const,
  availableRooms: (hostelId?: number) => [...hostelKeys.all, 'availableRooms', hostelId] as const,
  allocations: (filters?: QueryFilters) => [...hostelKeys.all, 'allocations', filters] as const,
  myAllocation: () => [...hostelKeys.all, 'myAllocation'] as const,
  leaves: () => [...hostelKeys.all, 'leaves'] as const,
  myLeaves: () => [...hostelKeys.all, 'myLeaves'] as const,
  complaints: () => [...hostelKeys.all, 'complaints'] as const,
  myComplaints: () => [...hostelKeys.all, 'myComplaints'] as const,
  visitors: (studentId?: number) => [...hostelKeys.all, 'visitors', studentId] as const,
  messMenu: (hostelId?: number) => [...hostelKeys.all, 'messMenu', hostelId] as const,
  dashboard: () => [...hostelKeys.all, 'dashboard'] as const,
};

// ============== HOSTELS ==============

export const useHostels = () => {
  return useQuery({
    queryKey: hostelKeys.hostels(),
    queryFn: hostelService.getHostels,
    select: (res) => res.data,
  });
};

export const useHostel = (id: number) => {
  return useQuery({
    queryKey: hostelKeys.hostelDetail(id),
    queryFn: () => hostelService.getHostelById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

export const useCreateHostel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hostelService.createHostel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.hostels() });
    },
  });
};

export const useUpdateHostel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Hostel> }) => 
      hostelService.updateHostel(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.hostelDetail(id) });
      queryClient.invalidateQueries({ queryKey: hostelKeys.hostels() });
    },
  });
};

export const useDeleteHostel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hostelService.deleteHostel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.hostels() });
    },
  });
};

// ============== ROOMS ==============

export const useRooms = (hostelId?: number) => {
  return useQuery({
    queryKey: hostelKeys.rooms(hostelId),
    queryFn: () => hostelService.getRooms(hostelId),
    select: (res) => res.data,
  });
};

export const useRoom = (id: number) => {
  return useQuery({
    queryKey: hostelKeys.roomDetail(id),
    queryFn: () => hostelService.getRoomById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

export const useAvailableRooms = (hostelId?: number) => {
  return useQuery({
    queryKey: hostelKeys.availableRooms(hostelId),
    queryFn: () => hostelService.getAvailableRooms(hostelId),
    select: (res) => res.data,
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hostelService.createRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.rooms() });
    },
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<HostelRoom> }) => 
      hostelService.updateRoom(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.roomDetail(id) });
      queryClient.invalidateQueries({ queryKey: hostelKeys.rooms() });
      queryClient.invalidateQueries({ queryKey: hostelKeys.availableRooms() });
    },
  });
};

export const useDeleteRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hostelService.deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.rooms() });
      queryClient.invalidateQueries({ queryKey: hostelKeys.availableRooms() });
    },
  });
};

// ============== ALLOCATIONS ==============

export const useAllocations = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: hostelKeys.allocations(filters),
    queryFn: () => hostelService.getAllocations(filters),
    select: (res) => ({ data: res.data, meta: res.meta }),
  });
};

export const useMyAllocation = () => {
  return useQuery({
    queryKey: hostelKeys.myAllocation(),
    queryFn: hostelService.getMyAllocation,
    select: (res) => res.data,
  });
};

export const useAllocateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, roomId }: { studentId: number; roomId: number }) => 
      hostelService.allocateRoom(studentId, roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.allocations() });
      queryClient.invalidateQueries({ queryKey: hostelKeys.availableRooms() });
    },
  });
};

export const useVacateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ allocationId, reason }: { allocationId: number; reason?: string }) => 
      hostelService.vacateRoom(allocationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.allocations() });
      queryClient.invalidateQueries({ queryKey: hostelKeys.myAllocation() });
      queryClient.invalidateQueries({ queryKey: hostelKeys.availableRooms() });
    },
  });
};

export const useTransferRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ allocationId, newRoomId }: { allocationId: number; newRoomId: number }) => 
      hostelService.transferRoom(allocationId, newRoomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.allocations() });
      queryClient.invalidateQueries({ queryKey: hostelKeys.myAllocation() });
      queryClient.invalidateQueries({ queryKey: hostelKeys.availableRooms() });
    },
  });
};

// ============== LEAVES ==============

export const useHostelLeaves = () => {
  return useQuery({
    queryKey: hostelKeys.leaves(),
    queryFn: hostelService.getLeaves,
    select: (res) => res.data,
  });
};

export const useMyHostelLeaves = () => {
  return useQuery({
    queryKey: hostelKeys.myLeaves(),
    queryFn: hostelService.getMyLeaves,
    select: (res) => res.data,
  });
};

export const useApplyHostelLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hostelService.applyLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.myLeaves() });
      queryClient.invalidateQueries({ queryKey: hostelKeys.leaves() });
    },
  });
};

export const useUpdateHostelLeaveStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leaveId, status, remarks }: { leaveId: number; status: string; remarks?: string }) => 
      hostelService.updateLeaveStatus(leaveId, status, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.leaves() });
      queryClient.invalidateQueries({ queryKey: hostelKeys.myLeaves() });
    },
  });
};

// ============== COMPLAINTS ==============

export const useHostelComplaints = () => {
  return useQuery({
    queryKey: hostelKeys.complaints(),
    queryFn: hostelService.getComplaints,
    select: (res) => res.data,
  });
};

export const useMyHostelComplaints = () => {
  return useQuery({
    queryKey: hostelKeys.myComplaints(),
    queryFn: hostelService.getMyComplaints,
    select: (res) => res.data,
  });
};

export const useSubmitComplaint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hostelService.submitComplaint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.myComplaints() });
      queryClient.invalidateQueries({ queryKey: hostelKeys.complaints() });
    },
  });
};

export const useUpdateComplaintStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ complaintId, status, resolution }: { complaintId: number; status: string; resolution?: string }) => 
      hostelService.updateComplaintStatus(complaintId, status, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.complaints() });
      queryClient.invalidateQueries({ queryKey: hostelKeys.myComplaints() });
    },
  });
};

// ============== VISITORS ==============

export const useVisitors = (studentId?: number) => {
  return useQuery({
    queryKey: hostelKeys.visitors(studentId),
    queryFn: () => hostelService.getVisitors(studentId),
    select: (res) => res.data,
  });
};

export const useRegisterVisitor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hostelService.registerVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.visitors() });
    },
  });
};

export const useCheckoutVisitor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hostelService.checkoutVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.visitors() });
    },
  });
};

// ============== MESS MENU ==============

export const useMessMenu = (hostelId?: number) => {
  return useQuery({
    queryKey: hostelKeys.messMenu(hostelId),
    queryFn: () => hostelService.getMessMenu(hostelId),
    select: (res) => res.data,
  });
};

export const useUpdateMessMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ menuId, data }: { menuId: number; data: Partial<MessMenu> }) => 
      hostelService.updateMessMenu(menuId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hostelKeys.messMenu() });
    },
  });
};

// ============== DASHBOARD ==============

export const useHostelDashboard = () => {
  return useQuery({
    queryKey: hostelKeys.dashboard(),
    queryFn: hostelService.getDashboard,
    select: (res) => res.data,
  });
};
