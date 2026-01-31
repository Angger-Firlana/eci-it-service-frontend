import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authenticatedRequest, unwrapApiData } from '../lib/api';

// Query keys factory
export const masterDataKeys = {
  all: ['masterData'],
  deviceTypes: () => [...masterDataKeys.all, 'deviceTypes'],
  deviceModels: () => [...masterDataKeys.all, 'deviceModels'],
  serviceTypes: () => [...masterDataKeys.all, 'serviceTypes'],
  vendors: () => [...masterDataKeys.all, 'vendors'],
  departments: () => [...masterDataKeys.all, 'departments'],
  statuses: (entityTypeId) => [...masterDataKeys.all, 'statuses', entityTypeId],
};

// Helper to get error message from API response
const getErrorMessage = (payload) => {
  if (!payload) return 'Request failed';
  if (typeof payload === 'string') return payload;
  if (payload.message) return payload.message;
  if (payload.errors) {
    try {
      return Object.entries(payload.errors)
        .map(([key, msgs]) => `${key}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
        .join('\n');
    } catch {
      return 'Validation error';
    }
  }
  return 'Request failed';
};

// ============ DEVICE TYPES ============

export function useDeviceTypes({ enabled = true } = {}) {
  return useQuery({
    queryKey: masterDataKeys.deviceTypes(),
    queryFn: async () => {
      const response = await authenticatedRequest('/device-type');
      if (!response.ok || response.data?.success === false) {
        throw new Error(getErrorMessage(response.data));
      }
      const payload = unwrapApiData(response.data);
      return Array.isArray(payload) ? payload : [];
    },
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour for master data
  });
}

export function useCreateDeviceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }) => {
      const response = await authenticatedRequest('/device-type', {
        method: 'POST',
        body: { name },
      });
      if (!response.ok || response.data?.success === false) {
        throw new Error(getErrorMessage(response.data));
      }
      return unwrapApiData(response.data);
    },
    // Optimistic update
    onMutate: async ({ name }) => {
      await queryClient.cancelQueries({ queryKey: masterDataKeys.deviceTypes() });
      const previousData = queryClient.getQueryData(masterDataKeys.deviceTypes());

      const optimisticItem = { id: `temp-${Date.now()}`, name, __optimistic: true };
      queryClient.setQueryData(masterDataKeys.deviceTypes(), (old) =>
        old ? [optimisticItem, ...old] : [optimisticItem]
      );

      return { previousData, optimisticItem };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(masterDataKeys.deviceTypes(), context.previousData);
      }
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic item with real data
      queryClient.setQueryData(masterDataKeys.deviceTypes(), (old) =>
        old?.map((item) => (item.id === context?.optimisticItem?.id ? data : item)) || [data]
      );
    },
  });
}

export function useUpdateDeviceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }) => {
      const response = await authenticatedRequest(`/device-type/${id}`, {
        method: 'PUT',
        body: { name },
      });
      if (!response.ok || response.data?.success === false) {
        throw new Error(getErrorMessage(response.data));
      }
      return unwrapApiData(response.data) || { id, name };
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(masterDataKeys.deviceTypes(), (old) =>
        old?.map((item) => (item.id === variables.id ? { ...item, ...data } : item))
      );
    },
  });
}

export function useDeleteDeviceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await authenticatedRequest(`/device-type/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok || response.data?.success === false) {
        throw new Error(getErrorMessage(response.data));
      }
      return id;
    },
    // Optimistic delete
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: masterDataKeys.deviceTypes() });
      const previousData = queryClient.getQueryData(masterDataKeys.deviceTypes());

      queryClient.setQueryData(masterDataKeys.deviceTypes(), (old) =>
        old?.filter((item) => item.id !== id)
      );

      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(masterDataKeys.deviceTypes(), context.previousData);
      }
    },
  });
}

// ============ DEVICE MODELS ============

export function useDeviceModels({ enabled = true } = {}) {
  return useQuery({
    queryKey: masterDataKeys.deviceModels(),
    queryFn: async () => {
      const response = await authenticatedRequest('/device-model');
      if (!response.ok || response.data?.success === false) {
        throw new Error(getErrorMessage(response.data));
      }
      const payload = unwrapApiData(response.data);
      return Array.isArray(payload) ? payload : [];
    },
    enabled,
    staleTime: 60 * 60 * 1000,
  });
}

