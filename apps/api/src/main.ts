import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const origin = config.get<string>("WEB_ORIGIN", "http://localhost:3000");

  app.enableCors({
    origin,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix("api");

  const configuredPort = config.get<string | number>("API_PORT", 4000);
  const port = Number(configuredPort) || 4000;
  await app.listen(port, "0.0.0.0");
  console.log(`API listening on http://localhost:${port}/api`);
}

bootstrap().catch((error) => {
  console.error("API failed to start", error);
  process.exit(1);
});
