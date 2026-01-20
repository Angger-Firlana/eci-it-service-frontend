import dsbIcon from '../assets/icons/dsb.svg';
import dsbSelectedIcon from '../assets/icons/dsb_selected.svg';
import makeIcon from '../assets/icons/make.svg';
import makeSelectedIcon from '../assets/icons/make_selected.svg';
import listIcon from '../assets/icons/list.svg';
import listSelectedIcon from '../assets/icons/list_selected.svg';
import kalenderIcon from '../assets/icons/kalender.svg';
import kalenderSelectedIcon from '../assets/icons/kalender_selected.svg';

export const USER_MENU_ITEMS = [
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
    route: '/create-request',
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
];
