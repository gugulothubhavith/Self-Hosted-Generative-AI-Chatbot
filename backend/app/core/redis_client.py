
import redis
from app.core.config import settings

# Shared Redis Client
redis_client = redis.from_url(
    settings.REDIS_URL, 
    decode_responses=True,
    socket_connect_timeout=2,
    socket_timeout=2
)

def get_redis_client():
    return redis_client
