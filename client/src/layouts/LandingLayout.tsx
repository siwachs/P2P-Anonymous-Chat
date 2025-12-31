import type { FC, ReactNode } from "react";

const LandingLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div>
      LandingLayout
      {children}
    </div>
  );
};

export default LandingLayout;
