import { Redirect, Route } from "react-router";
import { authService } from "./utils/Auth";

export const PrivateRoute = ({ component: Component, ...rest }: any) => {
  return (
    <Route
      {...rest}
      render={({ location }) =>
        authService.isAuthenticated() ? (
          <Component {...rest} />
        ) : (
          <Redirect to={{ pathname: "/login", state: { from: location } }} />
        )
      }
    />
  );
};
