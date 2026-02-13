"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { OpenAPIV3 } from "openapi-types";

type Props = {
  spec: Record<string, unknown>;
};


export default function SwaggerClient({ spec }: Props) {
  return <SwaggerUI spec={spec} />;
}
