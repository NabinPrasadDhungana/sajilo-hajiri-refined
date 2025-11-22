from django.db import models
from django.conf import settings

# Create your models here.
class FaceEncoding(models.Model):
    student = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'role': 'student'})
    encoding_data = models.TextField()  # Store as base64 or JSON string
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Face data for {self.student.email}"