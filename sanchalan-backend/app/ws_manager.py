from fastapi import WebSocket


class ConnectionManager:
    """Tiny in-memory broadcast hub for the Live Ops Feed.

    Not meant to scale past a single uvicorn worker — this is a demo/portfolio
    dashboard, not a message bus. Good enough to replace the frontend's
    'simulated push' comment with an actual push.
    """

    def __init__(self) -> None:
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket) -> None:
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, payload: dict) -> None:
        dead: list[WebSocket] = []
        for ws in self.active:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()
