import type { FC, ReactNode } from "react";

const RootLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div>
      RootLayout
      {children}
    </div>
  );
};

export default RootLayout;
