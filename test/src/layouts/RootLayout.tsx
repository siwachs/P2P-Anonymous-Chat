import { Outlet } from "react-router-dom";
import { RouterProviders } from "@/lib/providers";

const RootLayout = () => {
  return (
    <RouterProviders>
      <Outlet />
    </RouterProviders>
  );
};

export default RootLayout;
