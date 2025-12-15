import type { FC } from "react";
import { Outlet } from "react-router-dom";
import { RouterProviders } from "@/lib/providers";

const RootLayout: FC = () => {
  return (
    <RouterProviders>
      <Outlet />
    </RouterProviders>
  );
};

export default RootLayout;
