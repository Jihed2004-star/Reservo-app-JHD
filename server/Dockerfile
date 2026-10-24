# syntax=docker/dockerfile:1

# ---------- build ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS builder

WORKDIR /src

# Project files first, so restore stays cached while only source files change.
COPY MyApp.Data/MyApp.Data.csproj ./MyApp.Data/
COPY MyApp.Api/MyApp.Api.csproj ./MyApp.Api/
RUN dotnet restore ./MyApp.Api/MyApp.Api.csproj

COPY . .

RUN dotnet publish ./MyApp.Api/MyApp.Api.csproj \
        --configuration Release \
        --no-restore \
        --output /app/publish \
        /p:UseAppHost=false

# ---------- runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

WORKDIR /app

COPY --from=builder /app/publish .

# Covers/galleries are written to wwwroot/uploads. Creating the folder here lets
# a named volume inherit it (same path, correct ownership) on first run.
RUN mkdir -p /app/wwwroot/uploads

# ASP.NET Core 8+ images already listen on 8080; kept explicit for clarity.
ENV ASPNETCORE_HTTP_PORTS=8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "MyApp.Api.dll"]
