import React, { useEffect, useState } from "react";
import { Form, Button, Row, Col, Container } from "react-bootstrap";
import { useHistory } from "react-router";
import { authService } from "../../utils/Auth";

export const TargetCreate = () => {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [dob, setDob] = useState<string>("");
  const [disabled, setDisabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const history = useHistory();

  useEffect(() => {
    document.title = "Create Target";
    if (firstName.length > 0 && lastName.length > 0) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [firstName, lastName]);

  const createTarget = async (e: React.MouseEvent) => {
    setIsLoading(true);
    try {
      const token = await authService.ensureValidToken();
      if (!token) {
        history.push('/login');
        return;
      }

      const response = await fetch("/api/targets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          dob: dob,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create target');
      }

      const data = await response.json();
      history.push("/targets/" + data.id);
    } catch (error) {
      console.error('Error creating target:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Row>
        <Col>
          <Form>
            <Form.Group>
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Date of Birth</Form.Label>
              <Form.Control
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                disabled={isLoading}
              />
            </Form.Group>
            <Button disabled={disabled || isLoading} onClick={createTarget}>
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};
