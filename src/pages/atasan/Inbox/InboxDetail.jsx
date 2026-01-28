import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AtasanServiceDetail from '../ServiceList/ServiceDetail';

const InboxDetail = ({ onBack } = {}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('variant') || 'approval';

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate('/inbox');
  };

  return <AtasanServiceDetail variant={variant} onBack={handleBack} />;
};

export default InboxDetail;
