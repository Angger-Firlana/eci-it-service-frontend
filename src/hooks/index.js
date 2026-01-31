// Service Request hooks
export {
  serviceRequestKeys,
  useServiceRequests,
  useServiceRequestDetail,
  useCalendarServices,
  useInboxRequests,
  useCreateServiceRequest,
  useUpdateServiceRequestStatus,
  useSubmitApproval,
} from './useServiceRequests';

// Master Data hooks
export {
  masterDataKeys,
  useDeviceTypes,
  useCreateDeviceType,
  useUpdateDeviceType,
  useDeleteDeviceType,
  useDeviceModels,
  useCreateDeviceModel,
  useUpdateDeviceModel,
  useDeleteDeviceModel,
  useServiceTypes,
  useCreateServiceType,
  useVendors,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useStatuses,
} from './useMasterData';
