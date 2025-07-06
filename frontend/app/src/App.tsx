import React, { createContext, FC, useState, useEffect } from "react";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";

import { Home, NavigationBar, Login } from "./components/public";
import OIDCCallback from "./components/public/OIDCCallback";
import { TargetInfo, TargetSearch, TargetCreate } from "./components/private";
import { PrivateRoute } from "./PrivateRoute";
import { authService } from "./utils/Auth";

export const AuthContext = createContext({
  authenticated: false,
  setAuthenticated: (auth: boolean) => {},
});

export const App: FC = () => {
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  // 检查初始认证状态
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated();
      setAuthenticated(isAuth);
    };
    
    checkAuth();
    
    // 设置定期检查token有效性
    const interval = setInterval(async () => {
      try {
        await authService.ensureValidToken();
        checkAuth();
      } catch (error) {
        console.error('Token refresh failed:', error);
        setAuthenticated(false);
      }
    }, 60000); // 每分钟检查一次
    
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, setAuthenticated }}>
      <BrowserRouter basename="/">
        <NavigationBar />
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/login" component={Login} />
          <Route exact path="/oidc/callback" component={OIDCCallback} />
          <PrivateRoute exact path="/targets" component={TargetSearch} />
          <PrivateRoute exact path="/targets/create" component={TargetCreate} />
          <PrivateRoute path="/targets/:id" component={TargetInfo} />
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

export default App;
