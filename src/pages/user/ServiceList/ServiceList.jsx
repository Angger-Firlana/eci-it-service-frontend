import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ServiceList.css';
import eyeIcon from '../../../assets/icons/lihatdetail(eye).svg';
import { authenticatedRequest } from '../../../lib/api';
import { useServiceCache } from '../../../contexts/ServiceCacheContext';

const ServiceList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [services, setServices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { updateCache } = useServiceCache();

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authenticatedRequest(
          `/service-requests?page=${currentPage}&per_page=10`
        );

        if (response.ok && response.data) {
          const data = response.data.data || response.data;
          const servicesData = Array.isArray(data) ? data : data.data || [];

          setServices(servicesData);

          if (data.pagination) {
            setPagination(data.pagination);
          } else if (data.meta) {
            setPagination({
              current_page: data.meta.current_page,
              last_page: data.meta.last_page,
              total: data.meta.total,
            });
          } else {
            setPagination({
              current_page: currentPage,
              last_page: currentPage,
              total: servicesData.length,
            });
          }

          updateCache(servicesData);
        } else {
          throw new Error('Failed to fetch services');
        }
      } catch (err) {
        console.error('Service list fetch error:', err);
        setError(err.message || 'Failed to load services');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, [currentPage, updateCache]);

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetail = (service) => {
    navigate(`/services/${service.id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day} / ${month} / ${year}`;
  };

  // Get device info from service request details
  const getDeviceInfo = (row) => {
    const firstDetail = row.service_request_details?.[0];
    return firstDetail?.device || {};
  };

  if (isLoading) {
    return (
      <div className="service-list-page">
        <div className="service-list-header">
          <h1>Service List</h1>
        </div>
        <div className="service-list-loading">Loading services...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="service-list-page">
        <div className="service-list-header">
          <h1>Service List</h1>
        </div>
        <div className="service-list-error">
          <p>Failed to load services: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="service-list-page">
      <div className="service-list-header">
        <h1>Service List</h1>
      </div>

      <div className="service-list-controls">
        <div className="search-box">
          <input type="text" placeholder="" aria-label="Search" />
          <i className="bi bi-search"></i>
        </div>

        <div className="filter-group">
          <button className="filter-btn" type="button">
            <i className="bi bi-calendar3"></i>
            <span>Date</span>
            <i className="bi bi-chevron-down"></i>
          </button>
          <button className="filter-btn" type="button">
            <i className="bi bi-funnel"></i>
            <span>Status</span>
            <i className="bi bi-chevron-down"></i>
          </button>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="service-list-empty">
          <p>No service requests found.</p>
        </div>
      ) : (
        <>
          <div className="service-table-card">
            <div className="service-table-row service-table-head">
              <div>No. Service</div>
              <div>Serial Number</div>
              <div>Jenis Service</div>
              <div>Tanggal</div>
              <div>Keterangan</div>
              <div>Status</div>
              <div></div>
            </div>

            {services.map((row) => {
              const deviceInfo = getDeviceInfo(row);
              const firstDetail = row.service_request_details?.[0];

              return (
                <div className="service-table-row" key={row.id}>
                  <div>{row.service_number || `SR-${row.id}`}</div>
                  <div>{deviceInfo.serial_number || '-'}</div>
                  <div>{row.service_type?.name || '-'}</div>
                  <div>
                    <div className="date-pill">
                      <span>{formatDate(row.created_at)}</span>
                      <i className="bi bi-calendar3"></i>
                    </div>
                  </div>
                  <div className="service-desc">{firstDetail?.complaint || '-'}</div>
                  <div className={`status-pill status-${(row.status?.name || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>
                    {row.status?.name || 'Pending'}
                  </div>
                  <div className="service-actions">
                    <button className="ellipsis-btn" type="button" aria-label="Menu">
                      ...
                    </button>
                    <button
                      className="detail-btn"
                      type="button"
                      onClick={() => handleViewDetail(row)}
                    >
                      <img src={eyeIcon} alt="Detail" />
                      Detail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {pagination && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="bi bi-chevron-left"></i>
                Prev
              </button>

              <span className="pagination-info">
                Page {pagination.current_page} of {pagination.last_page}
              </span>

              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pagination.last_page}
              >
                Next
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ServiceList;
