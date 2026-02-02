import * as React from 'react';
export interface MainCardProps extends React.HTMLAttributes<HTMLDivElement> {
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
declare const MainCard: React.FC<MainCardProps>;
export default MainCard;
