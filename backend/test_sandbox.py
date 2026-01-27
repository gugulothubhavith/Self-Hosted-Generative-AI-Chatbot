import asyncio
import json
import docker
import logging

async def main():
    print("Testing Docker TCP connection...")
    try:
        # Test with TCP (Requires "Expose daemon on tcp://localhost:2375 without TLS" in Docker Desktop)
        client = docker.DockerClient(base_url='tcp://host.docker.internal:2375')
        print(f"DockerClient ping: {client.ping()}")
        print("TCP Connection Successful!")
    except Exception as e:
        print(f"TCP Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
