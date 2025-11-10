from django.contrib import admin
from .models import AttendanceSession, AttendanceRecord

# Register your models here.
admin.site.register(AttendanceSession)
admin.site.register(AttendanceRecord)