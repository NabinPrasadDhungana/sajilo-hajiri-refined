from django.db import models
from django.contrib.auth.models import AbstractUser
from django.urls import reverse

# Create your models here.
class User(AbstractUser):
    @property
    def avatar_url(self):
        if self.avatar:
            try:
                return self.avatar.url
            except Exception:
                return None
        return None
    
    def get_absolute_url(self):
        return reverse("user-profile", kwargs={"pk": self.pk})
    
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    ]
    APPROVAL_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('unapproved', 'Unapproved'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    name = models.CharField(max_length=150, blank=True, null=True)
    roll_number = models.CharField(max_length=10, unique=True, null=True, blank=True, db_index=True)
    semester = models.CharField(max_length=20, blank=True, null=True)
    section = models.CharField(max_length=20, blank=True, null=True)
    department = models.CharField(max_length=50, blank=True, null=True)
    approval_status = models.CharField(max_length=15, choices=APPROVAL_CHOICES, default='pending')
    feedback = models.TextField(blank=True, null=True)  # feedback if unapproved

    def __str__(self):
        return self.name or self.username
