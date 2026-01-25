export const getPrimaryDetail = (serviceRequest) =>
  serviceRequest?.service_request_details?.[0] || null;

export const findDeviceModel = (deviceModels, deviceModelId) =>
  (deviceModels || []).find((model) => model.id === deviceModelId) || null;

export const findDeviceType = (deviceTypes, deviceTypeId) =>
  (deviceTypes || []).find((type) => type.id === deviceTypeId) || null;

export const getDeviceSummary = ({ detail, deviceModels, deviceTypes }) => {
  const device = detail?.device || null;
  const deviceModel = findDeviceModel(deviceModels, device?.device_model_id);
  const deviceType = findDeviceType(deviceTypes, deviceModel?.device_type_id);

  return {
    deviceTypeName: deviceType?.name || '-',
    brand: deviceModel?.brand || '-',
    model: deviceModel?.model || '-',
    serialNumber: device?.serial_number || '-',
  };
};

export const buildRequestTitle = ({ detail, deviceModels, deviceTypes }) => {
  const { deviceTypeName, model } = getDeviceSummary({
    detail,
    deviceModels,
    deviceTypes,
  });
  return `${deviceTypeName} - ${model}`;
};
