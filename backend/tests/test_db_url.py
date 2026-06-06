from app.core.db_url import database_target_label, resolve_database_url


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
