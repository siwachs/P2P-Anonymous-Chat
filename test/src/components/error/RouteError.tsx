import { isRouteErrorResponse, useRouteError } from "react-router-dom";

import ErrorUI from "./ErrorUI";

export default function RouteError() {
  const error = useRouteError();

  let errorToDisplay: Error | null = null;
  let errorMessage: string | undefined;

  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || "An error occurred";
    errorToDisplay = new Error(error.data?.message || errorMessage);
  } else if (error instanceof Error) {
    errorToDisplay = error;
  } else {
    errorMessage = "An unexpected error occurred";
  }

  return <ErrorUI error={errorToDisplay} errorMessage={errorMessage} />;
}
