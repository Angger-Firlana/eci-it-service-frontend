import dsbIcon from '../../assets/icons/dsb.svg';
import dsbSelectedIcon from '../../assets/icons/dsb_selected.svg';
import listIcon from '../../assets/icons/list.svg';
import listSelectedIcon from '../../assets/icons/list_selected.svg';
import kalenderIcon from '../../assets/icons/kalender.svg';
import kalenderSelectedIcon from '../../assets/icons/kalender_selected.svg';
import inboxIcon from '../../assets/icons/inbox.svg';
import inboxSelectedIcon from '../../assets/icons/inbox_selected.svg';

export const ATASAN_MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: dsbIcon,
    iconActive: dsbSelectedIcon,
    route: '/dashboard',
  },
  {
    id: 'service-list',
    label: 'Service List',
    icon: listIcon,
    iconActive: listSelectedIcon,
    route: '/service-list',
  },
  {
    id: 'calendar',
    label: 'Kalender',
    icon: kalenderIcon,
    iconActive: kalenderSelectedIcon,
    route: '/calendar',
  },
  {
    id: 'inbox',
    label: 'Inbox',
    icon: inboxIcon,
    iconActive: inboxSelectedIcon,
    route: '/inbox',
  },
];
