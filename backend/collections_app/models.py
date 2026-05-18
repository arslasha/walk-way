from django.db import models
from django.contrib.auth.models import User
from places.models import Place


class Collection(models.Model):
    """
    A user-created folder/collection of Places.
    A Place can appear in multiple Collections (M2M).
    """
    name = models.CharField(max_length=100)
    description = models.TextField(max_length=300, blank=True, default="")
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="collections"
    )
    is_public = models.BooleanField(
        default=True,
        help_text="If True, friends can view this collection."
    )
    places = models.ManyToManyField(
        Place,
        blank=True,
        related_name="collections"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Collection"
        verbose_name_plural = "Collections"

    def __str__(self):
        return f"{self.owner.username} / {self.name}"
