import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from places.models import Place, Category
from django.contrib.gis.geos import Point
from users.models import UserProfile
from collections_app.models import Collection


# ──────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user_and_tokens(db):
    user = User.objects.create_user(
        username="test@example.com",
        email="test@example.com",
        password="password123"
    )
    UserProfile.objects.create(user=user, nickname="TestUser")

    client = APIClient()
    response = client.post("/api/v1/auth/login/", {
        "email": "test@example.com",
        "password": "password123"
    }, format="json")
    tokens = response.data["tokens"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    return user, client


@pytest.fixture
def other_user(db):
    user = User.objects.create_user(
        username="other@example.com",
        email="other@example.com",
        password="password123"
    )
    UserProfile.objects.create(user=user, nickname="OtherUser")
    return user


@pytest.fixture
def place(db):
    cat = Category.objects.create(name="Кафе", slug="cafe")
    return Place.objects.create(
        title="Тест Место",
        address="ул. Тестовая 1",
        location=Point(30.316, 59.938),
        kudago_id=99999,
        category=cat,
    )


@pytest.fixture
def collection(user_and_tokens):
    user, _ = user_and_tokens
    return Collection.objects.create(name="Любимые места", owner=user, is_public=True)


# ──────────────────────────────────────────────
# Tests
# ──────────────────────────────────────────────

@pytest.mark.django_db
def test_create_collection(user_and_tokens):
    _, client = user_and_tokens
    response = client.post("/api/v1/collections/", {
        "name": "Места для свиданий",
        "description": "Уютные и атмосферные",
        "is_public": True,
    }, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["name"] == "Места для свиданий"
    assert response.data["places_count"] == 0


@pytest.mark.django_db
def test_list_collections_only_own(user_and_tokens, other_user):
    user, client = user_and_tokens
    # Own collection
    Collection.objects.create(name="Моя", owner=user)
    # Another user's collection
    Collection.objects.create(name="Чужая", owner=other_user)

    response = client.get("/api/v1/collections/")
    assert response.status_code == status.HTTP_200_OK
    names = [c["name"] for c in response.data]
    assert "Моя" in names
    assert "Чужая" not in names


@pytest.mark.django_db
def test_add_place_to_collection(user_and_tokens, collection, place):
    _, client = user_and_tokens
    response = client.post(
        f"/api/v1/collections/{collection.id}/add-place/",
        {"place_id": place.id},
        format="json"
    )
    assert response.status_code == status.HTTP_200_OK
    collection.refresh_from_db()
    assert collection.places.filter(id=place.id).exists()


@pytest.mark.django_db
def test_add_place_idempotent(user_and_tokens, collection, place):
    """Adding the same place twice should not create duplicate."""
    _, client = user_and_tokens
    collection.places.add(place)

    response = client.post(
        f"/api/v1/collections/{collection.id}/add-place/",
        {"place_id": place.id},
        format="json"
    )
    assert response.status_code == status.HTTP_200_OK
    assert collection.places.count() == 1


@pytest.mark.django_db
def test_remove_place_from_collection(user_and_tokens, collection, place):
    _, client = user_and_tokens
    collection.places.add(place)

    response = client.post(
        f"/api/v1/collections/{collection.id}/remove-place/",
        {"place_id": place.id},
        format="json"
    )
    assert response.status_code == status.HTTP_200_OK
    assert not collection.places.filter(id=place.id).exists()


@pytest.mark.django_db
def test_delete_collection_by_owner(user_and_tokens, collection):
    _, client = user_and_tokens
    response = client.delete(f"/api/v1/collections/{collection.id}/")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not Collection.objects.filter(id=collection.id).exists()


@pytest.mark.django_db
def test_delete_collection_forbidden_for_non_owner(user_and_tokens, other_user):
    """Another user cannot delete someone else's collection."""
    _, client = user_and_tokens
    # Collection belongs to other_user
    other_collection = Collection.objects.create(name="Чужая", owner=other_user, is_public=False)

    response = client.delete(f"/api/v1/collections/{other_collection.id}/")
    assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]


@pytest.mark.django_db
def test_collection_detail_includes_places(user_and_tokens, collection, place):
    _, client = user_and_tokens
    collection.places.add(place)

    response = client.get(f"/api/v1/collections/{collection.id}/")
    assert response.status_code == status.HTTP_200_OK
    assert "places" in response.data
    place_ids = [p["id"] for p in response.data["places"]]
    assert place.id in place_ids


@pytest.mark.django_db
def test_unauthenticated_cannot_access_collections(api_client):
    response = api_client.get("/api/v1/collections/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
