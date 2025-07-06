import React, { useContext, useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router";
import { Container, Row, Col, Alert, Spinner, Button } from "react-bootstrap";
import { AuthContext } from "../../App";
import { handleOIDCCallback } from "../../utils/Auth";

export const OIDCCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const history = useHistory();
  const location = useLocation();
  const { setAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 从URL参数中获取授权码
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");

        if (error) {
          setError(`OIDC authentication failed: ${error}`);
          setLoading(false);
          return;
        }

        if (!code) {
          setError("No authorization code received");
          setLoading(false);
          return;
        }

        // 处理OIDC回调
        await handleOIDCCallback(code);
        setAuthenticated(true);
        
        // 重定向到主页或之前的页面
        history.push("/");
      } catch (err) {
        console.error("OIDC callback error:", err);
        setError(err instanceof Error ? err.message : "OIDC authentication failed");
        setLoading(false);
      }
    };

    handleCallback();
  }, [history, location, setAuthenticated]);

  if (loading) {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <Spinner animation="border" role="status">
              <span className="sr-only">Loading...</span>
            </Spinner>
            <p className="mt-3">Processing OIDC authentication...</p>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col md={6}>
            <Alert variant="danger">
              <Alert.Heading>Authentication Error</Alert.Heading>
              <p>{error}</p>
              <hr />
              <Button variant="outline-danger" onClick={() => history.push("/login")}>
                Back to Login
              </Button>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  return null;
}; 