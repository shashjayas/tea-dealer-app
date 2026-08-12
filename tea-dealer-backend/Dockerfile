# Stage 1 - Build Spring Boot app
FROM maven:3.9-eclipse-temurin-11 AS build
WORKDIR /app
# Copy pom.xml and download dependencies first
COPY pom.xml .
RUN mvn dependency:go-offline
# Copy source and build JAR
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2 - Run the JAR
FROM eclipse-temurin:11-jre-alpine
WORKDIR /app
# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
