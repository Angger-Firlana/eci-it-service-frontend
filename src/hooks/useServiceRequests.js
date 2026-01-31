import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authenticatedRequest, unwrapApiData } from '../lib/api';

// Query keys factory for consistent key management
export const serviceRequestKeys = {
  all: ['serviceRequests'],
  lists: () => [...serviceRequestKeys.all, 'list'],
  list: (filters) => [...serviceRequestKeys.lists(), filters],
  details: () => [...serviceRequestKeys.all, 'detail'],
  detail: (id) => [...serviceRequestKeys.details(), id],
  calendar: (userId) => [...serviceRequestKeys.all, 'calendar', userId],
  inbox: (statusIds) => [...serviceRequestKeys.all, 'inbox', statusIds],
};

// Helper to normalize API response
const normalizeListResponse = (response) => {
  if (!response.ok) {
    throw new Error(response.data?.message || 'Failed to fetch service requests');
  }

  const payload = response.data;
  const data = payload?.data || payload;
  const items = Array.isArray(data) ? data : data?.data || [];

  const pagination = data?.pagination || data?.meta || payload?.meta || {
    current_page: 1,
    last_page: 1,
    total: items.length,
  };

  return { items, pagination };
};

/**
 * Fetch paginated service requests
 * @param {Object} options
 * @param {number} options.page - Page number
 * @param {number} options.perPage - Items per page
 * @param {string} options.userId - Filter by user ID
 * @param {string} options.adminId - Filter by admin ID
 * @param {string} options.statusId - Filter by status ID
 */
export function useServiceRequests({
  page = 1,
  perPage = 10,
  userId,
  adminId,
  statusId,
  enabled = true,
} = {}) {
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('per_page', String(perPage));
  if (userId) queryParams.set('user_id', String(userId));
  if (adminId) queryParams.set('admin_id', String(adminId));
  if (statusId) queryParams.set('status_id', String(statusId));

  return useQuery({
    queryKey: serviceRequestKeys.list({ page, perPage, userId, adminId, statusId }),
    queryFn: async () => {
      const response = await authenticatedRequest(`/service-requests?${queryParams}`);
      return normalizeListResponse(response);
    },
    enabled,
    placeholderData: (previousData) => previousData, // Keep previous data while loading new page
  });
}

/**
 * Fetch a single service request by ID
 */
export function useServiceRequestDetail(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: serviceRequestKeys.detail(id),
    queryFn: async () => {
      if (!id) throw new Error('Service request ID is required');

      const response = await authenticatedRequest(`/service-requests/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Service request not found');
        }
        throw new Error(response.data?.message || 'Failed to fetch service request');
      }

      const data = response.data?.data || response.data;

      // Transform approvals to timeline format if no timeline exists
      let timeline = data.timeline || [];
      if (!timeline.length && data.service_request_approvals?.length) {
        timeline = data.service_request_approvals.map((approval) => ({
          id: approval.id,
          label: approval.status?.name || 'Status Update',
          status: approval.status?.name,
          date: approval.created_at,
          created_at: approval.created_at,
          note: approval.remarks || '-',
          description: approval.remarks || '-',
          state: 'active',
        }));
      }

      return { ...data, timeline };
    },
    enabled: enabled && !!id,
    staleTime: 30 * 1000, // 30 seconds for detail views
  });
}

/**
 * Fetch service requests for calendar view
 */
export function useCalendarServices(userId, { enabled = true } = {}) {
  return useQuery({
    queryKey: serviceRequestKeys.calendar(userId),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.set('per_page', '100');
      if (userId) queryParams.set('user_id', String(userId));

      const response = await authenticatedRequest(`/service-requests?${queryParams}`);
      const { items } = normalizeListResponse(response);
      return items;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch inbox items (multiple status IDs)
 */
export function useInboxRequests(statusIds, { enabled = true } = {}) {
  return useQuery({
    queryKey: serviceRequestKeys.inbox(statusIds),
    queryFn: async () => {
      if (!statusIds?.length) return [];

      const requests = statusIds.map((id) =>
        authenticatedRequest(`/service-requests?status_id=${id}&per_page=30`)
      );

      const responses = await Promise.all(requests);
      const seen = new Set();
      const items = [];

      for (const res of responses) {
        if (!res.ok) continue;
        const { items: resItems } = normalizeListResponse({ ok: true, data: res.data });
        for (const item of resItems) {
          if (!item?.id || seen.has(item.id)) continue;
          seen.add(item.id);
          items.push(item);
        }
      }

      // Sort by newest first
      items.sort((a, b) => {
        const aTime = new Date(a?.created_at || a?.request_date || 0).getTime();
        const bTime = new Date(b?.created_at || b?.request_date || 0).getTime();
        return bTime - aTime;
      });

      return items;
    },
    enabled: enabled && !!statusIds?.length,
  });
}

/**
 * Create a new service request
 */
export function useCreateServiceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      const response = await authenticatedRequest('/service-requests', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = response.data?.message || 'Failed to create service request';
        if (response.data?.errors) {
          const errors = response.data.errors;
          const errorList = Object.entries(errors).map(([field, msgs]) => {
            return `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
          });
          errorMsg = errorList.join('\n');
        }
        throw new Error(errorMsg);
      }

      return response.data?.data || response.data;
    },
    onSuccess: () => {
      // Invalidate all service request lists to refetch fresh data
      queryClient.invalidateQueries({ queryKey: serviceRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceRequestKeys.all });
    },
  });
}

/**
 * Update service request status (approve/reject)
 */
export function useUpdateServiceRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, statusId, remarks }) => {
      const response = await authenticatedRequest(`/service-requests/${id}/status`, {
        method: 'PUT',
        body: { status_id: statusId, remarks },
      });

      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to update status');
      }

      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      // Update the detail cache
      queryClient.setQueryData(serviceRequestKeys.detail(variables.id), (old) =>
        old ? { ...old, ...data } : data
      );
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: serviceRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceRequestKeys.inbox() });
    },
  });
}

/**
 * Submit approval action (approve/reject/revision)
 */
export function useSubmitApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceRequestId, statusId, remarks, approverType }) => {
      const response = await authenticatedRequest('/service-request-approvals', {
        method: 'POST',
        body: {
          service_request_id: serviceRequestId,
          status_id: statusId,
          remarks,
          approver_type: approverType,
        },
      });

      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to submit approval');
      }

      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: serviceRequestKeys.detail(variables.serviceRequestId),
      });
      queryClient.invalidateQueries({ queryKey: serviceRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceRequestKeys.inbox() });
    },
  });
}
