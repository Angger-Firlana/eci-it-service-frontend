import React from 'react';
import AtasanServiceDetail from '../../atasan/ServiceList/ServiceDetail';

const ServiceDetail = ({ onBack }) => {
  return <AtasanServiceDetail variant="progress" onBack={onBack} />;
};

export default ServiceDetail;
