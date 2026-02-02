// assets
import { DashboardOutlined, ReadOutlined } from '@ant-design/icons';

// icons
const icons = {
  DashboardOutlined,
  ReadOutlined
};

// ==============================|| MENU ITEMS - DASHBOARD ||============================== //

const dashboard = {
  id: 'group-dashboard',
  title: 'Navigation',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/dashboard/default',
      icon: icons.DashboardOutlined,
      breadcrumbs: false
    },
    // Bedtime Stories
    {
      id: 'stories',
      title: 'Bedtime Stories',
      type: 'item',
      url: '/stories',
      icon: icons.ReadOutlined
    }
  ]
};

export default dashboard;
