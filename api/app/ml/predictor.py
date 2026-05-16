import logging
from pathlib import Path
from typing import Any
from typing import Iterable

logger = logging.getLogger(__name__)

DEFAULT_MODEL_PATH = Path(__file__).resolve().parents[2] / "output" / "model.cbm"

_CAT_FEATURE_INDICES = [0, 2]


class CommissionPredictor:
    def __init__(self, model_path: Path = DEFAULT_MODEL_PATH) -> None:
        self._model_path = model_path
        self._model: Any | None = None

    def load(self) -> None:
        if self._model is not None:
            return
        if not self._model_path.exists():
            raise FileNotFoundError(f"Model file not found at {self._model_path}")
        from catboost import CatBoostRegressor

        model = CatBoostRegressor()
        model.load_model(str(self._model_path))
        self._model = model
        logger.info("Commission model loaded from %s", self._model_path)

    def predict_batch(self, rows: Iterable[tuple[str, float, str]]) -> list[float]:
        if self._model is None:
            self.load()
        assert self._model is not None

        from catboost import Pool

        data = [[str(exchange_id), float(price), str(day_month)] for exchange_id, price, day_month in rows]
        if not data:
            return []

        pool = Pool(data=data, cat_features=_CAT_FEATURE_INDICES)
        return [float(value) for value in self._model.predict(pool)]


predictor = CommissionPredictor()
