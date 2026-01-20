import React from 'react';
import './RequestList.css';
import RequestItem from '../RequestItem';

const RequestList = ({ requests, onViewAll, onViewDetails }) => {
  return (
    <section className="panel">
      <div className="panel-head">
        <div className="title">Request Terbaru</div>
        <a href="#" onClick={(e) => {e.preventDefault(); onViewAll();}}>
          Lihat Semua
        </a>
      </div>

      <div className="request-list">
        {requests.map((request) => (
          <RequestItem
            key={request.id}
            item={request}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </section>
  );
};

export default RequestList;
