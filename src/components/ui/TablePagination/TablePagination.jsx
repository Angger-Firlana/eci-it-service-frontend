import React from 'react';

const TablePagination = ({
  wrapperClassName = '',
  buttonClassName = '',
  infoClassName = '',
  currentPage,
  totalPages,
  onPrev,
  onNext,
  prevLabel = 'Prev',
  nextLabel = 'Next',
  disablePrev,
  disableNext,
}) => {
  return (
    <div className={wrapperClassName}>
      <button
        className={buttonClassName}
        onClick={onPrev}
        disabled={disablePrev}
        type="button"
      >
        <i className="bi bi-chevron-left"></i>
        {prevLabel}
      </button>

      <span className={infoClassName}>
        Page {currentPage} of {totalPages}
      </span>

      <button
        className={buttonClassName}
        onClick={onNext}
        disabled={disableNext}
        type="button"
      >
        {nextLabel}
        <i className="bi bi-chevron-right"></i>
      </button>
    </div>
  );
};

export default TablePagination;
