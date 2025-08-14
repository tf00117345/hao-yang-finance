# Use the official .NET 8 SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

# Set the working directory
WORKDIR /app

# Copy everything to the container
COPY . ./

# Restore dependencies
RUN dotnet restore

# Build the application
RUN dotnet build -c Release --no-restore

# Publish the application
RUN dotnet publish -c Release -o out --no-build

# Use the official .NET 8 runtime image for the final stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

# Set the working directory
WORKDIR /app

# Copy the published application from the build stage
COPY --from=build /app/out .
# Expose the port
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Start the application
ENTRYPOINT ["dotnet", "hao-yang-finance-api.dll"]