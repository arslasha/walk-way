from django.contrib.gis import admin
from .models import Category, Tag, Place

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Place)
class PlaceAdmin(admin.GISModelAdmin):
    list_display = ('title', 'category', 'is_active')
    list_filter = ('is_active', 'category', 'tags')
    search_fields = ('title', 'address', 'kudago_id')
