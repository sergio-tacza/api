FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
COPY src src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /deploy
COPY --from=build /build/target/quarkus-app/lib/ lib/
COPY --from=build /build/target/quarkus-app/*.jar ./
COPY --from=build /build/target/quarkus-app/app/ app/
COPY --from=build /build/target/quarkus-app/quarkus/ quarkus/

ENV JAVA_OPTS="-Dquarkus.http.host=0.0.0.0"
EXPOSE 8080
CMD ["java", "-jar", "quarkus-run.jar"]
