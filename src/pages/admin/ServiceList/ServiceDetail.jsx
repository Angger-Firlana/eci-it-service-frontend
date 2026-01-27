import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminInboxDetail from '../Inbox/InboxDetail';

const ServiceDetail = ({ onBack }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('variant') || 'approval';
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate('/services');
  };

  return <AdminInboxDetail variant={variant} onBack={handleBack} />;
};

export default ServiceDetail;
