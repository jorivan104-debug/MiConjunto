"""Tests de helpers contables."""
from app.services.journal import totals_match


def test_totals_match():
    assert totals_match(100.0, 100.0) is True
    assert totals_match(100.0, 100.005) is True  # within tolerance
    assert totals_match(100.0, 101.0) is False
