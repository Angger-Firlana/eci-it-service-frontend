import React from 'react';
import AtasanServiceDetail from '../../atasan/ServiceList/ServiceDetail';

const ServiceDetail = ({ onBack, requestId }) => {
  return (
    <AtasanServiceDetail
      variant="progress"
      requestId={requestId}
      onBack={onBack}
    />
  );
};

export default ServiceDetail;