export function useCreateDeviceModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ device_type_id, brand, model }) => {
      const response = await authenticatedRequest('/device-model', {
        method: 'POST',
        body: { device_type_id, brand, model },
      });
      if (!response.ok || response.data?.success === false) {
        throw new Error(getErrorMessage(response.data));
      }
      return unwrapApiData(response.data);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: masterDataKeys.deviceModels() });
      const previousData = queryClient.getQueryData(masterDataKeys.deviceModels());

      const optimisticItem = { id: `temp-${Date.now()}`, ...variables, __optimistic: true };
      queryClient.setQueryData(masterDataKeys.deviceModels(), (old) =>
        old ? [optimisticItem, ...old] : [optimisticItem]
      );

      return { previousData, optimisticItem };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(masterDataKeys.deviceModels(), context.previousData);
      }
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(masterDataKeys.deviceModels(), (old) =>
        old?.map((item) => (item.id === context?.optimisticItem?.id ? data : item)) || [data]
      );
    },
  });
}

export function useUpdateDeviceModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, device_type_id, brand, model }) => {
      const response = await authenticatedRequest(`/device-model/${id}`, {
        method: 'PUT',
        body: { device_type_id, brand, model },
      });
      if (!response.ok || response.data?.success === false) {
        throw new Error(getErrorMessage(response.data));
      }
      return unwrapApiData(response.data) || { id, device_type_id, brand, model };
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(masterDataKeys.deviceModels(), (old) =>
        old?.map((item) => (item.id === variables.id ? { ...item, ...data } : item))
      );
    },
  });
}

export function useDeleteDeviceModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await authenticatedRequest(`/device-model/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok || response.data?.success === false) {
        throw new Error(getErrorMessage(response.data));
      }
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: masterDataKeys.deviceModels() });
      const previousData = queryClient.getQueryData(masterDataKeys.deviceModels());

      queryClient.setQueryData(masterDataKeys.deviceModels(), (old) =>
        old?.filter((item) => item.id !== id)
      );

      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(masterDataKeys.deviceModels(), context.previousData);
      }
    },
  });
}

// ============ SERVICE TYPES ============

export function useServiceTypes({ enabled = true } = {}) {
  return useQuery({
    queryKey: masterDataKeys.serviceTypes(),
    queryFn: async () => {
      const response = await authenticatedRequest('/references/service-types');
      if (!response.ok || response.data?.success === false) {
        throw new Error(getErrorMessage(response.data));
      }
      const payload = unwrapApiData(response.data);
      return Array.isArray(payload) ? payload : [];
    },
    enabled,
    staleTime: 60 * 60 * 1000,
  });
}

export function useCreateServiceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name }) => {
      const response = await authenticatedRequest('/references/service-types', {
        method: 'POST',
        body: { name },
      });
      if (!response.ok || response.data?.success === false) {
        throw new Error(getErrorMessage(response.data));
      }
      return unwrapApiData(response.data);
    },
    onMutate: async ({ name }) => {
      await queryClient.cancelQueries({ queryKey: masterDataKeys.serviceTypes() });
      const previousData = queryClient.getQueryData(masterDataKeys.serviceTypes());

      const optimisticItem = { id: `temp-${Date.now()}`, name, __optimistic: true };
      queryClient.setQueryData(masterDataKeys.serviceTypes(), (old) =>
        old ? [optimisticItem, ...old] : [optimisticItem]
      );

      return { previousData, optimisticItem };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(masterDataKeys.serviceTypes(), context.previousData);
      }
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(masterDataKeys.serviceTypes(), (old) =>
        old?.map((item) => (item.id === context?.optimisticItem?.id ? data : item)) || [data]
      );
    },
  });
}

// ============ VENDORS ============

export function useVendors({ enabled = true } = {}) {
  return useQuery({
    queryKey: masterDataKeys.vendors(),
    queryFn: async () => {
      const response = await authenticatedRequest('/vendors?per_page=200');
      if (!response.ok) {
        throw new Error(getErrorMessage(response.data));
      }
      return Array.isArray(response.data?.data) ? response.data.data : [];
    },
    enabled,
    staleTime: 60 * 60 * 1000,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, maps_url, description }) => {
      const response = await authenticatedRequest('/vendors', {
        method: 'POST',
        body: { name, maps_url, description },
      });
      if (!response.ok) {
        throw new Error(getErrorMessage(response.data));
      }
      return response.data;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: masterDataKeys.vendors() });
      const previousData = queryClient.getQueryData(masterDataKeys.vendors());

      const optimisticItem = { id: `temp-${Date.now()}`, ...variables, __optimistic: true };
      queryClient.setQueryData(masterDataKeys.vendors(), (old) =>
        old ? [optimisticItem, ...old] : [optimisticItem]
      );

      return { previousData, optimisticItem };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(masterDataKeys.vendors(), context.previousData);
      }
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(masterDataKeys.vendors(), (old) =>
        old?.map((item) => (item.id === context?.optimisticItem?.id ? data : item)) || [data]
      );
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, maps_url, description }) => {
      const response = await authenticatedRequest(`/vendors/${id}`, {
        method: 'PUT',
        body: { name, maps_url, description },
      });
      if (!response.ok) {
        throw new Error(getErrorMessage(response.data));
      }
      return response.data || { id, name, maps_url, description };
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(masterDataKeys.vendors(), (old) =>
        old?.map((item) => (item.id === variables.id ? { ...item, ...data } : item))
      );
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await authenticatedRequest(`/vendors/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(getErrorMessage(response.data));
      }
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: masterDataKeys.vendors() });
      const previousData = queryClient.getQueryData(masterDataKeys.vendors());

      queryClient.setQueryData(masterDataKeys.vendors(), (old) =>
        old?.filter((item) => item.id !== id)
      );

      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(masterDataKeys.vendors(), context.previousData);
      }
    },
  });
}

