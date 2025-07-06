import React, { FC, useEffect, useState } from "react";
import {
  Card,
  Container,
  CardColumns,
  Image,
  Row,
  FormGroup,
  Form,
  Col,
  Jumbotron,
  Spinner,
} from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";

import { getName, Target } from ".";
import { authService } from "../../utils/Auth";

export const TargetSearch: FC = () => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [targetsDefault, setTargetsDefault] = useState<Target[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const history = useHistory();

  const loadAllTargets = async () => {
    try {
      const token = await authService.ensureValidToken();
      if (!token) {
        history.push('/login');
        return;
      }

      const response = await fetch("/api/targets", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch targets');
      }

      const data = await response.json();
      setTargetsDefault(data);
      setTargets(data);
    } catch (error) {
      console.error('Error fetching targets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Search Targets";
    loadAllTargets();
  }, [history]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    setSearchQuery(input);
    setTargets(
      targetsDefault.filter((elem) =>
        (
          elem.first_name.toLowerCase() +
          " " +
          elem.last_name.toLowerCase()
        ).includes(input.toLowerCase())
      )
    );
  };

  const listTargets = targets.map((target) => (
    <Card key={target.id} style={{ maxWidth: 345 }}>
      <Link to={"/targets/" + target.id}>
        <Card.Body style={{ textAlign: "center" }}>
          <Image roundedCircle height={50} src="/images/draven.jpeg" />
          <Image roundedCircle height={50} src="/images/ezreal.png" />
          <Image roundedCircle height={50} src="/images/avatar.jpg" />
          <Image roundedCircle height={50} src="/images/lulu.jpeg" />
          <Image roundedCircle height={50} src="/images/teemo.jpeg" />
          <hr />
          <Card.Text>{getName(target)}</Card.Text>
        </Card.Body>
      </Link>
    </Card>
  ));

  return (
    <Container>
      <Row>
        <Col>
          <Jumbotron>
            <h1>Search Targets</h1>
            <br />
            <FormGroup>
              <Form.Control
                value={searchQuery}
                onChange={handleChange}
                type="text"
                placeholder="Enter name"
              />
            </FormGroup>
          </Jumbotron>
        </Col>
      </Row>

      <Row>
        <Col style={{ textAlign: "center" }}>
          {loading ? (
            <Spinner
              variant="primary"
              style={{ height: 200, width: 200 }}
              animation="border"
            />
          ) : (
            <CardColumns>{listTargets}</CardColumns>
          )}
        </Col>
      </Row>
    </Container>
  );
};
