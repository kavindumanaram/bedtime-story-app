declare module './MainCard' {
  import * as React from 'react';
  interface MainCardProps extends React.HTMLAttributes<HTMLDivElement> {
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }
  const MainCard: React.FC<MainCardProps>;
  export default MainCard;
}
