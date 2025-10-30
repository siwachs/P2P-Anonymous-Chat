import type { FC, ReactNode } from "react";

const PublicLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div>
      PublicLayout
      {children}
    </div>
  );
};

export default PublicLayout;
