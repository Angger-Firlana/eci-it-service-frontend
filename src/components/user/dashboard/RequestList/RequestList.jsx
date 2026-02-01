import React from 'react';
import './RequestList.css';
import RequestItem from '../RequestItem';

const RequestList = ({
  requests,
  onViewAll,
  onViewDetails,
  title = 'Request Terbaru',
  viewAllLabel = 'Lihat Semua',
  emptyMessage = 'Belum ada request',
  hideWhenEmpty = false,
}) => {
  const hasRequests = Array.isArray(requests) && requests.length > 0;

  // If hideWhenEmpty is true and there are no requests, don't render anything
  if (hideWhenEmpty && !hasRequests) {
    return null;
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div className="title">{title}</div>
        <a href="#" onClick={(e) => {e.preventDefault(); onViewAll();}}>
          {viewAllLabel}
        </a>
      </div>

      <div className="request-list">
        {hasRequests ? (
          requests.map((request) => (
            <RequestItem
              key={request.id}
              item={request}
              onViewDetails={onViewDetails}
            />
          ))
        ) : (
          <div className="request-list-empty">{emptyMessage}</div>
        )}
      </div>
    </section>
  );
};

export default RequestList;
