from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..ws_manager import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/feed")
async def feed_socket(ws: WebSocket):
    """Real-time push for the Live Ops Feed / Audit Log.

    Every POST /api/feed, POST /api/audit, PATCH /api/blocks/{id} and
    POST /api/conflicts/resolve broadcasts here — connect a client and it
    receives {"channel": "feed"|"audit", ...} messages as they happen,
    instead of polling GET /api/feed.
    """
    await manager.connect(ws)
    try:
        while True:
            # This endpoint is push-only; we still need to await something
            # so a client disconnect is detected promptly.
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)
