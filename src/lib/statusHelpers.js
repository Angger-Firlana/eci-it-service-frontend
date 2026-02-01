const groupByEntityType = (statuses = []) =>
  statuses.reduce((acc, status) => {
    const key = String(status.entity_type_id || '');
    if (!acc[key]) acc[key] = [];
    acc[key].push(status);
    return acc;
  }, {});

export const findEntityTypeIdByCodes = (statuses, codes) => {
  const groups = groupByEntityType(statuses);
  const targetCodes = codes.map((code) => String(code).toUpperCase());

  return Object.values(groups).find((items) => {
    const available = items.map((item) => String(item.code || '').toUpperCase());
    return targetCodes.every((code) => available.includes(code));
  })?.[0]?.entity_type_id;
};

export const getServiceRequestEntityTypeId = (statuses) =>
  findEntityTypeIdByCodes(statuses, [
    'IN_REVIEW_ADMIN',
    'APPROVED_BY_ADMIN',
    'IN_PROGRESS',
  ]);

export const getVendorApprovalEntityTypeId = (statuses) =>
  findEntityTypeIdByCodes(statuses, ['APPROVED', 'REJECTED', 'PENDING']);

export const getInvoiceEntityTypeId = (statuses) =>
  findEntityTypeIdByCodes(statuses, ['DRAFT', 'SENT', 'PAID']);

export const getStatusByCode = (statuses, entityTypeId, code) => {
  if (!entityTypeId) return null;
  const targetCode = String(code || '').toUpperCase();
  return (
    statuses || []
  ).find(
    (status) =>
      status.entity_type_id === entityTypeId &&
      String(status.code || '').toUpperCase() === targetCode
  );
};

export const mapStatusVariant = (statusCode = '') => {
  const code = String(statusCode).toUpperCase();
  if (['PENDING', 'IN_REVIEW_ADMIN', 'IN_REVIEW_ABOVE', 'IN_REVIEW_VENDOR'].includes(code)) {
    return 'waiting';
  }
  if (['IN_PROGRESS', 'APPROVED_BY_ADMIN', 'APPROVED_BY_ABOVE', 'APPROVED_BY_VENDOR'].includes(code)) {
    return 'process';
  }
  if (['COMPLETED'].includes(code)) {
    return 'completed';
  }
  if (['REJECTED', 'CANCELLED'].includes(code)) {
    return 'rejected';
  }
  return 'default';
};