// ============ DEPARTMENTS ============

export function useDepartments({ enabled = true } = {}) {
  return useQuery({
    queryKey: masterDataKeys.departments(),
    queryFn: async () => {
      const response = await authenticatedRequest('/departments?per_page=200');
      if (!response.ok || response.data?.success === false) {
        throw new Error(getErrorMessage(response.data));
      }
      const payload = unwrapApiData(response.data);
      return Array.isArray(payload) ? payload : [];
    },
    enabled,
    staleTime: 60 * 60 * 1000,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, code }) => {
      const response = await authenticatedRequest('/departments', {
        method: 'POST',
        body: { name, code },
      });
      if (!response.ok || response.data?.success === false) {
        throw new Error(getErrorMessage(response.data));
      }
      return unwrapApiData(response.data);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: masterDataKeys.departments() });
      const previousData = queryClient.getQueryData(masterDataKeys.departments());

      const optimisticItem = { id: `temp-${Date.now()}`, ...variables, __optimistic: true };
      queryClient.setQueryData(masterDataKeys.departments(), (old) =>
        old ? [optimisticItem, ...old] : [optimisticItem]
      );

      return { previousData, optimisticItem };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(masterDataKeys.departments(), context.previousData);
      }
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(masterDataKeys.departments(), (old) =>
        old?.map((item) => (item.id === context?.optimisticItem?.id ? data : item)) || [data]
      );
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, code }) => {
      const response = await authenticatedRequest(`/departments/${id}`, {
        method: 'PUT',
        body: { name, code },
      });
      if (!response.ok || response.data?.success === false) {
        throw new Error(getErrorMessage(response.data));
      }
      return unwrapApiData(response.data) || { id, name, code };
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(masterDataKeys.departments(), (old) =>
        old?.map((item) => (item.id === variables.id ? { ...item, ...data } : item))
      );
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await authenticatedRequest(`/departments/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok || response.data?.success === false) {
        throw new Error(getErrorMessage(response.data));
      }
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: masterDataKeys.departments() });
      const previousData = queryClient.getQueryData(masterDataKeys.departments());

      queryClient.setQueryData(masterDataKeys.departments(), (old) =>
        old?.filter((item) => item.id !== id)
      );

      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(masterDataKeys.departments(), context.previousData);
      }
    },
  });
}

// ============ STATUSES ============

export function useStatuses(entityTypeId, { enabled = true } = {}) {
  return useQuery({
    queryKey: masterDataKeys.statuses(entityTypeId),
    queryFn: async () => {
      const queryParams = entityTypeId ? `?entity_type_id=${entityTypeId}` : '';
      const response = await authenticatedRequest(`/references/statuses${queryParams}`);
      if (!response.ok || response.data?.success === false) {
        throw new Error(getErrorMessage(response.data));
      }
      const payload = unwrapApiData(response.data);
      const list = Array.isArray(payload) ? payload : [];

      // Build lookup maps
      const byId = new Map();
      const byCode = new Map();
      for (const status of list) {
        byId.set(status.id, status);
        if (status.code) byCode.set(status.code, status);
      }

      return { list, byId, byCode };
    },
    enabled,
    staleTime: 60 * 60 * 1000,
  });
}
