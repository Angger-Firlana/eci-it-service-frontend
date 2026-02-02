import React from 'react';

const SearchBox = ({
  className = '',
  inputClassName = '',
  iconClassName = '',
  placeholder = '',
  value,
  onChange,
  onSearch,
  ariaLabel = 'Search',
  disabled = false,
}) => {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && onSearch) {
      onSearch();
    }
  };

  const iconProps = onSearch
    ? {
        role: 'button',
        tabIndex: 0,
        onClick: onSearch,
        onKeyDown: (event) => {
          if (event.key === 'Enter') onSearch();
        },
      }
    : {};

  return (
    <div className={className}>
      <input
        className={inputClassName}
        type="text"
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <i className={`bi bi-search ${iconClassName}`.trim()} {...iconProps}></i>
    </div>
  );
};

export default SearchBox;
