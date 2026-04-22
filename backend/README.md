# Biotech-Cal

Biotech-Cal is a Spring Boot application designed to track biotechnology catalysts and companies. It provides a RESTful
API for managing pharmaceutical catalysts, their expected dates, drug names, and associated companies.

## Stack

- **Language:** Java 25
- **Framework:** Spring Boot 4.0.3
- **Data Access:** Spring Data JPA, Spring Data JDBC
- **Database:** PostgreSQL
- **Documentation:** SpringDoc OpenAPI (Swagger UI)
- **Utilities:** Lombok
- **Build Tool:** Maven

## Requirements

- **Java SDK:** Version 25 or higher
- **Docker:** (Optional, for running PostgreSQL via Docker Compose)
- **Maven:** (Provided via `./mvnw` or `mvnw.cmd`)

## Setup & Run

### Using Docker Compose (Recommended for DB)

1. Start the PostgreSQL container:
   ```powershell
   docker-compose up -d
   ```

2. Configure `src/main/resources/application.properties` (see [Environment Variables](#environment-variables)).

### Running the Application

To run the application using the Maven wrapper:

```powershell
./mvnw spring-boot:run
```

The application will be available at `http://localhost:8080`.

### API Documentation

Once the application is running, you can access the Swagger UI for interactive API documentation at:
`http://localhost:8080/swagger-ui/index.html`

## Scripts

- `./mvnw clean install`: Build the project and install dependencies.
- `./mvnw spring-boot:run`: Run the application.
- `./mvnw test`: Run unit and integration tests.
- `docker-compose up`: Start the PostgreSQL database service.

## Environment Variables

The application can be configured via `src/main/resources/application.properties` or by setting the following
environment variables:

| Variable                        | Description                                           | Default Value                                                |
|---------------------------------|-------------------------------------------------------|--------------------------------------------------------------|
| `SERVER_PORT`                   | Port on which the application runs                    | `8080`                                                       |
| `SPRING_DOCKER_COMPOSE_ENABLED` | Enable/Disable Spring Boot Docker Compose integration | `false`                                                      |
| `SPRING_DATASOURCE_URL`         | JDBC URL for the PostgreSQL database                  | `jdbc:postgresql://localhost:5432/mydatabase` (TODO: verify) |
| `SPRING_DATASOURCE_USERNAME`    | Database username                                     | `myuser` (from `compose.yaml`)                               |
| `SPRING_DATASOURCE_PASSWORD`    | Database password                                     | `secret` (from `compose.yaml`)                               |

> [!IMPORTANT]
> Currently, `DataSourceAutoConfiguration` and `HibernateJpaAutoConfiguration` are explicitly excluded in
`application.properties`. This might need to be adjusted to enable database connectivity.

## API Endpoints

### Catalysts

- `GET /api/catalysts`: List all catalysts.
- `GET /api/catalysts/{id}`: Get catalyst by ID.
- `POST /api/catalysts`: Create a new catalyst.
- `PUT /api/catalysts/{id}`: Update an existing catalyst.
- `DELETE /api/catalysts/{id}`: Delete a catalyst.

### Companies

- `GET /api/companies`: List all companies.
- `GET /api/companies/{id}`: Get company by ID.
- `POST /api/companies`: Create a new company.
- `PUT /api/companies/{id}`: Update an existing company.
- `DELETE /api/companies/{id}`: Delete a company.

## Project Structure

```text
C:/Users/guild/IdeaProjects/biotech-cal
├── compose.yaml                # Docker Compose for PostgreSQL
├── mvnw / mvnw.cmd             # Maven Wrapper
├── pom.xml                     # Maven configuration
├── src/
│   ├── main/
│   │   ├── java/com/bcal/biotechcal/
│   │   │   ├── controller/     # REST Controllers
│   │   │   ├── dto/            # Data Transfer Objects
│   │   │   ├── entity/         # JPA Entities
│   │   │   ├── exception/      # Error handling
│   │   │   ├── repository/     # Data repositories
│   │   │   └── service/        # Business logic
│   │   └── resources/
│   │       └── application.properties
│   └── test/                   # Unit and integration tests
└── HELP.md                     # Spring Boot help documentation
```

## Tests

Run tests using the Maven wrapper:

```powershell
./mvnw test
```

Currently includes:

- `BiotechCalApplicationTests`: Context loading test.
- TODO: Add unit tests for Services and Controllers.

## License

TODO: Add license information.
