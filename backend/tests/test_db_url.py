import pytest

from app.core.db_url import (
    DatabaseConfigError,
    build_postgres_url,
    connection_target_label,
    database_target_label,
    postgres_connection_params,
    resolve_database_url,
    sanitize_postgres_url,
)


def test_build_postgres_url_without_password_avoids_ambiguous_at():
    url = build_postgres_url("postgres", "", "miconjunto-dbmconj-bikas5", 5432, "miconjunto")
    assert url == "postgresql://postgres@miconjunto-dbmconj-bikas5:5432/miconjunto"


def test_sanitize_postgres_url_recovers_host_from_password_field():
    url = sanitize_postgres_url(
        "postgresql://postgres:@miconjunto-dbmconj-bikas5:5432/miconjunto"
    )
    assert url == "postgresql://postgres@miconjunto-dbmconj-bikas5:5432/miconjunto"


def test_resolve_dokploy_host_with_at_prefix():
    url = resolve_database_url(
        "@miconjunto-dbmconj-bikas5",
        postgres_user="postgres",
        postgres_password="secret",
        postgres_db="miconjunto",
    )
    assert url == "postgresql://postgres:secret@miconjunto-dbmconj-bikas5:5432/miconjunto"


def test_resolve_postgres_host_env_takes_priority():
    url = resolve_database_url(
        "sqlite:///./local.db",
        postgres_host="db.internal",
        postgres_user="app",
        postgres_password="pw",
        postgres_db="prod",
    )
    assert url == "postgresql://app:pw@db.internal:5432/prod"


def test_database_target_label_masks_password():
    label = database_target_label("postgresql://user:pass@host:5432/db")
    assert "user:***@host:5432/db" in label


def test_build_postgres_url_requires_host():
    with pytest.raises(DatabaseConfigError):
        build_postgres_url("postgres", "pw", "", 5432, "db")


def test_postgres_connection_params_from_postgres_host_env():
    params = postgres_connection_params(
        "sqlite:///./ignored.db",
        postgres_host="@miconjunto-dbmconj-bikas5",
        postgres_user="postgres",
        postgres_password="secret",
        postgres_db="miconjunto",
        postgres_port="5432",
    )
    assert params["host"] == "miconjunto-dbmconj-bikas5"
    assert params["password"] == "secret"
    assert "miconjunto-dbmconj-bikas5" in connection_target_label(params)


def test_postgres_connection_params_from_at_prefixed_database_url():
    params = postgres_connection_params(
        "@miconjunto-dbmconj-bikas5",
        postgres_user="postgres",
        postgres_password="secret",
        postgres_db="miconjunto",
    )
    assert params["host"] == "miconjunto-dbmconj-bikas5"
