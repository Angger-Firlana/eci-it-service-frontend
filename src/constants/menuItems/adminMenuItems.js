import dsbIcon from '../../assets/icons/dsb.svg';
import dsbSelectedIcon from '../../assets/icons/dsb_selected.svg';
import makeIcon from '../../assets/icons/make.svg';
import makeSelectedIcon from '../../assets/icons/make_selected.svg';
import listIcon from '../../assets/icons/list.svg';
import listSelectedIcon from '../../assets/icons/list_selected.svg';
import kalenderIcon from '../../assets/icons/kalender.svg';
import kalenderSelectedIcon from '../../assets/icons/kalender_selected.svg';
import inboxIcon from '../../assets/icons/inbox.svg';
import inboxSelectedIcon from '../../assets/icons/inbox_selected.svg';
import kelolaUserIcon from '../../assets/icons/kelola_user.svg';
import kelolaUserSelectedIcon from '../../assets/icons/kelola_user_selected.svg';
import masterDataIcon from '../../assets/icons/master_data.svg';
import masterDataSelectedIcon from '../../assets/icons/master_data_selected.svg';

export const ADMIN_MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: dsbIcon,
    iconActive: dsbSelectedIcon,
    route: '/dashboard',
  },
  {
    id: 'create-request',
    label: 'Buat Request',
    icon: makeIcon,
    iconActive: makeSelectedIcon,
    route: '/service-requests/new',
  },
  {
    id: 'service-list',
    label: 'Service List',
    icon: listIcon,
    iconActive: listSelectedIcon,
    route: '/service-requests',
  },
  {
    id: 'inbox',
    label: 'Inbox',
    icon: inboxIcon,
    iconActive: inboxSelectedIcon,
    route: '/inbox',
    badge: '2',
  },
  {
    id: 'calendar',
    label: 'Kalender',
    icon: kalenderIcon,
    iconActive: kalenderSelectedIcon,
    route: '/calendar',
  },
  {
    id: 'master-section',
    label: 'Master Data',
    type: 'section',
  },
  {
    id: 'manage-users',
    label: 'Kelola User',
    icon: kelolaUserIcon,
    iconActive: kelolaUserSelectedIcon,
    route: '/users',
  },
  {
    id: 'master-data',
    label: 'Master Data',
    icon: masterDataIcon,
    iconActive: masterDataSelectedIcon,
    route: '/master-data',
  },
];
