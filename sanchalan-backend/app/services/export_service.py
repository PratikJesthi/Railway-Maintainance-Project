import csv
import io
from typing import Iterable

from fastapi.responses import StreamingResponse


def csv_response(filename: str, header: list[str], rows: Iterable[list]) -> StreamingResponse:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(header)
    writer.writerows(rows)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
