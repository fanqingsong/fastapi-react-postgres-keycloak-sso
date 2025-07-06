import React, { FC, useContext } from "react";
import { Button, Nav, Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useHistory } from "react-router";

import { authService } from "../../utils/Auth";
import { AuthContext } from "../../App";

export const NavigationBar: FC = () => {
  const history = useHistory();
  const { authenticated, setAuthenticated } = useContext(AuthContext);

  const clickLogout = async (e: React.MouseEvent) => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthenticated(false);
      history.push("/");
    }
  };

  return (
    <Navbar>
      <Nav>
        <Nav.Item>
          <Nav.Link as={Link} to="/">
            Home
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} to="/targets">
            Search
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} to="/targets/create">
            Create
          </Nav.Link>
        </Nav.Item>
      </Nav>
      <Nav className="ml-auto">
        {authenticated && (
          <Button variant="outline-primary" onClick={clickLogout}>
            Logout
          </Button>
        )}
      </Nav>
    </Navbar>
  );
};
