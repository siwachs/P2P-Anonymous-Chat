import { type FC } from "react";

import { FiltersProvider } from "@/lib/contexts";
import { Outlet } from "react-router-dom";

const ProvidersLayout: FC = () => {
  return (
    <FiltersProvider>
      <Outlet />
    </FiltersProvider>
  );
};

export default ProvidersLayout;
