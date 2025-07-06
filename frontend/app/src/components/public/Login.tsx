import React, { useContext, useEffect, useState } from "react";
import {
  Form,
  Button,
  Row,
  Col,
  Container,
  Jumbotron,
  Alert,
} from "react-bootstrap";
import { useHistory } from "react-router";

import { AuthContext } from "../../App";
import { authService } from "../../utils/Auth";
import OIDCLogin from "./OIDCLogin";

export const Login = (props: any) => {
  const from = props.location.state?.from?.pathname || "/";
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [disabled, setDisabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const history = useHistory();
  const { setAuthenticated } = useContext(AuthContext);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Login";
    if (username.length > 0 && password.length > 0) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [username, password]);

  const handlePasswordLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.login(username, password);
      setAuthenticated(true);
      history.push(from);
    } catch (err: any) {
      setError(err.message || '登录失败，请检查用户名和密码');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOIDCLoginSuccess = () => {
    setAuthenticated(true);
    history.push(from);
  };

  const handleOIDCLoginError = (errorMsg: string) => {
    setError(errorMsg);
  };

  return (
    <Container>
      <Row>
        <Col>
          <Jumbotron>
            <h1>登录</h1>
            <Form>
              <Form.Group>
                <Form.Label>用户名</Form.Label>
                <Form.Control
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>密码</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </Form.Group>
              {error && <Alert variant="warning">{error}</Alert>}
              <Button 
                disabled={disabled || isLoading} 
                onClick={handlePasswordLogin} 
                type="submit" 
                className="mr-2"
              >
                {isLoading ? '登录中...' : '密码登录'}
              </Button>
            </Form>
            
            <hr className="my-4" />
            
            <h5>或者使用单点登录</h5>
            <OIDCLogin 
              onLoginSuccess={handleOIDCLoginSuccess}
              onLoginError={handleOIDCLoginError}
            />
          </Jumbotron>
        </Col>
      </Row>
    </Container>
  );
};
