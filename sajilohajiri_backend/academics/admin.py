from django.contrib import admin
from .models import Class, ClassSubject, Subject, StudentClassEnrollment

# Register your models here.
admin.site.register(Class)
admin.site.register(Subject)
admin.site.register(ClassSubject)
admin.site.register(StudentClassEnrollment)