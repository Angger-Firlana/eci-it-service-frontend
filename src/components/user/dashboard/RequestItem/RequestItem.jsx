import React from 'react';
import './RequestItem.css';
import Badge from '../../../common/Badge/Badge';
import eyeIcon from '../../../../assets/icons/lihatdetail(eye).svg';
import { mapStatusVariant } from '../../../../lib/statusHelpers';

const RequestItem = ({ item, onViewDetails }) => {
  const statusVariant =
    item.statusVariant || mapStatusVariant(item.statusCode || item.status);

  return (
    <div className="request-item">
      {/* Background lane that reveals on hover */}
      <div className="eye-tile" aria-hidden="true"></div>

      {/* Eye button that appears on hover */}
      <button
        className="eye-btn"
        type="button"
        aria-label={`Lihat detail ${item.title}`}
        onClick={() => onViewDetails(item)}
      >
        <img src={eyeIcon} alt="view" className="eye-icon" />
      </button>

      {/* Main card */}
      <div className="request-card">
        <div className="req-left">
          <div className="wrench" aria-hidden="true">
            <i className="bi bi-wrench-adjustable"></i>
          </div>

          <div className="req-text">
            <p className="req-title">{item.title}</p>
            <p className="req-subtitle">{item.description}</p>
          </div>
        </div>

        <div className="req-right">
          <Badge label={item.status} variant={statusVariant} />
          <span className="date">{item.date}</span>
        </div>
      </div>
    </div>
  );
};

export default RequestItem;
