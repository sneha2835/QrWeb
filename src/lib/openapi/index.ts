import { baseDocument } from "./base";
import { paths } from "./paths";
import { schemas } from "./schemas";

export function getOpenApiDocument() {
  return {
    ...baseDocument,
    paths,
    components: {
      schemas,
    },
  };
}
