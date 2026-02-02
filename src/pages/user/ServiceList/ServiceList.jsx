import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ServiceList.css';
import eyeIcon from '../../../assets/icons/lihatdetail(eye).svg';
import { authenticatedRequest } from '../../../lib/api';
import { useServiceCache } from '../../../contexts/ServiceCacheContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getServiceRequestDetailCached } from '../../../lib/serviceRequestCache';
import { PageHeader, SearchBox, TablePagination } from '../../../components/ui';

const ServiceList = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [services, setServices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { serviceListCache, serviceListMeta, updateCache, isCacheValid } = useServiceCache();

  useEffect(() => {
    const needsDetailFetch = (item) => {
      const firstDetail = item.service_request_details?.[0];
      return !firstDetail || !firstDetail.service_type;
    };

    const enrichServices = async (items) => {
      const enriched = await Promise.all(
        items.map(async (item) => {
          if (!needsDetailFetch(item)) {
            return item;
          }

          try {
            return await getServiceRequestDetailCached(item.id);
          } catch (err) {
            console.error('Service detail fetch error:', err);
          }

          return item;
        })
      );

      return enriched;
    };

    const fetchServices = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const userId = user?.id;
        const userFilter = userId ? `&user_id=${userId}` : '';
        const response = await authenticatedRequest(
          `/service-requests?page=${currentPage}&per_page=10${userFilter}`
        );

        if (response.ok && response.data) {
          const data = response.data.data || response.data;
          const servicesData = Array.isArray(data) ? data : data.data || [];
          const paginationData = data.pagination
            ? data.pagination
            : data.meta
            ? {
                current_page: data.meta.current_page,
                last_page: data.meta.last_page,
                total: data.meta.total,
              }
            : {
                current_page: currentPage,
                last_page: currentPage,
                total: servicesData.length,
              };

          const enrichedServices = await enrichServices(servicesData);
          setServices(enrichedServices);
          setPagination(paginationData);
          if (currentPage === 1) {
            updateCache(enrichedServices, paginationData);
          }
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

    if (currentPage === 1 && isCacheValid() && Array.isArray(serviceListCache)) {
      setServices(serviceListCache);
      setPagination(
        serviceListMeta || {
          current_page: currentPage,
          last_page: currentPage,
          total: serviceListCache.length,
        }
      );
      setIsLoading(false);

      if (serviceListCache.some(needsDetailFetch)) {
        enrichServices(serviceListCache).then((enrichedServices) => {
          setServices(enrichedServices);
          updateCache(enrichedServices, serviceListMeta);
        });
      }
      return;
    }

    fetchServices();
  }, [currentPage, isCacheValid, serviceListCache, serviceListMeta, updateCache, user?.id]);

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
        <PageHeader className="service-list-header" title="Service List" />
        <div className="service-list-loading">Loading services...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="service-list-page">
        <PageHeader className="service-list-header" title="Service List" />
        <div className="service-list-error">
          <p>Failed to load services: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="service-list-page">
      <PageHeader className="service-list-header" title="Service List" />

      <div className="service-list-controls">
        <SearchBox className="search-box" placeholder="" ariaLabel="Search" />

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
                  <div data-label="No. Service">{row.service_number || `SR-${row.id}`}</div>
                  <div data-label="Serial Number">{deviceInfo.serial_number || '-'}</div>
                  <div data-label="Jenis Service">{firstDetail?.service_type?.name || row.service_type?.name || '-'}</div>
                  <div data-label="Tanggal">
                    <div className="date-pill">
                      <span>{formatDate(row.request_date || row.created_at)}</span>
                      <i className="bi bi-calendar3"></i>
                    </div>
                  </div>
                  <div className="service-desc" data-label="Keterangan">{firstDetail?.complaint || '-'}</div>
                  <div
                    data-label="Status"
                    className={`status-pill status-${(row.status?.name || 'pending')
                      .toLowerCase()
                      .replace(/\s+/g, '-')}`}
                  >
                    {row.status?.name || 'Pending'}
                  </div>
                  <div className="service-actions" data-label="Aksi">
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
            <TablePagination
              wrapperClassName="pagination"
              buttonClassName="pagination-btn"
              infoClassName="pagination-info"
              currentPage={pagination.current_page}
              totalPages={pagination.last_page}
              onPrev={() => handlePageChange(currentPage - 1)}
              onNext={() => handlePageChange(currentPage + 1)}
              disablePrev={currentPage === 1}
              disableNext={currentPage >= pagination.last_page}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ServiceList;
