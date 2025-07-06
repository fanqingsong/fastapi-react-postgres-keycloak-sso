import React, { FC, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router";
import {
  Row,
  Col,
  Container,
  ListGroup,
  DropdownButton,
  Dropdown,
  Jumbotron,
} from "react-bootstrap";

import { Target } from ".";
import { authService } from "../../utils/Auth";

export const TargetInfo: FC = () => {
  const { id }: { id: string } = useParams();
  const [target, setTarget] = useState<Target | null>(null);
  const history = useHistory();

  useEffect(() => {
    document.title = "Target Information";
    
    const fetchTarget = async () => {
      try {
        const token = await authService.ensureValidToken();
        if (!token) {
          history.push('/login');
          return;
        }

        const response = await fetch(`/api/targets/${id}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch target');
        }

        const data = await response.json();
        setTarget(data);
      } catch (error) {
        console.error('Error fetching target:', error);
      }
    };

    fetchTarget();
  }, [id, history]);

  const deleteTarget = async (e: React.MouseEvent) => {
    if (window.confirm("Are you sure you want to delete this target ?")) {
      try {
        const token = await authService.ensureValidToken();
        if (!token) {
          history.push('/login');
          return;
        }

        const response = await fetch(`/api/targets/${id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          history.push("/");
        } else {
          throw new Error('Failed to delete target');
        }
      } catch (error) {
        console.error('Error deleting target:', error);
      }
    }
  };

  const listPaths = target && (
    <ListGroup>
      {target.pictures.map((picture, idx) => (
        <ListGroup.Item key={idx}>{picture.path}</ListGroup.Item>
      ))}
    </ListGroup>
  );
  const listAttributes = target && (
    <ListGroup>
      {Object.entries(target)
        .filter(([key, value]) => key !== "pictures")
        .map(([key, value], idx) => (
          <ListGroup.Item key={idx}>
            <b>{key}</b> {value}
          </ListGroup.Item>
        ))}
    </ListGroup>
  );

  return (
    <Container>
      <Row>
        <Col style={{ textAlign: "center" }}>
          <Jumbotron>
            <h1>Target File</h1>
            <br />
            <DropdownButton title="Options">
              <Dropdown.Item onClick={deleteTarget}>
                Delete Target
              </Dropdown.Item>
            </DropdownButton>
          </Jumbotron>
        </Col>
      </Row>
      <Row>
        <Col xs={6}>
          <h1>Target Attributes</h1>
          {listAttributes}
        </Col>
        <Col xs={6}>
          <h1>Target Pictures</h1>
          {listPaths}
        </Col>
      </Row>
    </Container>
  );
};
