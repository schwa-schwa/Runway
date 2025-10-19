from django.contrib import admin
from .models import User, Challenge, Score

# Register your models here.
admin.site.register(User)
admin.site.register(Challenge)
admin.site.register(Score)