export const baseDocument = {
  openapi: "3.0.0",
  info: {
    title: "CityLink Cafe API",
    version: "1.0.0",
    description: "QR-based food ordering system API",
  },
  servers: [
    {
      url:
        process.env.NEXT_PUBLIC_APP_URL ??
        "http://localhost:3000",
    },
  ],
  paths: {},
  components: {
    schemas: {},
  },
} as const;
