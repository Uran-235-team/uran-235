class AccessTokenError(Exception):
    """Raised when an access JWT cannot be resolved to a User."""

    __slots__ = ("detail",)

    def __init__(self, detail: str) -> None:
        self.detail = detail
        super().__init__(detail)
